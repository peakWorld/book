import * as esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['./app/tree_shaking/index.ts'],
  outbase: 'app',
  outdir: 'dist',

  treeShaking: true, // 强制开启
});
