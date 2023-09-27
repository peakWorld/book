import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['./app/entry.ts'],
  entryNames: '[dir]/[name]-[hash]', // 设置输入文件名
  outbase: 'app',
  bundle: true,
  outdir: 'dist',
});
