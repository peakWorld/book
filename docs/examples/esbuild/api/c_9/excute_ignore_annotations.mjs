import * as esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['./app/excute_ignore_annotations/index.ts'],
  outbase: 'app',
  outdir: 'dist',
  bundle: true,

  // 该设置将忽略副作用注释: 不再遵循/* @__PURE__ */注释或sideEffects字段。
  // ignoreAnnotations: true,
});
