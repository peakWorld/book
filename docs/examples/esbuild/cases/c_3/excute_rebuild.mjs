import * as esbuild from 'esbuild';

let ctx = await esbuild.context({
  entryPoints: ['app.js'],
  bundle: true,
  outdir: 'dist',
});

// Call "rebuild" as many times as you want
for (let i = 0; i < 5; i++) {
  let result = await ctx.rebuild();
}

// Call "dispose" when you're done to free up resources
ctx.dispose();
