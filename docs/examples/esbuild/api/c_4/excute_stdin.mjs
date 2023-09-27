import * as esbuild from 'esbuild';

let result = await esbuild.build({
  stdin: {
    // 指定stdin文件的内容
    contents: `
      import Home from "./home.ts";
      console.log('sex', new Home().sex)
    `,
    // 可选配置
    resolveDir: './app', // 选择指定解析目录（用于确定相对导入的位置）
    sourcefile: 'imaginary__file.ts', // 源文件（在错误消息和源映射中使用的文件名）
    loader: 'ts', // 加载器（决定如何解释文件内容）
  },
  format: 'esm',
  outdir: 'dist',
});

console.log(result);
