import * as esbuild from 'esbuild';
import http from 'node:http';

let ctx = await esbuild.context({
  entryPoints: ['app.jsx'],
  bundle: true,
  outdir: 'www',
});

let { host, port } = await ctx.serve({
  servedir: 'www', // 未设置servedir, 只提供构建结果
  onRequest(ctx) {
    // 在请求完成后调用, 提供请求部分信息
    console.log('ctx', ctx);
  },
});

// 代理服务器
http
  .createServer((req, res) => {
    const options = {
      hostname: host,
      port: port,
      path: req.url,
      method: req.method,
      headers: req.headers,
    };

    // request to esbuild
    const proxyReq = http.request(options, (proxyRes) => {
      // If esbuild returns "not found", send a custom 404 page
      if (proxyRes.statusCode === 404) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>A custom 404 page</h1>');
        return;
      }

      // Otherwise, forward the response from esbuild to the client
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    // the body of the request to esbuild
    req.pipe(proxyReq, { end: true });
  })
  .listen(3000);

console.log(`Local: http://127.0.0.1:3000`);
