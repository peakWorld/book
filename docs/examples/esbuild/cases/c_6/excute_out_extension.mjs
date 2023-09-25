import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['./app/index.js'],
  // 自定义构建文件扩展名
  outExtension: {
    '.js': '.mjs',
  },
  // 输出目录
  outdir: 'dist',
});
