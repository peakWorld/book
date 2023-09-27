import * as esbuild from 'esbuild';

let ctx = await esbuild.build({
  entryPoints: ['app.ts'],
  bundle: true,
  outdir: 'dist',
  logLevel: 'info',

  // 自定义tsconfig文件
  // tsconfig: 'custom-tsconfig.json',

  // 自定义tsconfig内容
  tsconfigRaw: `{
    "compilerOptions": {
      "useDefineForClassFields": false,
    },
  }`,
});
