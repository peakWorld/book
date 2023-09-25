import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['./app/node_paths/index.ts'],
  bundle: true,
  outbase: 'app',
  outdir: 'dist',

  // NODE_PATH 自定义全局模块(文件夹)
  nodePaths: ['../../modules'],

  // 先进行alias别名替换, 再进行external的路径标记
  packages: 'external',
  // alias: {
  //   mbar: './app/conditions/index.ts',
  // },

  // 隐式文件扩展
  resolveExtensions: ['.mjs'],
});
