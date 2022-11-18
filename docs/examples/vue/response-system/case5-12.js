const bucket = new WeakMap();
const effectStack = [];
let activeEffect;
let ITERATE_KEY = Symbol();
const reactiveMap = new Map();

// 自定义方法
const mutableInstrumentations = {
  get(key) {
    const target = this.raw; // 获取原始数据
    const had = target.has(key); // key是否存在
    track(target, key); // 追踪依赖，建立响应联系
    if (had) {
      const res = target.get(key);
      // 如果res仍然可以代理, 则返回reactive包装后的响应式数据
      return typeof res === 'object' ? reactive(res) : res;
    }
  },
  set(key, newVal) {
    const target = this.raw;
    const had = target.has(key);
    const oldVal = target.get(key); // 获取旧值

    // target.set(key, newVal);
    // Q1问题解决 如果newVal是代理对象, 则获取原始数据对象
    const rawValue = newVal.raw || newVal;
    target.set(key, rawValue);

    if (!had) {
      trigger(target, key, 'ADD'); // 新增，ADD类型操作
    } else if (oldVal !== newVal && (oldVal === oldVal || newVal === newVal)) {
      trigger(target, key, 'SET'); // 值变了, SET类型操作
    }
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

// const p = reactive(new Map([['key', 1]]));
// effect(() => {
//   console.log(p.get('key'));
// });
// p.set('key', 2);

// Q1 set方法污染原始数据
const m = new Map();
const p1 = reactive(m);
const p2 = reactive(new Map());
p1.set('p2', p2); // 调用p1.set方法, 按现在的实现方式`target.set(key, newVal)`, 将代理对象设置给了原始数据对象。

effect(() => {
  console.log(m.get('p2').size); // p2 = m.get('p2'); p2.size  p2是代理对象,会track建立响应
});
m.get('p2').set('foo', 1); // p2 = m.get('p2'); p2.set('foo', 1) 会triger触发响应

// 原始数据混合响应式数据, 这是不应该的。
