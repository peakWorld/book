import * as esbuild from 'esbuild';

// JSX
const text = '<div id="cs">33</div>';
const result = await esbuild.transform(text, {
  // jsx: 'transform',
  // jsx: 'preserve',
  jsx: 'automatic',

  jsxDev: true, // 只有jsx: 'automatic'才生效
  loader: 'jsx',
});
// console.log(result.code);

// JSX factory
const result2 = await esbuild.transform(text, {
  jsxFactory: 'h', // 当jsx: 'automatic' 不生效
  loader: 'jsx',
});
// console.log(result2.code);

// JSX fragment
const text2 = '<>text</>';
const result3 = await esbuild.transform(text2, {
  jsxFragment: 'Fragment', // 当jsx: 'automatic' 不生效
  loader: 'jsx',
});
// console.log(result3.code);

// JSX side effects
await esbuild.build({
  entryPoints: ['./app/jsx/index.jsx'],
  outbase: 'app',
  outdir: 'dist',
  jsxSideEffects: true,
  bundle: true,
});
