import * as esbuild from 'esbuild';

let js = 'module.exports = "test"';
let result = await esbuild.transform(js, {
  format: 'iife',
  globalName: 'xyz', // 全局变量
});
// console.log(result.code);
// var xyz = (() => {
//   var require_stdin = __commonJS({
//     '<stdin>'(exports, module) {
//       module.exports = 'test';
//     },
//   });
//   return require_stdin();
// })();

let result2 = await esbuild.transform(js, {
  format: 'iife',
  globalName: 'example.versions["1.0"]', // 全局变量[复合属性表达式]
});
console.log(result2.code);
// var example;
// ((example ||= {}).versions ||= {})['1.0'] = (() => {
//   var require_stdin = __commonJS({
//     '<stdin>'(exports, module) {
//       module.exports = 'test';
//     },
//   });
//   return require_stdin();
// })();
