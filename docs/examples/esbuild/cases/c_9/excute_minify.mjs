import * as esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['./app/minify/index.ts'],
  outbase: 'app',
  outdir: 'dist',
  bundle: true,

  minify: true,
});

// var js = 'fn = obj => { return obj.x }';
// const res = await esbuild.transform(js, {
//   minify: true,

//   // minifyWhitespace: true, // 删除空白
//   // minifySyntax: true, // 重写语法
//   // minifyIdentifiers: true, // 局部变量重命名
// });
// console.log('code', res.code);
