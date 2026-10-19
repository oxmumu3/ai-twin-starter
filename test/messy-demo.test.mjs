import assert from 'node:assert/strict';
import { mkdtemp, readFile, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { runDemo } from '../examples/messy-project/demo.mjs';

test('messy synthetic project preserves gaps, adds labelled evidence, and detects stale sources', async t => {
  const parent = await realpath(await mkdtemp(join(tmpdir(), 'messy-twin-demo-')));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const cwd = join(parent, 'trial');
  const receipt = await runDemo(cwd);
  assert.equal(receipt.syntheticOnly, true);
  assert.equal(receipt.inventory.contentRead, false);
  assert.equal(receipt.initialMaterials.distilled, false);
  assert.ok(receipt.initialPacket.gaps.some(gap => gap.id === 'review-rule'));
  assert.ok(!receipt.finalPacket.gaps.some(gap => gap.id === 'review-rule'));
  assert.ok(receipt.finalPacket.gaps.some(gap => gap.id === 'legacy-format'));
  assert.deepEqual(new Set(receipt.cardKinds), new Set(['knowledge', 'judgment', 'workflow', 'tool']));
  assert.equal(receipt.sourceChangeCheck.materialsBlocked, true);
  assert.equal(receipt.sourceChangeCheck.originalContentRestored, true);
  assert.equal(receipt.realChannelVerified, false);
  assert.equal(receipt.sendingVerified, false);
  assert.equal(receipt.backgroundRunning, false);
  assert.equal(await readFile(join(cwd, '.env'), 'utf8'), 'DEMO_ONLY_NOT_A_CREDENTIAL=true\n');
  await assert.rejects(runDemo(cwd), /exist/i);
});
