import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createTwinStore } from '../lib/store.js';
import { createTwinEngine } from '../lib/twin-engine.js';
import { createGuestServer } from '../lib/guest-server.js';
import { createChannelManager, validateWeixinBaseUrl } from '../lib/channels.js';

function makeMockWsClass(sentFrames) {
  return class MockWebSocket {
    constructor(url) {
      this.url = url;
      this.readyState = 1;
      this.handlers = new Map();
      queueMicrotask(() => this.emit('open'));
    }
    on(event, fn) {
      if (!this.handlers.has(event)) this.handlers.set(event, []);
      this.handlers.get(event).push(fn);
    }
    send(payload) {
      sentFrames.push({ url: this.url, payload: JSON.parse(String(payload)) });
    }
    emit(event, data) {
      for (const fn of this.handlers.get(event) || []) fn(data);
    }
    close() {
      this.readyState = 3;
      this.emit('close');
    }
  };
}

test('validateWeixinBaseUrl blocks private/loopback/non-https SSRF URLs and allows official WeChat host', () => {
  assert.equal(validateWeixinBaseUrl('https://ilinkai.weixin.qq.com/qr'), 'https://ilinkai.weixin.qq.com');
  for (const bad of [
    'http://ilinkai.weixin.qq.com',
    'https://127.0.0.1:8080',
    'https://localhost/api',
    'https://10.0.0.5/api',
    'https://169.254.169.254/latest/meta-data',
    'https://evil.example.com/ilink',
    'not-a-url'
  ]) {
    assert.throws(() => validateWeixinBaseUrl(bad), /微信|HTTPS|SSRF|无效/);
  }
});

test('Guest HTTP Portal (/g/:token & /api/guest/:token/ask) + 5 local-first channels end-to-end', async t => {
  const root = await mkdtemp(join(tmpdir(), 'twin-chan-'));
  const projDir = join(root, 'proj');
  await mkdir(join(projDir, 'docs'), { recursive: true });
  await writeFile(
    join(projDir, 'docs', 'guide.md'),
    '# 试用说明\n\n项目指标按 T+1 对账口径生成汇总，外部分身不存储任何明文密钥。\n',
    'utf8'
  );

  const store = createTwinStore({ rootDir: join(root, 'twin-state'), dshHome: root, legacyCandidates: [] });
  await store.init();

  const fetchCalls = [];
  const wsFrames = [];
  const createdSockets = [];
  const MockWS = makeMockWsClass(wsFrames);
  const mockFetchImpl = async (url, init = {}) => {
    fetchCalls.push({ url: String(url), method: init.method || 'GET', body: init.body });
    if (String(url).includes('feishu.cn/open-apis/auth/v3/tenant_access_token/internal')) {
      return new Response(JSON.stringify({ code: 0, tenant_access_token: 't-feishu-ok', expire: 7200 }), { status: 200 });
    }
    if (String(url).includes('feishu.cn/callback/ws/endpoint')) {
      return new Response(JSON.stringify({ code: 0, data: { URL: 'wss://feishu.mock/ws' } }), { status: 200 });
    }
    if (String(url).includes('qyapi.weixin.qq.com/cgi-bin/gettoken')) {
      return new Response(JSON.stringify({ errcode: 0, access_token: 'wecom-corp-tok' }), { status: 200 });
    }
    if (String(url).includes('slack.com/api/apps.connections.open')) {
      return new Response(JSON.stringify({ ok: true, url: 'wss://slack.mock/socket' }), { status: 200 });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  let channels;
  const engine = createTwinEngine({
    store,
    onDispatchOutbound: (person, text) => channels.sendOutbound(person, text)
  });
  const scan = await engine.startExtraction({ rootPath: projDir, projectName: '项目指南', autoComplete: true });
  await store.updateState(st => { st.dutyMode = 'live'; });

  const guestServer = createGuestServer({
    port: 0,
    getState: () => store.getState(),
    readCallerThread: id => store.readCallerThread(id),
    allSecretValues: () => store.allSecretValues(),
    onGuestAsk: (person, q) => engine.handleInboundMessage({ personId: person.id, question: q, channelId: 'ch-web' })
  });
  const baseUrl = await guestServer.start();

  channels = createChannelManager({
    store,
    engine,
    guestServer,
    fetchImpl: mockFetchImpl,
    createWebSocket: url => {
      const ws = new MockWS(url);
      createdSockets.push(ws);
      return ws;
    }
  });
  await channels.start();

  t.after(async () => {
    await channels.stopAll();
    await guestServer.stop();
    await rm(root, { recursive: true, force: true });
  });

  // 1. Add Web guest + test real loopback HTTP portal
  const capIds = scan.capabilities.map(c => c.id);
  await store.updateState(st => {
    st.people.push(
      {
        id: 'p-web',
        name: '周先生<script>',
        role: '合作伙伴',
        channel: '免装试用网页',
        urlToken: 'tok-web-test-1',
        mode: 'direct',
        expiry: '7 天试用',
        expiresAt: Date.now() + 86400_000,
        caps: capIds,
        enabled: true
      },
      {
        id: 'p-wechat',
        name: '微信访客',
        role: '试点客户',
        channel: '个人微信',
        mode: 'direct',
        expiry: '7 天试用',
        expiresAt: Date.now() + 86400_000,
        caps: capIds,
        enabled: true
      },
      {
        id: 'p-feishu',
        name: '飞书同事',
        role: '同事',
        channel: '飞书',
        bindMode: 'dm_pair',
        pairCode: 'FS-7788',
        mode: 'direct',
        expiry: '长期有效',
        expiresAt: 0,
        caps: capIds,
        enabled: true
      },
      {
        id: 'p-wecom-group',
        name: '企微协作群',
        role: '客户群',
        channel: '企业微信',
        bindMode: 'group_allow',
        channelHandle: 'wr-wecom-99',
        mode: 'direct',
        expiry: '长期有效',
        expiresAt: 0,
        caps: capIds,
        enabled: true
      },
      {
        id: 'p-slack',
        name: 'Slack伙伴',
        role: '海外伙伴',
        channel: '合作方 Slack',
        bindMode: 'dm_pair',
        pairCode: 'SL-4455',
        mode: 'direct',
        expiry: '长期有效',
        expiresAt: 0,
        caps: capIds,
        enabled: true
      }
    );
  });

  const htmlRes = await fetch(`${baseUrl}/g/tok-web-test-1`);
  assert.equal(htmlRes.status, 200);
  const htmlText = await htmlRes.text();
  assert.ok(htmlText.includes('&lt;script&gt;'), 'must escape HTML in caller name');
  assert.equal(htmlText.includes('兑换码'), false);

  const askRes = await fetch(`${baseUrl}/api/guest/tok-web-test-1/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: '项目指标按什么口径生成汇总？' })
  });
  const askJson = await askRes.json();
  assert.equal(askRes.status, 200);
  assert.equal(askJson.ok, true);
  assert.equal(askJson.action, 'replied');
  assert.ok(askJson.reply.includes('T+1'));

  // Cross-site / 415 / 413 checks on Guest HTTP
  const csrfRes = await fetch(`${baseUrl}/api/guest/tok-web-test-1/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://attacker.example' },
    body: JSON.stringify({ question: 'hi' })
  });
  assert.equal(csrfRes.status, 403);
  const badTypeRes = await fetch(`${baseUrl}/api/guest/tok-web-test-1/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: 'hi'
  });
  assert.equal(badTypeRes.status, 415);

  // Paused HTML view when dutyMode is off
  await store.updateState(st => { st.dutyMode = 'off'; });
  const pausedHtml = await (await fetch(`${baseUrl}/g/tok-web-test-1`)).text();
  assert.ok(pausedHtml.includes('暂停对外值班'));
  await store.updateState(st => { st.dutyMode = 'live'; });

  // 2. WeChat 5-min QR + stranger block + 1-to-1 lock
  const qr = await channels.startWechatQrSession('p-wechat');
  assert.ok(qr.qrUrl.includes(qr.qrToken));
  const strangerWx = await channels.handleExternalEvent('ch-wechat', { senderId: 'wxid_stranger', text: '项目指标' });
  assert.equal(strangerWx.action, 'ignored');
  await channels.confirmWechatBind({ personId: 'p-wechat', wechatOpenId: 'wxid_vip_01', qrToken: qr.qrToken });
  const vipWx = await channels.handleExternalEvent('ch-wechat', { senderId: 'wxid_vip_01', chatId: 'wxid_vip_01', chatType: 'dm', text: '项目指标按什么口径？' });
  assert.equal(vipWx.action, 'replied');

  // 3. Feishu handshake + FS-7788 pairing + reply
  await channels.configureChannel('ch-feishu', { appId: 'cli_feishu_1', botName: '分身' }, { appSecret: 'sec_feishu_1' });
  const fsPair = await channels.handleExternalEvent('ch-feishu', { senderId: 'ou_fs_1', chatId: 'oc_dm_1', chatType: 'dm', text: 'FS-7788' });
  assert.equal(fsPair.action, 'paired');
  const fsAsk = await channels.handleExternalEvent('ch-feishu', { senderId: 'ou_fs_1', chatId: 'oc_dm_1', chatType: 'dm', text: '项目指标汇总怎么算' });
  assert.equal(fsAsk.action, 'replied');
  assert.ok(fetchCalls.some(c => c.url.includes('open-apis/im/v1/messages')));

  // 4. WeCom AI Bot WS subscribe + group @bot gating + reply
  await channels.configureChannel('ch-wecom', { wecomMode: 'aibot', appId: 'wb_bot_1' }, { appSecret: 'sec_wc_1' });
  await Promise.resolve();
  assert.ok(wsFrames.some(f => f.payload.cmd === 'aibot_subscribe'));
  const wcSocket = createdSockets.find(s => s.url.includes('work.weixin'));
  wcSocket.emit('message', JSON.stringify({
    cmd: 'aibot_msg_callback',
    headers: { req_id: 'req-wc-1' },
    body: { chatid: 'wr-wecom-99', chattype: 'group', from: { userid: 'u1' }, is_at_bot: true, text: { content: '项目指标口径' } }
  }));
  await new Promise(r => setTimeout(r, 30));
  assert.ok(wsFrames.some(f => f.payload.cmd === 'aibot_respond_msg'));

  // Also check WeCom CorpApp validation path
  await channels.configureChannel('ch-wecom', { wecomMode: 'corpapp', appId: 'ww_corp', agentId: '10002' }, { appSecret: 'sec_corp' });
  assert.ok(fetchCalls.some(c => c.url.includes('cgi-bin/gettoken')));

  // 5. Slack Socket Mode envelope_id ack + SL-4455 pairing
  await channels.configureChannel('ch-slack', { appId: 'xapp-1-abc' }, { appSecret: 'xoxb-1-xyz' });
  const slPair = await channels.handleExternalEvent('ch-slack', { senderId: 'U_SL_1', chatId: 'D_SL_1', chatType: 'dm', text: 'SL-4455' });
  assert.equal(slPair.action, 'paired');
  const slackSocket = createdSockets.find(s => s.url.includes('slack.mock'));
  slackSocket.emit('message', JSON.stringify({
    envelope_id: 'env-99',
    type: 'events_api',
    payload: { event: { user: 'U_SL_1', channel: 'D_SL_1', channel_type: 'im', text: '项目指标汇总怎么算', ts: '1.1' } }
  }));
  await new Promise(r => setTimeout(r, 30));
  assert.ok(wsFrames.some(f => f.payload.envelope_id === 'env-99'));
  assert.ok(fetchCalls.some(c => c.url.includes('chat.postMessage')));

  // 6. Regenerate invite & disconnectChannel wipes secrets
  const regen = await channels.regenerateInvite('p-slack');
  assert.notEqual(regen.pairCode, 'SL-4455');
  assert.equal(store.getState().people.find(p => p.id === 'p-slack').externalSenderId, '');

  await channels.disconnectChannel('ch-feishu');
  assert.equal(store.getSecrets()['ch-feishu'], undefined);
  assert.equal(store.getState().channels.find(c => c.id === 'ch-feishu').configured, false);
});
