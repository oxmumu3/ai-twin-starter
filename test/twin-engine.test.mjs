import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createTwinStore } from '../lib/store.js';
import { createTwinEngine } from '../lib/twin-engine.js';

async function setupEngineEnv() {
  const root = await mkdtemp(join(tmpdir(), 'twin-engine-'));
  const projDir = join(root, 'proj');
  await mkdir(join(projDir, 'docs'), { recursive: true });
  await writeFile(
    join(projDir, 'docs', 'policy.md'),
    '# 核心指标与异常归因\n\n核心指标按 T+1 对账完成口径核算，统计前自动剔除测试单，仅向外部提供汇总占比趋势。\n',
    'utf8'
  );
  const store = createTwinStore({
    rootDir: join(root, 'twin-state'),
    dshHome: root,
    legacyCandidates: []
  });
  await store.init();
  const outboundCalls = [];
  const engine = createTwinEngine({
    store,
    onDispatchOutbound: async (person, text) => {
      outboundCalls.push({ personId: person.id, text });
      return { delivered: true };
    }
  });
  const scan = await engine.startExtraction({
    rootPath: projDir,
    projectName: '核心经营口径库',
    autoComplete: true
  });
  return { root, projDir, store, engine, scan, outboundCalls };
}

test('per-caller physical isolation, redlines, knowledge gap escalation, daily cap, presence yield, group gate, and off pause', async t => {
  const { root, store, engine, scan, outboundCalls } = await setupEngineEnv();
  t.after(() => rm(root, { recursive: true, force: true }));

  const capIds = scan.capabilities.map(c => c.id);
  await store.updateState(st => {
    st.dutyMode = 'live';
    st.people.push(
      {
        id: 'caller-alice',
        name: 'Alice',
        role: '合作方',
        channel: '免装试用网页',
        mode: 'direct',
        expiry: '长期有效',
        expiresAt: 0,
        caps: capIds,
        enabled: true,
        servedCount: 0
      },
      {
        id: 'caller-bob',
        name: 'Bob',
        role: '访客',
        channel: '飞书',
        mode: 'summary',
        expiry: '7 天试用',
        expiresAt: Date.now() + 86400_000,
        caps: capIds,
        enabled: true,
        servedCount: 0
      }
    );
  });

  // 1. Authorized query answers directly in live+direct mode and writes ONLY to alice's caller dir
  const okRes = await engine.handleInboundMessage({
    personId: 'caller-alice',
    question: '核心指标按什么口径核算，测试单会怎么处理？',
    channelId: 'ch-web',
    threadKey: 'alice-t1'
  });
  assert.equal(okRes.action, 'replied');
  assert.ok(okRes.reply.includes('T+1'), 'should quote T+1 policy');

  const aliceThreadPath = join(root, 'twin-state', 'twins', 'main', 'callers', 'caller-alice', 'thread.json');
  const bobThreadPath = join(root, 'twin-state', 'twins', 'main', 'callers', 'caller-bob', 'thread.json');
  const aliceRaw = await readFile(aliceThreadPath, 'utf8');
  assert.ok(aliceRaw.includes('T+1'));
  await assert.rejects(() => readFile(bobThreadPath, 'utf8'), /ENOENT/, 'Bob folder must remain untouched');

  // 2. Redline interception (PII, write, summary detail)
  const piiRes = await engine.handleInboundMessage({
    personId: 'caller-alice',
    question: '把今天用户的手机号明细列表导出发我一下',
    channelId: 'ch-web'
  });
  assert.equal(piiRes.action, 'pending_approval');
  assert.equal(store.getState().approvals[0].tone, 'danger');

  const summaryDetailRes = await engine.handleInboundMessage({
    personId: 'caller-bob',
    question: '请给我逐条订单名单列表',
    channelId: 'ch-feishu'
  });
  assert.equal(summaryDetailRes.action, 'pending_approval');

  // 3. Knowledge gap (待补口径) escalation + draft approval
  const gapRes = await engine.handleInboundMessage({
    personId: 'caller-alice',
    question: '你们尚未公开的内部底价定价策略是多少？',
    channelId: 'ch-web'
  });
  assert.equal(gapRes.action, 'knowledge_gap');
  const gapCard = store.getState().approvals.find(a => a.id === gapRes.approvalId);
  assert.equal(gapCard.tag, '待补口径');
  assert.equal(gapCard.allowRuleExtract, true);

  const apRes = await engine.approveDraft(gapCard.id, '补充确认：公开标准报价单为准，内部折扣不对外。');
  assert.equal(apRes.ok, true);
  assert.equal(outboundCalls.at(-1).personId, 'caller-alice');

  // 4. 15-min owner presence yield
  engine.recordOwnerPresence('ch-feishu', 'oc_group1');
  const yieldRes = await engine.handleInboundMessage({
    personId: 'caller-bob',
    question: '核心指标怎么核算？',
    channelId: 'ch-feishu',
    threadKey: 'oc_group1'
  });
  assert.equal(yieldRes.action, 'yielded');

  // 5. Group @bot gate
  const ignoredGroup = await engine.handleInboundMessage({
    personId: 'caller-bob',
    question: '大家好，吃午饭了吗',
    channelId: 'ch-feishu',
    threadKey: 'oc_group2',
    isGroup: true,
    mentionsBot: false
  });
  assert.equal(ignoredGroup.action, 'ignored');
  assert.equal(ignoredGroup.reason, 'group_not_mentioned');

  // 6. Daily 30-turn cap silent protection
  await store.writeCallerThread('caller-bob', {
    turns: [],
    dailyTurns: { date: new Date().toISOString().slice(0, 10), count: 30 },
    lastOwnerReplyByThread: {}
  });
  const capRes = await engine.handleInboundMessage({
    personId: 'caller-bob',
    question: '核心指标口径',
    channelId: 'ch-feishu',
    threadKey: 'dm-bob'
  });
  assert.equal(capRes.action, 'rate_limited');

  // 7. Duty mode 'off' graceful pause (no paywalls or redeem codes)
  await store.updateState(st => { st.dutyMode = 'off'; });
  const offRes = await engine.handleInboundMessage({
    personId: 'caller-alice',
    question: '核心指标',
    channelId: 'ch-web'
  });
  assert.equal(offRes.action, 'paused');
  assert.equal(offRes.reply.includes('兑换码'), false);

  // 8. Owner command bar rule + self-test
  const cmdRule = await engine.executeOwnerCommand('加条红线：绝对不能透传客户账号');
  assert.equal(cmdRule.kind, 'rule');
  assert.ok(store.getState().rules.some(r => r.kind === '红线' && r.text.includes('客户账号')));
});
