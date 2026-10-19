import assert from 'node:assert/strict';
import { access, chmod, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { initWorkspace } from '../src/workspace.mjs';
import { inspectDistillation, prepareDistillation, applyDistillation } from '../src/distill.mjs';

async function api() {
  const url = new URL('../src/materials.mjs', import.meta.url);
  await assert.doesNotReject(access(url), 'The material preparation implementation must exist');
  return import(url);
}

async function fixture(t, initialize = true) {
  const cwd = await mkdtemp(join(await realpath(tmpdir()), 'twin-materials-'));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  if (initialize) await initWorkspace(cwd);
  await mkdir(join(cwd, 'project'));
  await writeFile(join(cwd, 'project/overview.md'), '# Project\nA synthetic reporting project supports evidence-based operating decisions.\n');
  await writeFile(join(cwd, 'project/workflow.txt'), 'Search existing reports before querying.\nA documented read-only tool is already available.\n');
  return { cwd, base: join(cwd, '.agent-twin/materials') };
}

function proposal(batch) {
  const first = { sourceId: batch.sources[0].sourceId, startLine: 2, endLine: 2 };
  const second = { sourceId: batch.sources[1].sourceId, startLine: 1, endLine: 2 };
  return {
    project: { title: 'Synthetic reporting project', summary: 'Organize reporting evidence before making operating decisions.', sourceRefs: [first] },
    materials: [
      { id: 'project-background', kind: 'background', title: 'Project background', summary: 'Existing project scope and purpose.', sourceRefs: [first], selectedForDistillation: true },
      { id: 'request-workflow', kind: 'workflow', title: 'Request workflow', summary: 'Reuse prior reports before new queries.', sourceRefs: [second], selectedForDistillation: true },
      { id: 'query-tool', kind: 'tool', title: 'Read-only query', summary: 'A read-only capability is documented.', sourceRefs: [second], selectedForDistillation: false, toolStatus: 'available' },
    ],
    gaps: [{ id: 'decision-case', description: 'A real decision case and its limitations have not yet been provided.' }],
  };
}

test('inventory lists metadata without reading content or initializing a workspace', async t => {
  const { inventoryMaterials } = await api();
  const { cwd } = await fixture(t, false);
  await writeFile(join(cwd, 'project/private-content.md'), 'xoxb-SYNTHETIC-CONTENT-MUST-NOT-BE-READ');
  const before = await readdir(cwd);
  const result = await inventoryMaterials(cwd, ['project']);
  assert.equal(result.inventoried, true);
  assert.equal(result.contentRead, false);
  assert.equal(result.privacy, 'private');
  const source = result.entries.find(entry => entry.path === 'project/private-content.md');
  assert.equal(source.kind, 'candidate');
  assert.ok(source.sizeBytes > 0);
  assert.ok(source.modifiedAt);
  assert.equal(JSON.stringify(result).includes('xoxb-SYNTHETIC'), false);
  assert.deepEqual(await readdir(cwd), before);
});

test('inventory excludes hidden credentials runtime and symlink entries and identifies conversions', async t => {
  const { inventoryMaterials } = await api();
  const { cwd } = await fixture(t, false);
  for (const directory of ['.git', 'credentials', 'outputs', 'node_modules']) {
    await mkdir(join(cwd, directory));
    await writeFile(join(cwd, directory, 'must-not-appear.md'), 'PRIVATE');
  }
  await writeFile(join(cwd, '.env'), 'PRIVATE');
  await writeFile(join(cwd, 'project/report.pdf'), 'synthetic binary placeholder');
  await symlink(join(cwd, 'project'), join(cwd, 'alias'), 'dir');
  const result = await inventoryMaterials(cwd, ['.']);
  for (const path of ['.git', 'credentials', 'outputs', 'node_modules', '.env', 'alias']) assert.equal(result.entries.find(entry => entry.path === path)?.kind, 'excluded', path);
  assert.equal(result.entries.some(entry => entry.path.includes('must-not-appear')), false);
  assert.equal(result.entries.find(entry => entry.path === 'project/report.pdf').kind, 'needs_conversion');
});

test('inventory rejects outside or ambiguous roots without traversal', async t => {
  const { inventoryMaterials } = await api();
  const { cwd } = await fixture(t, false);
  for (const roots of [[], ['/tmp'], ['../outside'], ['project/../project'], ['.git'], ['alias/..']]) await assert.rejects(inventoryMaterials(cwd, roots), /root|relative|sensitive|hidden|path/i);
});

test('inventory reports bounded truncation and inaccessible or missing entries', async t => {
  const { inventoryMaterials } = await api();
  const { cwd } = await fixture(t, false);
  await mkdir(join(cwd, 'project/a/b/c/d/e'), { recursive: true });
  await writeFile(join(cwd, 'project/a/b/c/d/e/deep.md'), 'too deep');
  const result = await inventoryMaterials(cwd, ['project', 'missing']);
  assert.equal(result.truncated, true);
  assert.ok(result.issues.some(issue => issue.code === 'depth_limit'));
  assert.ok(result.entries.some(entry => entry.path === 'missing' && entry.kind === 'unreadable'));
  assert.equal(result.complete, false);
});

test('inventory exposes unreadable directory coverage without reading its children', async t => {
  const { inventoryMaterials } = await api();
  const { cwd } = await fixture(t, false);
  const path = join(cwd, 'unreadable');
  await mkdir(path);
  await writeFile(join(path, 'not-listed.md'), 'not read');
  await chmod(path, 0o000);
  try {
    const result = await inventoryMaterials(cwd, ['.']);
    assert.equal(result.entries.find(entry => entry.path === 'unreadable')?.kind, 'unreadable');
    assert.equal(result.entries.some(entry => entry.path === 'unreadable/not-listed.md'), false);
    assert.equal(result.complete, false);
  } finally { await chmod(path, 0o700); }
});

test('prepare returns actual source evidence and a materials-specific instruction', async t => {
  const { prepareMaterials } = await api();
  const { cwd } = await fixture(t);
  const batch = await prepareMaterials(cwd, ['project/overview.md', 'project/workflow.txt']);
  assert.equal(batch.stage, 'materials');
  assert.equal(batch.materialized, false);
  assert.equal(batch.distilled, false);
  assert.match(batch.sources[0].content, /synthetic reporting project/);
  assert.equal(batch.sources[0].lines[1].line, 2);
  assert.match(batch.extractionInstruction, /material|gap|tool/i);
  const stored = await readFile(join(cwd, '.agent-twin/distillation/batches', `${batch.batchId}.json`), 'utf8');
  assert.equal(stored.includes('synthetic reporting project'), false);
});

test('explicit material selection cannot reintroduce an excluded runtime source', async t => {
  const { prepareMaterials } = await api();
  const { cwd } = await fixture(t);
  await mkdir(join(cwd, 'outputs'));
  await writeFile(join(cwd, 'outputs/generated.md'), 'A derived runtime artifact.\n');
  await assert.rejects(prepareMaterials(cwd, ['outputs/generated.md']), /excluded|runtime|generated/i);
});

test('space-separated sensitive paths excluded by inventory cannot be read during preparation', async t => {
  const { inventoryMaterials, prepareMaterials } = await api();
  const { cwd } = await fixture(t);
  await mkdir(join(cwd, 'private chats'));
  const privateText = 'PRIVATE CONVERSATION SENTINEL MUST NOT BE RETURNED';
  await writeFile(join(cwd, 'private chats/notes.md'), `${privateText}\n`);
  const inventory = await inventoryMaterials(cwd, ['.']);
  assert.equal(inventory.entries.find(entry => entry.path === 'private chats')?.reason, 'sensitive_path');
  await assert.rejects(prepareMaterials(cwd, ['private chats/notes.md']), error => {
    assert.match(error.message, /sensitive|path/i);
    assert.equal(error.message.includes(privateText), false);
    return true;
  });
  const secret = 'xoxb-SYNTHETIC-12345678901234567890';
  await writeFile(join(cwd, 'private chats/keys.md'), `${privateText}\n${secret}\n`);
  await assert.rejects(prepareMaterials(cwd, ['private chats/keys.md']), error => {
    assert.match(error.message, /sensitive|path/i);
    assert.equal(error.message.includes(privateText), false);
    assert.equal(error.message.includes(secret), false);
    return true;
  });
});

test('materials batches and distillation batches cannot be consumed by the wrong stage', async t => {
  const { prepareMaterials, applyMaterials } = await api();
  const { cwd } = await fixture(t);
  const batch = await prepareMaterials(cwd, ['project/overview.md', 'project/workflow.txt']);
  const cards = [{ id: 'cannot-bypass-preparation', kind: 'knowledge', title: 'Project scope', content: 'A reporting project.', when: 'During reporting.', limits: 'No new authority.', status: 'documented', sourceRefs: [{ sourceId: batch.sources[0].sourceId, startLine: 2, endLine: 2 }] }];
  await assert.rejects(applyDistillation(cwd, batch.batchId, cards), /stage|material/i);
  const other = await prepareDistillation(cwd, ['project/overview.md', 'project/workflow.txt']);
  await assert.rejects(applyMaterials(cwd, other.batchId, proposal(other)), /stage|material/i);
});

test('apply creates a private source-backed materials packet and readable views without distilling', async t => {
  const { prepareMaterials, applyMaterials, inspectMaterials } = await api();
  const { cwd, base } = await fixture(t);
  const original = await readFile(join(cwd, 'project/overview.md'), 'utf8');
  const batch = await prepareMaterials(cwd, ['project/overview.md', 'project/workflow.txt']);
  const result = await applyMaterials(cwd, batch.batchId, proposal(batch));
  assert.equal(result.materialized, true);
  assert.equal(result.distilled, false);
  assert.equal(result.stage, 'materials');
  assert.deepEqual(result.counts, { materials: 3, gaps: 1, selectedSources: 2, tools: 1 });
  const pointer = JSON.parse(await readFile(join(base, 'current.json'), 'utf8'));
  const directory = join(base, 'generations', pointer.generationId);
  for (const file of ['OVERVIEW.md', 'MATERIALS.md', 'GAPS.md']) assert.ok((await readFile(join(directory, file), 'utf8')).length > 20);
  assert.match(await readFile(join(directory, 'GAPS.md'), 'utf8'), /real decision case/);
  assert.equal((await lstat(join(directory, 'packet.json'))).mode & 0o077, 0);
  assert.equal(await readFile(join(cwd, 'project/overview.md'), 'utf8'), original);
  assert.equal((await inspectDistillation(cwd)).materialized, false);
  const status = await inspectMaterials(cwd);
  assert.equal(status.canDistill, true);
  assert.deepEqual(status.selectedEntries, ['project/overview.md', 'project/workflow.txt']);
});

test('packet may explicitly contain gaps and no selected materials without inventing facts', async t => {
  const { prepareMaterials, applyMaterials, inspectMaterials, prepareDistillationFromMaterials } = await api();
  const { cwd } = await fixture(t);
  const batch = await prepareMaterials(cwd, ['project/overview.md']);
  await applyMaterials(cwd, batch.batchId, { project: { title: 'Project to clarify', summary: '', sourceRefs: [] }, materials: [], gaps: [{ id: 'background-missing', description: 'The project scope is not yet confirmed.' }] });
  const status = await inspectMaterials(cwd);
  assert.equal(status.materialized, true);
  assert.equal(status.canDistill, false);
  await assert.rejects(prepareDistillationFromMaterials(cwd), /selected|material|source/i);
});

test('apply validates packet schema, references, and mandatory tool status', async t => {
  const { prepareMaterials, applyMaterials } = await api();
  const { cwd, base } = await fixture(t);
  const batch = await prepareMaterials(cwd, ['project/overview.md', 'project/workflow.txt']);
  const good = proposal(batch);
  const cases = [
    { ...good, privacy: 'public' },
    { ...good, project: { ...good.project, sourceRefs: [] } },
    { ...good, materials: [{ ...good.materials[0], kind: 'personality' }] },
    { ...good, materials: [{ ...good.materials[0], sourceRefs: [{ sourceId: 'invented', startLine: 1, endLine: 1 }] }] },
    { ...good, materials: [{ ...good.materials[0], sourceRefs: [{ sourceId: batch.sources[0].sourceId, startLine: 1, endLine: 100 }] }] },
    { ...good, materials: [{ ...good.materials[2], toolStatus: 'executed' }] },
    { ...good, materials: [{ ...good.materials[2], toolStatus: undefined }] },
    { ...good, materials: [good.materials[0], good.materials[0]] },
  ];
  for (const packet of cases) await assert.rejects(applyMaterials(cwd, batch.batchId, packet), /field|private|source|span|evidence|tool|kind|duplicate|status/i);
  await assert.rejects(lstat(join(base, 'current.json')), { code: 'ENOENT' });
});

test('tool readiness states remain descriptive and do not execute tools', async t => {
  const { prepareMaterials, applyMaterials } = await api();
  const { cwd } = await fixture(t);
  const batch = await prepareMaterials(cwd, ['project/overview.md', 'project/workflow.txt']);
  const packet = proposal(batch);
  packet.materials = ['available', 'needs_connection', 'needs_development'].map((toolStatus, index) => ({ ...packet.materials[2], id: `tool-${index}`, toolStatus }));
  const result = await applyMaterials(cwd, batch.batchId, packet);
  assert.equal(result.counts.tools, 3);
  assert.equal(result.toolsExecuted, false);
});

test('credentials in sources and packet content are refused without echo or publication', async t => {
  const { prepareMaterials, applyMaterials } = await api();
  const { cwd, base } = await fixture(t);
  const secret = 'xoxb-SYNTHETIC-1234567890123456789';
  await writeFile(join(cwd, 'project/unsafe.md'), `# Unsafe\n${secret}\n`);
  await assert.rejects(prepareMaterials(cwd, ['project/unsafe.md']), error => !error.message.includes(secret) && /credential/i.test(error.message));
  const batch = await prepareMaterials(cwd, ['project/overview.md', 'project/workflow.txt']);
  const packet = proposal(batch);
  packet.gaps[0].description = secret;
  await assert.rejects(applyMaterials(cwd, batch.batchId, packet), error => !error.message.includes(secret) && /credential/i.test(error.message));
  await assert.rejects(lstat(join(base, 'current.json')), { code: 'ENOENT' });
});

test('prepare/apply source changes cannot be hidden by a material summary', async t => {
  const { prepareMaterials, applyMaterials } = await api();
  const { cwd, base } = await fixture(t);
  const batch = await prepareMaterials(cwd, ['project/overview.md', 'project/workflow.txt']);
  await writeFile(join(cwd, 'project/overview.md'), 'Source changed before materialization.\n');
  await assert.rejects(applyMaterials(cwd, batch.batchId, proposal(batch)), /changed|hash|stale/i);
  await assert.rejects(lstat(join(base, 'current.json')), { code: 'ENOENT' });
});

test('inspect and distillation handoff stop on changed or missing original source', async t => {
  const { prepareMaterials, applyMaterials, inspectMaterials, prepareDistillationFromMaterials } = await api();
  const { cwd } = await fixture(t);
  const batch = await prepareMaterials(cwd, ['project/overview.md', 'project/workflow.txt']);
  await applyMaterials(cwd, batch.batchId, proposal(batch));
  await writeFile(join(cwd, 'project/overview.md'), 'A changed original.\n');
  const stale = await inspectMaterials(cwd);
  assert.equal(stale.stale, true);
  assert.equal(stale.canDistill, false);
  assert.equal(stale.changedSources[0].reason, 'changed');
  await assert.rejects(prepareDistillationFromMaterials(cwd), /stale|changed|source/i);
  await rm(join(cwd, 'project/workflow.txt'));
  assert.ok((await inspectMaterials(cwd)).changedSources.some(source => source.reason === 'missing'));
});

test('handoff prepares selected original evidence and never reads material summaries as sources', async t => {
  const { prepareMaterials, applyMaterials, prepareDistillationFromMaterials } = await api();
  const { cwd } = await fixture(t);
  const batch = await prepareMaterials(cwd, ['project/overview.md', 'project/workflow.txt']);
  const packet = proposal(batch);
  packet.materials[1].selectedForDistillation = false;
  await applyMaterials(cwd, batch.batchId, packet);
  const next = await prepareDistillationFromMaterials(cwd);
  assert.equal(next.stage, 'distillation');
  assert.equal(next.materialized, false);
  assert.equal(next.distilled, false);
  assert.ok(next.fromMaterialsGenerationId);
  assert.notEqual(next.batchId, batch.batchId);
  assert.deepEqual(next.sources.map(source => source.path), ['project/overview.md']);
  assert.match(next.sources[0].content, /synthetic reporting project/);
  assert.equal((await inspectDistillation(cwd)).materialized, false);
});

test('repeat apply preserves history and refuses to overwrite existing or edited packets', async t => {
  const { prepareMaterials, applyMaterials, inspectMaterials } = await api();
  const { cwd, base } = await fixture(t);
  const batch = await prepareMaterials(cwd, ['project/overview.md', 'project/workflow.txt']);
  await applyMaterials(cwd, batch.batchId, proposal(batch));
  await assert.rejects(applyMaterials(cwd, batch.batchId, proposal(batch)), /already|overwrite|applied/i);
  const pointer = JSON.parse(await readFile(join(base, 'current.json'), 'utf8'));
  const path = join(base, 'generations', pointer.generationId, 'OVERVIEW.md');
  await writeFile(path, 'Manual edit must not be overwritten.');
  await assert.rejects(inspectMaterials(cwd), /integrity|modified|hash/i);
  const next = await prepareMaterials(cwd, ['project/overview.md', 'project/workflow.txt']);
  await assert.rejects(applyMaterials(cwd, next.batchId, proposal(next)), /integrity|modified|hash/i);
  assert.equal(await readFile(path, 'utf8'), 'Manual edit must not be overwritten.');
});

test('source metadata changes fail the material generation integrity chain', async t => {
  const { prepareMaterials, applyMaterials, inspectMaterials } = await api();
  const { cwd, base } = await fixture(t);
  const batch = await prepareMaterials(cwd, ['project/overview.md', 'project/workflow.txt']);
  await applyMaterials(cwd, batch.batchId, proposal(batch));
  const pointer = JSON.parse(await readFile(join(base, 'current.json'), 'utf8'));
  const path = join(base, 'generations', pointer.generationId, 'manifest.json');
  const manifest = JSON.parse(await readFile(path, 'utf8'));
  manifest.sources[0].sha256 = '0'.repeat(64);
  await writeFile(path, JSON.stringify(manifest));
  await assert.rejects(inspectMaterials(cwd), /integrity|modified|hash/i);
});

test('material output symlinks are refused without touching their target', async t => {
  const { prepareMaterials, applyMaterials } = await api();
  const { cwd, base } = await fixture(t);
  const batch = await prepareMaterials(cwd, ['project/overview.md', 'project/workflow.txt']);
  const external = join(cwd, 'external');
  await mkdir(external);
  await symlink(external, base, 'dir');
  await assert.rejects(applyMaterials(cwd, batch.batchId, proposal(batch)), /symlink/i);
  assert.deepEqual(await readdir(external), []);
});

test('material status without a packet remains read-only', async t => {
  const { inspectMaterials } = await api();
  const { cwd } = await fixture(t);
  const before = (await readdir(join(cwd, '.agent-twin'))).sort();
  const result = await inspectMaterials(cwd);
  assert.equal(result.materialized, false);
  assert.equal(result.canDistill, false);
  assert.deepEqual((await readdir(join(cwd, '.agent-twin'))).sort(), before);
});
