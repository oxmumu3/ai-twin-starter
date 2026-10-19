import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, realpath, mkdir, copyFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { countStock } from '../examples/messy-project/raw/tools/stock-count.mjs';

test('synthetic read-only stock tool reconciles counts and rejects ambiguous data', async t => {
  const cwd = await realpath(await mkdtemp(join(tmpdir(), 'stock-demo-')));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const path = join(cwd, 'stock.csv');
  await writeFile(path, 'item,counted,reserved\npart-a,12,2\npart-b,8,1\n');
  assert.deepEqual(await countStock(path), { items: 2, counted: 20, reserved: 3, usable: 17 });
  for (const rows of ['part-a,2,3', 'part-a,2,0\npart-a,3,0', 'part-a,no,0', 'part-a,9007199254740992,0']) {
    await writeFile(path, `item,counted,reserved\n${rows}\n`);
    await assert.rejects(countStock(path));
  }
});

test('stock demo CLI works in paths containing spaces and tilde characters', async t => {
  const parent = await realpath(await mkdtemp(join(tmpdir(), 'stock-path-')));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const cwd = join(parent, 'path ~ with spaces');
  await mkdir(cwd);
  const file = join(cwd, 'stock-count.mjs');
  await copyFile(new URL('../examples/messy-project/raw/tools/stock-count.mjs', import.meta.url), file);
  const input = fileURLToPath(new URL('../examples/messy-project/raw/stock.csv', import.meta.url));
  const { stdout } = await promisify(execFile)(process.execPath, [file, input]);
  assert.equal(stdout.trim(), JSON.stringify({ items: 2, counted: 20, reserved: 3, usable: 17 }));
});
