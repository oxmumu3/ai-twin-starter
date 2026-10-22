import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import http from 'node:http';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createTwinService } from '../src/native-service.mjs';

const snapshot = () => ({ schemaVersion: 1, revision: 40, project: { projectId: 'p1', sessionId: 's1', cwd: '/tmp/test-project', title: '测试项目', goal: '交付结果', mechanism: '核验依据' }, materials: { entries: [], inventory: { entries: [{ path: 'input/daily.csv', format: 'csv', kind: 'needs_conversion' }, { path: 'notes/review.md', format: 'md', kind: 'candidate' }, { path: 'notes/blocked.md', format: 'md', kind: 'excluded' }] }, status: 'empty' }, ability: { candidate: null, adopted: null, history: [] }, channel: { config: {}, status: 'unconfigured' }, identities: [], rules: {}, service: { enabled: false, everEnabled: false }, tasks: [], outbox: [], events: [], readiness: { project: false, ability: false, channels: false, rules: false, canEnable: false, gaps: [] }, runtime: { executorConfigured: false, transportConfigured: false }, workbench: { reports: [], captures: [], review: null } });
const report = { id: 'report-1', requestId: 'report-request-1', entry: 'input/daily.csv', status: 'completed', createdAt: '2026-10-22T12:00:00Z', output: 'twin-project/outputs/daily-report-1.md', acceptedRows: 2, rejectedRows: 1, warnings: [{ row: 4, code: 'invalid_date' }], totals: { orders: 7, revenue: '130.50', cost: '50.00', margin: '80.50' }, preview: '# Actual file report\n\n| Total | 7 | 130.50 | 50.00 | 80.50 |' };
const capture = { id: 'capture-1', requestId: 'capture-request-1', entry: 'notes/review.md', status: 'pending', createdAt: '2026-10-22T12:00:00Z', pending: 'twin-project/captures/capture-1.json', sha256: 'abcdef123456', distilled: false };

const content = node => typeof node === 'string' ? node : node?.children?.map(content).join('') ?? '';
const find = (node, predicate) => { if (!node || typeof node === 'string') return null; if (predicate(node)) return node; for (const child of node.children ?? []) { const match = find(child, predicate); if (match) return match; } return null; };
const button = (tree, label) => find(tree, node => node.type === 'button' && content(node) === label);
const form = tree => find(tree, node => node.type === 'form');
const submit = (tree, values) => form(tree).props.onSubmit({ preventDefault() {}, currentTarget: values });

async function fixture(t, mutate = () => {}) {
  const state = { value: snapshot(), writes: [] };
  const server = http.createServer(async (req, res) => {
    if (req.method === 'POST') {
      let raw = ''; for await (const chunk of req) raw += chunk;
      const body = JSON.parse(raw); state.writes.push(body);
      await mutate(body, state, res);
      if (res.writableEnded) return;
      state.value = { ...state.value, revision: state.value.revision + 1 };
    }
    res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(state.value));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  state.url = `http://127.0.0.1:${server.address().port}`;
  return state;
}

async function mount(t, url, { intervals } = {}) {
  let plugin, cursor = 0; const state = [], effects = [], disposers = [];
  const React = { createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }), useState(initial) { const i = cursor++; if (!(i in state)) state[i] = typeof initial === 'function' ? initial() : initial; return [state[i], next => { state[i] = typeof next === 'function' ? next(state[i]) : next; }]; }, useEffect(fn) { const i = cursor++; if (!(i in state)) { state[i] = true; effects.push(fn); } }, useRef(value) { const i = cursor++; return state[i] ?? (state[i] = { current: value }); } };
  const code = await fs.readFile(new URL('../src/client.js', import.meta.url), 'utf8');
  vm.runInNewContext(code, { window: { __ModuleLoader__: { load(entry) { plugin = entry.factory(name => name === 'react' ? React : { Modal: 'native-modal', SettingsForm: 'native-settings-form', SettingsSecretField: 'native-secret-field' }); } } }, AbortController, AbortSignal, setTimeout, clearTimeout, setInterval: intervals ? (callback, delay) => { intervals.push({ callback, delay }); return intervals.length; } : setInterval, clearInterval: intervals ? () => {} : clearInterval, fetch: (path, options) => fetch(url + path, options), URL, FormData: class { constructor(values) { this.values = values; } get(name) { return this.values[name] ?? null; } getAll(name) { return this.values[name] ?? []; } }, console });
  const registrations = [];
  plugin.apply({ layout: { selectPanel() {} }, effect(fn) { const off = fn(); if (typeof off === 'function') disposers.push(off); }, slots: { inject(_name, fn) { return fn(); }, register(options, Component) { registrations.push({ options, Component }); return () => {}; } } });
  const Main = registrations.find(item => item.options.name === 'main').Component;
  function expand(node) { if (node == null || typeof node === 'boolean') return null; if (typeof node !== 'object') return String(node); if (Array.isArray(node)) return node.flatMap(expand); if (typeof node.type === 'function') return expand(node.type({ ...node.props, children: node.children })); return { ...node, children: node.children.flatMap(child => { const out = expand(child); return Array.isArray(out) ? out : [out]; }).filter(x => x !== null) }; }
  const render = () => { cursor = 0; return expand(Main()); };
  render(); effects.forEach(fn => { const off = fn(); if (typeof off === 'function') disposers.push(off); });
  const close = () => disposers.splice(0).forEach(fn => fn()); t.after(close);
  for (let i = 0; i < 100 && !content(render()).includes('宿主状态修订'); i++) await new Promise(resolve => setTimeout(resolve, 5));
  return { render, close, navigate(label) { button(render(), label).props.onClick(); return render(); } };
}

test('daily report UI requires a project CSV and displays the returned file preview and validation results', async t => {
  const f = await fixture(t, (body, state) => { assert.equal(body.action, 'run_daily_report'); state.value.workbench.reports = [{ ...report, requestId: body.payload.requestId }]; });
  const ui = await mount(t, f.url); let tree = ui.navigate('分身能力');
  assert.match(content(tree), /本地日报/);
  assert.equal(button(tree, '选择 CSV 生成日报').props.disabled, false, 'local reports do not require a model, adopted ability or external channel');
  button(tree, '选择 CSV 生成日报').props.onClick(); tree = ui.render();
  const picker = find(tree, node => node.type === 'select' && node.props.name === 'entrySelection');
  assert.ok(picker); assert.equal(picker.props.defaultValue, ''); assert.match(content(picker), /input\/daily.csv/); assert.doesNotMatch(content(picker), /review.md/);
  await submit(tree, {}); assert.equal(f.writes.length, 0); assert.match(content(ui.render()), /选择.*文件/);
  await submit(ui.render(), { entry: '../outside.csv' }); assert.equal(f.writes.length, 0); assert.match(content(ui.render()), /相对路径/);
  await submit(ui.render(), { entry: 'notes/review.md' }); assert.equal(f.writes.length, 0);
  await submit(ui.render(), { entrySelection: 'input/daily.csv', entry: 'input/other.csv' }); assert.equal(f.writes.length, 0);
  await submit(ui.render(), { entrySelection: 'input/daily.csv' });
  assert.equal(f.writes.length, 1); assert.equal(f.writes[0].expectedRevision, 40); assert.equal(f.writes[0].payload.entry, 'input/daily.csv'); assert.match(f.writes[0].payload.requestId, /^[A-Za-z0-9_-]{8,128}$/);
  tree = ui.render(); assert.match(content(tree), /130.50/); assert.match(content(tree), /80.50/); assert.match(content(tree), /有效.*2/); assert.match(content(tree), /排除.*1/); assert.match(content(tree), /第 4 行/); assert.match(content(tree), /未发送/);
  button(tree, '查看日报').props.onClick(); tree = ui.render();
  assert.equal(content(find(tree, node => node.type === 'pre')), report.preview);
  assert.match(content(tree), /twin-project\/outputs\/daily-report-1.md/);
  assert.equal(f.writes.length, 1, 'viewing a saved report is read-only');
});

test('capture UI requires review and explicit adoption, then separately selects the saved source', async t => {
  const f = await fixture(t, (body, state) => {
    if (body.action === 'capture_submit') state.value.workbench.captures = [{ ...capture, requestId: body.payload.requestId }];
    else if (body.action === 'capture_review') state.value.workbench.review = { id: capture.id, content: '# Original work notes\n\nA concrete verified decision.', sha256: capture.sha256 };
    else if (body.action === 'capture_adopt') { state.value.workbench.captures[0] = { ...state.value.workbench.captures[0], status: 'adopted', source: 'twin-project/context/captured/capture-1.md' }; state.value.workbench.review = null; }
    else if (body.action === 'select_sources') state.value.materials.entries = body.payload.entries;
    else assert.fail(`Unexpected action ${body.action}`);
  });
  const ui = await mount(t, f.url); let tree = ui.navigate('项目沉淀');
  assert.match(content(tree), /材料回流/); button(tree, '提交工作材料').props.onClick(); tree = ui.render();
  const picker = find(tree, node => node.type === 'select' && node.props.name === 'entrySelection'); assert.ok(picker); assert.match(content(picker), /notes\/review.md/); assert.doesNotMatch(content(picker), /daily.csv|blocked.md/);
  await submit(tree, { entry: 'notes/review.md' });
  assert.equal(f.writes[0].action, 'capture_submit'); assert.equal(f.writes[0].payload.entry, capture.entry); assert.match(f.writes[0].payload.requestId, /^[A-Za-z0-9_-]{8,128}$/);
  tree = ui.render(); assert.match(content(tree), /待审阅/); assert.equal(button(tree, '采纳为正式来源'), null); assert.deepEqual(f.value.materials.entries, []);
  await button(tree, '审阅材料').props.onClick(); tree = ui.render();
  assert.equal(f.writes[1].action, 'capture_review'); assert.deepEqual(f.writes[1].payload, { id: capture.id }); assert.equal(f.writes[1].expectedRevision, 41);
  assert.equal(content(find(tree, node => node.type === 'pre')), f.value.workbench.review.content);
  await button(tree, '采纳为正式来源').props.onClick(); tree = ui.render();
  assert.equal(f.writes[2].action, 'capture_adopt'); assert.deepEqual(f.writes[2].payload, { id: capture.id, confirmation: 'adopt' }); assert.equal(f.writes[2].expectedRevision, 42);
  assert.match(content(tree), /twin-project\/context\/captured\/capture-1.md/); assert.deepEqual(f.value.materials.entries, []); assert.match(content(tree), /整理.*蒸馏.*试跑.*采用/);
  await button(tree, '加入来源选择').props.onClick(); tree = ui.render();
  assert.equal(f.writes[3].action, 'select_sources'); assert.deepEqual(f.writes[3].payload, { entries: ['twin-project/context/captured/capture-1.md'] }); assert.equal(f.writes[3].expectedRevision, 43);
  assert.match(content(tree), /已在读取范围/); assert.equal(f.value.ability.adopted, null);
});

test('workbench writes remain disabled while pending and after revision conflicts until refresh', async t => {
  let release; const held = new Promise(resolve => { release = resolve; });
  const f = await fixture(t, async (_body, _state, res) => { await held; res.statusCode = 409; res.end(JSON.stringify({ code: 'REVISION_CONFLICT' })); });
  const ui = await mount(t, f.url); let tree = ui.navigate('分身能力');
  const open = button(tree, '选择 CSV 生成日报'); assert.ok(open); open.props.onClick();
  const pending = submit(ui.render(), { entry: 'input/daily.csv' }); tree = ui.render();
  assert.equal(find(tree, node => node.type === 'button' && node.props.type === 'submit').props.disabled, true);
  assert.equal(find(tree, node => node.type === 'input' && node.props.name === 'entry').props.disabled, true);
  await submit(tree, { entry: 'input/daily.csv' }); release(); await pending;
  assert.equal(f.writes.length, 1); tree = ui.render(); assert.match(content(tree), /刷新/); assert.equal(find(tree, node => node.type === 'button' && node.props.type === 'submit').props.disabled, true);
  await button(tree, '刷新').props.onClick(); tree = ui.render(); assert.equal(find(tree, node => node.type === 'button' && node.props.type === 'submit').props.disabled, false); assert.equal(f.writes.length, 1);
});

test('trial modal keeps its failure visible and disables writes across the actual polling callback', async t => {
  const f = await fixture(t, (_body, _state, res) => { res.statusCode = 500; res.end(JSON.stringify({ error: '候选草稿缺少有效输出', code: 'candidate_trial_output_invalid' })); });
  f.value.runtime.executorConfigured = true; f.value.ability.candidate = { id: 'candidate-1', cards: [], scopes: [], fingerprint: 'test' };
  const intervals = [], ui = await mount(t, f.url, { intervals }); let tree = ui.navigate('分身能力');
  button(tree, '对候选执行试跑').props.onClick(); await submit(ui.render(), { prompt: '请检查这份候选' });
  tree = ui.render(); let modal = find(tree, node => node.type === 'native-modal'); assert.match(content(modal), /候选草稿缺少有效输出/);
  assert.equal(button(modal, '执行真实试跑（不外发）').props.disabled, true);
  const poll = intervals.find(item => item.delay === 15000); assert.ok(poll); await poll.callback(); await new Promise(resolve => setTimeout(resolve, 50));
  tree = ui.render(); modal = find(tree, node => node.type === 'native-modal'); assert.match(content(modal), /候选草稿缺少有效输出/); assert.equal(button(modal, '执行真实试跑（不外发）').props.disabled, true); assert.equal(f.writes.length, 1);
  await button(modal, '刷新并核对状态').props.onClick(); tree = ui.render(); modal = find(tree, node => node.type === 'native-modal'); assert.doesNotMatch(content(modal), /候选草稿缺少有效输出/); assert.equal(button(modal, '执行真实试跑（不外发）').props.disabled, false); assert.equal(f.writes.length, 1);
});

test('adopted bundles distinguish pending content from stale sources and show the completed adoption', async t => {
  const f = await fixture(t);
  const passed = { passed: true, output: '实际试跑草稿', outputFingerprint: 'checked-output', checkedAt: '2026-10-22T12:00:00Z' };
  f.value.ability = { status: 'ready', adopted: { id: 'adopted-1', version: 1, cards: [{ id: 'confirmed', status: 'documented', title: '已有依据的事实' }, { id: 'pending', status: 'candidate', title: '尚待确认的记录' }], scopes: [], fingerprint: 'sources-unchanged', adoptedAt: '2026-10-22T12:01:00Z', test: passed, staleCardIds: [], candidateCardIds: ['pending'] }, candidate: { id: 'candidate-2', version: 2, cards: [], scopes: [], fingerprint: 'new-candidate', test: passed }, history: [] };
  const ui = await mount(t, f.url); let tree = ui.navigate('分身能力');
  const adoptedCard = find(tree, node => node.type === 'article' && content(node).includes('当前采用版'));
  assert.match(content(adoptedCard), /1项内容仍待确认，未用于在线任务/); assert.match(content(adoptedCard), /试跑通过，已明确采用/); assert.doesNotMatch(content(adoptedCard), /待验收|来源有变化|项需更新/); assert.doesNotMatch(content(tree), /来源已变化/);
  const candidateCard = find(tree, node => node.type === 'article' && content(node).includes('待复核候选')); assert.match(content(candidateCard), /已生成实际草稿，待验收/); assert.doesNotMatch(content(candidateCard), /已明确采用/);
  button(adoptedCard, '查看能力与依据').props.onClick(); tree = ui.render(); const modal = find(tree, node => node.type === 'native-modal'); assert.match(content(modal), /试跑通过，已明确采用/); assert.doesNotMatch(content(modal), /待你验收/);
  modal.props.onClose(); f.value.ability.adopted.staleCardIds = ['confirmed']; f.value.ability.status = 'stale'; f.value.revision++;
  await button(ui.render(), '刷新').props.onClick(); tree = ui.render(); assert.match(content(tree), /1 项来源有变化/); assert.match(content(tree), /来源已变化/); assert.match(content(tree), /1项内容仍待确认，未用于在线任务/); assert.equal(f.writes.length, 0);
});

test('a newly mounted workbench reads report and capture history from the host without repeating work', async t => {
  const f = await fixture(t); f.value.service.everEnabled = true; f.value.workbench.reports = [report]; f.value.workbench.captures = [{ ...capture, status: 'adopted', source: 'twin-project/context/captured/capture-1.md' }];
  const first = await mount(t, f.url); let tree = first.navigate('分身能力'); assert.match(content(tree), /input\/daily.csv/); first.close();
  const reopened = await mount(t, f.url); tree = reopened.navigate('分身能力'); assert.match(content(tree), /input\/daily.csv/); assert.match(content(tree), /130.50/); tree = reopened.navigate('项目沉淀'); assert.match(content(tree), /twin-project\/context\/captured\/capture-1.md/); assert.equal(button(tree, '采纳为正式来源'), null); assert.equal(f.writes.length, 0);
});

test('capture review refuses a mismatched body and project switching retires an open file form', async t => {
  const f = await fixture(t, (_body, state) => { state.value.workbench.review = { id: capture.id, content: 'Changed content must not be presented as reviewed.', sha256: 'different-hash' }; });
  f.value.workbench.captures = [capture];
  const ui = await mount(t, f.url); let tree = ui.navigate('项目沉淀');
  await button(tree, '审阅材料').props.onClick(); tree = ui.render();
  assert.equal(button(tree, '采纳为正式来源').props.disabled, true); assert.equal(find(tree, node => node.type === 'pre'), null); assert.match(content(tree), /重新读取/);
  button(tree, '关闭').props.onClick(); tree = ui.navigate('分身能力'); button(tree, '选择 CSV 生成日报').props.onClick();
  f.value.project = { ...f.value.project, projectId: 'different-project' }; f.value.workbench = { reports: [], captures: [], review: null };
  await button(ui.render(), '刷新').props.onClick(); tree = ui.render(); assert.equal(form(tree), null); assert.match(content(tree), /服务项目已变化/); assert.equal(f.writes.length, 1);
});

test('interrupted work resumes only on an explicit click with its original request identity', async t => {
  const f = await fixture(t); f.value.workbench.reports = [{ ...report, status: 'running' }]; f.value.workbench.captures = [{ ...capture, status: 'submitting' }, { ...capture, id: 'capture-2', status: 'adopting' }];
  const ui = await mount(t, f.url); let tree = ui.navigate('分身能力'); assert.equal(f.writes.length, 0);
  await button(tree, '核对并继续生成').props.onClick(); assert.deepEqual(f.writes[0].payload, { entry: report.entry, requestId: report.requestId });
  tree = ui.navigate('项目沉淀'); await button(tree, '核对并继续提交').props.onClick(); assert.deepEqual(f.writes[1].payload, { entry: capture.entry, requestId: capture.requestId });
  await button(ui.render(), '继续已确认的采纳').props.onClick(); assert.deepEqual(f.writes[2].payload, { id: 'capture-2', confirmation: 'adopt' });
});

test('an open file form is retired when the same project is rebound to another directory', async t => {
  const f = await fixture(t); const ui = await mount(t, f.url); let tree = ui.navigate('分身能力');
  button(tree, '选择 CSV 生成日报').props.onClick(); f.value.project = { ...f.value.project, cwd: '/tmp/rebound-project' };
  await button(ui.render(), '刷新').props.onClick(); tree = ui.render(); assert.equal(form(tree), null); assert.match(content(tree), /服务项目已变化/); assert.equal(f.writes.length, 0);
});

test('polling a changed project retires its open source selection and reopening uses only the new project entries', async t => {
  const f = await fixture(t);
  f.value.materials.entries = ['notes/shared.md'];
  f.value.materials.inventory.entries = [{ path: 'notes/shared.md', format: 'md', kind: 'candidate' }];
  const intervals = [], ui = await mount(t, f.url, { intervals }); let tree = ui.navigate('项目沉淀');
  button(tree, '选择来源').props.onClick(); tree = ui.render(); let modal = find(tree, node => node.type === 'native-modal');
  assert.equal(find(modal, node => node.type === 'input' && node.props.type === 'checkbox').props.checked, true);
  // Another owner window changes the binding while this source picker is open.
  f.value.project = { ...f.value.project, projectId: 'project-b', cwd: '/tmp/project-b', sessionId: 'session-b' }; f.value.revision++;
  f.value.materials.entries = ['notes/b-only.md']; f.value.materials.inventory.entries = [{ path: 'notes/shared.md', format: 'md', kind: 'candidate' }, { path: 'notes/b-only.md', format: 'md', kind: 'candidate' }];
  const poll = intervals.find(item => item.delay === 15000); assert.ok(poll); await poll.callback();
  for (let i = 0; i < 100 && !content(ui.render()).includes('专用会话：session-b'); i++) await new Promise(resolve => setTimeout(resolve, 5));
  tree = ui.render(); modal = find(tree, node => node.type === 'native-modal'); assert.match(content(modal), /服务项目已变化/); assert.equal(button(modal, '保存读取范围'), null); assert.equal(find(modal, node => node.type === 'input' && node.props.type === 'checkbox'), null); assert.equal(f.writes.length, 0);
  modal.props.onClose(); tree = ui.render(); assert.equal(find(tree, node => node.type === 'native-modal'), null);
  button(tree, '选择来源').props.onClick(); tree = ui.render(); modal = find(tree, node => node.type === 'native-modal');
  const selected = name => find(find(modal, node => node.type === 'label' && content(node).includes(name)), node => node.type === 'input').props.checked;
  assert.equal(selected('notes/shared.md'), false, 'same relative path in the new project must not inherit the old selection'); assert.equal(selected('notes/b-only.md'), true);
  await button(modal, '保存读取范围').props.onClick(); assert.equal(f.writes.length, 1); assert.deepEqual(f.writes[0], { action: 'select_sources', payload: { entries: ['notes/b-only.md'] }, expectedRevision: 41 });
});

test('archive buttons require explicit confirmation and retain a visible archive location', async t => {
  const f = await fixture(t, (body, state) => {
    assert.equal(body.action, 'archive_workbench');
    state.value.workbench[body.payload.kind] = state.value.workbench[body.payload.kind].filter(item => item.id !== body.payload.id);
    state.value.workbench.archive.counts[body.payload.kind]++;
  });
  f.value.workbench.reports = [report, { ...report, id: 'running-report', status: 'running' }]; f.value.workbench.captures = [{ ...capture, status: 'adopted', source: 'twin-project/context/captured/capture-1.md' }, { ...capture, id: 'pending-capture' }];
  f.value.materials.entries = ['twin-project/context/captured/capture-1.md'];
  f.value.workbench.archive = { root: '.agent-twin/workbench-archive', counts: { reports: 0, captures: 0 } };
  const ui = await mount(t, f.url); let tree = ui.navigate('分身能力');
  const reportRow = find(tree, node => node.props.key === report.id); assert.ok(button(reportRow, '归档记录')); assert.equal(button(find(tree, node => node.props.key === 'running-report'), '归档记录'), null);
  button(reportRow, '归档记录').props.onClick(); tree = ui.render(); assert.equal(f.writes.length, 0); assert.match(content(tree), /原文件.*保留/); assert.match(content(tree), /\.agent-twin\/workbench-archive\/reports/);
  await button(tree, '确认归档记录').props.onClick(); tree = ui.render(); assert.deepEqual(f.writes[0].payload, { kind: 'reports', id: report.id }); assert.equal(f.writes[0].expectedRevision, 40); assert.match(content(tree), /已归档.*1.*条/); assert.match(content(tree), /\.agent-twin\/workbench-archive\/reports/); assert.equal(find(tree, node => node.props.key === report.id), null);
  tree = ui.navigate('项目沉淀'); assert.equal(button(find(tree, node => node.props.key === 'pending-capture'), '归档记录'), null); button(find(tree, node => node.props.key === capture.id), '归档记录').props.onClick(); await button(ui.render(), '确认归档记录').props.onClick(); tree = ui.render(); assert.deepEqual(f.writes[1].payload, { kind: 'captures', id: capture.id }); assert.match(content(tree), /\.agent-twin\/workbench-archive\/captures/);
  button(tree, '选择来源').props.onClick(); tree = ui.render(); const savedSource = find(tree, node => node.type === 'label' && content(node).includes('twin-project/context/captured/capture-1.md')); assert.ok(savedSource, 'selected source remains manageable after its capture row is archived'); assert.equal(find(savedSource, node => node.type === 'input').props.checked, true);
});

test('UI actions execute real CSV and capture workflows and recover their on-disk history after service restart', async t => {
  const root = await fs.realpath(await fs.mkdtemp(join(tmpdir(), 'native-ui-workflow-')));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const cwd = join(root, 'project'), stateDir = join(root, 'state'); await fs.mkdir(cwd);
  await fs.writeFile(join(cwd, 'daily.csv'), 'date,orders,revenue,cost\n2026-10-22,4,12.50,3.20\n2026-10-22,1,0.20,0.10\ninvalid,2,8,4\n');
  const original = '# Completed work\n\nA project-specific result from this fixture.\n'; await fs.writeFile(join(cwd, 'notes.md'), original);
  let service = createTwinService({ stateDir });
  await service.command('configure_project', { projectId: 'test-project', sessionId: 'test-session', cwd, title: 'Test project', goal: 'Check the actual result', mechanism: 'Owner reviews the content' });
  const writes = [];
  const server = http.createServer(async (req, res) => {
    try {
      let result;
      if (req.method === 'POST') { let raw = ''; for await (const chunk of req) raw += chunk; const body = JSON.parse(raw); writes.push(body); result = await service.command(body.action, body.payload, { expectedRevision: body.expectedRevision }); }
      else result = await service.snapshot();
      res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(result));
    } catch (error) { res.statusCode = 400; res.end(JSON.stringify({ error: error.message })); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); t.after(() => new Promise(resolve => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}`, ui = await mount(t, url);
  let tree = ui.navigate('分身能力'); button(tree, '选择 CSV 生成日报').props.onClick(); await submit(ui.render(), { entry: 'daily.csv' });
  tree = ui.render(); assert.match(content(tree), /12.70/); assert.match(content(tree), /9.40/); button(tree, '查看日报').props.onClick(); tree = ui.render();
  const savedReport = (await service.snapshot()).workbench.reports[0];
  assert.equal(content(find(tree, node => node.type === 'pre')), await fs.readFile(join(cwd, savedReport.output), 'utf8'));
  find(tree, node => node.type === 'native-modal').props.onClose(); tree = ui.navigate('项目沉淀'); button(tree, '提交工作材料').props.onClick(); await submit(ui.render(), { entry: 'notes.md' });
  await button(ui.render(), '审阅材料').props.onClick(); tree = ui.render(); assert.equal(content(find(tree, node => node.type === 'pre')), original);
  await button(tree, '采纳为正式来源').props.onClick(); tree = ui.render();
  const savedCapture = (await service.snapshot()).workbench.captures[0]; assert.equal(savedCapture.status, 'adopted'); assert.match(await fs.readFile(join(cwd, savedCapture.source), 'utf8'), /A project-specific result/); assert.deepEqual((await service.snapshot()).materials.entries, []);
  ui.close(); service = createTwinService({ stateDir }); const restarted = await mount(t, url); tree = restarted.navigate('分身能力'); assert.match(content(tree), /12.70/); tree = restarted.navigate('项目沉淀'); assert.match(content(tree), new RegExp(savedCapture.source.replaceAll('.', '\\.'))); assert.equal(writes.length, 4); assert.equal((await service.snapshot()).workbench.review, null);
  // A full history must have a user-facing way to continue without deleting files.
  for (let i = 1; i < 32; i++) await service.command('run_daily_report', { entry: 'daily.csv', requestId: `capacity-report-${i}` });
  await button(restarted.render(), '刷新').props.onClick(); tree = restarted.navigate('分身能力'); button(tree, '选择 CSV 生成日报').props.onClick(); await submit(restarted.render(), { entry: 'daily.csv' });
  tree = restarted.render(); assert.match(content(tree), /full/); assert.equal((await service.snapshot()).workbench.reports.length, 32);
  await button(tree, '刷新').props.onClick(); tree = restarted.render(); find(tree, node => node.type === 'native-modal').props.onClose(); tree = restarted.render();
  button(find(tree, node => node.props.key === savedReport.id), '归档记录').props.onClick(); await button(restarted.render(), '确认归档记录').props.onClick(); tree = restarted.render();
  assert.equal((await service.snapshot()).workbench.reports.length, 31); assert.equal((await service.snapshot()).workbench.archive.counts.reports, 1); assert.equal((await fs.readdir(join(cwd, 'twin-project', 'outputs'))).length, 32); assert.match(content(tree), /已归档 1 条/);
  button(tree, '选择 CSV 生成日报').props.onClick(); await submit(restarted.render(), { entry: 'daily.csv' }); assert.equal((await service.snapshot()).workbench.reports.length, 32); assert.equal((await fs.readdir(join(cwd, 'twin-project', 'outputs'))).length, 33);
  await service.command('run_daily_report', { entry: savedReport.entry, requestId: savedReport.requestId }); assert.equal((await fs.readdir(join(cwd, 'twin-project', 'outputs'))).length, 33, 'replaying an archived request cannot make another file');
});
