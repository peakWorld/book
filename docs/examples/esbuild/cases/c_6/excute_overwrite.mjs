import * as esbuild from 'esbuild';

// app 文件存在入口文件 index.js
// 构建生成的文件也是 index.js, 此时会报错
// 开启allowOverwrite, 覆盖 index.js 文件 可比对前后差异

esbuild.build({
  entryPoints: ['./app/index.js'],
  outdir: './app',
  // allowOverwrite: true,
  format: 'iife',
});
