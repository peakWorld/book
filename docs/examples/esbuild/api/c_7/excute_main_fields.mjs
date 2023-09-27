import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['./app/main_fields/index.ts'],
  bundle: true,
  outbase: 'app',
  outdir: 'dist',

  mainFields: ['main', 'module'],
  platform: 'neutral',
});

// 每个Platform配置有默认的mainFields值

// 将平台设置为‘neutral’, 防止默认值干扰
// mainFields 的优先级从前往后
