import * as esbuild from 'esbuild';
import fs from 'fs';

const result = await esbuild.build({
  entryPoints: ['./app/analyze/index.ts'],
  outbase: 'app',
  outdir: 'dist',
  logLevel: 'info',

  bundle: true,
  metafile: true,
});

fs.writeFileSync('./dist/analyze/meta.json', JSON.stringify(result.metafile));
