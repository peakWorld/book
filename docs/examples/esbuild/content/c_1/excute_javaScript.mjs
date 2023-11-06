import * as esbuild from 'esbuild';

const result = await esbuild.build({
  entryPoints: ['./app/javaScript/index.ts'],
  outbase: 'app',
  outdir: 'dist',
  logLevel: 'info',

  // target: 'es5', // 不支持
  platform: 'neutral',
  bundle: true,
});
