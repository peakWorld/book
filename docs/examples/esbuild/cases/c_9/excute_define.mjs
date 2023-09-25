import * as esbuild from 'esbuild';

/** Define */
let js = 'hooks = DEBUG && require("hooks"); id, str';
const result = await esbuild.transform(js, {
  define: {
    DEBUG: 'false',
    id: 'text',
    str: '"text"',
  },
});

// console.log('code', result.code); // code hooks = false; text, "text";
// "esbuild --define:process.env.NODE_ENV=\\\"production\\\" app.js"

/** Drop */
let js2 = `
  let x = 1;
  debugger;

  x = 23;

  console.log('x', x + 2)
`;
const result2 = await esbuild.transform(js2, {
  drop: ['console', 'debugger'],
});

// console.log('code', result2.code);

/** Drop labels */
let js3 = `
  function example() {
    DEV: doAnExpensiveCheck()
    return normalCodePath()
  }
`;
const result3 = await esbuild.transform(js3, {
  dropLabels: ['DEV', 'TEST'],
});
console.log('code', result3.code);

// Ignore annotations
