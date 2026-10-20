import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const destination = join(root, 'dist');
await mkdir(destination, { recursive: true });
const packed = spawnSync('npm', ['pack', '--json', '--pack-destination', destination], { cwd: root, encoding: 'utf8' });
assert.equal(packed.status, 0, 'npm pack failed');
const manifest = JSON.parse(packed.stdout)[0];
const paths = manifest.files.map(file => file.path);
for (const required of ['index.js', 'src/client.js', 'src/native-plugin.mjs', 'src/native-service.mjs', 'src/native-store.mjs', 'src/native-host.mjs', 'src/native-slack.mjs', 'src/project-structure.mjs', 'docs/native.md']) assert.ok(paths.includes(required), `Missing ${required}`);
for (const path of paths) {
  assert.ok(!/^(?:test|dist|node_modules|dev-plans|docs\/superpowers)\//.test(path), `Private development file packaged: ${path}`);
  assert.ok(!/(?:^|\/)\.env(?:\.|$)|\.log$|\.pid$/.test(path), `Runtime data packaged: ${path}`);
  if (!/\.(?:js|mjs|json|md|yml|yaml|txt)$/.test(path)) continue;
  const text = await readFile(join(root, path), 'utf8');
  assert.ok(!/\/Users\/|\/home\/[^/]+\//.test(text), `Private machine path: ${path}`);
  assert.ok(!/gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{20,}/.test(text), `Credential-shaped value: ${path}`);
  assert.ok(!/example-company|miclip\.mx|ExampleWorkspace|Example Brand/i.test(text), `Private business marker: ${path}`);
}
new vm.Script(await readFile(join(root, 'src/client.js'), 'utf8'));
const tarball = await readFile(join(destination, manifest.filename));
const sha256 = createHash('sha256').update(tarball).digest('hex');
await writeFile(join(destination, 'SHA256SUMS'), `${sha256}  ${manifest.filename}\n`);
console.log(JSON.stringify({ filename: manifest.filename, bytes: tarball.length, files: paths.length, sha256, privateDataChecks: 'passed', clientSyntax: 'passed' }, null, 2));
