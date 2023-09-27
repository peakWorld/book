import * as esbuild from 'esbuild';

let ctx = await esbuild.context({
  entryPoints: ['app.js'],
  bundle: true,
  outdir: 'dist',
  logLevel: 'info', // 输出启动日志
});

await ctx.watch();
console.log('watching...');

await new Promise((r) => setTimeout(r, 10 * 1000));
await ctx.dispose();
console.log('stopped watching');
