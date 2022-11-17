const bucket = new WeakMap();
const effectStack = [];
let activeEffect;
let ITERATE_KEY = Symbol();
const reactiveMap = new Map();

// 自定义方法
const mutableInstrumentations = {
  add(key) {
    const target = this.raw; // p.add this指向的是代理对象, 通过raw获取原始数据对象
    const hadKey = target.has(key); // 判断值是否已经存在
    const res = target.add(key); // 原始数据对象执行add方法添加值
    if (!hadKey) {
      // 元素不存在, 触发响应
      trigger(target, key, 'ADD');
    }
    return res;
  },
  delete(key) {
    const target = this.raw;
    const hadKey = target.has(key);
    const res = target.delete(key);
    if (hadKey) {
      // 元素存在, 触发响应
      trigger(target, key, 'DELETE');
    }
    return res;
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
        track(target, ITERATE_KEY); // 调用track函数建立响应联系
        return Reflect.get(target, key, target);
      }
      return mutableInstrumentations[key]; // 返回自定义方法
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
  if (['ADD', 'DELETE'].includes(type)) {
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

const p = reactive(new Set([1, 2, 3]));
effect(() => {
  console.log(p.size); // 在副作用函数内访问size属性
});
p.add(1); // 添加值为1的元素，应该触发响应
