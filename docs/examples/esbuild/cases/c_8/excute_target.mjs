import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['./app/target/index.js'],
  outbase: 'app',
  outdir: 'dist',
  bundle: true,

  target: [
    // 指定 JavaScript 语言版本
    // 'es2020',
    // 'es6',

    // 目标环境 都是一个环境名称，后跟一个版本号。
    'chrome58',
    'edge16',
    'firefox57',
    'node12',
    'safari11',
  ],

  // 设置某个特性
  supported: {
    // target设置不支持 destructuring特性, 导致编译报错;
    // 在supported开启这个特性, 则不会报错
    destructuring: true,
  },
});
