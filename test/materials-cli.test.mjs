import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, realpath, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

const exec = promisify(execFile);
const cli = new URL('../bin/agent-twin.mjs', import.meta.url).pathname;
async function fixture(t) {
  const cwd = await realpath(await mkdtemp(join(tmpdir(), 'twin-materials-cli-')));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  return { cwd, run: async (...args) => JSON.parse((await exec(process.execPath, [cli, ...args, '--cwd', cwd])).stdout) };
}

test('CLI inventories a scattered project then prepares materials and distills original evidence', async t => {
  const f = await fixture(t);
  await writeFile(join(f.cwd, 'notes.txt'), 'Provide a weekly stock summary.\nCheck totals before interpreting a change.\n');
  await writeFile(join(f.cwd, 'old-report.csv'), 'week,total\n1,10\n');
  await writeFile(join(f.cwd, '.env'), 'SYNTHETIC_EXCLUDED_VALUE=not-real\n');
  const inventory = await f.run('materials-inventory', '--root', '.');
  assert.equal(inventory.contentRead, false);
  assert.ok(inventory.entries.some(item => item.path === 'notes.txt' && item.kind === 'candidate'));
  assert.ok(inventory.entries.some(item => item.path === 'old-report.csv' && item.kind === 'needs_conversion'));
  assert.ok(!JSON.stringify(inventory).includes('SYNTHETIC_EXCLUDED_VALUE'));
  await f.run('init');
  const prepared = await f.run('materials-prepare', '--entry', 'notes.txt');
  const ref = { sourceId: prepared.sources[0].sourceId, startLine: 1, endLine: 2 };
  const packetPath = join(f.cwd, 'packet.json');
  await writeFile(packetPath, JSON.stringify({
    project: { title: 'Stock summary', summary: 'A weekly stock summary with checks.', sourceRefs: [ref] },
    materials: [{ id: 'stock-rules', kind: 'workflow', title: 'Summary workflow', summary: 'Check totals before interpreting changes.', sourceRefs: [ref], selectedForDistillation: true }],
    gaps: [{ id: 'missing-tool', description: 'Confirm which read-only stock query tool is available.' }],
  }));
  const materialized = await f.run('materials-apply', '--batch', prepared.batchId, '--packet', packetPath);
  assert.equal(materialized.materialized, true);
  assert.equal(materialized.distilled, false);
  const status = await f.run('materials-status');
  assert.equal(status.canDistill, true);
  const batch = await f.run('materials-distill');
  assert.equal(batch.fromMaterialsGenerationId, materialized.generationId);
  assert.equal(batch.sources[0].path, 'notes.txt');
  const cardsPath = join(f.cwd, 'cards.json');
  await writeFile(cardsPath, JSON.stringify([{
    id: 'totals-first', kind: 'judgment', title: 'Check totals first', content: 'Check the totals before interpreting a change.',
    when: 'Before explaining a weekly stock change.', limits: 'Does not prove a query tool is connected.', sourceRefs: [ref], status: 'documented',
  }]));
  await f.run('distill-apply', '--batch', batch.batchId, '--cards', cardsPath);
  const knowledge = await f.run('distill-read');
  assert.equal(knowledge.cards.length, 1);
  await writeFile(join(f.cwd, 'notes.txt'), 'Changed instructions.\n');
  assert.equal((await f.run('materials-status')).canDistill, false);
  await assert.rejects(f.run('materials-distill'), /source|stale|change|valid/i);
  assert.equal((await f.run('distill-read')).cards.length, 0);
  assert.equal(await readFile(join(f.cwd, '.env'), 'utf8'), 'SYNTHETIC_EXCLUDED_VALUE=not-real\n');
});

test('CLI rejects missing and cross-operation material arguments', async t => {
  const f = await fixture(t);
  for (const args of [
    ['materials-inventory'], ['materials-prepare'], ['materials-apply'],
    ['materials-status', '--root', '.'], ['materials-distill', '--entry', 'notes.txt'],
    ['init', '--packet', 'anything.json'], ['materials-apply', '--batch', 'bad', '--cards', 'x.json'],
  ]) await assert.rejects(f.run(...args));
});
