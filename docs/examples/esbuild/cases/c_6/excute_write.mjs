import * as esbuild from 'esbuild';

let result = await esbuild.build({
  entryPoints: ['./app/index.ts'],
  sourcemap: 'external',
  write: false, // 是否写入文件系统
  outdir: 'out',
});

for (let out of result.outputFiles) {
  console.log(out.path, out.contents, out.hash, out.text);
}
