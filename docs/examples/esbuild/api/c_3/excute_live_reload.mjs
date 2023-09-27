import * as esbuild from 'esbuild';

let ctx = await esbuild.context({
  entryPoints: ['app.jsx'],
  bundle: true,
  outdir: 'www',
  logLevel: 'info',
});

// esbuild没有直接提供实时重新加载的API。
// 相反，您可以通过组合观察模式（在编辑和保存文件时自动启动构建）和服务模式（提供最新的构建，但在完成之前阻止）

// 观察模式
await ctx.watch();

// 服务模式
let { host, port } = await ctx.serve({
  servedir: 'www',
});
