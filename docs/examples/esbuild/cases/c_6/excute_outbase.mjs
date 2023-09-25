import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['./app/outbase/home/index.ts', './app/outbase/about/index.ts'],
  bundle: true,
  outdir: 'dist',
  // outbase: 'app/outbase',
  outbase: 'app',
});
