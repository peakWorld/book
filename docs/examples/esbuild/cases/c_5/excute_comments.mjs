import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['./app/index.ts'],
  bundle: true,
  outdir: 'dist',
  logLevel: 'info',
  legalComments: 'eof', // 注释行为
  lineLimit: 80, // 行字符数
});
