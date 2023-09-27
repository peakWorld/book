import * as esbuild from 'esbuild';

import process from 'node:process';

let ctx = await esbuild.context({
  entryPoints: ['app.jsx'],
  bundle: true,
  outdir: 'dist',
  logLevel: 'info',
});

// 命令行输入任意信息, 取消当前构建、重启新构建
process.stdin.on('data', async () => {
  try {
    await ctx.cancel();

    console.log('build:', await ctx.rebuild());
  } catch (err) {
    console.error(err);
  }
});
