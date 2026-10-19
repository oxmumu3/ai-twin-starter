import assert from 'node:assert/strict';
import { access, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { initWorkspace } from '../src/workspace.mjs';

async function api() {
  const url = new URL('../src/distill.mjs', import.meta.url);
  await assert.doesNotReject(access(url), 'The content distillation implementation must exist');
  return import(url);
}

async function fixture(t, initialize = true) {
  const cwd = await mkdtemp(join(await realpath(tmpdir()), 'twin-distill-'));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  if (initialize) await initWorkspace(cwd);
  await mkdir(join(cwd, 'project'));
  await writeFile(join(cwd, 'project/rules.md'), '# Analysis rules\nUse the official source for formal totals.\nReconcile grouped totals before conclusions.\nSearch existing reports, then query read-only.\nThe query tool cannot modify records.\n');
  return { cwd, base: join(cwd, '.agent-twin/distillation') };
}

function card(sourceId, kind = 'knowledge', id = kind) {
  return {
    id, kind, title: `${kind} example`,
    content: 'Use the assigned source within its authority; verify results before sharing.',
    when: 'A member asks for a documented project result.',
    limits: 'Do not infer causality or grant additional permissions.',
    sourceRefs: [{ sourceId, startLine: 2, endLine: 5 }], status: 'documented',
  };
}

test('prepare reads only explicit sources and persists metadata rather than their contents', async t => {
  const { prepareDistillation } = await api();
  const { cwd, base } = await fixture(t);
  await writeFile(join(cwd, 'unselected.md'), 'UNSELECTED PRIVATE SENTINEL');
  const result = await prepareDistillation(cwd, ['project/rules.md']);
  assert.equal(result.prepared, true);
  assert.equal(result.materialized, false);
  assert.equal(result.privacy, 'private');
  assert.equal(result.sources.length, 1);
  const source = result.sources[0];
  assert.equal(source.path, 'project/rules.md');
  assert.match(source.sha256, /^[a-f0-9]{64}$/);
  assert.equal(source.lines[1].line, 2);
  assert.match(source.lines[1].text, /official source/);
  assert.match(source.content, /Reconcile grouped totals/);
  assert.ok(!JSON.stringify(result).includes('UNSELECTED PRIVATE SENTINEL'));
  const stored = await readFile(join(base, 'batches', `${result.batchId}.json`), 'utf8');
  assert.ok(!stored.includes('official source'));
  assert.ok(!stored.includes('Reconcile grouped totals'));
  assert.equal((await lstat(join(base, 'batches', `${result.batchId}.json`))).mode & 0o077, 0);
});

test('distillation requires initialization and does not create it implicitly', async t => {
  const { prepareDistillation, inspectDistillation } = await api();
  const { cwd } = await fixture(t, false);
  await assert.rejects(prepareDistillation(cwd, ['project/rules.md']), /initializ|agent-twin/i);
  await assert.rejects(inspectDistillation(cwd), /initializ|agent-twin/i);
  await assert.rejects(lstat(join(cwd, '.agent-twin')), { code: 'ENOENT' });
});

test('prepare rejects non-explicit, outside, sensitive-path, non-text and directory entries', async t => {
  const { prepareDistillation } = await api();
  const { cwd } = await fixture(t);
  for (const entries of [[], ['../outside.md'], ['/tmp/file.md'], ['project/.env'], ['project/credentials.md'], ['private-chats/log.md'], ['project/code.js'], ['project'], ['project/../project/rules.md'], ['.agent-twin/config.json']]) {
    await assert.rejects(prepareDistillation(cwd, entries), /entry|entries|path|relative|sensitive|text|directory|file/i);
  }
});

test('prepare refuses source symlinks and symlink ancestors', async t => {
  const { prepareDistillation } = await api();
  const { cwd } = await fixture(t);
  await symlink(join(cwd, 'project/rules.md'), join(cwd, 'alias.md'));
  await symlink(join(cwd, 'project'), join(cwd, 'alias-project'), 'dir');
  await assert.rejects(prepareDistillation(cwd, ['alias.md']), /symlink/i);
  await assert.rejects(prepareDistillation(cwd, ['alias-project/rules.md']), /symlink/i);
});

test('explicit project policy and context entries are readable without allowing hidden-directory scanning', async t => {
  const { prepareDistillation } = await api();
  const { cwd } = await fixture(t);
  await mkdir(join(cwd, '.agent/memory'), { recursive: true });
  await writeFile(join(cwd, '.agent/policy.md'), 'Explicit project policy.\n');
  await writeFile(join(cwd, '.agent/memory/context.md'), 'Explicit project context knowledge.\n');
  await writeFile(join(cwd, '.agent/memory/progress.md'), 'Explicit current project progress.\n');
  await writeFile(join(cwd, '.agent/memory/unselected.md'), 'HIDDEN UNSELECTED SENTINEL');
  const entries = ['.agent/policy.md', '.agent/memory/context.md', '.agent/memory/progress.md'];
  const prepared = await prepareDistillation(cwd, entries);
  assert.deepEqual(prepared.sources.map(source => source.path), entries);
  assert.match(prepared.sources[1].content, /Explicit project context knowledge/);
  assert.ok(!JSON.stringify(prepared).includes('HIDDEN UNSELECTED SENTINEL'));
  for (const path of ['.agent/memory/unselected.md', '.agent/context.md', '.agent/.env', '.git/config.md', '.ssh/notes.md']) {
    await assert.rejects(prepareDistillation(cwd, [path]), /sensitive|hidden|entry/i);
  }
});

test('an explicitly allowlisted context path still cannot traverse a symlink', async t => {
  const { prepareDistillation } = await api();
  const { cwd } = await fixture(t);
  await mkdir(join(cwd, '.agent'));
  await symlink(join(cwd, 'project'), join(cwd, '.agent/memory'), 'dir');
  await writeFile(join(cwd, 'project/context.md'), 'A source behind an unsafe alias.\n');
  await assert.rejects(prepareDistillation(cwd, ['.agent/memory/context.md']), /symlink/i);
});

test('credential material is rejected with a category and line but never echoed or persisted', async t => {
  const { prepareDistillation } = await api();
  const { cwd, base } = await fixture(t);
  const secret = 'xoxb-SYNTHETIC-12345678901234567890';
  await writeFile(join(cwd, 'project/unsafe.md'), `# Example\n${secret}\n`);
  await assert.rejects(prepareDistillation(cwd, ['project/unsafe.md']), error => {
    assert.match(error.message, /credential|token/i);
    assert.match(error.message, /line 2/i);
    assert.ok(!error.message.includes(secret));
    return true;
  });
  await assert.rejects(lstat(base), { code: 'ENOENT' });
});

test('quoted credential assignments in markdown snippets are rejected without echo', async t => {
  const { prepareDistillation } = await api();
  const { cwd } = await fixture(t);
  const secret = 'SyntheticCredentialValue987654';
  await writeFile(join(cwd, 'project/snippet.md'), `Example configuration\n{"api_key": "${secret}"}\n`);
  await assert.rejects(prepareDistillation(cwd, ['project/snippet.md']), error => {
    assert.match(error.message, /credential-assignment/);
    assert.ok(!error.message.includes(secret));
    return true;
  });
});

test('prepare bounds individual files, total input, and explicit source count', async t => {
  const { prepareDistillation } = await api();
  const { cwd } = await fixture(t);
  await writeFile(join(cwd, 'project/large.md'), 'a'.repeat(65537));
  await assert.rejects(prepareDistillation(cwd, ['project/large.md']), /size|limit|large/i);
  const paths = [];
  for (let i = 0; i < 17; i++) {
    const path = `project/file-${i}.txt`;
    await writeFile(join(cwd, path), 'a'.repeat(60000));
    paths.push(path);
  }
  await assert.rejects(prepareDistillation(cwd, paths), /count|limit|entries/i);
  await assert.rejects(prepareDistillation(cwd, paths.slice(0, 5)), /total|limit|large/i);
});

test('apply materializes evidence-linked content of all four kinds without changing source', async t => {
  const { prepareDistillation, applyDistillation, inspectDistillation, readKnowledge } = await api();
  const { cwd, base } = await fixture(t);
  const before = await readFile(join(cwd, 'project/rules.md'), 'utf8');
  const batch = await prepareDistillation(cwd, ['project/rules.md']);
  const cards = ['knowledge', 'judgment', 'workflow', 'tool'].map(kind => card(batch.sources[0].sourceId, kind));
  const result = await applyDistillation(cwd, batch.batchId, cards);
  assert.equal(result.materialized, true);
  assert.equal(result.counts.total, 4);
  for (const kind of ['knowledge', 'judgment', 'workflow', 'tool']) assert.equal(result.counts[kind], 1);
  const current = JSON.parse(await readFile(join(base, 'current.json'), 'utf8'));
  const directory = join(base, 'generations', current.generationId);
  const materialized = JSON.parse(await readFile(join(directory, 'cards.json'), 'utf8'));
  assert.equal(materialized.length, 4);
  assert.ok(materialized.every(value => value.privacy === 'private'));
  assert.match(materialized[0].sourceRefs[0].spanSha256, /^[a-f0-9]{64}$/);
  assert.match(await readFile(join(directory, 'INDEX.md'), 'utf8'), /knowledge example/);
  assert.equal(await readFile(join(cwd, 'project/rules.md'), 'utf8'), before);
  assert.equal((await inspectDistillation(cwd)).validCardIds.length, 4);
  assert.equal((await readKnowledge(cwd)).cards.length, 4);
});

test('apply rejects missing evidence, forged source, invalid spans and invalid card schemas', async t => {
  const { prepareDistillation, applyDistillation } = await api();
  const { cwd, base } = await fixture(t);
  const batch = await prepareDistillation(cwd, ['project/rules.md']);
  const good = card(batch.sources[0].sourceId);
  const invalid = [[], [{ ...good, sourceRefs: [] }], [{ ...good, sourceRefs: [{ sourceId: 'forged', startLine: 1, endLine: 2 }] }], [{ ...good, sourceRefs: [{ sourceId: batch.sources[0].sourceId, startLine: 0, endLine: 2 }] }], [{ ...good, sourceRefs: [{ sourceId: batch.sources[0].sourceId, startLine: 1, endLine: 200 }] }], [{ ...good, kind: 'personality' }], [{ ...good, status: 'official' }], [{ ...good, when: '' }], [{ ...good, id: '../escape' }], [{ ...good, privacy: 'public' }], [good, good]];
  for (const cards of invalid) await assert.rejects(applyDistillation(cwd, batch.batchId, cards), /card|source|span|evidence|field|private|duplicate/i);
  await assert.rejects(lstat(join(base, 'current.json')), { code: 'ENOENT' });
});

test('apply rejects source changes after prepare and does not publish a generation', async t => {
  const { prepareDistillation, applyDistillation } = await api();
  const { cwd, base } = await fixture(t);
  const batch = await prepareDistillation(cwd, ['project/rules.md']);
  await writeFile(join(cwd, 'project/rules.md'), 'Changed after preparation\n');
  await assert.rejects(applyDistillation(cwd, batch.batchId, [card(batch.sources[0].sourceId)]), /changed|hash|stale/i);
  await assert.rejects(lstat(join(base, 'current.json')), { code: 'ENOENT' });
});

test('apply rejects credentials in generated cards without echoing them', async t => {
  const { prepareDistillation, applyDistillation } = await api();
  const { cwd } = await fixture(t);
  const batch = await prepareDistillation(cwd, ['project/rules.md']);
  const secret = 'sk-SYNTHETIC12345678901234567890123456';
  await assert.rejects(applyDistillation(cwd, batch.batchId, [{ ...card(batch.sources[0].sourceId), content: secret }]), error => {
    assert.match(error.message, /credential|token/i);
    assert.ok(!error.message.includes(secret));
    return true;
  });
});

test('repeat apply refuses overwriting a batch and later batches preserve history', async t => {
  const { prepareDistillation, applyDistillation } = await api();
  const { cwd, base } = await fixture(t);
  const batch = await prepareDistillation(cwd, ['project/rules.md']);
  await applyDistillation(cwd, batch.batchId, [card(batch.sources[0].sourceId)]);
  await assert.rejects(applyDistillation(cwd, batch.batchId, [card(batch.sources[0].sourceId)]), /already|applied|overwrite/i);
  const before = await readdir(join(base, 'generations'));
  const next = await prepareDistillation(cwd, ['project/rules.md']);
  await applyDistillation(cwd, next.batchId, [card(next.sources[0].sourceId, 'judgment')]);
  const after = await readdir(join(base, 'generations'));
  assert.equal(after.length, before.length + 1);
  assert.ok(before.every(value => after.includes(value)));
});

test('refresh invalidates only cards whose sources changed and does not re-extract automatically', async t => {
  const { prepareDistillation, applyDistillation, refreshDistillation, readKnowledge } = await api();
  const { cwd } = await fixture(t);
  await writeFile(join(cwd, 'project/other.txt'), 'Independent source rule.\nSecond supporting line.\n');
  const batch = await prepareDistillation(cwd, ['project/rules.md', 'project/other.txt']);
  const second = card(batch.sources[1].sourceId, 'judgment');
  second.sourceRefs[0] = { sourceId: batch.sources[1].sourceId, startLine: 1, endLine: 2 };
  await applyDistillation(cwd, batch.batchId, [card(batch.sources[0].sourceId), second]);
  assert.equal((await refreshDistillation(cwd)).unchanged, true);
  await writeFile(join(cwd, 'project/rules.md'), 'Updated operating rule.\n');
  const result = await refreshDistillation(cwd);
  assert.equal(result.unchanged, false);
  assert.deepEqual(result.staleCardIds, ['knowledge']);
  assert.equal(result.changedSources[0].reason, 'changed');
  assert.deepEqual((await readKnowledge(cwd)).cards.map(value => value.id), ['judgment']);
});

test('incremental apply preserves unrelated cards and never revives an old changed-source card', async t => {
  const { prepareDistillation, applyDistillation, inspectDistillation, readKnowledge } = await api();
  const { cwd } = await fixture(t);
  await writeFile(join(cwd, 'project/other.txt'), 'Independent source rule.\nSecond supporting line.\n');
  const batch = await prepareDistillation(cwd, ['project/rules.md', 'project/other.txt']);
  const other = card(batch.sources[1].sourceId, 'judgment');
  other.sourceRefs[0] = { sourceId: batch.sources[1].sourceId, startLine: 1, endLine: 2 };
  await applyDistillation(cwd, batch.batchId, [card(batch.sources[0].sourceId), card(batch.sources[0].sourceId, 'tool'), other]);
  await writeFile(join(cwd, 'project/rules.md'), '# Updated\nA new official source rule.\nA new reconciliation rule.\nRead-only workflow.\nA query capability.\n');
  const next = await prepareDistillation(cwd, ['project/rules.md']);
  await applyDistillation(cwd, next.batchId, [card(next.sources[0].sourceId)]);
  assert.deepEqual((await readKnowledge(cwd)).cards.map(value => value.id).sort(), ['judgment', 'knowledge']);
  assert.deepEqual((await inspectDistillation(cwd)).staleCardIds, ['tool']);
});

test('missing sources invalidate cards and candidates are never executable current knowledge', async t => {
  const { prepareDistillation, applyDistillation, inspectDistillation, readKnowledge } = await api();
  const { cwd } = await fixture(t);
  const batch = await prepareDistillation(cwd, ['project/rules.md']);
  const candidate = { ...card(batch.sources[0].sourceId, 'judgment'), status: 'candidate' };
  await applyDistillation(cwd, batch.batchId, [card(batch.sources[0].sourceId), candidate]);
  assert.deepEqual((await readKnowledge(cwd)).cards.map(value => value.id), ['knowledge']);
  assert.deepEqual((await inspectDistillation(cwd)).candidateCardIds, ['judgment']);
  await rm(join(cwd, 'project/rules.md'));
  const status = await inspectDistillation(cwd);
  assert.equal(status.changedSources[0].reason, 'missing');
  assert.equal((await readKnowledge(cwd)).cards.length, 0);
});

test('inspection without a materialized generation is read-only', async t => {
  const { inspectDistillation, readKnowledge } = await api();
  const { cwd } = await fixture(t);
  const before = (await readdir(join(cwd, '.agent-twin'))).sort();
  assert.equal((await inspectDistillation(cwd)).materialized, false);
  assert.deepEqual((await readKnowledge(cwd)).cards, []);
  assert.deepEqual((await readdir(join(cwd, '.agent-twin'))).sort(), before);
});

test('tampered generation cards are rejected rather than silently replacing user changes', async t => {
  const { prepareDistillation, applyDistillation, inspectDistillation } = await api();
  const { cwd, base } = await fixture(t);
  const batch = await prepareDistillation(cwd, ['project/rules.md']);
  await applyDistillation(cwd, batch.batchId, [card(batch.sources[0].sourceId)]);
  const current = JSON.parse(await readFile(join(base, 'current.json'), 'utf8'));
  const path = join(base, 'generations', current.generationId, 'cards.json');
  await writeFile(path, '[]');
  await assert.rejects(inspectDistillation(cwd), /integrity|modified|hash/i);
  assert.equal(await readFile(path, 'utf8'), '[]');
});

test('distillation metadata and current pointers cannot be symlinks', async t => {
  const { prepareDistillation, applyDistillation, inspectDistillation } = await api();
  const { cwd, base } = await fixture(t);
  const external = join(cwd, 'external');
  await mkdir(external);
  await symlink(external, base, 'dir');
  await assert.rejects(prepareDistillation(cwd, ['project/rules.md']), /symlink/i);
  assert.deepEqual(await readdir(external), []);
  await rm(base);
  const batch = await prepareDistillation(cwd, ['project/rules.md']);
  await applyDistillation(cwd, batch.batchId, [card(batch.sources[0].sourceId)]);
  await rm(join(base, 'current.json'));
  await writeFile(join(external, 'pointer.json'), '{}');
  await symlink(join(external, 'pointer.json'), join(base, 'current.json'));
  await assert.rejects(inspectDistillation(cwd), /symlink/i);
});
