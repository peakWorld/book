import * as esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['./app/index.ts'],
  assetNames: 'assets/[name]-[hash]',
  bundle: true,
  outdir: 'dist',
  // 加载文件
  loader: { '.png': 'file' },
});
