/**
 * Public Cordis service (`ctx.get('agentTwin')`, `agentTwin` v0.6.3).
 * Exposes AI 分身 lifecycle, Scoped Twin querying, inbound event injection,
 * intra-project `scopePaths` controls, and semantic knowledge graph hooks.
 */
import { randomUUID } from 'node:crypto';
import {
  CHANNEL_PREFIX_MAP,
  DUTY_MODES,
  PERSON_MODES,
  RULE_KINDS,
  channelIdFromSelection,
  channelSelectionLabel,
  normalizePublicBaseUrl,
  normalizePublicLobbyConfig,
  sanitizeSurfaceText
} from '../shared/schema.js';
import { normalizeScopePaths } from './scanner.js';

export async function applyPublicLobbyPatch(store, patch = {}) {
  const input = patch && typeof patch === 'object' ? { ...patch } : {};
  if (input.publicBaseUrl !== undefined) {
    input.publicBaseUrl = normalizePublicBaseUrl(input.publicBaseUrl);
  }
  await store.updateState(st => {
    const validCaps = new Set((st.capabilities || []).map(c => c.id));
    const nextCfg = normalizePublicLobbyConfig(input, st.publicLobby);
    nextCfg.capIds = (nextCfg.capIds || []).filter(cid => validCaps.has(cid));
    st.publicLobby = nextCfg;
  }, { saveUndo: 'caps' });
  return store.getState().publicLobby;
}

export function createTwinService(runtime) {
  const {
    store,
    engine,
    channelManager,
    officialConnectors,
    guestServer,
    fullBloodRunner,
    graphProvider = null,
    registerKnowledgeProvider
  } = runtime;

  async function getStatus() {
    const snap = await store.buildViewSnapshot(guestServer?.getBaseUrl?.() || '');
    return {
      ...snap,
      fullBloodAvailable: Boolean(fullBloodRunner?.isAvailable?.())
    };
  }

  async function publishWorkspace({
    rootPath,
    projectName = '',
    brief = '',
    dutyMode,
    connectOfficialFeishu = false,
    botName = '工作分身',
    skipModelDistill = false
  }) {
    if (!rootPath) throw new Error('请选择或传入要发布为分身的本地项目目录');
    const existing = store.getState().mountedProjects || [];
    const mode = existing.length === 0 ? 'initial' : 'mount';

    const scan = await engine.startExtraction({
      rootPath,
      projectName,
      mode,
      brief,
      autoComplete: true,
      skipModelDistill
    });

    await store.updateState(st => {
      st.lifecycleStage = 'mature';
      st.scene = 'desk';
      if (DUTY_MODES.includes(dutyMode)) {
        st.dutyMode = dutyMode;
      }
    }, { saveUndo: 'caps' });

    let feishuConnect = null;
    if (connectOfficialFeishu && channelManager?.connectOfficialChannel) {
      try {
        feishuConnect = await channelManager.connectOfficialChannel('ch-feishu', { botName });
      } catch (err) {
        feishuConnect = { ok: false, error: err?.message || 'official_feishu_connect_failed' };
      }
    }

    const snap = await getStatus();
    return {
      ok: true,
      project: snap.mountedProjects.find(m => m.id === scan.projectId) || scan,
      capabilities: snap.capabilities.filter(c => c.projectId === scan.projectId),
      twinProfile: snap.twinProfile,
      dutyMode: snap.dutyMode,
      feishuConnect,
      status: snap
    };
  }

  async function grantAccess({
    name,
    role = '团队协作者',
    channel = '免装试用网页',
    bindMode = 'dm_pair',
    channelHandle = '',
    mode = 'confirm',
    days = 7,
    note = '',
    capIds
  }) {
    const cleanName = sanitizeSurfaceText(String(name || '').trim());
    if (!cleanName) throw new Error('请填写授权对象的称呼');

    const chId = channelIdFromSelection(channel);
    const normalizedMode = PERSON_MODES.includes(mode) ? mode : 'confirm';
    const normalizedBind = bindMode === 'group_allow' ? 'group_allow' : 'dm_pair';
    const safeDays = Number.isFinite(Number(days)) && Number(days) > 0
      ? Math.min(365, Math.round(Number(days)))
      : 7;

    const allEnabledCaps = store.getState().capabilities.filter(c => c.enabled).map(c => c.id);
    const caps = Array.isArray(capIds) && capIds.length > 0
      ? capIds.filter(Boolean)
      : allEnabledCaps.slice(0, 6);

    const personId = `p-${randomUUID().slice(0, 8)}`;
    const pairCode = (chId !== 'ch-web' && chId !== 'ch-wechat' && normalizedBind !== 'group_allow')
      ? store.nextPairCode(CHANNEL_PREFIX_MAP[chId] || 'TW')
      : '';
    const urlToken = chId === 'ch-web' ? `tok-${randomUUID().slice(0, 12)}` : '';
    const tones = ['amber', 'terra', 'sage', 'slate'];
    const avatarTone = tones[store.getState().people.length % tones.length];

    const personRecord = {
      id: personId,
      name: cleanName,
      role: sanitizeSurfaceText(String(role || '团队协作者').trim()) || '团队协作者',
      avatarTone,
      channel: channelSelectionLabel(chId),
      bindMode: normalizedBind,
      channelHandle: sanitizeSurfaceText(String(channelHandle || '').trim()),
      pairCode,
      urlToken,
      mode: normalizedMode,
      expiry: `剩 ${safeDays} 天试用`,
      expiresAt: Date.now() + safeDays * 24 * 60 * 60 * 1000,
      caps,
      digest: true,
      note: sanitizeSurfaceText(String(note || '').trim()),
      enabled: true,
      servedCount: 0,
      lastActive: '刚刚邀请',
      wechatBound: false
    };

    await store.updateState(st => {
      st.people.unshift(personRecord);
      if (st.lifecycleStage === 'cold') st.lifecycleStage = 'mature';
    }, { saveUndo: 'desk' });

    let guestUrl = '';
    if (chId === 'ch-web') {
      const base = guestServer?.getBaseUrl?.() || '';
      guestUrl = base ? `${base}/g/${encodeURIComponent(urlToken)}` : `/g/${encodeURIComponent(urlToken)}`;
    }

    let qr = null;
    if (chId === 'ch-wechat' && channelManager?.startWechatQrSession) {
      qr = await channelManager.startWechatQrSession(personId);
    }

    const latestPerson = store.getState().people.find(p => p.id === personId) || personRecord;
    return {
      person: latestPerson,
      guestUrl,
      qr
    };
  }

  function listInbox() {
    const s = store.getState();
    return {
      dutyMode: s.dutyMode,
      approvals: s.approvals || [],
      recentDeliveries: (s.deliveries || []).slice(0, 8)
    };
  }

  async function resolveApproval({
    approvalId,
    action = 'approve',
    draft,
    saveAsRule = false,
    ruleKind = '规矩',
    ruleText = ''
  }) {
    if (!approvalId) throw new Error('缺少 approvalId 参数');
    if (action === 'dismiss') {
      const existing = store.getState().approvals.find(a => a.id === approvalId);
      if (!existing) throw new Error('该待办草稿已处理或不存在');
      await store.updateState(st => {
        st.approvals = st.approvals.filter(a => a.id !== approvalId);
      }, { saveUndo: 'desk' });
      return { ok: true, action: 'dismissed', approvalId };
    }

    const currentItem = store.getState().approvals.find(a => a.id === approvalId);
    const approveRes = await engine.approveDraft(approvalId, draft);
    if (saveAsRule) {
      const normalizedKind = RULE_KINDS.includes(ruleKind) ? ruleKind : '规矩';
      const cleanRule = sanitizeSurfaceText(
        String(ruleText || (currentItem ? `同类问题（${currentItem.question.slice(0, 18)}）按已拍板口径回复` : '')).trim()
      );
      if (cleanRule) {
        await store.updateState(st => {
          if (!st.rules.some(r => r.text === cleanRule)) {
            st.rules.push({
              id: `r-ap-${randomUUID().slice(0, 6)}`,
              kind: normalizedKind,
              text: cleanRule
            });
          }
        }, { saveUndo: 'desk' });
      }
    }

    return {
      ok: true,
      action: 'approved',
      approvalId,
      statusLabel: approveRes.statusLabel,
      reply: approveRes.reply
    };
  }

  async function updateCapabilityScope(capId, scopePaths) {
    const normalized = normalizeScopePaths(scopePaths);
    await store.updateState(st => {
      const cap = st.capabilities.find(c => c.id === capId);
      if (!cap) throw new Error('未找到对应能力项');
      cap.scopePaths = normalized;
    }, { saveUndo: 'caps' });
    return { ok: true, capId, scopePaths: normalized };
  }

  async function configurePublicLobby(patch = {}) {
    await applyPublicLobbyPatch(store, patch);
    return getStatus();
  }

  return Object.freeze({
    version: '0.6.3',
    features: Object.freeze({
      fullBloodDshAgent: true,
      officialConnectors023: true,
      weixinIlink: true,
      toolViews: true,
      knowledgeProviderHook: true,
      streamingProgress: true,
      scopePathIsolation: true,
      semanticGraph: true,
      mobileOwnerApproval: true,
      publicTryLobby: true
    }),
    getStatus,
    publishWorkspace,
    grantAccess,
    listInbox,
    resolveApproval,
    updateCapabilityScope,
    configurePublicLobby,
    listGraphNodes: () => (graphProvider ? graphProvider.listNodes() : Promise.resolve([])),
    upsertGraphNodes: nodes => (graphProvider ? graphProvider.upsertNodes(nodes) : Promise.reject(new Error('Knowledge graph provider unavailable'))),
    submitInboundEvent: (channelId, event) => channelManager.handleExternalEvent(channelId, event),
    queryScopedTwin: ({ personId, question, sandboxOnly = true, onProgress = null }) =>
      engine.handleInboundMessage({ personId, question, sandboxOnly, onProgress }),
    probeOfficialConnectors: () =>
      officialConnectors ? officialConnectors.probeAll() : Promise.resolve({}),
    registerKnowledgeProvider: provider => registerKnowledgeProvider(provider)
  });
}
