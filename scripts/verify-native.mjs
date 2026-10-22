import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, mkdtemp, rm, lstat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const privateScanFile = process.env.AGENT_TWIN_PRIVATE_SCAN_FILE;
let privateScanPatterns = [];
if (privateScanFile !== undefined) {
  assert.ok(typeof privateScanFile === 'string' && isAbsolute(privateScanFile) && !privateScanFile.includes('\0'), 'AGENT_TWIN_PRIVATE_SCAN_FILE must be an absolute path');
  let values;
  try {
    const stat = await lstat(privateScanFile);
    assert.ok(stat.isFile() && !stat.isSymbolicLink() && stat.size <= 65536);
    const bytes = await readFile(privateScanFile);
    assert.ok(bytes.length <= 65536);
    values = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new Error('Private scan configuration must be a readable, bounded, regular UTF-8 JSON file');
  }
  assert.ok(Array.isArray(values) && values.length > 0 && values.length <= 128 && values.every(value => typeof value === 'string' && value.trim().length > 0 && value.length <= 4096 && !value.includes('\0')), 'Private scan configuration must be a non-empty array of up to 128 bounded regular-expression strings');
  try { privateScanPatterns = values.map(value => new RegExp(value, 'i')); }
  catch { throw new Error('Private scan configuration contains an invalid regular expression'); }
}
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
  assert.ok(!privateScanPatterns.some(pattern => pattern.test(text)), `Local private marker: ${path}`);
}
new vm.Script(await readFile(join(root, 'src/client.js'), 'utf8'));
const tarball = await readFile(join(destination, manifest.filename));
const extracted = await mkdtemp(join(tmpdir(), 'twin-package-check-'));
try {
  const unpack = spawnSync('tar', ['-xzf', join(destination, manifest.filename), '-C', extracted], { encoding: 'utf8' });
  assert.equal(unpack.status, 0, 'tarball extraction failed');
  for (const path of paths) {
    const actual = join(extracted, 'package', path);
    assert.ok((await lstat(actual)).isFile(), `Non-regular packaged entry: ${path}`);
    assert.deepEqual(await readFile(actual), await readFile(join(root, path)), `Tarball differs from checked source: ${path}`);
  }
} finally {
  await rm(extracted, { recursive: true, force: true });
}
const sha256 = createHash('sha256').update(tarball).digest('hex');
await writeFile(join(destination, 'SHA256SUMS'), `${sha256}  ${manifest.filename}\n`);
console.log(JSON.stringify({ filename: manifest.filename, bytes: tarball.length, files: paths.length, sha256, privateDataChecks: 'passed', privateMarkerChecks: privateScanFile === undefined ? 'not_configured' : 'passed', tarballMatchesSource: true, clientSyntax: 'passed' }, null, 2));
