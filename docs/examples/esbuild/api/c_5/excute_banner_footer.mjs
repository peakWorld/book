import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['./app/index.ts'],
  // 开头
  banner: {
    js: '//comment banner',
    css: '/*comment*/',
  },
  // 末尾
  footer: {
    js: '//comment footer',
    css: '/*comment*/',
  },
  bundle: true,
  outdir: 'dist',
});
