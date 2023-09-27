import * as esbuild from 'esbuild';

let ctx = await esbuild.context({
  entryPoints: ['app.js'],
  bundle: true,
  outdir: 'dist',
  logLevel: 'info', // 输出启动日志
});

let { host, port } = await ctx.serve({
  servedir: 'dist', // 未设置servedir, 只提供构建结果
  onRequest(ctx) {
    // 在请求完成后调用, 提供请求部分信息
    console.log('ctx', ctx);
  },
  // 使用https
  keyfile: './cerf/your.key',
  certfile: './cerf/your.cert',
});
