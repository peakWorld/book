import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['./app/index.ts'],
  bundle: true,
  outdir: 'dist',
  // 结合加载器使用
  loader: { '.png': 'file' },
  publicPath: 'https://www.example.com/v1',
});
