import * as esbuild from 'esbuild';

// await esbuild.build({
//   entryPoints: ['./app/supported/index.js'],
//   outbase: 'app',
//   outdir: 'dist',
//   bundle: true,
//   supported: {
//     class: false,
//     arrow: false,
//     'async-await': false,
//   },
// });

const text = `
  export class Test {}

  const xx = () => {};

  async function test() {
    const xx = await new Promise((resolve) => setTimeout(resolve, 2000));
  }
`;
const result = await esbuild.transform(text, {
  supported: {
    // class: false,    // API
    // arrow: false,    // 语法
    // 'async-await': false, // 语法
  },
});

console.log('result', result);
