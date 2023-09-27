import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['app.jsx'],
  bundle: true,
  minify: true, // enable minification
  sourcemap: true, // enable source maps
  target: ['chrome58', 'firefox57', 'safari11', 'edge16'], // 配置浏览器目标环境，将太新的语法转换为较旧的语法
  outfile: 'to_browser.js',
});

// esbuild app.jsx --bundle --minify --sourcemap --target=chrome58,firefox57,safari11,edge16
