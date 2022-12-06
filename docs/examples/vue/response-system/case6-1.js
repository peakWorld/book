import { reactive, effect } from './core5.js';
// S1. 用非原始值“包裹”原始值
const wrapper = { value: 'vue' };
const name = reactive(wrapper);
effect(() => {
  console.log('name.value => ', name.value);
});
name.value = 'vue3'; // 触发响应

// 问题
// 1. 用户创建一个响应式的原始值, 必须顺带创建一个包裹对象。
// 2. 包裹对象由用户定义, 用户可以随意命名, 不规范。

// S2. 封装一个ref函数
function refTmp(val) {
  const wrapper = { value: val }; // 在ref函数内部创建包裹对象
  return reactive(wrapper); // 将包裹对象变成响应式数据
}

const refval = refTmp(1);
effect(() => {
  console.log('refval.value => ', refval.value);
});
refval.value = 2;

// S3 区分ref对象
const refVal1 = ref(1); // 原始值的包裹对象
const refVal2 = reactive({ value: 1 }); // 非原始值的响应式数据

function ref(val) {
  const wrapper = { value: val };
  Object.defineProperty(wrapper, '__v_isRef', { value: true }); // 定义不可枚举且不可写的属性
  return reactive(wrapper);
}
