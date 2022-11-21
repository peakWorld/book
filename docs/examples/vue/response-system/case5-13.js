const bucket = new WeakMap();
const effectStack = [];
let activeEffect;
let ITERATE_KEY = Symbol();
const reactiveMap = new Map();

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
  forEach(callback, thisArg) {
    const target = this.raw;
    track(target, ITERATE_KEY);
    // Q1解决
    // 将可代理的值转换成响应式数据
    const wrap = (val) => (typeof val === 'object' ? reactive(val) : val);
    // 通过原始数据对象调用forEach方法
    target.forEach((v, k) => {
      callback(thisArg, wrap(v), wrap(k), this); // 手动调用callback函数，传递响应式数据
    });
  },
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
    // Q2 Map类型的SET操作, 也触发与ITERATE_KEY相关联的副作用函数重新执行
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

const key = { key: 1 };
const value = new Set([1, 2, 3]);
const m = reactive(new Map([[key, value]], ['key', 1]));
effect(() => {
  m.forEach(function (value, key, m) {
    console.log(value);
    console.log(key);
  });
});
m.set({ key: 2 }, value); // 新增属性, 触发副作用执行

// Q1 reactive是深响应, 那么forEach回调函数所接收到的参数也应该是响应式数据才对。
effect(() => {
  m.forEach(function (value, key) {
    console.log(value.size);
  });
});
m.get(key).delete(1); // 未触发响应
// 答:
// value.size value是原始数据对象, 不会建立追踪关系
// m.get(key) 获取到的是原始数据对象, 不会触发响应

// Q2 修改集合的值, 也没有触发响应
m.set('key', 2);
// 答：
// 只对键的数量改变(ADD、DELETE)做了相应处理；未对集合值的改变做处理
