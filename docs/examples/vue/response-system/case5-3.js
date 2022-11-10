const bucket = new WeakMap();
const effectStack = [];
let activeEffect;
let ITERATE_KEY = Symbol();

const obj = { x: 1, y: 1, z: NaN };

const proxy = new Proxy(obj, {
  get(target, key, receiver) {
    track(target, key);
    return Reflect.get(target, key, receiver);
  },
  has(target, key) {
    track(target, key);
    return Reflect.has(target, key);
  },
  ownKeys(target) {
    track(target, ITERATE_KEY);
    return Reflect.ownKeys(target);
  },
  set(target, key, newVal, receiver) {
    const oldVal = target[key];
    const type = Object.prototype.hasOwnProperty(target, key) ? 'SET' : 'ADD';
    const res = Reflect.set(target, key, newVal, receiver);
    if (
      oldVal !== newVal && // 解决问题Q1 => 只有值发生变化才触发trigger
      (oldVal === oldVal || newVal === newVal) // 解决问题Q2 => 新值和旧值都是NaN, 不触发tigger
    ) {
      trigger(target, key, type);
    }
    return res;
  },
  deleteProperty(target, key) {
    const hadKey = Object.prototype.hasOwnProperty(target, key);
    const res = Reflect.deleteProperty(target, key);
    if (hadKey && res) {
      trigger(target, key, 'DELETE');
    }
  },
});

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

export function effect(fn, options = {}) {
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

// Q1 x值未发生变化, 不应该触发trigger;
// obj.x = 1

// Q2 z重新赋值为NaN, 不应该触发trigger;
// obj.z = NaN
// 因为!!(NaN !== NaN)为true, 知NaN是互不相等;
