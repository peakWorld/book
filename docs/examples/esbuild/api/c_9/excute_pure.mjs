import * as esbuild from 'esbuild';

let js = `
  document.createElement(elemName());
  let createElement2 = document.createElement;
  createElement2('xx');
`;

const res = await esbuild.transform(js, {
  // 在指定函数调用前添加特殊注释/* @__PURE__ */
  pure: ['document.createElement'],

  // 缩小化时, 执行约定
  minify: true,
});

console.log('code', res.code);
