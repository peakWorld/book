import * as utils from './core6.js';

// Dom平台 合格的渲染器
function renderer(domString, container) {
  container.innerHTML = domString;
}

// 如下方法调用

// 1. 静态字符串
renderer('<h1>hello</h1>', document.getElementById('app'));

// 2.动态拼接的HTML内容
let count = 1;
renderer(`<h1>${count}</h1>`, document.getElementById('app'));

// 3. 结合响应式数据和副作用函数
const countRef = utils.ref(2);
utils.effect(() => {
  renderer(`<h1>${countRef.value}</h1>`, document.getElementById('app'));
});
setTimeout(() => countRef.value++, 500);
// 利用响应系统的能力, 自动调用渲染器完成页面的渲染和更新。

// 4. 使用@vue/reactivity
const { effect, ref } = VueReactivity;
const countVRef = ref(5);
effect(() => {
  renderer(`<h1>${countVRef.value}</h1>`, document.getElementById('app'));
});
setTimeout(() => countVRef.value++, 500);
