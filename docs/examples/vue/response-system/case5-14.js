const bucket = new WeakMap();
const effectStack = [];
let activeEffect;
const ITERATE_KEY = Symbol();
const MAP_KEY_ITERATE_KEY = Symbol();
const reactiveMap = new Map();

function iterationMethod() {
  const target = this.raw;
  const itr = target[Symbol.iterator](); // 获取原始迭代器方法
  track(target, ITERATE_KEY);
  // Q2 将原始数据对象转成响应式数据
  const wrap = (val) =>
    typeof val === 'object' && val !== null ? reactive(val) : val;
  return {
    // 迭代器协议
    next() {
      const { value, done } = itr.next();
      return {
        value: value ? [wrap(value[0]), wrap(value[1])] : value,
        done,
      };
    },
    // Q3 新增可迭代协议
    [Symbol.iterator]() {
      return this;
    },
  };
}

function valuesiterationMethod() {
  const target = this.raw;
  const itr = target.values(); // 调用原始对象的values方法
  track(target, ITERATE_KEY);
  const wrap = (val) =>
    typeof val === 'object' && val !== null ? reactive(val) : val;
  return {
    next() {
      const { value, done } = itr.next();
      return { value: wrap(value), done };
    },
    [Symbol.iterator]() {
      return this;
    },
  };
}

function keysiterationMethod() {
  const target = this.raw;
  const itr = target.keys(); // 调用原始对象的keys方法
  track(target, MAP_KEY_ITERATE_KEY); // Q4
  const wrap = (val) =>
    typeof val === 'object' && val !== null ? reactive(val) : val;
  return {
    next() {
      const { value, done } = itr.next();
      return { value: wrap(value), done };
    },
    [Symbol.iterator]() {
      return this;
    },
  };
}

const mutableInstrumentations = {
  get(key) {
    const target = this.raw;
    const had = target.has(key);
    track(target, key);
    if (had) {
      const res = target.get(key);
      return typeof res === 'object' ? reactive(res) : res;
    }
  },
  set(key, newVal) {
    const target = this.raw;
    const had = target.has(key);
    const oldVal = target.get(key);
    const rawValue = newVal.raw || newVal;
    target.set(key, rawValue);

    if (!had) {
      trigger(target, key, 'ADD');
    } else if (oldVal !== newVal && (oldVal === oldVal || newVal === newVal)) {
      trigger(target, key, 'SET');
    }
  },
  [Symbol.iterator]: iterationMethod, // Q1
  entries: iterationMethod,
  values: valuesiterationMethod,
  keys: keysiterationMethod,
};

function reactive(obj) {
  const exisitProxy = reactiveMap.get(obj);
  if (exisitProxy) return exisitProxy;
  const proxy = createReactive(obj);
  reactiveMap.set(obj, proxy);
  return proxy;
}

function createReactive(obj, isShallow = false, isReadonly = false) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      if (key === 'raw') return target;
      if (key === 'size') {
        track(target, ITERATE_KEY);
        return Reflect.get(target, key, target);
      }
      return mutableInstrumentations[key];
    },
  });
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

function trigger(target, key, type) {
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
  if (
    ['ADD', 'DELETE'].includes(type) ||
    (type === 'SET' &&
      Object.prototype.toString.call(target) === '[object Map]')
  ) {
    const iterateEffects = depsMap.get(ITERATE_KEY);
    iterateEffects &&
      iterateEffects.forEach((effectFn) => {
        if (effectFn !== activeEffect) {
          effectsToRun.add(effectFn);
        }
      });
  }

  if (
    // Q4
    ['ADD', 'DELETE'].includes(type) &&
    Object.prototype.toString.call(target) === '[object Map]'
  ) {
    const iterateEffects = depsMap.get(MAP_KEY_ITERATE_KEY);
    iterateEffects &&
      iterateEffects.forEach((effectFn) => {
        if (effectFn !== activeEffect) {
          effectsToRun.add(effectFn);
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

const p = reactive(
  new Map([
    ['k1', 'v1'],
    ['k2', 'v2'],
  ])
);
effect(() => {
  for (const [k, v] of p) {
    console.log(k, v);
  }
});
// Q1 error: p is not iterable
// 答: 代理对象p不是一个可迭代的对象
// 使用for...of遍历代理对象p时, 会试图读取p[Symbol.iterator]属性, 这个读取操作会触发get拦截函数

// Q2 迭代产生的值应该也是可响应的

// Q3 for...of 遍历p.entries()时, error: 方法的返回值不可迭代
// 答: 注意区分 迭代器协议 和 可迭代协议

const p2 = reactive(
  new Map([
    ['k1', 'v1'],
    ['k2', 'v2'],
  ])
);
effect(() => {
  for (const k of p.keys()) {
    console.log(k);
  }
});
p2.set('k2', 'v3'); // 会触发重新执行
// Q4 此处SET类型操作, p2的键数量没有改变; 而effect中是对keys的迭代器处理, 不应该触发重新执行
