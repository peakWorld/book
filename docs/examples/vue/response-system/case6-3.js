import { reactive, effect } from './core5.js';

function toRef(obj, key) {
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

function toRefs(obj) {
  const ret = {};
  for (const key in obj) {
    ret[key] = toRef(obj, key);
  }
  return ret;
}

const obj = reactive({ foo: 1, bar: 2 });
const newObj = { ...toRefs(obj) };

// Q1 由于toRefs会把响应式数据的第一层属性值转换为ref, 必须通过value属性访问值
obj.foo; // 响应式数据访问值
newObj.foo.value; // toRefs包裹数据访问值; 有使用负担

// Q2 脱ref
function proxyRefs(target) {
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
const newObj2 = proxyRefs({ ...toRefs(obj) });

newObj2.foo; // 不用再加上.value
