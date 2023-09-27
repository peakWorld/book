import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['./app/alias/index.jsx'],
  bundle: true,
  outdir: 'dist',
  outbase: './app',
  alias: {
    // react: 'react-dom',  // 第三方模块
    // react: 'mbar',       // 本地模块
    // react: './app/alias/other/index.js', // 本地文件
  },
});
