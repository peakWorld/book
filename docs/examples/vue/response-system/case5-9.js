const bucket = new WeakMap();
const effectStack = [];
const reactiveMap = new Map();
const arrayInstrumentations = {};

let activeEffect;
let ITERATE_KEY = Symbol();
let shouldTrack = false;

['includes', 'indexOf', 'lastIndexOf'].forEach((method) => {
  const originMethod = Array.prototype[method];
  arrayInstrumentations[method] = function (...args) {
    let res = originMethod.apply(this, args);
    if (res === false || res === -1) {
      res = originMethod.apply(this.raw, args);
    }
    return res;
  };
});

['push', 'pop', 'shift', 'unshift', 'splice'].forEach((method) => {
  const originMethod = Array.prototype[method];
  arrayInstrumentations[method] = function (...args) {
    shouldTrack = false; // 在调用原始方法前, 禁止追踪; 在调用push时, 会读取length属性, 这些方法不track 属性length
    let res = originMethod.apply(this, args);
    shouldTrack = true; // 在调用原始方法后, 允许追踪; 这些方法调用结束后, 允许后续的track
    return res;
  };
});

function reactive(obj) {
  const exisitProxy = reactiveMap.get(obj);
  if (exisitProxy) return exisitProxy;
  const proxy = createReactive(obj);
  reactiveMap.set(obj, proxy);
  return proxy;
}

function createReactive(obj, isShallow = false, isReadonly = false) {
  const proxy = new Proxy(obj, {
    get(target, key, receiver) {
      console.log('get', key);
      if (key === 'raw') {
        return target;
      }
      if (Array.isArray(target) && arrayInstrumentations.hasOwnProperty(key)) {
        return Reflect.get(arrayInstrumentations, key, receiver);
      }
      if (!isReadonly && typeof key !== 'symbol') {
        track(target, key);
      }
      const res = Reflect.get(target, key, receiver);
      if (isShallow) {
        return res;
      }
      if (typeof res === 'object' && res !== null) {
        return isReadonly ? readonly(res) : reactive(res);
      }
      return res;
    },
    has(target, key) {
      track(target, key);
      return Reflect.has(target, key);
    },
    ownKeys(target) {
      track(target, Array.isArray(target) ? 'length' : ITERATE_KEY);
      return Reflect.ownKeys(target);
    },
    set(target, key, newVal, receiver) {
      console.log('set', key);
      if (isReadonly) {
        console.warn(`属性${key}只读。`);
        return;
      }
      const oldVal = target[key];
      const type = Array.isArray(target)
        ? Number(key) < target.length
          ? 'SET'
          : 'ADD'
        : Object.prototype.hasOwnProperty.call(target, key)
        ? 'SET'
        : 'ADD';
      const res = Reflect.set(target, key, newVal, receiver);
      if (target === receiver.raw) {
        if (oldVal !== newVal && (oldVal === oldVal || newVal === newVal)) {
          trigger(target, key, type, newVal);
        }
      }
      return res;
    },
    deleteProperty(target, key) {
      if (isReadonly) {
        console.warn(`属性${key}只读。`);
        return;
      }
      const hadKey = Object.prototype.hasOwnProperty(target, key);
      const res = Reflect.deleteProperty(target, key);
      if (hadKey && res) {
        trigger(target, key, 'DELETE');
      }
    },
  });
  return proxy;
}

function track(target, key) {
  if (!activeEffect || !shouldTrack) return; // 禁止追踪则直接返回
  let depsMap = bucket.get(target);
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()));
  }
  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }
  deps.add(activeEffect);
  activeEffect.deps.push(deps);
}

function trigger(target, key, type, newVal) {
  const depsMap = bucket.get(target);
  if (!depsMap) return;
  const effects = depsMap.get(key);

  const effectsToRun = new Set();
  effects &&
    effects.forEach((effectFn) => {
      if (effectFn !== activeEffect) {
        effectsToRun.add(effectFn);
      }
    });
  if (['ADD', 'DELETE'].includes(type)) {
    const iterateEffects = depsMap.get(ITERATE_KEY);
    iterateEffects &&
      iterateEffects.forEach((effectFn) => {
        if (effectFn !== activeEffect) {
          effectsToRun.add(effectFn);
        }
      });
  }
  if (Array.isArray(target) && type === 'ADD') {
    const lengthEffects = depsMap.get('length');
    lengthEffects &&
      lengthEffects.forEach((effectFn) => {
        if (effectFn !== activeEffect) {
          effectsToRun.add(effectFn);
        }
      });
  }
  if (Array.isArray(target) && key === 'length') {
    depsMap.forEach((effects, key) => {
      if (key >= newVal) {
        effects.forEach((effectFn) => {
          if (effectFn !== activeEffect) {
            effectsToRun.add(effectFn);
          }
        });
      }
    });
  }
  effectsToRun.forEach((effectFn) => {
    if (effectFn.options.scheduler) {
      effectFn.options.scheduler(effectFn);
    } else {
      effectFn();
    }
  });
}

function cleanup(effectFn) {
  for (let i = 0, len = effectFn.deps.length; i < len; i++) {
    const deps = effectFn.deps[i];
    deps.delete(effectFn);
  }
  effectFn.deps.length = 0;
}

function effect(fn, options = {}) {
  const effectFn = () => {
    cleanup(effectFn);
    activeEffect = effectFn;
    effectStack.push(effectFn);
    const res = fn();
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
    return res;
  };
  effectFn.options = options;
  effectFn.deps = [];
  if (!options.lazy) {
    effectFn();
  }
  return effectFn;
}

const arr = reactive([]);
effect(function effectFn1() {
  console.log('effectFn1 push...');
  arr.push('1');
});
// 读取length属性、设置索引0的值、设置length的值
// get length => track
// set key '0', 无‘0’副作用函数; 数组新增导致length改变, 但activeEffect和effectFn1一致,也不执行
// set 'length', 数组长度和length值一样都为1, 值未改变、不执行trigger函数

// 此时桶中关系
// arr -> length -> effectFn1

effect(function effectFn2() {
  console.log('effectFn2 push...');
  arr.push('2');
});
// 此时桶中关系
// arr -> length -> effectFn1/effectFn2
// set key '1', 无'1'副作用函数; 但是数组新增导致length改变, 触发length相关的副作用函数, 而activeEffect和effectFn2一样, 只会执行effectFn1副作用函数。
// 此时effectFn2未执行完, 又执行effectFn1函数; 而effectFn1函数又会执行以上逻辑
// Q1导致栈溢出

// push方法调用时会间接读取length属性。而该方法在语义上是修改操作、非读取操作, 应该避免追踪length属性。
