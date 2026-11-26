/**
 * Authenticated local HTTP API routes (`/api/agent_twin/*`, Step 3)
 * enforcing same-origin CSRF checks, 415/413 body limits, secret redaction,
 * and Zero-Path Surface sanitization.
 */
import { randomUUID } from 'node:crypto';
import { basename, isAbsolute, resolve } from 'node:path';
import {
  CHANNEL_GUIDE_MAP,
  CHANNEL_PREFIX_MAP,
  DUTY_MODES,
  PERSON_MODES,
  RULE_KINDS,
  channelIdFromSelection,
  channelSelectionLabel,
  redactSecrets,
  sanitizeSurfaceText
} from '../shared/schema.js';
import { normalizeScopePaths, scanProjectDirectory } from './scanner.js';
import { applyPublicLobbyPatch } from './service.js';

const MAX_BODY_BYTES = 65536;
const CANDIDATE_SCAN_TTL_MS = 30_000;
const TEMP_WS_RE = /(?:test[-_]?workspace|\.(?:tmp|temp)\b|(?:^|[-_])(tmp|temp|fixture)[-_.]?)/i;

export function isCrossSiteWrite(request) {
  const secFetch = String(request.headers.get('sec-fetch-site') || '').toLowerCase();
  if (secFetch === 'cross-site') return true;
  const origin = request.headers.get('origin');
  if (origin !== null) {
    if (origin === 'null' || !origin.trim()) return true;
    try {
      const reqOrigin = new URL(request.url).origin;
      if (new URL(origin).origin !== reqOrigin) return true;
    } catch {
      return true;
    }
  }
  return false;
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

function sanitizeViewSnapshot(view) {
  if (!view || !view.extractionJob) return view;
  const { rootPath: _omitRoot, scanPayload: _omitScan, ...safeJob } = view.extractionJob;
  return { ...view, extractionJob: safeJob };
}

function computeExpiryMeta(rawExpiry) {
  const expiry = sanitizeSurfaceText(String(rawExpiry || '剩 7 天试用').trim()) || '剩 7 天试用';
  const daysMatch = expiry.match(/(\d+)\s*天/);
  const expiresAt = expiry.includes('长期')
    ? 0
    : Date.now() + (daysMatch ? Number(daysMatch[1]) : 7) * 24 * 60 * 60 * 1000;
  return { expiry, expiresAt };
}

async function listWorkspaceCandidates(ctx, candidatePaths, scanCache) {
  let wsList = [];
  let wsReg = null;
  try {
    wsReg = ctx?.get?.('workspaceRegistry', false) ?? ctx?.root?.get?.('workspaceRegistry', false);
  } catch {
    wsReg = null;
  }
  if (wsReg && typeof wsReg.list === 'function') {
    try {
      const raw = wsReg.list();
      if (Array.isArray(raw)) wsList = raw;
    } catch {
      wsList = [];
    }
  }
  const now = Date.now();
  const out = [];
  for (const item of wsList) {
    const rawPath = item?.rootPath || item?.path || item?.cwd || item?.directory;
    if (typeof rawPath !== 'string' || !isAbsolute(rawPath)) continue;
    const absPath = resolve(rawPath);
    const token = item?.id ? String(item.id) : `ws-${Buffer.from(absPath).toString('base64url').slice(0, 12)}`;
    candidatePaths.set(token, absPath);
    const rawLabel = String(item?.name || item?.title || basename(absPath) || '工作区项目');
    const isTempName = TEMP_WS_RE.test(rawLabel) || TEMP_WS_RE.test(basename(absPath));
    const isTempLocation = /(?:^|\/)(?:private\/)?(?:var\/folders|tmp)\//.test(absPath);
    const sortRank = isTempName ? 2 : isTempLocation ? 1 : 0;
    const isTempWorkspace = isTempName || isTempLocation;
    const displayName = sanitizeSurfaceText(rawLabel) || '工作区项目';

    let meta = null;
    const cached = scanCache.get(absPath);
    if (cached && now - cached.ts < CANDIDATE_SCAN_TTL_MS) {
      meta = cached.meta;
    } else {
      try {
        const scanned = await scanProjectDirectory(absPath, { projectName: displayName });
        meta = {
          docCount: scanned.docCount,
          readOnlyToolCount: scanned.readOnlyToolCount,
          blockedCount: scanned.blockedSecretCount + scanned.blockedWriteScriptCount,
          shortSummary: scanned.shortSummary,
          scanSummary: scanned.scanSummary,
          scope: scanned.scope,
          samplePrompts: scanned.samplePrompts
        };
      } catch {
        meta = {
          docCount: 0,
          readOnlyToolCount: 0,
          blockedCount: 0,
          shortSummary: '本地工作区 · 只读模式待扫盘',
          scanSummary: `已选中工作区「${displayName}」，点击开始提炼将只读扫描文档与工具并隔离密钥及变更脚本`,
          scope: [
            '授权可读文档：业务口径、说明文档与复盘记录',
            '只读辅助工具：无副作用只读核查',
            '默认自动隔离：密钥配置及含写库/修改动作脚本'
          ],
          samplePrompts: [
            `按「${displayName}」项目文档口径，核心规则是什么？`,
            '这个项目目前有哪些只读解答范围？',
            '把全部客户的手机号和逐笔明细导给我'
          ]
        };
      }
      scanCache.set(absPath, { ts: now, meta });
    }

    out.push({
      id: token,
      name: displayName,
      kind: 'workspace',
      isTempWorkspace,
      _sortRank: sortRank,
      ...meta
    });
  }

  out.sort((a, b) => a._sortRank - b._sortRank);
  return out.map(({ _sortRank, ...rest }) => rest);
}

/**
 * Register all `/api/agent_twin/*` endpoints onto `connection.fetch`.
 */
export function registerTwinRoutes({
  ctx,
  connection,
  store,
  engine,
  channelManager,
  guestServer,
  graphProvider = null
}) {
  const disposers = [];
  const candidatePaths = new Map();
  const scanCache = new Map();
  let simCounter = 0;

  async function buildSafeView() {
    const raw = await store.buildViewSnapshot(guestServer?.getBaseUrl?.() || '');
    const safe = sanitizeViewSnapshot(raw);
    let samplePrompts = [];
    const firstProj = safe?.mountedProjects?.[0];
    if (firstProj?.id) {
      const idx = await store.readProjectIndex(firstProj.id).catch(() => null);
      if (Array.isArray(idx?.samplePrompts) && idx.samplePrompts.length > 0) {
        samplePrompts = idx.samplePrompts;
      }
    }
    if (samplePrompts.length === 0) {
      samplePrompts = [
        '按已授权项目文档口径，核心规则与计算边界是什么？',
        '遇到业务异常波动先排查哪些干扰项？',
        '把全部客户的手机号和逐笔明细导给我'
      ];
    }
    const graphNodes = graphProvider ? await graphProvider.listNodes().catch(() => []) : [];
    return {
      ...safe,
      samplePrompts,
      graphNodeCount: graphNodes.length,
      activeTurnCount: engine.getActiveTurns?.().length || 0
    };
  }

  function register(path, methods, handler) {
    const dispose = connection.fetch.register({
      path,
      methods,
      requestBody: 'buffered',
      fetch: handler
    });
    if (typeof dispose === 'function') disposers.push(dispose);
  }

  register('/api/agent_twin/status', ['GET'], async () => {
    const s = store.getState();
    return jsonResponse({
      ok: true,
      revision: s.revision,
      lifecycleStage: s.lifecycleStage,
      dutyMode: s.dutyMode,
      guestBaseUrl: guestServer?.getBaseUrl?.() || '',
      activeChannels: s.channels.filter(c => c.enabled).map(c => c.id),
      mountedProjects: s.mountedProjects.length
    });
  });

  register('/api/agent_twin/view', ['GET'], async () => {
    const [view, projects] = await Promise.all([
      buildSafeView(),
      listWorkspaceCandidates(ctx, candidatePaths, scanCache)
    ]);
    return jsonResponse({
      ok: true,
      view,
      presets: engine.getPersonaPresets(),
      channelGuides: CHANNEL_GUIDE_MAP,
      projects
    });
  });

  register('/api/agent_twin/projects', ['GET'], async () => {
    return jsonResponse({
      ok: true,
      projects: await listWorkspaceCandidates(ctx, candidatePaths, scanCache)
    });
  });

  register('/api/agent_twin/action', ['POST'], async request => {
    if (isCrossSiteWrite(request)) {
      return jsonResponse({ ok: false, error: '拒绝跨站写入请求' }, 403);
    }
    const ctype = String(request.headers.get('content-type') || '').toLowerCase();
    if (!ctype.includes('application/json')) {
      return jsonResponse({ ok: false, error: 'Content-Type 必须为 application/json' }, 415);
    }
    const rawText = await request.text();
    if (Buffer.byteLength(rawText, 'utf8') > MAX_BODY_BYTES) {
      return jsonResponse({ ok: false, error: '请求体超过 64KB 上限' }, 413);
    }
    let body;
    try {
      body = rawText ? JSON.parse(rawText) : {};
    } catch {
      return jsonResponse({ ok: false, error: 'JSON 请求体格式无效' }, 400);
    }

    const action = String(body?.action || '').trim();
    if (!action) {
      return jsonResponse({ ok: false, error: '缺少 action 参数' }, 400);
    }

    try {
      let result = {};
      switch (action) {
        case 'start_extraction': {
          await listWorkspaceCandidates(ctx, candidatePaths, scanCache);
          const candidate = body.candidateId ? candidatePaths.get(String(body.candidateId)) : '';
          const rawRoot = candidate || String(body.rootPath || '').trim();
          if (!rawRoot || !isAbsolute(rawRoot)) {
            throw new Error('请先选择一个本机已有项目工作区或输入有效绝对目录');
          }
          result = await engine.startExtraction({
            rootPath: resolve(rawRoot),
            projectName: body.projectName,
            mode: body.mode || 'initial',
            brief: body.brief || '',
            ownerName: body.ownerName || '',
            autoComplete: Boolean(body.autoComplete)
          });
          break;
        }
        case 'fast_forward_extraction': {
          result = await engine.fastForwardExtraction();
          break;
        }
        case 'complete_extraction': {
          await engine.completeExtractionJob(body.scene || 'desk', { keepScene: Boolean(body.keepScene) });
          result = { completed: true };
          break;
        }
        case 'minimize_extraction': {
          await store.updateState(st => {
            st.scene = 'desk';
          });
          result = { minimized: true };
          break;
        }
        case 'switch_scene': {
          const scene = ['onboard', 'desk', 'people', 'caps'].includes(body.scene) ? body.scene : 'desk';
          await store.updateState(st => {
            st.scene = scene;
            if (body.onboardMode) st.onboardMode = body.onboardMode;
          });
          result = { scene };
          break;
        }
        case 'set_duty_mode': {
          if (!DUTY_MODES.includes(body.dutyMode)) throw new Error('不支持的值班模式');
          await store.updateState(st => {
            st.dutyMode = body.dutyMode;
          }, { saveUndo: 'desk' });
          result = { dutyMode: body.dutyMode };
          break;
        }
        case 'set_presence_yield': {
          await store.updateState(st => {
            st.presenceAutoYield = Boolean(body.enabled);
          }, { saveUndo: 'desk' });
          result = { presenceAutoYield: Boolean(body.enabled) };
          break;
        }
        case 'set_ack_slow_turns': {
          await store.updateState(st => {
            st.ackSlowTurns = Boolean(body.enabled);
          }, { saveUndo: 'caps' });
          result = { ackSlowTurns: Boolean(body.enabled) };
          break;
        }
        case 'set_owner_notify': {
          await store.updateState(st => {
            st.ownerNotify = {
              feishu: body.feishu !== undefined ? Boolean(body.feishu) : st.ownerNotify?.feishu !== false,
              wechat: body.wechat !== undefined ? Boolean(body.wechat) : Boolean(st.ownerNotify?.wechat)
            };
          }, { saveUndo: 'caps' });
          result = { ownerNotify: store.getState().ownerNotify };
          break;
        }
        case 'update_profile': {
          const nextName = sanitizeSurfaceText(String(body.name || '').trim());
          const nextIntro = sanitizeSurfaceText(String(body.intro || '').trim());
          if (!nextName) throw new Error('分身对外名称不能为空');
          await store.updateState(st => {
            st.twinProfile = {
              personaId: body.personaId || st.twinProfile?.personaId || 'advisor',
              name: nextName,
              intro: nextIntro || st.twinProfile?.intro || '依据项目文档与口径提供只读解答',
              draftReady: true,
              userEdited: true
            };
            if (DUTY_MODES.includes(body.dutyMode)) {
              st.dutyMode = body.dutyMode;
            }
          }, { saveUndo: 'desk' });
          result = { updated: true };
          break;
        }
        case 'approve_draft': {
          result = await engine.approveDraft(body.approvalId, body.customDraft ?? null);
          break;
        }
        case 'dismiss_approval': {
          await store.updateState(st => {
            st.approvals = st.approvals.filter(a => a.id !== body.approvalId);
          }, { saveUndo: 'desk' });
          result = { dismissed: body.approvalId };
          break;
        }
        case 'save_approval_as_rule': {
          const ruleText = sanitizeSurfaceText(String(body.ruleText || body.customDraft || '').trim());
          if (!ruleText) throw new Error('规矩内容不能为空');
          const kind = RULE_KINDS.includes(body.kind) ? body.kind : '规矩';
          const exists = store.getState().approvals.some(a => a.id === body.approvalId);
          if (exists) {
            await engine.approveDraft(body.approvalId, body.customDraft ?? null);
          }
          const ruleId = `r-${randomUUID().slice(0, 6)}`;
          await store.updateState(st => {
            st.rules.push({ id: ruleId, kind, text: ruleText });
          }, { saveUndo: 'desk' });
          result = { ruleId };
          break;
        }
        case 'run_command': {
          result = await engine.executeOwnerCommand(body.text);
          break;
        }
        case 'self_test': {
          result = await engine.handleInboundMessage({
            question: body.question,
            isOwnerSelfTest: true
          });
          break;
        }
        case 'caller_preview_ask': {
          result = await engine.handleInboundMessage({
            personId: body.personId,
            question: body.question,
            channelId: 'ch-web',
            sandboxOnly: true
          });
          break;
        }
        case 'undo_desk': {
          result = { undone: await store.undoDesk() };
          break;
        }
        case 'undo_caps': {
          result = { undone: await store.undoCaps() };
          break;
        }
        case 'add_person': {
          const name = sanitizeSurfaceText(String(body.name || '').trim());
          if (!name) throw new Error('请填写服务对象称呼');
          const chId = channelIdFromSelection(body.channel);
          const mode = PERSON_MODES.includes(body.mode) ? body.mode : 'confirm';
          const { expiry, expiresAt } = computeExpiryMeta(body.expiry || '剩 7 天试用');
          const allCaps = store.getState().capabilities.filter(c => c.enabled).map(c => c.id);
          const requestedCaps = Array.isArray(body.caps) && body.caps.length ? body.caps : allCaps.slice(0, 3);
          const personId = `p-${randomUUID().slice(0, 8)}`;
          const bindMode = body.bindMode === 'group_allow' ? 'group_allow' : 'dm_pair';
          const pairCode = (chId !== 'ch-web' && chId !== 'ch-wechat' && bindMode !== 'group_allow')
            ? store.nextPairCode(CHANNEL_PREFIX_MAP[chId] || 'TW')
            : '';
          const urlToken = chId === 'ch-web' ? `tok-${randomUUID().slice(0, 12)}` : '';
          const tones = ['amber', 'terra', 'sage', 'slate'];
          const avatarTone = tones[store.getState().people.length % tones.length];

          const personRecord = {
            id: personId,
            name,
            role: sanitizeSurfaceText(String(body.role || '外部试用对象').trim()) || '外部试用对象',
            avatarTone,
            channel: channelSelectionLabel(chId),
            bindMode,
            channelHandle: sanitizeSurfaceText(String(body.channelHandle || '').trim()),
            pairCode,
            urlToken,
            mode,
            expiry,
            expiresAt,
            caps: requestedCaps,
            digest: body.digest !== false,
            note: sanitizeSurfaceText(String(body.note || '').trim()),
            enabled: body.enabled !== false,
            servedCount: 0,
            lastActive: '刚刚邀请',
            wechatBound: false
          };

          await store.updateState(st => {
            st.people.unshift(personRecord);
          }, { saveUndo: 'desk' });

          let qr = null;
          if (chId === 'ch-wechat') {
            qr = await channelManager.startWechatQrSession(personId);
          }
          result = { person: personRecord, qr };
          break;
        }
        case 'update_person': {
          const personId = String(body.personId || '').trim();
          const current = store.getState().people.find(x => x.id === personId);
          if (!current) throw new Error('未找到该服务对象');

          const name = sanitizeSurfaceText(String(body.name || current.name).trim());
          if (!name) throw new Error('服务对象称呼不能为空');
          const chId = body.channel ? channelIdFromSelection(body.channel) : channelIdFromSelection(current.channel);
          const mode = PERSON_MODES.includes(body.mode) ? body.mode : current.mode;
          const { expiry, expiresAt } = body.expiry
            ? computeExpiryMeta(body.expiry)
            : { expiry: current.expiry, expiresAt: current.expiresAt };
          const bindMode = body.bindMode === 'group_allow' ? 'group_allow' : 'dm_pair';

          let pairCode = current.pairCode || '';
          if (chId !== 'ch-web' && chId !== 'ch-wechat' && bindMode !== 'group_allow') {
            if (!pairCode || channelIdFromSelection(current.channel) !== chId) {
              pairCode = store.nextPairCode(CHANNEL_PREFIX_MAP[chId] || 'TW');
            }
          } else {
            pairCode = '';
          }
          const urlToken = current.urlToken || (chId === 'ch-web' ? `tok-${randomUUID().slice(0, 12)}` : '');

          let updatedPerson = null;
          await store.updateState(st => {
            const p = st.people.find(x => x.id === personId);
            if (!p) throw new Error('未找到该服务对象');
            p.name = name;
            p.role = sanitizeSurfaceText(String(body.role ?? p.role).trim()) || '外部试用对象';
            p.channel = channelSelectionLabel(chId);
            p.bindMode = bindMode;
            p.channelHandle = sanitizeSurfaceText(String(body.channelHandle ?? p.channelHandle).trim());
            p.pairCode = pairCode;
            p.urlToken = urlToken;
            p.mode = mode;
            p.expiry = expiry;
            p.expiresAt = expiresAt;
            if (Array.isArray(body.caps)) p.caps = body.caps.filter(Boolean);
            if (typeof body.digest === 'boolean') p.digest = body.digest;
            if (typeof body.note === 'string') p.note = sanitizeSurfaceText(body.note.trim());
            if (typeof body.enabled === 'boolean') p.enabled = body.enabled;
            updatedPerson = p;
          }, { saveUndo: 'desk' });

          let qr = null;
          if (chId === 'ch-wechat' && !updatedPerson?.wechatBound) {
            qr = await channelManager.startWechatQrSession(personId);
          }
          result = { person: updatedPerson, qr };
          break;
        }
        case 'update_person_note': {
          const personId = String(body.personId || '').trim();
          const note = sanitizeSurfaceText(String(body.note || '').trim());
          await store.updateState(st => {
            const p = st.people.find(x => x.id === personId);
            if (!p) throw new Error('未找到该服务对象');
            p.note = note;
          }, { saveUndo: 'desk' });
          result = { personId, note };
          break;
        }
        case 'simulate_inbound': {
          let stateSnap = store.getState();
          let target = body.personId
            ? stateSnap.people.find(p => p.id === body.personId)
            : stateSnap.people.find(p => p.enabled);

          if (!target) {
            const demoId = `p-demo-${randomUUID().slice(0, 6)}`;
            const activeCaps = stateSnap.capabilities.filter(c => c.enabled).map(c => c.id);
            target = {
              id: demoId,
              name: '合作方试跑代表',
              role: '外部试用伙伴',
              avatarTone: 'amber',
              channel: '免装试用网页',
              bindMode: 'dm_pair',
              channelHandle: '',
              pairCode: '',
              urlToken: `tok-${randomUUID().slice(0, 12)}`,
              mode: 'confirm',
              expiry: '剩 7 天试用',
              expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
              caps: activeCaps,
              digest: false,
              note: '',
              enabled: true,
              servedCount: 0,
              lastActive: '刚刚邀请',
              wechatBound: false
            };
            await store.updateState(st => {
              st.people.unshift(target);
            }, { saveUndo: 'desk' });
            stateSnap = store.getState();
          }

          let question = String(body.question || '').trim();
          if (!question) {
            simCounter += 1;
            const proj = stateSnap.mountedProjects?.[0];
            const idxData = proj?.id ? await store.readProjectIndex(proj.id).catch(() => null) : null;
            const basePrompts = Array.isArray(idxData?.samplePrompts) && idxData.samplePrompts.length > 0
              ? idxData.samplePrompts
              : [
                  `请问「${proj?.projectName || '本项目'}」的核心口径边界怎么统计？`,
                  `遇到「${proj?.projectName || '本项目'}」尚未公开的内部定价规则怎么处理？`,
                  '能帮我拉一下最近 20 笔用户的手机号和逐笔明细吗？'
                ];
            question = basePrompts[(simCounter - 1) % basePrompts.length];
          }

          const chId = channelIdFromSelection(target.channel);
          const inboundRes = await engine.handleInboundMessage({
            personId: target.id,
            question,
            channelId: chId,
            threadKey: target.id
          });
          await store.updateState(st => {
            if (st.lifecycleStage === 'cold') st.lifecycleStage = 'mature';
            st.scene = 'desk';
          });
          result = { ...inboundRes, personId: target.id, personName: target.name };
          break;
        }
        case 'toggle_person': {
          await store.updateState(st => {
            const p = st.people.find(x => x.id === body.personId);
            if (!p) throw new Error('未找到该服务对象');
            p.enabled = Boolean(body.enabled);
            p.expiry = p.enabled ? (p.expiry === '已暂停' ? '剩 7 天试用' : p.expiry) : '已暂停';
          }, { saveUndo: 'desk' });
          result = { personId: body.personId, enabled: Boolean(body.enabled) };
          break;
        }
        case 'update_person_caps': {
          if (!Array.isArray(body.caps)) throw new Error('能力白名单参数无效');
          await store.updateState(st => {
            const p = st.people.find(x => x.id === body.personId);
            if (!p) throw new Error('未找到该服务对象');
            p.caps = body.caps.filter(Boolean);
          }, { saveUndo: 'desk' });
          result = { personId: body.personId, caps: body.caps };
          break;
        }
        case 'update_person_mode': {
          if (!PERSON_MODES.includes(body.mode)) throw new Error('不支持的权限模式');
          await store.updateState(st => {
            const p = st.people.find(x => x.id === body.personId);
            if (!p) throw new Error('未找到该服务对象');
            p.mode = body.mode;
          }, { saveUndo: 'desk' });
          result = { personId: body.personId, mode: body.mode };
          break;
        }
        case 'regenerate_invite': {
          result = await channelManager.regenerateInvite(body.personId);
          break;
        }
        case 'issue_wechat_qr': {
          result = await channelManager.startWechatQrSession(body.personId || null);
          break;
        }
        case 'confirm_wechat_scan': {
          result = await channelManager.confirmWechatBind({
            personId: body.personId || null,
            wechatOpenId: body.wechatOpenId || `wxid_${randomUUID().slice(0, 8)}`,
            qrToken: body.qrToken
          });
          break;
        }
        case 'configure_channel': {
          result = await channelManager.configureChannel(
            body.channelId,
            {
              botName: body.botName,
              appId: body.appId,
              wecomMode: body.wecomMode,
              agentId: body.agentId,
              wsEndpoint: body.wsEndpoint
            },
            { appSecret: body.appSecret, agentId: body.agentId }
          );
          break;
        }
        case 'connect_official_channel': {
          result = await channelManager.connectOfficialChannel(body.channelId, {
            botName: body.botName,
            triggerAuth: Boolean(body.triggerAuth)
          });
          break;
        }
        case 'probe_official_connectors': {
          result = await channelManager.probeOfficialConnectors();
          break;
        }
        case 'toggle_channel': {
          result = await channelManager.toggleChannel(body.channelId, body.enabled);
          break;
        }
        case 'disconnect_channel': {
          result = await channelManager.disconnectChannel(body.channelId);
          break;
        }
        case 'toggle_capability': {
          await store.updateState(st => {
            const cap = st.capabilities.find(c => c.id === body.capId);
            if (!cap) throw new Error('未找到对应能力项');
            cap.enabled = Boolean(body.enabled);
          }, { saveUndo: 'caps' });
          result = { capId: body.capId, enabled: Boolean(body.enabled) };
          break;
        }
        case 'update_capability_scope': {
          const scopePaths = normalizeScopePaths(body.scopePaths);
          await store.updateState(st => {
            const cap = st.capabilities.find(c => c.id === body.capId);
            if (!cap) throw new Error('未找到对应能力项');
            cap.scopePaths = scopePaths;
          }, { saveUndo: 'caps' });
          result = { capId: body.capId, scopePaths };
          break;
        }
        case 'list_graph_nodes': {
          result = { nodes: graphProvider ? await graphProvider.listNodes() : [] };
          break;
        }
        case 'upsert_graph_nodes': {
          if (!graphProvider) throw new Error('当前运行时未启用语义知识图谱提供器');
          result = await graphProvider.upsertNodes(body.nodes || body.node);
          break;
        }
        case 'unmount_project': {
          await store.updateState(st => {
            const idx = st.mountedProjects.findIndex(m => m.id === body.projectId);
            if (idx === -1) throw new Error('未找到该已挂载项目');
            st.mountedProjects.splice(idx, 1);
            st.capabilities = st.capabilities.filter(c => c.projectId !== body.projectId);
            delete st.pendingDeltaByProject[body.projectId];
          }, { saveUndo: 'caps' });
          result = { unmounted: body.projectId };
          break;
        }
        case 'recheck_delta': {
          result = await engine.recheckProjectDelta(body.projectId);
          break;
        }
        case 'confirm_delta_upgrade': {
          result = await engine.confirmDeltaUpgrade(body.projectId);
          break;
        }
        case 'add_rule': {
          const text = sanitizeSurfaceText(String(body.text || '').trim());
          if (!text) throw new Error('规矩或红线内容不能为空');
          const kind = RULE_KINDS.includes(body.kind) ? body.kind : '规矩';
          const rule = { id: `r-${randomUUID().slice(0, 6)}`, kind, text };
          await store.updateState(st => {
            st.rules.push(rule);
          }, { saveUndo: 'caps' });
          result = { rule };
          break;
        }
        case 'edit_rule': {
          const text = sanitizeSurfaceText(String(body.text || '').trim());
          if (!text) throw new Error('内容不能为空');
          await store.updateState(st => {
            const r = st.rules.find(x => x.id === body.ruleId);
            if (!r) throw new Error('未找到该条规矩');
            if (RULE_KINDS.includes(body.kind)) r.kind = body.kind;
            r.text = text;
          }, { saveUndo: 'caps' });
          result = { ruleId: body.ruleId };
          break;
        }
        case 'delete_rule': {
          await store.updateState(st => {
            st.rules = st.rules.filter(x => x.id !== body.ruleId);
          }, { saveUndo: 'caps' });
          result = { deleted: body.ruleId };
          break;
        }
        case 'configure_public_lobby': {
          result = {
            publicLobby: await applyPublicLobbyPatch(store, body.publicLobby || body)
          };
          break;
        }
        default:
          return jsonResponse({ ok: false, error: `未知操作：${action}` }, 400);
      }

      const view = await buildSafeView();
      return jsonResponse({ ok: true, result, view });
    } catch (err) {
      const safeMessage = redactSecrets(err?.message || '操作失败', store.allSecretValues());
      return jsonResponse({ ok: false, error: safeMessage }, 400);
    }
  });

  return () => {
    for (const dispose of disposers.splice(0)) {
      try {
        dispose();
      } catch {
        // ignore disposer errors
      }
    }
  };
}
