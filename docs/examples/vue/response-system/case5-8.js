const bucket = new WeakMap();
const effectStack = [];
let activeEffect;
let ITERATE_KEY = Symbol();
const reactiveMap = new Map();

const arrayInstrumentations = {};

['includes', 'indexOf', 'lastIndexOf'].forEach((method) => {
  const originMethod = Array.prototype[method];
  arrayInstrumentations[method] = function (...args) {
    // this是代理对象, 先在代理对象中查找, 存储结果
    let res = originMethod.apply(this, args);
    // 代理对象没有找到, 去原始数组中查找
    if (res === false || res === -1) {
      res = originMethod.apply(this.raw, args);
    }
    return res;
  };
});

function reactive(obj) {
  // Q1问题解决
  // 优先通过原始对象寻找映射的代理对象
  const exisitProxy = reactiveMap.get(obj);
  if (exisitProxy) return exisitProxy;
  // 创建新的代理对象, 缓存在map中
  const proxy = createReactive(obj);
  reactiveMap.set(obj, proxy);
  return proxy;
}

function createReactive(obj, isShallow = false, isReadonly = false) {
  const proxy = new Proxy(obj, {
    get(target, key, receiver) {
      console.log('get', key); // proxy.xx 都会触发get拦截函数, key为xx
      if (key === 'raw') {
        return target;
      }
      // 问题Q2解决 数组且key是arrayInstrumentations上的值, 执行自定义函数
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
  if (!activeEffect) return;
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

const obj = {};
const arr = reactive([obj]);
// console.log(arr.includes(arr[0])) // false Q1为什么？
// 通过代理对象来访问元素值时,如果值仍然是可以被代理的, 那么得到的值就是新的代理对象而非原始对象。
// arr[0] 得到一个代理对象
// includes内部也会通过arr访问数组元素,也会得到一个代理对象

// console.log(arr.includes(obj)) // false Q2为什么直接查询原始对象不存在？
// arr是代理对象, 而obj是原始对象
// 需要重写数组的includes方法并实现自定义的行为
