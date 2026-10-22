import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, realpath, rm, writeFile, readFile, readdir, symlink } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createTwinService } from '../src/native-service.mjs';

async function fixture(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'native-workbench-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const cwd = join(root, 'project'); await mkdir(cwd);
  await writeFile(join(cwd, 'sales.csv'), 'date,orders,revenue,cost\n2026-10-22,2,10.10,3.05\n2026-10-22,1,0.20,0.10\n2026-10-23,,9,2\n');
  await writeFile(join(cwd, 'recap.md'), '# Private recap\nObserved two missing rows.\n');
  const stateDir = join(root, 'state');
  const fresh = () => createTwinService({ stateDir });
  const service = fresh();
  const bind = async (target = cwd, projectId = 'project-one') => service.command('configure_project', { projectId, sessionId: `${projectId}-session`, cwd: target, title: projectId, goal: 'Use source evidence', mechanism: 'Owner checks material' });
  await bind();
  return { root, cwd, service, stateDir, fresh, bind };
}
async function editState(f, edit) {
  const path = join(f.stateDir, 'state.json');
  const envelope = JSON.parse(await readFile(path, 'utf8'));
  edit(envelope.state);
  envelope.checksum = createHash('sha256').update(JSON.stringify(envelope.state)).digest('hex');
  await writeFile(path, JSON.stringify(envelope));
}
const reportInput = { entry: 'sales.csv', requestId: 'report-request-0001' };
const captureInput = { entry: 'recap.md', requestId: 'capture-request-0001' };

test('owner report command persists exact totals, bounded preview and a single file across replay/restart', async t => {
  const f = await fixture(t);
  const before = await f.service.snapshot();
  const first = await f.service.command('run_daily_report', reportInput, { expectedRevision: before.revision });
  assert.equal(first.workbench.reports.length, 1);
  const report = first.workbench.reports[0];
  assert.equal(report.status, 'completed');
  assert.deepEqual(report.totals, { orders: 3, revenue: '10.30', cost: '3.15', margin: '7.15' });
  assert.deepEqual(report.warnings, [{ row: 4, code: 'missing_value' }]);
  assert.match(report.preview, /Local daily business report/);
  assert.ok(Buffer.byteLength(report.preview) <= 16384);
  assert.equal(report.previewTruncated, false);
  assert.equal(first.workbench.review, null);
  assert.equal(first.materials.entries.length, 0);
  await f.service.command('run_daily_report', reportInput);
  await f.fresh().command('run_daily_report', reportInput);
  assert.equal((await readdir(join(f.cwd, 'twin-project', 'outputs'))).length, 1);
  assert.equal((await f.fresh().snapshot()).workbench.reports[0].id, report.id);
  await assert.rejects(f.service.command('run_daily_report', { ...reportInput, entry: 'other.csv' }), e => e.code === 'request_conflict');
});

test('capture review is explicit and ephemeral; adoption remains separate from selected materials and ability', async t => {
  const f = await fixture(t);
  const submitted = await f.service.command('capture_submit', captureInput);
  const capture = submitted.workbench.captures[0];
  assert.equal(capture.status, 'pending');
  assert.equal(capture.content, undefined);
  assert.equal(submitted.workbench.review, null);
  assert.equal(submitted.materials.entries.length, 0);
  assert.equal(submitted.ability.adopted, null);
  const reviewed = await f.service.command('capture_review', { id: capture.id });
  assert.equal(reviewed.workbench.review.id, capture.id);
  assert.match(reviewed.workbench.review.content, /Private recap/);
  assert.equal(reviewed.workbench.review.sha256, capture.sha256);
  assert.equal((await f.fresh().snapshot()).workbench.review, null);
  assert.ok(!JSON.stringify(JSON.parse(await readFile(join(f.stateDir, 'state.json'), 'utf8')).state.workbench).includes('Observed two missing rows'));
  await assert.rejects(f.service.command('capture_adopt', { id: capture.id }), e => e.code === 'invalid_input');
  const adopted = await f.service.command('capture_adopt', { id: capture.id, confirmation: 'adopt' });
  assert.equal(adopted.workbench.captures[0].status, 'adopted');
  assert.equal(adopted.workbench.captures[0].adopted, true);
  assert.match(await readFile(join(f.cwd, adopted.workbench.captures[0].source), 'utf8'), /Evidence only/);
  assert.deepEqual(adopted.materials.entries, []);
  assert.equal(adopted.ability.adopted, null);
  await f.fresh().command('capture_adopt', { id: capture.id, confirmation: 'adopt' });
  await f.fresh().command('capture_submit', captureInput);
  assert.equal((await readdir(join(f.cwd, 'twin-project', 'captures'))).length, 1);
  assert.equal((await readdir(join(f.cwd, 'twin-project', 'context', 'captured'))).length, 1);
  const selected = await f.service.command('select_sources', { entries: [adopted.workbench.captures[0].source] });
  assert.equal(selected.materials.entries.length, 1);
  assert.equal(selected.ability.adopted, null);
});

test('stale revision, payload cwd/sender/tool and unsafe inputs cannot create workbench files', async t => {
  const f = await fixture(t);
  const before = await f.service.snapshot();
  for (const action of ['run_daily_report', 'capture_submit']) {
    const input = action === 'run_daily_report' ? reportInput : captureInput;
    await assert.rejects(f.service.command(action, input, { expectedRevision: before.revision - 1 }), e => e.code === 'revision_conflict');
    for (const extra of [{ cwd: f.cwd }, { senderId: 'stranger' }, { tool: 'shell' }, { command: 'cat file' }])
      await assert.rejects(f.service.command(action, { ...input, ...extra }), e => e.code === 'invalid_input');
    await assert.rejects(f.service.command(action, { ...input, requestId: '../escape' }), e => e.code === 'invalid_input');
    await assert.rejects(f.service.command(action, { ...input, entry: '../outside.md' }));
  }
  await symlink(join(f.cwd, 'sales.csv'), join(f.cwd, 'linked.csv'));
  await assert.rejects(f.service.command('run_daily_report', { ...reportInput, entry: 'linked.csv' }));
  await writeFile(join(f.cwd, 'sensitive.md'), 'password=DO_NOT_ECHO_THIS_SECRET\n');
  await assert.rejects(f.service.command('capture_submit', { ...captureInput, entry: 'sensitive.md' }), e => !e.message.includes('DO_NOT_ECHO_THIS_SECRET'));
  assert.deepEqual((await f.service.snapshot()).workbench.reports, []);
  assert.deepEqual((await f.service.snapshot()).workbench.captures, []);
  assert.deepEqual(await readdir(join(f.cwd, 'twin-project', 'outputs')), []);
});

test('project switching hides private history and review, keeps each project history on return', async t => {
  const f = await fixture(t);
  await f.service.command('run_daily_report', reportInput);
  const first = await f.service.command('capture_submit', captureInput);
  const id = first.workbench.captures[0].id;
  await f.service.command('capture_review', { id });
  const second = join(f.root, 'project-two'); await mkdir(second);
  await f.bind(second, 'project-two');
  const snapshot = await f.service.snapshot();
  assert.deepEqual(snapshot.workbench, { reports: [], captures: [], review: null, archive: { root: '.agent-twin/workbench-archive', counts: { reports: 0, captures: 0 } } });
  assert.ok(!JSON.stringify(snapshot.workbench).includes('recap.md'));
  await assert.rejects(f.service.command('capture_review', { id }), e => e.code === 'capture_missing');
  await assert.rejects(f.service.command('capture_adopt', { id, confirmation: 'adopt' }), e => e.code === 'capture_missing');
  await f.bind();
  assert.equal((await f.service.snapshot()).workbench.reports.length, 1);
  assert.equal((await f.service.snapshot()).workbench.captures.length, 1);
  assert.equal((await f.service.snapshot()).workbench.review, null);
});

test('checkpoint recovery after a report file write reuses that file; changed input cannot replay another effect', async t => {
  const f = await fixture(t);
  const first = await f.service.command('run_daily_report', reportInput);
  const id = first.workbench.reports[0].id;
  await editState(f, state => {
    const row = state.workbench.reports[0]; row.status = 'running';
    for (const field of ['preview', 'previewTruncated', 'completedAt', 'totals', 'warnings', 'acceptedRows', 'rejectedRows']) delete row[field];
  });
  const recovered = await f.fresh().command('run_daily_report', reportInput);
  assert.equal(recovered.workbench.reports[0].status, 'completed');
  assert.equal(recovered.workbench.reports[0].id, id);
  assert.equal((await readdir(join(f.cwd, 'twin-project', 'outputs'))).length, 1);
  await editState(f, state => { state.workbench.reports[0].status = 'running'; });
  await writeFile(join(f.cwd, 'sales.csv'), 'date,orders,revenue,cost\n2026-10-22,9,900,3\n');
  const refused = await f.fresh().command('run_daily_report', reportInput);
  assert.equal(refused.workbench.reports[0].status, 'failed');
  assert.equal(refused.workbench.reports[0].error.code, 'workbench_input_changed');
  assert.equal((await readdir(join(f.cwd, 'twin-project', 'outputs'))).length, 1);
  assert.match(await readFile(join(f.cwd, first.workbench.reports[0].output), 'utf8'), /10\.30/);
});

test('capture checkpoints recover submission and adoption without duplicate immutable files', async t => {
  const f = await fixture(t);
  const first = await f.service.command('capture_submit', captureInput), id = first.workbench.captures[0].id;
  await editState(f, state => { state.workbench.captures[0].status = 'submitting'; });
  const recovered = await f.fresh().command('capture_submit', captureInput);
  assert.equal(recovered.workbench.captures[0].status, 'pending');
  await f.fresh().command('capture_adopt', { id, confirmation: 'adopt' });
  await editState(f, state => { state.workbench.captures[0].status = 'adopting'; delete state.workbench.captures[0].source; delete state.workbench.captures[0].adoptedAt; });
  const adopted = await f.fresh().command('capture_adopt', { id, confirmation: 'adopt' });
  assert.equal(adopted.workbench.captures[0].status, 'adopted');
  assert.equal((await readdir(join(f.cwd, 'twin-project', 'captures'))).length, 1);
  assert.equal((await readdir(join(f.cwd, 'twin-project', 'context', 'captured'))).length, 1);
});

test('old native state gains an empty workbench without resetting material or service state', async t => {
  const f = await fixture(t);
  await f.service.command('select_sources', { entries: ['recap.md'] });
  await editState(f, state => { delete state.workbench; });
  const migrated = await f.fresh().snapshot();
  assert.deepEqual(migrated.workbench, { reports: [], captures: [], review: null, archive: { root: '.agent-twin/workbench-archive', counts: { reports: 0, captures: 0 } } });
  assert.deepEqual(migrated.materials.entries, ['recap.md']);
  const submitted = await f.fresh().command('capture_submit', captureInput);
  assert.equal(submitted.workbench.captures[0].status, 'pending');
});

test('report preview is capped while full output and all validation warnings remain available', async t => {
  const f = await fixture(t);
  const rows = Array.from({ length: 1000 }, (_, i) => i === 0 ? '2026-10-22,1,1,0' : '2026-10-22,,1,0');
  await writeFile(join(f.cwd, 'large.csv'), `date,orders,revenue,cost\n${rows.join('\n')}\n`);
  const result = await f.service.command('run_daily_report', { entry: 'large.csv', requestId: 'large-report-0001' });
  const report = result.workbench.reports[0];
  assert.equal(report.status, 'completed');
  assert.equal(report.previewTruncated, true);
  assert.ok(Buffer.byteLength(report.preview) <= 16384);
  assert.equal(report.warnings.length, 999);
  assert.ok(Buffer.byteLength(await readFile(join(f.cwd, report.output), 'utf8')) > 16384);
});

test('native action rejects oversized capture and non-string request IDs before retaining records', async t => {
  const f = await fixture(t);
  await writeFile(join(f.cwd, 'large.md'), '文'.repeat(20481));
  await assert.rejects(f.service.command('capture_submit', { entry: 'large.md', requestId: 'large-capture-0001' }), e => e.code === 'invalid_input');
  await assert.rejects(f.service.command('run_daily_report', { ...reportInput, requestId: 12345678 }), e => e.code === 'invalid_input');
  assert.deepEqual((await f.service.snapshot()).workbench.captures, []);
});

test('full report ledger refuses another effect without pruning history', async t => {
  const f = await fixture(t);
  await f.service.command('run_daily_report', reportInput);
  await editState(f, state => {
    const sample = state.workbench.reports[0];
    state.workbench.reports = Array.from({ length: 32 }, (_, i) => ({ ...sample, id: `${sample.id}-${i}`, requestId: `previous-report-${i}` }));
  });
  await assert.rejects(f.fresh().command('run_daily_report', { ...reportInput, requestId: 'full-report-new' }), e => e.code === 'workbench_full');
  assert.equal((await f.fresh().snapshot()).workbench.reports.length, 32);
  assert.equal((await readdir(join(f.cwd, 'twin-project', 'outputs'))).length, 1);
});

test('tampered capture cannot be reviewed or adopted even if its JSON hash was recomputed', async t => {
  const f = await fixture(t);
  const result = await f.service.command('capture_submit', captureInput), capture = result.workbench.captures[0];
  const path = join(f.cwd, capture.pending), record = JSON.parse(await readFile(path, 'utf8'));
  record.content = 'Changed untrusted capture';
  record.sha256 = createHash('sha256').update(record.content).digest('hex');
  await writeFile(path, JSON.stringify(record));
  await assert.rejects(f.service.command('capture_review', { id: capture.id }), e => e.code === 'workbench_input_changed');
  const refused = await f.service.command('capture_adopt', { id: capture.id, confirmation: 'adopt' });
  assert.equal(refused.workbench.captures[0].status, 'failed');
  assert.equal(refused.workbench.captures[0].error.code, 'workbench_input_changed');
  assert.deepEqual(refused.materials.entries, []);
  await assert.rejects(readdir(join(f.cwd, 'twin-project', 'context', 'captured')), { code: 'ENOENT' });
});

test('owner archives a completed report to free capacity while archived request replay stays idempotent', async t => {
  const f = await fixture(t);
  const first = await f.service.command('run_daily_report', reportInput), report = first.workbench.reports[0];
  await editState(f, state => {
    const original = state.workbench.reports[0];
    state.workbench.reports = [original, ...Array.from({ length: 31 }, (_, i) => ({ ...original, id: randomUUID(), requestId: `other-report-${i}` }))];
  });
  await assert.rejects(f.service.command('run_daily_report', { ...reportInput, requestId: 'new-after-full-report' }), e => e.code === 'workbench_full');
  const archived = await f.service.command('archive_workbench', { kind: 'reports', id: report.id });
  assert.equal(archived.workbench.reports.length, 31);
  assert.equal(archived.workbench.archive.root, '.agent-twin/workbench-archive');
  assert.equal(archived.workbench.archive.counts.reports, 1);
  const directory = join(f.cwd, archived.workbench.archive.root, 'reports', 'by-request');
  const files = await readdir(directory); assert.equal(files.length, 1);
  const saved = JSON.parse(await readFile(join(directory, files[0]), 'utf8')).value;
  assert.equal(saved.record.id, report.id);
  assert.deepEqual(saved.record.totals, report.totals);
  assert.equal(saved.record.preview, report.preview);
  assert.ok(saved.record.archivedAt);
  await f.fresh().command('run_daily_report', { ...reportInput, requestId: 'new-after-full-report' });
  assert.equal((await f.fresh().snapshot()).workbench.reports.length, 32);
  await f.fresh().command('run_daily_report', reportInput);
  assert.equal((await readdir(join(f.cwd, 'twin-project', 'outputs'))).length, 2);
  await assert.rejects(f.fresh().command('run_daily_report', { ...reportInput, entry: 'other.csv' }), e => e.code === 'request_conflict');
  const again = await f.fresh().command('archive_workbench', { kind: 'reports', id: report.id });
  assert.equal(again.workbench.archive.counts.reports, 1);
  assert.equal((await readdir(directory)).length, 1);
});

test('capture archive requires completed owner adoption and preserves source, pending record and request identity', async t => {
  const f = await fixture(t);
  const submitted = await f.service.command('capture_submit', captureInput), capture = submitted.workbench.captures[0];
  await assert.rejects(f.service.command('archive_workbench', { kind: 'captures', id: capture.id }), e => e.code === 'archive_invalid');
  const adopted = await f.service.command('capture_adopt', { id: capture.id, confirmation: 'adopt' });
  const source = adopted.workbench.captures[0].source;
  await f.service.command('capture_review', { id: capture.id });
  const archived = await f.service.command('archive_workbench', { kind: 'captures', id: capture.id });
  assert.equal(archived.workbench.captures.length, 0);
  assert.equal(archived.workbench.review, null);
  assert.equal(archived.workbench.archive.counts.captures, 1);
  assert.match(await readFile(join(f.cwd, source), 'utf8'), /Private recap/);
  assert.equal((await readdir(join(f.cwd, 'twin-project', 'captures'))).length, 1);
  await f.fresh().command('capture_submit', captureInput);
  assert.equal((await f.fresh().snapshot()).workbench.captures.length, 0);
  assert.equal((await readdir(join(f.cwd, 'twin-project', 'captures'))).length, 1);
  assert.deepEqual((await f.fresh().snapshot()).materials.entries, []);
});

test('archive publication recovers before ledger removal, and a conflicting archive never loses active history', async t => {
  const f = await fixture(t);
  const first = await f.service.command('run_daily_report', reportInput), id = first.workbench.reports[0].id;
  const done = await f.service.command('archive_workbench', { kind: 'reports', id });
  const directory = join(f.cwd, done.workbench.archive.root, 'reports', 'by-request');
  const path = join(directory, (await readdir(directory))[0]);
  const saved = JSON.parse(await readFile(path, 'utf8')).value;
  await editState(f, state => {
    const record = { ...saved.record, archiveRequestedAt: saved.record.archivedAt }; delete record.archivedAt;
    state.workbench.reports.push(record);
    state.workbench.archives[record.projectKey].reports = 0;
  });
  const recovered = await f.fresh().command('archive_workbench', { kind: 'reports', id });
  assert.equal(recovered.workbench.reports.length, 0);
  assert.equal(recovered.workbench.archive.counts.reports, 1);
  assert.equal((await readdir(directory)).length, 1);
  await editState(f, state => {
    const record = { ...saved.record, archiveRequestedAt: saved.record.archivedAt }; delete record.archivedAt;
    state.workbench.reports.push(record);
  });
  await writeFile(path, '{"changed":true}');
  await assert.rejects(f.fresh().command('archive_workbench', { kind: 'reports', id }), e => e.code === 'workbench_archive_failed');
  assert.equal((await f.fresh().snapshot()).workbench.reports.length, 1);
  assert.equal(await readFile(path, 'utf8'), '{"changed":true}');
});

test('active limits, archive counts, lookups and private records remain project-scoped', async t => {
  const f = await fixture(t);
  const first = await f.service.command('run_daily_report', reportInput), id = first.workbench.reports[0].id;
  await f.service.command('archive_workbench', { kind: 'reports', id });
  await f.service.command('run_daily_report', { ...reportInput, requestId: 'active-old-project' });
  await editState(f, state => {
    const sample = state.workbench.reports[0];
    state.workbench.reports = Array.from({ length: 32 }, (_, i) => ({ ...sample, id: `${sample.id}-${i}`, requestId: `old-project-report-${i}` }));
  });
  const other = join(f.root, 'other'); await mkdir(other);
  await writeFile(join(other, 'sales.csv'), 'date,orders,revenue,cost\n2026-10-22,1,8,1\n');
  await f.bind(other, 'other-project');
  let snapshot = await f.service.snapshot();
  assert.equal(snapshot.workbench.reports.length, 0);
  assert.deepEqual(snapshot.workbench.archive.counts, { reports: 0, captures: 0 });
  await assert.rejects(f.service.command('archive_workbench', { kind: 'reports', id }), e => e.code === 'archive_missing');
  snapshot = await f.service.command('run_daily_report', reportInput);
  assert.equal(snapshot.workbench.reports.length, 1);
  assert.equal(snapshot.workbench.reports[0].totals.orders, 1);
  await f.bind();
  assert.equal((await f.service.snapshot()).workbench.archive.counts.reports, 1);
});
