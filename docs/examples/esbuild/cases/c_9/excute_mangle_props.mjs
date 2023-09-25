import * as esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['./app/mangle_props/index.ts'],
  outbase: 'app',
  outdir: 'dist',
  // bundle: true,

  // 混淆以下划线结尾的属性(属性生效)
  mangleProps: /_$/,

  // 混淆字符串字面量内容[字符串属性, 默认不生效]
  mangleQuoted: true,

  // 排除某些属性, 不混淆
  reserveProps: /keep_$/,

  // 持久化 名称和混淆名称的映射
  mangleCache: {
    foo_: 'my_foo',
    age_: false,
  },
});
