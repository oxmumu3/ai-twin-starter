import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { chmod, mkdtemp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Context } from '@deepseek-ai/cordis';
import { mountTwinHost } from '../lib/host.js';
import { createKnowledgeGraphProvider } from '../lib/graph-provider.js';
import { makeApprovalShortCode, parseOwnerMobileCommand } from '../lib/owner-notifier.js';
import { materializeScopedWorkspace, matchesScopePaths, normalizeScopePaths } from '../lib/scanner.js';
import { createTwinService } from '../lib/service.js';
import { createTwinStore } from '../lib/store.js';

const PKG_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

function parseSseFrames(raw) {
  const frames = [];
  for (const block of String(raw || '').split(/\r?\n\r?\n/)) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    let event = 'message';
    let data = '';
    for (const line of trimmed.split(/\r?\n/)) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data += line.slice(5).trim();
    }
    if (data) frames.push({ event, data: JSON.parse(data) });
  }
  return frames;
}

test('P1-1: Guest SSE /api/guest/:token/ask-stream emits live progress + result and channels slow-turn ack fires once after delay', async t => {
  const root = await mkdtemp(join(tmpdir(), 'twin-v61-p11-'));
  const projDir = join(root, 'proj');
  await mkdir(join(projDir, 'docs'), { recursive: true });
  await writeFile(join(projDir, 'docs', 'metric.md'), '# ROI 口径\n\nD7 ROI 为净营收除以投放花费。\n', 'utf8');

  const fetchCalls = [];
  let allowFinishFast = false;
  const ctx = new Context();
  ctx.baseUrl = `file://${root}/`;
  const registeredRoutes = new Map();
  ctx.provide('connection', {
    fetch: {
      register(def) {
        registeredRoutes.set(def.path, def);
        return () => registeredRoutes.delete(def.path);
      }
    }
  });

  const runtime = await mountTwinHost(ctx, { guestPort: 0 }, {
    paths: { rootDir: join(root, 'twin-state'), dshHome: root, legacyCandidates: [] },
    ackDelayMs: 25,
    officialConnectors: false,
    graphProvider: false,
    ownerNotifier: false,
    fullBloodRunner: false,
    fetchImpl: async (url, init = {}) => {
      const u = String(url);
      fetchCalls.push({ url: u, body: init.body ? JSON.parse(init.body) : null });
      if (u.includes('tenant_access_token')) {
        return new Response(JSON.stringify({ code: 0, tenant_access_token: 't-slow-tok', expire: 7200 }), { status: 200 });
      }
      return new Response(JSON.stringify({ ok: true, code: 0 }), { status: 200 });
    },
    llmResponder: async () => {
      if (!allowFinishFast) {
        await new Promise(r => setTimeout(r, 70));
      }
      return '经过核对：D7 ROI 按净营收除以投放花费计算。';
    }
  });

  t.after(async () => {
    await runtime.dispose();
    await ctx.fiber.dispose();
    await rm(root, { recursive: true, force: true });
  });

  const scan = await runtime.engine.startExtraction({ rootPath: projDir, projectName: '增长看板', autoComplete: true, skipModelDistill: true });
  await runtime.store.updateState(st => { st.dutyMode = 'live'; });

  const service = createTwinService(runtime);
  const { person, guestUrl } = await service.grantAccess({
    name: '网页流式访客',
    channel: 'ch-web',
    mode: 'direct',
    capIds: scan.capabilities.map(c => c.id)
  });

  // 1) Cross-site rejection on /ask-stream
  const csrfRes = await fetch(`${guestUrl.replace('/g/', '/api/guest/')}/ask-stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' },
    body: JSON.stringify({ question: 'D7 ROI 怎么算？' })
  });
  assert.equal(csrfRes.status, 403);

  // 2) Live SSE progress + result
  allowFinishFast = true;
  const sseRes = await fetch(`${guestUrl.replace('/g/', '/api/guest/')}/ask-stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'D7 ROI 怎么算？' })
  });
  assert.equal(sseRes.status, 200);
  assert.ok((sseRes.headers.get('content-type') || '').includes('text/event-stream'));
  const frames = parseSseFrames(await sseRes.text());
  const progressFrames = frames.filter(f => f.event === 'progress');
  const resultFrame = frames.find(f => f.event === 'result');
  assert.ok(progressFrames.length >= 2, 'must emit auth & doc progress steps before final result');
  assert.equal(progressFrames[0].data.title, '核对身份与能力范围');
  assert.ok(resultFrame?.data?.ok);
  assert.equal(resultFrame.data.action, 'replied');
  assert.ok(resultFrame.data.reply.includes('D7 ROI'));

  // 3) Slow-turn ack fires ONLY when external turn takes > ackDelayMs (25ms)
  await runtime.channelManager.configureChannel('ch-feishu', { appId: 'cli_slow_1' }, { appSecret: 'sec_slow_1' });
  const fsGrant = await service.grantAccess({
    name: '慢查询同事',
    channel: 'ch-feishu',
    mode: 'direct',
    capIds: scan.capabilities.map(c => c.id)
  });
  await runtime.channelManager.handleExternalEvent('ch-feishu', {
    eventId: 'ev-pair-slow',
    senderId: 'ou_slow_1',
    chatId: 'oc_slow_1',
    chatType: 'dm',
    text: fsGrant.person.pairCode
  });

  fetchCalls.length = 0;
  allowFinishFast = false; // triggers 70ms > 25ms ackDelayMs
  const slowRes = await runtime.channelManager.handleExternalEvent('ch-feishu', {
    eventId: 'ev-slow-q1',
    senderId: 'ou_slow_1',
    chatId: 'oc_slow_1',
    chatType: 'dm',
    text: 'ROI 口径怎么核算？'
  });
  assert.equal(slowRes.action, 'replied');
  assert.equal(slowRes.ackSent, true);
  const feishuMsgsSlow = fetchCalls.filter(c => c.url.includes('open-apis/im/v1/messages'));
  assert.equal(feishuMsgsSlow.length, 2, 'must send 1 slow ack + 1 final answer');
  assert.ok(JSON.parse(feishuMsgsSlow[0].body.content).text.includes('正在只读核对'));

  // 4) Fast turn (< 25ms) must NOT send duplicate ack
  fetchCalls.length = 0;
  allowFinishFast = true;
  const fastRes = await runtime.channelManager.handleExternalEvent('ch-feishu', {
    eventId: 'ev-fast-q2',
    senderId: 'ou_slow_1',
    chatId: 'oc_slow_1',
    chatType: 'dm',
    text: '再确认一下 ROI 口径'
  });
  assert.equal(fastRes.ackSent, undefined);
  const feishuMsgsFast = fetchCalls.filter(c => c.url.includes('open-apis/im/v1/messages'));
  assert.equal(feishuMsgsFast.length, 1, 'fast turn must only send final answer');

  // Ensure toggle route works cleanly
  const actionRoute = registeredRoutes.get('/api/agent_twin/action');
  const toggleReq = new Request('http://127.0.0.1/api/agent_twin/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'set_ack_slow_turns', enabled: false })
  });
  const toggleJson = await (await actionRoute.fetch(toggleReq)).json();
  assert.equal(toggleJson.ok, true);
  assert.equal(toggleJson.view.ackSlowTurns, false);
  assert.equal(person.id.startsWith('p-'), true);
});

test('P1-2: scopePaths enforces intra-project directory/file physical isolation and traversal rejection', async t => {
  assert.deepEqual(
    normalizeScopePaths([' ./docs/ ', '../secrets', 'README.md', 'data/*.csv', '/scripts/']),
    ['docs/', 'README.md', 'data/*.csv', 'scripts/']
  );
  assert.equal(matchesScopePaths('docs/attribution.md', ['docs/', 'README.md']), true);
  assert.equal(matchesScopePaths('data/channel_weekly_metrics.csv', ['docs/', 'README.md']), false);
  assert.equal(matchesScopePaths('data/channel_weekly_metrics.csv', ['data/*.csv']), true);

  const root = await mkdtemp(join(tmpdir(), 'twin-v61-scope-'));
  const growthDemo = join(PKG_ROOT, 'examples', 'growth-bi-desk');
  const rootDir = join(root, 'twin-state');
  const store = createTwinStore({ rootDir, dshHome: root, legacyCandidates: [] });
  await store.init();
  t.after(() => rm(root, { recursive: true, force: true }));

  const docOnlyCap = {
    id: 'cap-docs-only',
    projectId: 'proj-growth',
    projectName: '增长工作区',
    enabled: true,
    scopePaths: ['README.md', 'docs/']
  };
  const dataCap = {
    id: 'cap-data-scripts',
    projectId: 'proj-growth',
    projectName: '增长工作区',
    enabled: true,
    scopePaths: ['data/', 'scripts/']
  };

  // External partner granted only docOnlyCap -> must NOT have data/ or scripts/
  const liSb = await materializeScopedWorkspace({
    rootDir,
    scopeKey: 'caller-li-partner',
    mountedProjects: [{ id: 'proj-growth', projectName: '增长工作区', rootPath: growthDemo }],
    capabilities: [docOnlyCap, dataCap],
    allowedCapIds: ['cap-docs-only']
  });
  assert.equal(existsSync(join(liSb.sandboxDir, 'README.md')), true);
  assert.equal(existsSync(join(liSb.sandboxDir, 'docs', 'attribution-and-roi-handbook.md')), true);
  assert.equal(existsSync(join(liSb.sandboxDir, 'data')), false, 'unauthorized data/ folder must not be materialized');
  assert.equal(existsSync(join(liSb.sandboxDir, 'scripts')), false, 'unauthorized scripts/ folder must not be materialized');

  // Internal lead granted both caps -> gets union of docs + data + safe scripts (still excluding .env & SQL)
  const minSb = await materializeScopedWorkspace({
    rootDir,
    scopeKey: 'caller-min-lead',
    mountedProjects: [{ id: 'proj-growth', projectName: '增长工作区', rootPath: growthDemo }],
    capabilities: [docOnlyCap, dataCap],
    allowedCapIds: ['cap-docs-only', 'cap-data-scripts']
  });
  assert.equal(existsSync(join(minSb.sandboxDir, 'data', 'channel_weekly_metrics.csv')), true);
  assert.deepEqual(await readdir(join(minSb.sandboxDir, 'scripts')), ['calc_roi_summary.py']);
});

test('P2-1: Built-in semantic knowledge graph provider discovers project graphs, filters by caller mode, expands 1-hop relations, and supports upsertNodes', async t => {
  const root = await mkdtemp(join(tmpdir(), 'twin-v61-graph-'));
  const growthDemo = join(PKG_ROOT, 'examples', 'growth-bi-desk');
  const store = createTwinStore({ rootDir: join(root, 'twin-state'), dshHome: root, legacyCandidates: [] });
  await store.init();
  t.after(() => rm(root, { recursive: true, force: true }));

  const graph = createKnowledgeGraphProvider({ store });
  const projId = 'proj-growth-demo';
  await store.updateState(st => {
    st.mountedProjects.push({ id: projId, projectName: '星云增长工作区', rootPath: growthDemo });
    st.capabilities.push({ id: 'cap-growth-1', projectId: projId, projectName: '星云增长工作区', enabled: true, scopePaths: [] });
  });

  const allNodes = await graph.listNodes();
  assert.ok(allNodes.length >= 5, 'must auto-load examples/growth-bi-desk/graph/growth-semantic-graph.json');

  // Query D7 净回本 ROI under summary mode -> expands 1-hop relations & marks policy.q1_agency_rebate with boundary hint
  const resSummary = await graph.query('D7 净回本 ROI 是怎么算的？', {
    person: { id: 'p-li', mode: 'summary' },
    activeCaps: ['cap-growth-1']
  });
  assert.ok(resSummary.length >= 1);
  assert.equal(resSummary[0].source, '语义知识图谱');
  assert.ok(resSummary[0].summary.includes('NetD7Revenue'));
  assert.ok(resSummary[0].summary.includes('2026-W03 IAP 延迟脉冲'));
  assert.ok(resSummary[0].summary.includes('边界提示'), 'restricted rebate node must emit boundary hint instead of content');
  assert.equal(resSummary[0].summary.includes('尚在法务与财务终审'), false);

  // Under confirm mode, direct query for rebate policy is allowed for draft preparation
  const resConfirm = await graph.query('Q1 返点政策怎么约定？', {
    person: { id: 'p-con', mode: 'confirm' },
    activeCaps: ['cap-growth-1']
  });
  assert.ok(resConfirm.some(r => r.nodeId === 'policy.q1_agency_rebate'));

  // Upsert custom owner graph node and verify query returns it
  const up = await graph.upsertNodes([{
    id: 'metric.organic_baseline',
    type: 'metric',
    title: '自然量基线比例',
    aliases: ['自然量占比'],
    summary: '新客自然新增占总新增比例通常维持在 28% 到 34% 之间。',
    allowedModes: ['direct', 'summary', 'confirm']
  }]);
  assert.equal(up.count, 1);
  const resCustom = await graph.query('目前自然量基线比例大概多少？', {
    person: { id: 'p-li', mode: 'summary' },
    activeCaps: ['cap-growth-1']
  });
  assert.ok(resCustom.some(r => r.nodeId === 'metric.organic_baseline'));
});

test('P2-2: Mobile Owner Push & Remote Feishu DM + opt-in dsh-wechat remote approval loop end-to-end', async t => {
  assert.deepEqual(parseOwnerMobileCommand('待办'), { kind: 'list', code: '', text: '' });
  assert.deepEqual(parseOwnerMobileCommand('批准 #A1B2'), { kind: 'approve', code: 'A1B2', text: '' });
  assert.deepEqual(parseOwnerMobileCommand('改 #a1b2：周四前发出最终方案'), { kind: 'edit', code: 'A1B2', text: '周四前发出最终方案' });
  assert.deepEqual(parseOwnerMobileCommand('记规矩 #A1B2：统一按 Q4 口径回复'), { kind: 'rule', code: 'A1B2', text: '统一按 Q4 口径回复' });
  assert.deepEqual(parseOwnerMobileCommand('忽略 #A1B2'), { kind: 'dismiss', code: 'A1B2', text: '' });
  assert.equal(parseOwnerMobileCommand('今天辛苦了，我自己在群里回一下'), null);

  const root = await mkdtemp(join(tmpdir(), 'twin-v61-mobile-'));
  const binDir = join(root, 'bin');
  await mkdir(binDir, { recursive: true });
  const cliLog = join(root, 'feishu-calls.jsonl');
  const larkMock = join(binDir, 'lark-cli');

  // Mock lark-cli emitting caller question AND later owner DM approval command
  await writeFile(larkMock, `#!/usr/bin/env node
import { appendFileSync } from 'node:fs';
const args = process.argv.slice(2);
appendFileSync(${JSON.stringify(cliLog)}, JSON.stringify(args) + '\\n');
if (args[0] === 'auth' && args[1] === 'status') {
  console.log(JSON.stringify({ appId: 'cli_mob_1', identities: { user: { available: true, verified: true, userName: '山哥', openId: 'ou_owner_mob' }, bot: { available: true } } }));
  process.exit(0);
}
if (args[0] === 'im') {
  console.log(JSON.stringify({ ok: true, message_id: 'om_sent_' + Date.now() }));
  process.exit(0);
}
process.exit(0);
`, 'utf8');
  await chmod(larkMock, 0o755);

  const projDir = join(root, 'proj');
  await mkdir(projDir, { recursive: true });
  await writeFile(join(projDir, 'README.md'), '# 代理商协同口径\n\n公开 ROI 基准线为 0.45。\n', 'utf8');

  const wechatPushCalls = [];
  const runtime = await mountTwinHost(new Context(), { guestPort: 0 }, {
    paths: { rootDir: join(root, 'twin-state'), dshHome: root, legacyCandidates: [] },
    skipGuestServer: true,
    fullBloodRunner: false,
    execFileImpl: async (cmd, args) => {
      if (String(cmd).includes('dsh-wechat') || args?.[0] === 'send') {
        wechatPushCalls.push({ cmd, args });
        return { stdout: 'ok', stderr: '' };
      }
      const { execFile } = await import('node:child_process');
      const { promisify } = await import('node:util');
      return promisify(execFile)(cmd, args, { encoding: 'utf8', timeout: 10_000 });
    }
  });
  // Recreate with mocked officialConnectors pointing to our larkMock script
  const { createOfficialConnectorsBridge } = await import('../lib/official-connectors.js');
  const mockedOfficial = createOfficialConnectorsBridge({
    paths: runtime.paths,
    larkCliPath: larkMock
  });
  await runtime.dispose();

  const ctx2 = new Context();
  ctx2.baseUrl = `file://${root}/`;
  const wechatLogs = [];
  const rt2 = await mountTwinHost(ctx2, { guestPort: 0 }, {
    paths: { rootDir: join(root, 'twin-state-2'), dshHome: root, legacyCandidates: [] },
    skipGuestServer: true,
    fullBloodRunner: false,
    officialConnectors: mockedOfficial,
    execFileImpl: async (cmd, args) => {
      wechatLogs.push({ cmd, args });
      return { stdout: 'sent', stderr: '' };
    }
  });

  t.after(async () => {
    await rt2.dispose();
    await ctx2.fiber.dispose();
    await rm(root, { recursive: true, force: true });
  });

  const scan = await rt2.engine.startExtraction({ rootPath: projDir, projectName: '增长协同', autoComplete: true, skipModelDistill: true });
  await rt2.store.updateState(st => {
    st.dutyMode = 'live';
    st.ownerNotify = { feishu: true, wechat: true };
    st.people.push({
      id: 'p-li-feishu',
      name: '外部代理李总',
      role: '渠道代理',
      channel: '飞书',
      externalSenderId: 'ou_li_ext',
      externalChatId: 'oc_li_dm',
      mode: 'confirm',
      expiry: '剩 7 天试用',
      expiresAt: Date.now() + 86400_000,
      caps: scan.capabilities.map(c => c.id),
      enabled: true
    });
  });

  // Directly simulate channel enabled in official_cli mode
  await rt2.store.updateState(st => {
    const fsCh = st.channels.find(c => c.id === 'ch-feishu');
    fsCh.connectionMode = 'official_cli';
    fsCh.configured = true;
    fsCh.enabled = true;
  });

  // External partner asks redline question -> creates #CODE approval & pushes to Feishu DM + dsh-wechat
  const resQ = await rt2.channelManager.handleExternalEvent('ch-feishu', {
    eventId: 'ev-li-1',
    senderId: 'ou_li_ext',
    chatId: 'oc_li_dm',
    chatType: 'dm',
    text: '能帮我确认报价和客户手机号明细吗？',
    replyContext: { messageId: 'om_li_1', chatId: 'oc_li_dm', openId: 'ou_li_ext' }
  });
  assert.equal(resQ.action, 'pending_approval');
  const code = resQ.shortCode || makeApprovalShortCode(resQ.approvalId);
  assert.equal(code.length, 4);
  assert.equal(wechatLogs.length, 1, 'dsh-wechat push must invoke when ownerNotify.wechat === true');
  assert.ok(wechatLogs[0].args[1].includes(`#${code}`));

  const { readFile } = await import('node:fs/promises');
  const feishuCliCallsBefore = (await readFile(cliLog, 'utf8')).trim().split('\n').map(l => JSON.parse(l));
  assert.ok(
    feishuCliCallsBefore.some(args => args.includes('+messages-send') && args.includes('ou_owner_mob') && args.some(a => a.includes(`#${code}`))),
    'owner Feishu DM must receive #CODE approval brief'
  );

  // Owner replies from phone in DM: `改 #CODE：经本人终审，暂按 2025-Q4 公开口径对接。`
  const ownerCmdRes = await rt2.channelManager.handleExternalEvent('ch-feishu', {
    eventId: 'ev-owner-dm-1',
    senderId: 'ou_owner_mob',
    chatId: 'oc_owner_dm',
    chatType: 'dm',
    isOwner: true,
    isOwnerDm: true,
    text: `改 #${code}：经本人终审，暂按 2025-Q4 公开口径对接。`,
    replyContext: { messageId: 'om_owner_1', chatId: 'oc_owner_dm', openId: 'ou_owner_mob' }
  });
  assert.equal(ownerCmdRes.action, 'owner_command_handled');
  assert.equal(ownerCmdRes.command, 'edit');
  assert.equal(rt2.store.getState().approvals.length, 0, 'approval must be cleared after phone command');
  assert.equal(rt2.store.getState().deliveries[0].summary.includes('2025-Q4'), true);

  const feishuCliCallsAfter = (await readFile(cliLog, 'utf8')).trim().split('\n').map(l => JSON.parse(l));
  assert.ok(
    feishuCliCallsAfter.some(args => args.includes('+messages-reply') && args.includes('om_li_1') && args.some(a => a.includes('2025-Q4'))),
    'approved custom reply must dispatch back to 外部代理李总 original Feishu message'
  );
  assert.ok(
    feishuCliCallsAfter.some(args => args.includes('om_owner_1') && args.some(a => a.includes('已按你的修改发出'))),
    'receipt confirmation must be sent back to owner phone'
  );

  // Owner message in a GROUP chat still records 15-min presence yield (no command side effects)
  const ownerGroupRes = await rt2.channelManager.handleExternalEvent('ch-feishu', {
    eventId: 'ev-owner-grp-1',
    senderId: 'ou_owner_mob',
    chatId: 'oc_team_grp',
    chatType: 'group',
    isOwner: true,
    text: '批准 #0000'
  });
  assert.equal(ownerGroupRes.action, 'owner_presence_recorded');
  assert.equal(rt2.engine.isOwnerPresentRecently('ch-feishu', 'oc_team_grp'), true);
});
