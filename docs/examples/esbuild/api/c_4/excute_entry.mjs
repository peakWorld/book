import * as esbuild from 'esbuild';

await esbuild.build({
  // entryPoints: ['./app/home.ts', './app/setting.ts'],
  entryPoints: [
    { out: 'out1', in: './app/home.ts' },
    { out: 'out2', in: './app/setting.ts' },
  ],
  bundle: true, // 打包
  outdir: 'dist',
});
