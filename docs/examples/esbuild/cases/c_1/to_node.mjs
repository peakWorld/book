import * as esbuild from 'esbuild';

// await esbuild.build({
//   entryPoints: ['app.js'],
//   bundle: true,
//   platform: 'node', // configure the platform
//   target: ['node10.4'],
//   outfile: 'out_node.js',
// });
//esbuild app.js --bundle --platform=node --target=node10.4

await esbuild.build({
  entryPoints: ['app.jsx'],
  bundle: true,
  platform: 'node',
  packages: 'external', // 依赖项不再包含在捆绑包中，因此在运行时仍必须在文件系统上存在这些依赖项。
  outfile: 'out_node.js',
});
