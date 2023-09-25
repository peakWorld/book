import * as esbuild from 'esbuild';

let ctx = await esbuild.context({
  entryPoints: ['app.ts'],
  bundle: true,
  outdir: 'dist',
});

// Watch mode
// await ctx.watch();

// Serve mode
// let { host, port } = await ctx.serve();

// Rebuild mode
// await ctx.rebuild();
