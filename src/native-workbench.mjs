import { createHash, randomUUID } from 'node:crypto';
import { link, open, unlink } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join } from 'node:path';
import { readProjectSource, assertNoCredentials } from './distill.mjs';
import { prepareDailyReport, runDailyReport } from './bounded-workflows.mjs';
import { explicitPath, readBounded, submitCapture, inspectCapture, adoptCapture, projectRoot, privateDirectory, exclusiveWrite } from './material-capture.mjs';

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const REQUEST = /^[a-zA-Z0-9_-]{8,128}$/;
const LIMITS = { reports: 32, captures: 128, preview: 16384, capture: 61440 };
const ARCHIVE_ROOT = '.agent-twin/workbench-archive';
const digest = value => createHash('sha256').update(value).digest('hex');
const issue = (code, message) => Object.assign(new Error(message), { code });
const key = project => project ? createHash('sha256').update(JSON.stringify({ projectId: project.projectId, cwd: project.cwd })).digest('hex') : null;
const copy = value => structuredClone(value);
function only(payload, fields) {
  if (!payload || Object.keys(payload).some(name => !fields.includes(name)))
    throw issue('invalid_input', 'Unsupported workbench field');
}
function entryInput(payload) {
  only(payload, ['entry', 'requestId']);
  if (typeof payload.entry !== 'string' || payload.entry.length > 1024 || typeof payload.requestId !== 'string' || !REQUEST.test(payload.requestId))
    throw issue('invalid_input', 'Select an explicit relative entry and request ID');
  try { explicitPath(payload.entry); assertNoCredentials(payload.entry, 'workbench entry'); }
  catch { throw issue('invalid_input', 'Select a safe explicit relative entry'); }
}
function boundedPreview(content) {
  if (Buffer.byteLength(content) <= LIMITS.preview) return { preview: content, previewTruncated: false };
  // Keep whole Markdown lines and whole UTF-8 code points in the bounded excerpt.
  const prefix = Buffer.from(content).subarray(0, LIMITS.preview).toString('utf8');
  const end = prefix.lastIndexOf('\n');
  return { preview: end >= 0 ? prefix.slice(0, end) : prefix.replace(/\uFFFD$/, ''), previewTruncated: true };
}
function failed(record, error) {
  record.status = 'failed';
  const code = ['workbench_input_changed', 'workbench_output_changed'].includes(error?.code) ? error.code : 'workbench_failed';
  record.error = { code, message: code === 'workbench_input_changed' ? '原始材料已变化，请核对后创建新的操作。' : code === 'workbench_output_changed' ? '已有产物与本次操作不一致，文件已保留，请主人核对。' : '本次操作未确认完成，现有文件已保留，请核对材料与输出。' };
}
function ledger(state) {
  state.workbench ??= { reports: [], captures: [] };
  state.workbench.archives ??= {};
  if (!Array.isArray(state.workbench.reports) || !Array.isArray(state.workbench.captures))
    throw issue('state_corrupt', 'Unsupported workbench ledger; existing data was preserved');
  return state.workbench;
}
function newRoom(rows, kind, projectKey) {
  if (rows.filter(row => row.projectKey === projectKey).length >= LIMITS[kind]) throw issue('workbench_full', 'This project activity history is full; archive completed records before another operation');
}
function archivePaths(cwd, kind, projectKey, requestId, id) {
  const base = join(cwd, ARCHIVE_ROOT, kind);
  return { base, request: join(base, 'by-request', `${digest(JSON.stringify([projectKey, requestId]))}.json`), id: join(base, 'by-id', `${id}.json`) };
}
async function archiveJSON(path) {
  try {
    const envelope = JSON.parse(await readBounded(path, 524288));
    if (envelope?.version !== 1 || !envelope.value || envelope.checksum !== digest(JSON.stringify(envelope.value)))
      throw issue('workbench_archive_failed', 'The private archive failed its integrity check');
    return envelope.value;
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw issue('workbench_archive_failed', 'The private archive could not be verified; existing records were preserved');
  }
}
async function archivedRequest(cwd, kind, projectKey, requestId) {
  const path = archivePaths(cwd, kind, projectKey, requestId, '').request;
  const saved = await archiveJSON(path);
  if (saved === null) return null;
  const record = saved.record;
  if (saved.kind !== kind || saved.projectKey !== projectKey || !record || record.projectKey !== projectKey || record.requestId !== requestId || !UUID.test(record.id ?? '') || record.status !== (kind === 'reports' ? 'completed' : 'adopted') || typeof record.archivedAt !== 'string')
    throw issue('workbench_archive_failed', 'The archived operation identity does not match');
  return saved;
}
async function archivedId(cwd, kind, projectKey, id) {
  const index = await archiveJSON(archivePaths(cwd, kind, projectKey, '', id).id);
  if (index === null) return null;
  if (index.projectKey !== projectKey || index.kind !== kind || index.id !== id || typeof index.requestId !== 'string' || !REQUEST.test(index.requestId))
    throw issue('workbench_archive_failed', 'The archive index does not match this project');
  const saved = await archivedRequest(cwd, kind, projectKey, index.requestId);
  if (!saved || saved.record.id !== id) throw issue('workbench_archive_failed', 'The archive index has no matching complete record');
  return saved;
}
async function atomicArchive(path, value) {
  const serialized = JSON.stringify({ version: 1, value, checksum: digest(JSON.stringify(value)) }, null, 2) + '\n';
  if (Buffer.byteLength(serialized) > 524288) throw issue('workbench_archive_failed', 'Archive record exceeds its size limit');
  const temporary = join(dirname(path), `.archive-${randomUUID()}.tmp`);
  try {
    await exclusiveWrite(temporary, serialized);
    try { await link(temporary, path); }
    catch (error) {
      if (error.code !== 'EEXIST' || await readBounded(path, 524288) !== serialized) throw error;
    }
    const directory = await open(dirname(path), constants.O_RDONLY);
    try { await directory.sync(); } finally { await directory.close(); }
  } finally {
    await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; });
  }
}
async function saveArchive(cwd, kind, projectKey, record) {
  const root = await projectRoot(cwd);
  const paths = archivePaths(root, kind, projectKey, record.requestId, record.id);
  await privateDirectory(join(root, ARCHIVE_ROOT));
  await privateDirectory(paths.base);
  await privateDirectory(join(paths.base, 'by-request'));
  await privateDirectory(join(paths.base, 'by-id'));
  const archived = { ...record, archivedAt: record.archiveRequestedAt };
  delete archived.archiveRequestedAt;
  await atomicArchive(paths.request, { kind, projectKey, record: archived });
  await atomicArchive(paths.id, { kind, projectKey, id: record.id, requestId: record.requestId });
}

/** Owner-only local commands. The host authenticates the owner; incoming message
 * tasks and the tool-free model never call this helper. No caller-provided cwd. */
export function createNativeWorkbench() {
  let review = null;
  function view(state) {
    const projectKey = key(state.project), history = ledger(state);
    if (review && review.projectKey !== projectKey) review = null;
    const visible = rows => rows.filter(row => row.projectKey === projectKey).map(({ projectKey: hidden, ...record }) => copy(record));
    return { reports: visible(history.reports), captures: visible(history.captures), review: review ? copy(review.value) : null, archive: { root: ARCHIVE_ROOT, counts: copy(history.archives[projectKey] ?? { reports: 0, captures: 0 }) } };
  }
  async function command(state, action, payload, { checkpoint }, at) {
    if (!state.project?.cwd || !state.project?.sessionId) throw issue('project_unbound', 'Bind a project and its service session first');
    const cwd = state.project.cwd, projectKey = key(state.project), history = ledger(state);
    if (action === 'archive_workbench') {
      only(payload, ['kind', 'id']);
      if (!['reports', 'captures'].includes(payload.kind) || typeof payload.id !== 'string' || !UUID.test(payload.id))
        throw issue('invalid_input', 'Choose an explicit workbench record to archive');
      const rows = history[payload.kind], record = rows.find(row => row.projectKey === projectKey && row.id === payload.id);
      if (!record) {
        if (await archivedId(cwd, payload.kind, projectKey, payload.id)) return;
        throw issue('archive_missing', 'This record does not belong to the bound project');
      }
      if (record.status !== (payload.kind === 'reports' ? 'completed' : 'adopted'))
        throw issue('archive_invalid', 'Only completed reports and explicitly adopted captures can be archived');
      record.archiveRequestedAt ??= at();
      await checkpoint();
      try { await saveArchive(cwd, payload.kind, projectKey, record); }
      catch { throw issue('workbench_archive_failed', 'Archive could not be confirmed; active history and existing files were preserved'); }
      rows.splice(rows.indexOf(record), 1);
      history.archives[projectKey] ??= { reports: 0, captures: 0 };
      history.archives[projectKey][payload.kind] += 1;
      if (review?.projectKey === projectKey && review.value.id === record.id) review = null;
      return;
    }
    if (action === 'run_daily_report' || action === 'capture_submit') {
      entryInput(payload);
      const isReport = action === 'run_daily_report', kind = isReport ? 'reports' : 'captures';
      const rows = history[kind];
      let record = rows.find(row => row.projectKey === projectKey && row.requestId === payload.requestId);
      if (record && record.entry !== payload.entry) throw issue('request_conflict', 'This request ID already belongs to another input');
      if (record && !['running', 'submitting'].includes(record.status)) return;
      if (!record) {
        const archived = await archivedRequest(cwd, kind, projectKey, payload.requestId);
        if (archived) {
          if (archived.record.entry !== payload.entry) throw issue('request_conflict', 'This request ID belongs to an archived input');
          return;
        }
        newRoom(rows, kind, projectKey);
        let input;
        try { input = isReport ? await prepareDailyReport(cwd, payload.entry) : await readProjectSource(cwd, payload.entry); }
        catch { throw issue('invalid_input', 'The selected input is unavailable or failed its safe reader and format checks'); }
        if (!isReport && input.bytes > LIMITS.capture) throw issue('invalid_input', 'Capture must be at most 60 KiB');
        record = { id: randomUUID(), projectKey, requestId: payload.requestId, entry: payload.entry, createdAt: at(), status: isReport ? 'running' : 'submitting', ...(isReport ? { inputSha256: input.inputSha256 } : { sha256: input.sha256, distilled: false }) };
        rows.push(record);
      }
      // Persist the stable effect ID and original input hash before creating a file.
      // A restart can retry only this same immutable destination with the same hash.
      await checkpoint();
      try {
        if (isReport) {
          const result = await runDailyReport(cwd, record.entry, { runId: record.id, expectedInputSha256: record.inputSha256 });
          const markdown = await readBounded(join(cwd, result.output), 262144);
          Object.assign(record, result, boundedPreview(markdown), { status: 'completed', completedAt: at() });
        } else {
          const result = await submitCapture(cwd, record.entry, { id: record.id, createdAt: record.createdAt, expectedInputSha256: record.sha256 });
          Object.assign(record, result, { completedAt: at() });
        }
      } catch (error) { failed(record, error); }
      return;
    }
    only(payload, action === 'capture_adopt' ? ['id', 'confirmation'] : ['id']);
    if (typeof payload.id !== 'string' || !UUID.test(payload.id) || action === 'capture_adopt' && payload.confirmation !== 'adopt')
      throw issue('invalid_input', 'Choose a capture and explicitly confirm adoption');
    const record = history.captures.find(row => row.projectKey === projectKey && row.id === payload.id);
    if (!record) throw issue('capture_missing', 'This capture does not belong to the bound project');
    if (!['pending', 'adopting', 'adopted'].includes(record.status)) throw issue('capture_unavailable', 'Capture submission has not completed');
    if (action === 'capture_review') {
      // Body content is never persisted into service state or loaded by polling.
      const inspected = await inspectCapture(cwd, record.id, { includeContent: true });
      if (inspected.sha256 !== record.sha256) throw issue('workbench_input_changed', 'Capture differs from the submitted source');
      review = { projectKey, value: { id: record.id, content: inspected.content, sha256: inspected.sha256 } };
      return;
    }
    if (record.status === 'adopted') return;
    record.status = 'adopting';
    await checkpoint();
    try {
      const result = await adoptCapture(cwd, record.id, payload.confirmation, { idempotent: true, expectedSha256: record.sha256 });
      Object.assign(record, result, { adopted: true, adoptedAt: at() });
    } catch (error) { failed(record, error); }
    // Deliberately leave materials.entries, packets and abilities untouched.
  }
  return { view, command };
}
