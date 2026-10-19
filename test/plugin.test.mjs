import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const entry = new URL('../index.js', import.meta.url);

async function plugin() {
  await assert.doesNotReject(access(entry), 'The DSH starter adapter must exist');
  return import(entry);
}

async function fixture(t, options = {}) {
  const cwd = await realpath(await mkdtemp(join(tmpdir(), 'ai-twin-plugin-')));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const registered = [];
  let current = cwd;
  let policy = { mode: 'workspace-write', workspaceRoot: cwd };
  const directory = { get: () => current };
  const sandboxPolicy = { resolve: request => {
    assert.equal(request.session.id, 'synthetic-session');
    return policy;
  } };
  const ctx = {
    tools: { register: definition => registered.push(definition) },
    get: key => ({ workingDirectory: directory, sandboxPolicy })[key],
  };
  const agent = {
    id: 'synthetic-session',
    session: { id: 'synthetic-session', header: { cwd: '/stale-header-must-not-be-used' } },
    ctx: { get: key => ({ workingDirectory: directory, sandboxPolicy })[key] },
  };
  const { apply } = await plugin();
  await apply(ctx);
  assert.equal(registered.length, 1);
  return {
    cwd, ctx, agent, tool: registered[0],
    setDirectory: value => { current = value; },
    setPolicy: value => { policy = value; },
    execute: (args, exec = {}) => registered[0].execute(args, {
      agent, signal: new AbortController().signal, callId: 'synthetic-call', ...exec,
    }),
    ...options,
  };
}

test('starter exposes the host adapter before claiming installation support', async () => {
  const adapter = await plugin();
  assert.equal(typeof adapter.apply, 'function');
});

test('mount registers one tool with no path argument and creates no workspace', async t => {
  const f = await fixture(t);
  assert.equal(f.tool.name, 'agent_twin');
  assert.deepEqual(Object.keys(f.tool.parameters.properties), ['operation', 'entries', 'batchId', 'cards']);
  assert.deepEqual(f.tool.parameters.properties.operation.enum, [
    'init', 'status', 'runbook', 'distill_prepare', 'distill_apply', 'distill_status', 'distill_refresh', 'knowledge_read',
    'channel_probe', 'channel_status', 'channel_tick',
  ]);
  assert.deepEqual(await readdir(f.cwd), []);
});

test('init and status use the current host directory and remain disabled', async t => {
  const f = await fixture(t);
  const initialized = await f.execute({ operation: 'init' });
  assert.equal(initialized.initialized, true);
  assert.equal(initialized.enabled, false);
  assert.equal(initialized.ready, false);
  assert.ok(initialized.created.length > 0);
  const status = await f.execute({ operation: 'status' });
  assert.equal(status.directory, join(f.cwd, '.agent-twin'));
  assert.equal(status.initialized, true);
  assert.equal(status.enabled, false);
  assert.deepEqual(status.runtime, {
    connectorRegistered: false, schedulerRegistered: false, backgroundRunning: false,
  });
});

test('an existing starter is refused instead of overwritten', async t => {
  const f = await fixture(t);
  await f.execute({ operation: 'init' });
  await assert.rejects(f.execute({ operation: 'init' }), /exist|already|存在|覆盖/i);
});

test('runbook is available without claiming a background runtime', async t => {
  const f = await fixture(t);
  const result = await f.execute({ operation: 'runbook' });
  assert.equal(typeof result.text, 'string');
  assert.ok(result.text.length > 50);
  assert.deepEqual(await readdir(f.cwd), []);
});

test('no current agent or working directory fails without using the header', async t => {
  const f = await fixture(t);
  await assert.rejects(f.execute({ operation: 'init' }, { agent: undefined }), /session|agent|会话/i);
  f.agent.ctx.get = () => undefined;
  f.ctx.get = () => undefined;
  await assert.rejects(f.execute({ operation: 'init' }), /directory|目录/i);
  assert.deepEqual(await readdir(f.cwd), []);
});

test('a relative or missing projected directory is rejected', async t => {
  const f = await fixture(t);
  f.setDirectory('relative-project');
  await assert.rejects(f.execute({ operation: 'init' }), /absolute|directory|目录/i);
  f.setDirectory(undefined);
  await assert.rejects(f.execute({ operation: 'init' }), /absolute|directory|目录/i);
  assert.deepEqual(await readdir(f.cwd), []);
});

test('each call follows the committed current directory instead of a cached path', async t => {
  const f = await fixture(t);
  const next = await realpath(await mkdtemp(join(tmpdir(), 'ai-twin-moved-')));
  t.after(() => rm(next, { recursive: true, force: true }));
  f.setDirectory(next);
  f.setPolicy({ mode: 'workspace-write', workspaceRoot: next });
  const result = await f.execute({ operation: 'init' });
  assert.equal(result.directory, join(next, '.agent-twin'));
  assert.deepEqual(await readdir(f.cwd), []);
});

test('unknown operations and model-supplied paths cannot reach file writes', async t => {
  const f = await fixture(t);
  await assert.rejects(f.execute({ operation: 'start' }), /operation|enum|invalid|parameter/i);
  await assert.rejects(f.execute({ operation: 'init', cwd: '/tmp/foreign-project' }), /argument|parameter|cwd|field|operation/i);
  assert.deepEqual(await readdir(f.cwd), []);
});

test('an aborted tool call does not initialize files', async t => {
  const f = await fixture(t);
  const controller = new AbortController();
  controller.abort(new Error('synthetic cancellation'));
  await assert.rejects(f.execute({ operation: 'init' }, { signal: controller.signal }), /synthetic cancellation/);
  assert.deepEqual(await readdir(f.cwd), []);
});

test('init respects read-only and rejects missing or unknown sandbox policies', async t => {
  const f = await fixture(t);
  for (const policy of [{ mode: 'read-only', workspaceRoot: f.cwd }, undefined, { mode: 'unknown', workspaceRoot: f.cwd }]) {
    f.setPolicy(policy);
    await assert.rejects(f.execute({ operation: 'init' }), /policy|read-only|sandbox|策略|只读/i);
  }
  assert.deepEqual(await readdir(f.cwd), []);
  f.ctx.get = key => key === 'workingDirectory' ? { get: () => f.cwd } : undefined;
  f.agent.ctx.get = f.ctx.get;
  await assert.rejects(f.execute({ operation: 'init' }), /policy|sandbox|策略/i);
});

test('read operations remain available in read-only mode without changing files', async t => {
  const f = await fixture(t);
  f.setPolicy({ mode: 'read-only', workspaceRoot: f.cwd });
  const result = await f.execute({ operation: 'status' });
  assert.equal(result.initialized, false);
  const guide = await f.execute({ operation: 'runbook' });
  assert.ok(guide.text.length > 50);
  assert.deepEqual(await readdir(f.cwd), []);
});

test('workspace-write rejects current directories outside the policy root', async t => {
  const f = await fixture(t);
  f.setPolicy({ mode: 'workspace-write', workspaceRoot: join(f.cwd, 'foreign-root') });
  await assert.rejects(f.execute({ operation: 'init' }), /workspace|root|outside|sandbox|目录|范围/i);
  assert.deepEqual(await readdir(f.cwd), []);
  f.setPolicy({ mode: 'workspace-write' });
  await assert.rejects(f.execute({ operation: 'init' }), /workspace|root|policy|sandbox|目录|策略/i);
});

test('danger-full-access still writes only to the current host project', async t => {
  const f = await fixture(t);
  f.setPolicy({ mode: 'danger-full-access', workspaceRoot: '/unrelated-root' });
  const result = await f.execute({ operation: 'init' });
  assert.equal(result.directory, join(f.cwd, '.agent-twin'));
});

test('distillation prepares only explicit source files and applies source-backed cards', async t => {
  const f = await fixture(t);
  await f.execute({ operation: 'init' });
  await writeFile(join(f.cwd, 'notes.md'), 'Use a checklist before delivery.\nKeep evidence separate from conclusions.\n');
  await writeFile(join(f.cwd, 'not-selected.md'), 'UNSELECTED_PRIVATE_MARKER');
  const prepared = await f.execute({ operation: 'distill_prepare', entries: ['notes.md'] });
  assert.equal(prepared.prepared, true);
  assert.equal(prepared.materialized, false);
  assert.equal(prepared.sources.length, 1);
  assert.equal(prepared.sources[0].path, 'notes.md');
  assert.ok(prepared.sources[0].content.includes('Use a checklist'));
  assert.ok(!JSON.stringify(prepared).includes('UNSELECTED_PRIVATE_MARKER'));
  const applied = await f.execute({ operation: 'distill_apply', batchId: prepared.batchId, cards: [{
    id: 'delivery-evidence', kind: 'workflow', title: 'Delivery check',
    content: 'Use a checklist and keep evidence separate from conclusions.',
    when: 'Before delivery', limits: 'This records a documented workflow, not execution evidence.',
    sourceRefs: [{ sourceId: prepared.sources[0].sourceId, startLine: 1, endLine: 2 }], status: 'documented',
  }] });
  assert.equal(applied.materialized, true);
  assert.equal(applied.counts.total, 1);
  assert.equal(applied.counts.workflow, 1);
  assert.equal(typeof await f.execute({ operation: 'distill_status' }), 'object');
  assert.equal(typeof await f.execute({ operation: 'distill_refresh' }), 'object');
});

test('new writes cannot bypass the current sandbox policy', async t => {
  const f = await fixture(t);
  await f.execute({ operation: 'init' });
  f.setPolicy({ mode: 'read-only', workspaceRoot: f.cwd });
  for (const args of [
    { operation: 'distill_prepare', entries: ['notes.md'] },
    { operation: 'distill_apply', batchId: 'not-a-live-batch', cards: [] },
    { operation: 'channel_probe' }, { operation: 'channel_tick' },
  ]) {
    await assert.rejects(f.execute(args), /policy|read-only|sandbox/i);
  }
  for (const operation of ['distill_status', 'distill_refresh', 'knowledge_read', 'channel_status']) {
    assert.equal(typeof await f.execute({ operation }), 'object');
  }
});

test('operation-specific inputs reject secrets, paths, and attempts to enable sending', async t => {
  const f = await fixture(t);
  for (const args of [
    { operation: 'distill_prepare' },
    { operation: 'distill_apply', cards: [] },
    { operation: 'channel_probe', token: 'model-supplied-secret' },
    { operation: 'channel_tick', dryRun: false },
    { operation: 'channel_status', entries: ['notes.md'] },
    { operation: 'init', batchId: 'unexpected' },
  ]) {
    await assert.rejects(f.execute(args), /argument|parameter|operation|entries|batchId|cards|token|dryRun/i);
  }
  assert.deepEqual(await readdir(f.cwd), []);
});

test('channel probe and dry-run tick without a local token remain blocked and never fetch', async t => {
  const f = await fixture(t);
  await f.execute({ operation: 'init' });
  const previous = process.env.AGENT_TWIN_SLACK_BOT_TOKEN;
  delete process.env.AGENT_TWIN_SLACK_BOT_TOKEN;
  t.after(() => {
    if (previous === undefined) delete process.env.AGENT_TWIN_SLACK_BOT_TOKEN;
    else process.env.AGENT_TWIN_SLACK_BOT_TOKEN = previous;
  });
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async () => { requests++; throw new Error('No real network allowed'); });
  for (const operation of ['channel_probe', 'channel_tick']) {
    const result = await f.execute({ operation });
    assert.equal(result.status, 'blocked');
    assert.equal(result.ready, false);
    assert.ok(!JSON.stringify(result).includes('model-supplied-secret'));
  }
  assert.equal(requests, 0);
});

test('Slack operation dispatch uses only the local token and read APIs without leaking inputs', async t => {
  const f = await fixture(t);
  await f.execute({ operation: 'init' });
  await writeFile(join(f.cwd, 'channel-rules.md'), 'Only serve verified members within the approved scope.\n');
  const prepared = await f.execute({ operation: 'distill_prepare', entries: ['channel-rules.md'] });
  await f.execute({ operation: 'distill_apply', batchId: prepared.batchId, cards: [{
    id: 'channel-scope', kind: 'workflow', title: 'Approved channel scope',
    content: 'Only serve verified members within the approved scope.',
    when: 'Before handling a channel request', limits: 'A routing plan is not a business execution receipt.',
    sourceRefs: [{ sourceId: prepared.sources[0].sourceId, startLine: 1, endLine: 1 }], status: 'documented',
  }] });
  const configPath = join(f.cwd, '.agent-twin/config.json');
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  Object.assign(config, {
    channel: 'slack', ownerId: 'UOWNER', ownerDestinationId: 'DOWNER',
    allowedChannelIds: ['CINBOX'], allowedDestinationIds: ['CINBOX', 'DOWNER'],
  });
  await writeFile(configPath, JSON.stringify(config));
  const policyPath = join(f.cwd, '.agent-twin/policy.json');
  const policy = JSON.parse(await readFile(policyPath, 'utf8'));
  policy.grants = [{ senderId: 'UTEAM', role: 'reader', scope: 'demo', actions: ['read'], destinationIds: ['CINBOX'] }];
  await writeFile(policyPath, JSON.stringify(policy));
  const previous = process.env.AGENT_TWIN_SLACK_BOT_TOKEN;
  const token = 'synthetic-runtime-only-token';
  process.env.AGENT_TWIN_SLACK_BOT_TOKEN = token;
  t.after(() => {
    if (previous === undefined) delete process.env.AGENT_TWIN_SLACK_BOT_TOKEN;
    else process.env.AGENT_TWIN_SLACK_BOT_TOKEN = previous;
  });
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (input, init) => {
    const url = new URL(input);
    assert.equal(url.origin, 'https://slack.com');
    assert.equal(init.method, 'POST');
    assert.ok(init.signal instanceof AbortSignal);
    const method = url.pathname.replace('/api/', '');
    requests.push(method);
    const parameters = new URLSearchParams(init.body);
    const channel = parameters.get('channel');
    let value;
    switch (method) {
      case 'auth.test': value = { ok: true, team_id: 'TTEST', user_id: 'UBOT', bot_id: 'BTEST' }; break;
      case 'users.info': value = { ok: true, user: { id: 'UOWNER', team_id: 'TTEST', is_bot: false, deleted: false } }; break;
      case 'conversations.info': value = { ok: true, channel: channel === 'DOWNER'
        ? { id: 'DOWNER', is_im: true, user: 'UOWNER' }
        : { id: 'CINBOX', is_channel: true, is_member: true, is_archived: false } }; break;
      case 'conversations.members': value = { ok: true, members: channel === 'DOWNER' ? ['UBOT', 'UOWNER'] : ['UBOT', 'UOWNER', 'UTEAM'], response_metadata: { next_cursor: '' } }; break;
      case 'conversations.history': value = { ok: true, messages: [{ type: 'message', user: 'UTEAM', ts: '1720000000.000001', text: JSON.stringify({ scope: 'demo', action: 'read', destinationId: 'CINBOX', note: 'SYNTHETIC_PRIVATE_MESSAGE' }) }], has_more: false }; break;
      default: assert.fail(`Unexpected Slack API: ${method}`);
    }
    return new Response(JSON.stringify(value), { status: 200, headers: { 'content-type': 'application/json' } });
  });
  const probe = await f.execute({ operation: 'channel_probe' });
  assert.equal(probe.status, 'verified');
  assert.equal(probe.ready, false);
  const tick = await f.execute({ operation: 'channel_tick' });
  assert.equal(tick.ready, false);
  assert.equal(tick.counts.allowed_dry_run, 1);
  assert.deepEqual(tick.ledgerEntries[0].knowledgeRefs.cardIds, ['channel-scope']);
  assert.ok(requests.includes('conversations.history'));
  assert.ok(requests.every(method => ['auth.test', 'users.info', 'conversations.info', 'conversations.members', 'conversations.history'].includes(method)));
  assert.ok(!JSON.stringify({ probe, tick }).includes(token));
  assert.ok(!JSON.stringify({ probe, tick }).includes('SYNTHETIC_PRIVATE_MESSAGE'));
});

test('knowledge_read uses the actual example and excludes candidates and changed-source cards', async t => {
  const f = await fixture(t);
  await f.execute({ operation: 'init' });
  const example = await readFile(new URL('../examples/synthetic-operations/sources/request-workflow.md', import.meta.url), 'utf8');
  await writeFile(join(f.cwd, 'request-workflow.md'), example);
  const prepared = await f.execute({ operation: 'distill_prepare', entries: ['request-workflow.md'] });
  const base = {
    kind: 'workflow', title: '核实范围后交付',
    content: '先核实身份与范围，查定义并核对数字；原获准线程交付，发送不明时先核对。',
    when: '获准成员提出数据请求时', limits: '未知身份或范围冲突交本人；API成功不是已读证明。',
    sourceRefs: [{ sourceId: prepared.sources[0].sourceId, startLine: 3, endLine: 7 }],
  };
  await f.execute({ operation: 'distill_apply', batchId: prepared.batchId, cards: [
    { ...base, id: 'verified-request-workflow', status: 'documented' },
    { ...base, id: 'pending-request-workflow', status: 'candidate' },
  ] });
  f.setPolicy({ mode: 'read-only', workspaceRoot: f.cwd });
  const knowledge = await f.execute({ operation: 'knowledge_read' });
  assert.equal(knowledge.materialized, true);
  assert.deepEqual(knowledge.cards.map(card => card.id), ['verified-request-workflow']);
  assert.equal(knowledge.cards[0].privacy, 'private');
  await writeFile(join(f.cwd, 'request-workflow.md'), `${example}\n来源更新：这项流程需要重新提炼。\n`);
  const changed = await f.execute({ operation: 'knowledge_read' });
  assert.deepEqual(changed.cards, []);
  assert.ok(changed.staleCardIds.includes('verified-request-workflow'));
});
