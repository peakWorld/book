import * as esbuild from 'esbuild';

await esbuild.build({
  bundle: true,
  outbase: 'app',
  outdir: 'dist',
  logLevel: 'info',

  // entryPoints入口路径是相对于工作目录的

  // 工作目录 /Users/windlliu/twk/book/docs/examples/esbuild/cases/c_7
  // entryPoints: ['./app/working_directory/index.ts'],

  // 重新设置了工作目录, 则入口路径要相对于新的工作目录
  absWorkingDir:
    '/Users/windlliu/twk/book/docs/examples/esbuild/cases/c_7/app/working_directory',
  entryPoints: ['index.ts'],
});
