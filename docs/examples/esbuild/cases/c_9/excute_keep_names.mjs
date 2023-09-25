import * as esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['./app/keep_names/index.ts'],
  outbase: 'app',
  outdir: 'dist',
  bundle: true,

  minify: true,
  keepNames: true, // 保留函数名, 不会进行重命名
});
