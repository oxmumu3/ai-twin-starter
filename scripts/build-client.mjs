/**
 * Bundle `src-client/index.js` into DSH `window.__ModuleLoader__.load` CJS module (`client.js`).
 */
import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const result = await build({
  absWorkingDir: root,
  entryPoints: ['src-client/index.js'],
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'chrome120',
  external: ['react'],
  jsx: 'transform',
  write: false,
  minify: false
});

const text = result.outputFiles[0].text;
const wrapped = `window.__ModuleLoader__.load({id:"@oxmumu3/dsh-agent-twin",factory:require=>{const module={exports:{}};const exports=module.exports;\n${text}\nreturn module.exports;}});\n`;

await writeFile(resolve(root, 'client.js'), wrapped, 'utf8');
console.log(`Built client.js (${Buffer.byteLength(wrapped, 'utf8')} bytes)`);
