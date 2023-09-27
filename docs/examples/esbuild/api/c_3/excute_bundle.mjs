import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['app_glob.js'],
  bundle: true, // 打包
  outdir: 'dist',
});
