import { reactive, effect } from './core5.js';

// Q1 展开运算符(...)导致响应丢失
const pobj = reactive({ foo: 1, bar: 2 }); // 响应式数据
const newObj = { ...pobj }; // 展开运算符得到新对象, 普通对象
effect(() => {
  console.log(newObj.bar);
});
pobj.bar = 3; // 修改bar值不会触发响应 ❌

// Q2 在副作用函数中, 即使通过普通对象newObj来访问属性值, 也能建立响应联系？
const newObj2 = {
  foo: {
    get value() {
      return pobj.foo;
    },
  },
  bar: {
    get value() {
      return pobj.bar;
    },
  },
};
effect(() => {
  console.log(newObj2.bar.value); // 访问器属性(函数), 函数中读取响应式数据的相应元素
});
pobj.bar = 33; // 修改bar值会触发响应 ✅

// Q3 优化
function toRefTmp2(obj, key) {
  // obj 响应式数据, key 对应键名
  const wrapper = {
    get value() {
      return obj[key];
    },
  };
  return wrapper;
}
const newObj3 = {
  foo: toRefTmp2(pobj, 'foo'), // 单个键转换成访问器属性
  bar: toRefTmp2(pobj, 'bar'),
};
function toRefs(obj) {
  // obj 响应式数据
  const ret = {};
  for (const key in obj) {
    ret[key] = toRefTmp2(obj, key);
  }
  return ret;
}
const newObj4 = { ...toRefs(pobj) };

// Q4 区分ref对象, 且newObj设值触发更新
function toRef(obj, key) {
  const wrapper = {
    get value() {
      return obj[key];
    },
    set value(val) {
      obj[key] = val; // 允许设置值
    },
  };
  Object.defineProperty(wrapper, '__v_isRef', { value: true });
  return wrapper;
}
const refFoo = toRef(pobj, 'foo');
effect(() => {
  console.log('refFoo', refFoo.value);
});
refFoo.value = 55;
