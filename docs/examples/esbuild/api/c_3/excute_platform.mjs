import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['app.js'],
  bundle: true,
  platform: 'node', // 面向node
  outfile: 'dist/app_node.js',
});

await esbuild.build({
  entryPoints: ['app.js'],
  bundle: true,
  platform: 'browser', // 面向浏览器
  outfile: 'dist/app_browser.js',
});
