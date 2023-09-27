import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['./app/external/index.ts'],
  bundle: true,
  outbase: 'app',
  outdir: 'dist',
  // 模块
  // external: ['mbar'],

  // 静态文件
  loader: {
    '.png': 'file',
  },
  external: ['*.png'],
});
