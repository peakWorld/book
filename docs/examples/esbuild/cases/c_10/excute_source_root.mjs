import * as esbuild from 'esbuild';

const ctx = await esbuild.context({
  entryPoints: ['./app/source_root/index.ts'],
  outbase: 'app',
  outdir: 'dist',
  logLevel: 'info',

  // sourcemap: true,
  // sourceRoot: '/',
});
