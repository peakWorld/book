import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['./app/entry.ts'],
  chunkNames: 'chunks/[name]-[hash]',
  bundle: true,
  outdir: 'dist',
  // 必备
  splitting: true,
  format: 'esm',
});
