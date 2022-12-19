import { reactive } from './core5.js';

// 原始数据类型包裹ref
export function ref(val) {
  const wrapper = { value: val };
  Object.defineProperty(wrapper, '__v_isRef', { value: true });
  return reactive(wrapper);
}

export function toRef(obj, key) {
  // 将单个元素转变为存取器属性
  const wrapper = {
    get value() {
      return obj[key];
    },
    set value(val) {
      obj[key] = val;
    },
  };
  Object.defineProperty(wrapper, '__v_isRef', { value: true });
  return wrapper;
}

// 对象类型包裹ref
export function toRefs(obj) {
  const ret = {};
  for (const key in obj) {
    ret[key] = toRef(obj, key);
  }
  return ret;
}

// 对于ref包裹数据 => 脱ref
export function proxyRefs(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver);
      return value.__v_isRef ? value.value : value;
    },
    set(target, key, newVal, receiver) {
      const value = target[key];
      if (value.__v_isRef) {
        value.value = newVal;
        return true;
      }
      return Reflect.set(target, key, newVal, receiver);
    },
  });
}

export * from './core5.js';
