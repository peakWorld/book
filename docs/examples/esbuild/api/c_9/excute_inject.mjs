import * as esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['./app/inject/index.ts'],
  outbase: 'app',
  outdir: 'dist',
  bundle: true,

  // 使用inject功能将所有对全局属性process.cwd的引用替换为从该文件导入的内容
  inject: ['./app/inject/process-cwd-shim.js'],
});

esbuild.build({
  entryPoints: ['./app/inject/index.tsx'],
  outbase: 'app',
  outdir: 'dist',
  bundle: true,

  // 识别tsx后缀, 自动转换代码; 使用esm编译, 去除胶水代码(方便观察代码差异)
  external: ['react'],
  format: 'esm',
  // 全局替换[代码差异]
  inject: ['./app/inject/jsx-shim.js'],
});

esbuild.build({
  entryPoints: ['./app/inject/global/index.ts'],
  outbase: 'app',
  outdir: 'dist',
  bundle: true,

  format: 'esm',
  inject: ['./app/inject/global-shim.js'],
});
