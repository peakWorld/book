import * as esbuild from 'esbuild';

let js = 'let π = Math.PI';

(await esbuild.transform(js)).code;
// 'let \\u03C0 = Math.PI;\n'

(
  await esbuild.transform(js, {
    charset: 'utf8', // 使得esbuild打印原始字符而不使用转义序列
  })
).code;
// 'let π = Math.PI;\n'
