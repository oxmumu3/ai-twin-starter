import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, realpath, rm, writeFile, readFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const executable = fileURLToPath(new URL('../bin/agent-twin.mjs', import.meta.url));
async function fixture(t) {
  const cwd = await realpath(await mkdtemp(join(tmpdir(), 'twin-cli-workflow-')));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  return cwd;
}
function run(cwd, args) {
  const env = { ...process.env };
  delete env.AGENT_TWIN_SLACK_BOT_TOKEN;
  return spawnSync(process.execPath, [executable, ...args], { cwd, env, encoding: 'utf8', timeout: 20000 });
}

test('CLI reads selected material and materializes an evidence-backed distilled card', async t => {
  const cwd = await fixture(t);
  await mkdir(join(cwd, 'sources'));
  await writeFile(join(cwd, 'sources/rules.md'), '# Reporting rule\nA total must be reconciled before a conclusion is delivered.\n');
  assert.equal(run(cwd, ['init']).status, 0);
  const prepare = run(cwd, ['distill-prepare', '--entry', 'sources/rules.md']);
  assert.equal(prepare.status, 0, prepare.stderr);
  const batch = JSON.parse(prepare.stdout);
  assert.match(batch.sources[0].content, /reconciled/);
  const cards = [{ id: 'reconcile-first', kind: 'judgment', title: 'Reconcile before delivery', content: 'If grouped results disagree with the total, hold the conclusion and investigate.', when: 'Before delivering a quantitative conclusion.', limits: 'This rule does not define a new metric.', status: 'documented', sourceRefs: [{ sourceId: batch.sources[0].sourceId, startLine: 2, endLine: 2 }] }];
  await writeFile(join(cwd, 'proposal.json'), JSON.stringify(cards));
  const apply = run(cwd, ['distill-apply', '--batch', batch.batchId, '--cards', 'proposal.json']);
  assert.equal(apply.status, 0, apply.stderr);
  assert.equal(JSON.parse(apply.stdout).materialized, true);
  const status = run(cwd, ['distill-status']);
  assert.equal(status.status, 0, status.stderr);
  assert.ok(JSON.parse(status.stdout).validCardIds.includes('reconcile-first'));
  await writeFile(join(cwd, 'sources/rules.md'), '# Reporting rule\nThe owner must review any reconciliation conflict.\n');
  const refresh = run(cwd, ['distill-refresh']);
  assert.equal(refresh.status, 0, refresh.stderr);
  assert.ok(JSON.parse(refresh.stdout).staleCardIds.includes('reconcile-first'));
});

test('CLI channel probe reports missing authorization without reading a token or sending', async t => {
  const cwd = await fixture(t);
  assert.equal(run(cwd, ['init']).status, 0);
  const probe = run(cwd, ['channel-probe']);
  assert.equal(probe.status, 0, probe.stderr);
  const result = JSON.parse(probe.stdout);
  assert.equal(result.status, 'blocked');
  assert.equal(result.ready, false);
  assert.ok(result.issues.length > 0);
  const config = JSON.parse(await readFile(join(cwd, '.agent-twin/config.json'), 'utf8'));
  assert.equal(config.enabled, false);
});
