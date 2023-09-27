import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['./app/splitting/entry1.ts', './app/splitting/entry2.ts'],
  bundle: true,
  outdir: 'dist',
  format: 'esm', // 代码输出格式
  platform: 'node', // 代码适用平台
  logLevel: 'info',
  splitting: true, // 代码分割
});
