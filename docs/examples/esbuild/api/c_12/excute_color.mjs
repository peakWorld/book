import * as esbuild from 'esbuild';

// let js = 'typeof x == "null"';
// await esbuild.transform(js, {
//   color: true,
//   logLevel: 'info',
// });

const result = await esbuild.build({
  entryPoints: ['./app/color/index.ts'],
  outbase: 'app',
  outdir: 'dist',
  logLevel: 'verbose',

  color: false, // 控制台彩色错误信息
  logLimit: 20, // 设置日志限制为 20 条消息
});
