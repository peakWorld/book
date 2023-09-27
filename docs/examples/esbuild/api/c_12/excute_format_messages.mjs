import * as esbuild from 'esbuild';

const result = await esbuild.build({
  entryPoints: ['./app/format_messages/index.ts'],
  outbase: 'app',
  outdir: 'dist',

  logLevel: 'silent', // 禁止默认日志记录
  write: false, // 不写入磁盘
});

let formatted = await esbuild.formatMessages(
  // 例子
  // [
  //   {
  //     text: 'This is an error',
  //     location: {
  //       file: 'app.js',
  //       line: 10,
  //       column: 4,
  //       length: 3,
  //       lineText: 'let foo = bar',
  //     },
  //   },
  // ],

  // 编译输出错误
  result.warnings,
  {
    kind: 'error', // 错误(error) ｜ 警告(warning)
    color: true, // 彩色输出
    terminalWidth: 100, // 长行换行
  }
);

console.log(formatted.join('\n'));
