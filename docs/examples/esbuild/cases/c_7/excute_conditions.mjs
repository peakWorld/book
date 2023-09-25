import * as esbuild from 'esbuild';

// mfoo/case1 中自定义import/require/browser/node,
// mfoo/case2 自定义browser/node,

await esbuild.build({
  entryPoints: ['./app/conditions/index.ts'],
  bundle: true,
  outbase: 'app',
  outdir: 'dist',

  // platform: 'neutral',
  platform: 'node',

  // conditions: ['custom2'],
});

// 五种特殊行为Conditions
// import/require 优先级最高, 按引用方式导入
// 未自定义import/require, 根据platform引入browser/node
// 未自定义import/require、设定平台为neutral, 引入default

// 1、默认配置

// mfoo/case1路径, 导致的文件
// import方式 => imported1.mjs
// require方式 => required1.cjs

// mfoo/case2路径, 导致的文件
// import|require => browser2.js

// 2、平台设置neutral

// mfoo/case1路径, 导致的文件
// import方式 => imported1.mjs
// require方式 => required1.cjs

// mfoo/case2路径, 导致的文件
// import|require => fallback2.js

// format编码方式, 按照所选平台默认设置

// 自定义Conditions
// 自定义优先级高于五种默认的特殊行为

// 满足多个条件, 则按exports中的顺序导入
// mfoo/case4
