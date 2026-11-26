import test from 'node:test';
import assert from 'node:assert/strict';
import { chmod, lstat, mkdtemp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createTwinStore } from '../lib/store.js';
import { createTwinEngine } from '../lib/twin-engine.js';
import { createChannelManager } from '../lib/channels.js';
import { createOfficialConnectorsBridge } from '../lib/official-connectors.js';
import { createWeixinIlinkClient, validateWeixinBaseUrl } from '../lib/weixin-ilink.js';
import {
  collectHeadlessEvents,
  computePolicyDigest,
  createFullBloodTwinRunner,
  parseTwinDecision
} from '../lib/fullblood-runner.js';
import { materializeScopedWorkspace, scanProjectDirectory } from '../lib/scanner.js';
import { sanitizeSurfaceText } from '../shared/schema.js';

test('v6 scanner filters ISO telemetry dumps & dotdirs, preserves markdown tables, and materializes isolated 0700 Scoped Workspace', async t => {
  const root = await mkdtemp(join(tmpdir(), 'twin-v6-scan-'));
  const projDir = join(root, 'growth-proj');
  const stateRoot = join(root, 'twin-state');
  await mkdir(join(projDir, 'docs'), { recursive: true });
  await mkdir(join(projDir, 'data'), { recursive: true });
  await mkdir(join(projDir, 'scripts'), { recursive: true });
  await mkdir(join(projDir, '.agent', 'memory'), { recursive: true });
  await mkdir(join(projDir, '.claude'), { recursive: true });

  await writeFile(join(projDir, 'README.md'), '# 增长工作区\n\n核心手册。\n', 'utf8');
  await writeFile(join(projDir, 'docs', 'roi.md'), '# D7 ROI 口径\n\n| 渠道 | 目标 |\n| --- | --- |\n| 小红书 | 0.45 |\n', 'utf8');
  await writeFile(join(projDir, 'data', 'weekly.csv'), 'week,channel,spend\n2026-W01,xiaohongshu,42000\n', 'utf8');
  await writeFile(join(projDir, 'scripts', 'calc_roi.py'), 'print("ok")\n', 'utf8');
  await writeFile(join(projDir, '.env.production'), 'BI_SECRET=sk_live_NEVER_LEAK_1234\n', 'utf8');
  await writeFile(join(projDir, 'scripts', 'drop_users.sql'), 'DELETE FROM users;\n', 'utf8');
  await writeFile(join(projDir, '.agent', 'memory', 'private.md'), 'private agent state\n', 'utf8');
  await writeFile(join(projDir, '.claude', 'settings.json'), '{"secret":1}\n', 'utf8');
  await writeFile(join(projDir, '2026-11-23T10-00-00Z-abc123.json'), '{"schema_version":"1.0","event_id":"ev-1"}\n', 'utf8');
  await writeFile(join(projDir, 'telemetry_dump.json'), '{"schema_version":"2.0","event_id":"ev-2"}\n', 'utf8');
  await writeFile(join(projDir, 'debug.log'), 'noise log line\n', 'utf8');

  t.after(() => rm(root, { recursive: true, force: true }));

  const mdSample = '参考 /Users/shan/work/growth/roi.md 计算:\n\n| 渠道 | 值 |\n| --- | --- |\n| xhs | 0.49 |';
  const cleanedMd = sanitizeSurfaceText(mdSample);
  assert.ok(cleanedMd.includes('\n| 渠道 | 值 |'), 'sanitizeSurfaceText must preserve markdown tables/newlines');
  assert.equal(cleanedMd.includes('/Users/shan'), false);

  const scan = await scanProjectDirectory(projDir, { projectName: '增长工作区' });
  const titles = scan.snippets.map(s => s.title).join(' ');
  assert.equal(titles.includes('2026-11-23T10-00-00Z'), false);
  assert.equal(titles.includes('telemetry_dump'), false);
  assert.ok(scan.blockedSecretCount >= 1);
  assert.ok(scan.blockedWriteScriptCount >= 1);

  const { sandboxDir, linkedProjects } = await materializeScopedWorkspace({
    rootDir: stateRoot,
    scopeKey: 'caller-wangmin',
    mountedProjects: [{ id: scan.projectId, projectName: scan.projectName, rootPath: projDir }],
    capabilities: scan.capabilities
  });

  const sbStat = await lstat(sandboxDir);
  assert.equal(sbStat.mode & 0o777, 0o700);
  assert.equal(linkedProjects[0].linkedCount, 4, 'only README.md, docs/roi.md, data/weekly.csv, scripts/calc_roi.py symlinked');

  const topEntries = await readdir(sandboxDir);
  assert.equal(topEntries.includes('.env.production'), false);
  assert.equal(topEntries.includes('.agent'), false);
  assert.equal(topEntries.includes('.claude'), false);
  assert.equal(topEntries.includes('2026-11-23T10-00-00Z-abc123.json'), false);
  assert.equal(topEntries.includes('telemetry_dump.json'), false);
  const scriptEntries = await readdir(join(sandboxDir, 'scripts'));
  assert.deepEqual(scriptEntries, ['calc_roi.py']);
});

test('v6 weixin-ilink implements real QR SVG, scaned_but_redirect host switch, pollUpdates, -2 single retry & SSRF rejection', async () => {
  assert.throws(() => validateWeixinBaseUrl('http://ilinkai.weixin.qq.com'), /HTTPS/);
  assert.throws(() => validateWeixinBaseUrl('https://127.0.0.1:8443'), /SSRF|私网|内网/);

  const calls = [];
  let statusCheckCount = 0;
  let sendCount = 0;

  const client = createWeixinIlinkClient({
    baseUrl: 'https://ilinkai.weixin.qq.com',
    fetchImpl: async (url, init = {}) => {
      const u = String(url);
      calls.push({ url: u, headers: init.headers, body: init.body ? JSON.parse(init.body) : null });
      if (u.includes('get_bot_qrcode')) {
        return new Response(JSON.stringify({
          qrcode: 'qr-v6-1',
          qrcode_img_content: 'https://ilinkai.weixin.qq.com/dl/qr-v6-1'
        }), { status: 200 });
      }
      if (u.includes('get_qrcode_status')) {
        statusCheckCount += 1;
        if (statusCheckCount === 1) {
          return new Response(JSON.stringify({
            status: 'scaned_but_redirect',
            redirect_host: 'sz.ilinkai.weixin.qq.com'
          }), { status: 200 });
        }
        return new Response(JSON.stringify({
          status: 'confirmed',
          bot_token: 'wx-tok-live',
          baseurl: 'https://sz.ilinkai.weixin.qq.com',
          ilink_bot_id: 'bot-001',
          ilink_user_id: 'wxid-caller-7'
        }), { status: 200 });
      }
      if (u.includes('getupdates')) {
        return new Response(JSON.stringify({
          ret: 0,
          get_updates_buf: 'cursor-2',
          msgs: [{
            message_id: 'm-99',
            from_user_id: 'wxid-caller-7',
            context_token: 'ctx-expired',
            item_list: [{ type: 1, text_item: { text: '你好，查一下本周 ROI' } }]
          }]
        }), { status: 200 });
      }
      if (u.includes('sendmessage')) {
        sendCount += 1;
        if (sendCount === 1) {
          return new Response(JSON.stringify({ ret: -2, errmsg: 'context_token expired' }), { status: 200 });
        }
        return new Response(JSON.stringify({ ret: 0, message_id: 'wx-sent-2' }), { status: 200 });
      }
      return new Response('{}', { status: 200 });
    }
  });

  const qr = await client.getQr();
  assert.equal(qr.qrcode, 'qr-v6-1');
  assert.ok(qr.qrSvg.includes('<svg'));

  const s1 = await client.checkQr({ qrcode: 'qr-v6-1' });
  assert.equal(s1.status, 'scaned');

  const s2 = await client.checkQr({ qrcode: 'qr-v6-1' });
  assert.equal(s2.status, 'confirmed');
  assert.ok(calls.some(c => c.url.startsWith('https://sz.ilinkai.weixin.qq.com/ilink/bot/get_qrcode_status')), 'must switch checkQr host on redirect');
  assert.equal(s2.botToken, 'wx-tok-live');
  assert.equal(s2.baseUrl, 'https://sz.ilinkai.weixin.qq.com');

  const updates = await client.pollUpdates({ botToken: 'wx-tok-live', baseUrl: s2.baseUrl, cursor: 'cursor-1' });
  assert.equal(updates.cursor, 'cursor-2');
  assert.equal(updates.messages.length, 1);
  assert.equal(updates.messages[0].text, '你好，查一下本周 ROI');

  const sent = await client.sendText({
    botToken: 'wx-tok-live',
    baseUrl: s2.baseUrl,
    peerId: 'wxid-caller-7',
    contextToken: 'ctx-expired',
    text: '小红书 D7 ROI 为 0.49'
  });
  assert.equal(sent.delivered, true);
  assert.equal(sent.messageId, 'wx-sent-2');
  assert.equal(sendCount, 2, 'must retry once on -2 and strip stale context_token');
  assert.equal(calls[calls.length - 1].body.msg.context_token, undefined);
});

test('v6 official-connectors bridges 0.2.3 lark-cli stream, eventId dedup, owner yield, reply & wecom-cli', async t => {
  const root = await mkdtemp(join(tmpdir(), 'twin-v6-official-'));
  const binDir = join(root, 'bin');
  await mkdir(binDir, { recursive: true });
  const cliLog = join(root, 'cli-calls.jsonl');
  const larkMock = join(binDir, 'lark-cli');
  const wecomMock = join(binDir, 'wecom-cli');

  await writeFile(larkMock, `#!/usr/bin/env node
import { appendFileSync } from 'node:fs';
const args = process.argv.slice(2);
appendFileSync(${JSON.stringify(cliLog)}, JSON.stringify({ bin: 'lark', args }) + '\\n');
if (args[0] === 'auth' && args[1] === 'status') {
  console.log(JSON.stringify({ appId: 'cli_official_1', identities: { user: { available: true, verified: true, userName: '山哥', openId: 'ou_owner_1' }, bot: { available: true } } }));
  process.exit(0);
}
if (args[0] === 'event' && args[1] === 'consume') {
  process.stderr.write('[event] ready\\n');
  console.log(JSON.stringify({ header: { event_id: 'ev-msg-1' }, event: { sender: { sender_id: { open_id: 'ou_colleague_1' }, sender_type: 'user' }, message: { message_id: 'om_1', chat_id: 'oc_grp_1', chat_type: 'group', mentions: [{ key: '@_user_1' }], content: JSON.stringify({ text: '@_user_1 ROI 口径怎么算？' }) } } }));
  console.log(JSON.stringify({ header: { event_id: 'ev-msg-1' }, event: { sender: { sender_id: { open_id: 'ou_colleague_1' }, sender_type: 'user' }, message: { message_id: 'om_1', chat_id: 'oc_grp_1', chat_type: 'group', mentions: [{ key: '@_user_1' }], content: JSON.stringify({ text: '@_user_1 ROI 口径怎么算？' }) } } }));
  process.stdin.resume();
  process.stdin.on('end', () => process.exit(0));
  process.on('SIGTERM', () => process.exit(0));
} else if (args[0] === 'im') {
  console.log(JSON.stringify({ ok: true, message_id: 'om_reply_1' }));
  process.exit(0);
}
`, 'utf8');

  await writeFile(wecomMock, `#!/usr/bin/env node
import { appendFileSync } from 'node:fs';
const args = process.argv.slice(2);
appendFileSync(${JSON.stringify(cliLog)}, JSON.stringify({ bin: 'wecom', args }) + '\\n');
if (args[0] === 'auth' && args[1] === 'show') {
  console.log('Status: authorized\\nBot ID: wb_official_1');
  process.exit(0);
}
if (args[0] === 'identity' && args[1] === 'whoami') {
  console.log(JSON.stringify({ userid: 'wecom_owner_1' }));
  process.exit(0);
}
if (args[0] === 'message') {
  console.log(JSON.stringify({ errcode: 0 }));
  process.exit(0);
}
`, 'utf8');

  await chmod(larkMock, 0o755);
  await chmod(wecomMock, 0o755);

  const projDir = join(root, 'proj');
  await mkdir(join(projDir, 'docs'), { recursive: true });
  await writeFile(join(projDir, 'docs', 'roi.md'), '# ROI 口径\n\nROI 口径按 D7 净营收除以投放花费计算。\n', 'utf8');

  const store = createTwinStore({ rootDir: join(root, 'twin-state'), dshHome: root, legacyCandidates: [] });
  await store.init();
  const officialConnectors = createOfficialConnectorsBridge({
    paths: { rootDir: join(root, 'twin-state'), dshHome: root },
    larkCliPath: larkMock,
    wecomCliPath: wecomMock
  });

  let channels;
  const engine = createTwinEngine({
    store,
    onDispatchOutbound: (person, text, rc) => channels.sendOutbound(person, text, rc)
  });
  await engine.startExtraction({ rootPath: projDir, projectName: '增长', autoComplete: true });
  await store.updateState(st => {
    st.dutyMode = 'live';
    st.people.push({
      id: 'p-grp',
      name: '增长群',
      role: '协作群',
      channel: '飞书',
      bindMode: 'group_allow',
      channelHandle: 'oc_grp_1',
      mode: 'direct',
      expiry: '长期有效',
      expiresAt: 0,
      caps: st.capabilities.map(c => c.id),
      enabled: true
    });
  });

  channels = createChannelManager({ store, engine, officialConnectors });
  t.after(async () => {
    await channels.stopAll();
    await rm(root, { recursive: true, force: true });
  });

  const probes = await channels.probeOfficialConnectors();
  assert.equal(probes['ch-feishu'].connected, true);
  assert.equal(probes['ch-feishu'].userName, '山哥');
  assert.equal(probes['ch-wecom'].connected, true);

  const fsConn = await channels.connectOfficialChannel('ch-feishu', { botName: '增长分身' });
  assert.equal(fsConn.ok, true);
  assert.equal(fsConn.connectionMode, 'official_cli');

  // Wait briefly for mock lark-cli stream to emit duplicate ev-msg-1
  await new Promise(r => setTimeout(r, 250));
  const deliveries = store.getState().deliveries;
  const replies = deliveries.filter(d => d.personId === 'p-grp');
  assert.equal(replies.length, 1, 'duplicate event_id ev-msg-1 must be processed once');

  // Also test WeCom official outbound
  const wcConn = await channels.connectOfficialChannel('ch-wecom', { botName: '增长分身' });
  assert.equal(wcConn.ok, true);
  const wcSent = await officialConnectors.sendWecomMessage({
    replyContext: { chatId: 'wc-room-1' },
    text: '企微官方回执送达'
  });
  assert.equal(wcSent.delivered, true);
});

test('v6 fullblood-runner event collection, decision parsing, session reuse, policy invalidation & graph provider hook', async t => {
  const col = collectHeadlessEvents();
  col.consume({ type: 'session', sessionId: 'sess-full-1' });
  col.consume({ type: 'status', phase: 'step_start' });
  col.consume({ type: 'tool_call', callId: 'c1', tool: 'read', input: { file_path: 'data/channel_weekly_metrics.csv' } });
  col.consume({ type: 'final', sessionId: 'sess-full-1', text: '[[TWIN_DECISION:REDLINE|涉及未定稿返点]]\n未定稿返点政策需由负责人拍板。' });
  const finished = col.finish();
  assert.equal(finished.ok, true);
  assert.equal(finished.sessionId, 'sess-full-1');
  assert.equal(finished.traceSteps[0].title, '查阅授权文档');

  const parsed = parseTwinDecision(finished.text);
  assert.equal(parsed.decision, 'REDLINE');
  assert.equal(parsed.reason, '涉及未定稿返点');
  assert.ok(parsed.reply.includes('未定稿返点政策需由负责人拍板'));

  // Test full Engine -> Runner sessionId reuse & policyDigest invalidation
  const root = await mkdtemp(join(tmpdir(), 'twin-v6-runner-'));
  const projDir = join(root, 'proj');
  await mkdir(projDir, { recursive: true });
  await writeFile(join(projDir, 'README.md'), '# BI 口径\n\nD7 ROI 达标线为 0.45。\n', 'utf8');

  const store = createTwinStore({ rootDir: join(root, 'twin-state'), dshHome: root, legacyCandidates: [] });
  await store.init();

  const runnerCalls = [];
  const fullBloodRunner = createFullBloodTwinRunner({
    paths: store.paths,
    runnerOverride: {
      async runCallerTurn(args) {
        runnerCalls.push(args);
        if (args.question.includes('返点')) {
          return {
            decision: 'REDLINE',
            reason: '未定稿返点需本人确认',
            reply: 'Q1 返点政策尚在法务审定，已转请负责人拍板后统一回复你。',
            sessionId: args.sessionId || 'sess-caller-1',
            traceSteps: [{ title: '核对红线规则', detail: '命中负责人返点红线' }]
          };
        }
        return {
          decision: 'ANSWER',
          reason: '',
          reply: `核对真实文件后答复：达标线 0.45（外部参考=${args.externalKnowledge.length}）。`,
          sessionId: args.sessionId || 'sess-caller-1',
          traceSteps: [{ title: '查阅授权文档', detail: 'README.md' }]
        };
      }
    }
  });

  const engine = createTwinEngine({
    store,
    fullBloodRunner,
    knowledgeProviders: () => [{
      name: 'graph-test',
      async query(q) {
        return q.includes('图谱') ? [{ title: '语义图谱卡', summary: '图谱关联指标说明' }] : [];
      }
    }]
  });
  await engine.startExtraction({ rootPath: projDir, projectName: 'BI工作区', autoComplete: true, skipModelDistill: true });
  await store.updateState(st => {
    st.dutyMode = 'live';
    st.people.push({
      id: 'p-min',
      name: '王敏',
      role: '增长负责人',
      channel: '免装试用网页',
      mode: 'direct',
      expiry: '长期有效',
      expiresAt: 0,
      caps: st.capabilities.map(c => c.id),
      enabled: true
    });
  });

  t.after(() => rm(root, { recursive: true, force: true }));

  const r1 = await engine.handleInboundMessage({ personId: 'p-min', question: '请结合图谱说明达标线' });
  assert.equal(r1.action, 'replied');
  assert.ok(r1.reply.includes('外部参考=1'));
  assert.equal(runnerCalls[0].includeFullPolicy, true);

  // Second turn with unchanged rules should reuse sessionId & omit full policy
  const r2 = await engine.handleInboundMessage({ personId: 'p-min', question: '再确认一遍达标线' });
  assert.equal(r2.action, 'replied');
  assert.equal(runnerCalls[1].sessionId, 'sess-caller-1');
  assert.equal(runnerCalls[1].includeFullPolicy, false);

  // Owner adds a new redline rule -> policy digest changes -> re-sends full policy + semantic REDLINE escalates
  await engine.executeOwnerCommand('加条红线：未定稿返点政策先转我拍板');
  const r3 = await engine.handleInboundMessage({ personId: 'p-min', question: 'Q1 返点是多少？' });
  assert.equal(r3.action, 'pending_approval');
  assert.equal(runnerCalls[2].includeFullPolicy, true);
  assert.notEqual(
    computePolicyDigest({ twinProfile: {}, rules: store.getState().rules, mode: 'direct', activeCaps: [] }),
    computePolicyDigest({ twinProfile: {}, rules: [], mode: 'direct', activeCaps: [] })
  );

  // Per-caller serialization + graceful Path B fallback when full-blood CLI throws transiently
  const order = [];
  const flakyRunner = createFullBloodTwinRunner({
    paths: store.paths,
    runnerOverride: {
      async runCallerTurn(args) {
        order.push(`start:${args.question}`);
        if (args.question === 'SLOW') {
          await new Promise(r => setTimeout(r, 35));
          order.push('end:SLOW');
          return { decision: 'ANSWER', reason: '', reply: '慢问题答复', sessionId: 's-seq', traceSteps: [] };
        }
        order.push(`end:${args.question}`);
        throw new Error('simulated transient upstream 503');
      }
    }
  });
  const engine2 = createTwinEngine({ store, fullBloodRunner: flakyRunner });
  const [seqA, seqB] = await Promise.all([
    engine2.handleInboundMessage({ personId: 'p-min', question: 'SLOW' }),
    engine2.handleInboundMessage({ personId: 'p-min', question: 'BI 口径 达标线' })
  ]);
  assert.equal(seqA.action, 'replied');
  assert.equal(seqB.action, 'replied', 'transient full-blood error must fall back gracefully to Path B');
  assert.deepEqual(order.slice(0, 3), ['start:SLOW', 'end:SLOW', 'start:BI 口径 达标线']);
});
