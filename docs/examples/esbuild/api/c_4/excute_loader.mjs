import * as esbuild from 'esbuild';

// await esbuild.build({
//   entryPoints: ['./app/home.ts'],
//   bundle: true, // 打包
//   loader: {
//     '.png': 'dataurl',
//     '.svg': 'text',
//   },
//   outdir: 'dist',
// });

let ts = 'let x: number = 1';
let result = await esbuild.transform(ts, {
  loader: 'ts',
});
