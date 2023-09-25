import * as esbuild from 'esbuild';

// 启用打包, esbuild选择一个输出格式;未启用打包, 不进行格式转换
await esbuild.build({
  entryPoints: ['./app/index.ts'],
  bundle: true,
  outfile: './dist/format_no.js',
});

let iife_js = 'alert("test")';
let iife_result = await esbuild.transform(iife_js, {
  format: 'iife',
});
// console.log('iife', iife_result.code);

let cjs_js = 'export default "test"';
let cjs_result = await esbuild.transform(cjs_js, {
  format: 'cjs',
});
// console.log(cjs_result.code);

let esm_js = 'module.exports = "test"';
let esm_result = await esbuild.transform(esm_js, {
  format: 'esm',
});
console.log(esm_result.code);
