/**
 * Authenticated local HTTP API routes (`/api/agent_twin/*`, Step 3)
 * enforcing same-origin CSRF checks, 415/413 body limits, secret redaction,
 * and Zero-Path Surface sanitization.
 */
import { randomUUID } from 'node:crypto';
import { isAbsolute, resolve } from 'node:path';
import {
  CHANNEL_GUIDE_MAP,
  CHANNEL_PREFIX_MAP,
  DUTY_MODES,
  PERSON_MODES,
  RULE_KINDS,
  channelIdFromSelection,
  redactSecrets,
  sanitizeSurfaceText
} from '../shared/schema.js';

const MAX_BODY_BYTES = 65536;

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
  const { rootPath: _omit, ...safeJob } = view.extractionJob;
  return { ...view, extractionJob: safeJob };
}

function listWorkspaceCandidates(ctx, candidatePaths) {
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
  const out = [];
  for (const item of wsList) {
    const rawPath = item?.rootPath || item?.path || item?.cwd || item?.directory;
    if (typeof rawPath !== 'string' || !isAbsolute(rawPath)) continue;
    const absPath = resolve(rawPath);
    const token = item?.id ? String(item.id) : `ws-${Buffer.from(absPath).toString('base64url').slice(0, 12)}`;
    candidatePaths.set(token, absPath);
    out.push({
      id: token,
      name: sanitizeSurfaceText(item?.name || item?.title || absPath.split('/').filter(Boolean).pop() || '工作区项目'),
      kind: 'workspace'
    });
  }
  return out;
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
  guestServer
}) {
  const disposers = [];
  const candidatePaths = new Map();

  async function buildSafeView() {
    const raw = await store.buildViewSnapshot(guestServer?.getBaseUrl?.() || '');
    return sanitizeViewSnapshot(raw);
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
    const view = await buildSafeView();
    return jsonResponse({
      ok: true,
      view,
      presets: engine.getPersonaPresets(),
      channelGuides: CHANNEL_GUIDE_MAP,
      projects: listWorkspaceCandidates(ctx, candidatePaths)
    });
  });

  register('/api/agent_twin/projects', ['GET'], async () => {
    return jsonResponse({
      ok: true,
      projects: listWorkspaceCandidates(ctx, candidatePaths)
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
          listWorkspaceCandidates(ctx, candidatePaths);
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
        case 'complete_extraction': {
          await engine.completeExtractionJob(body.scene || 'desk');
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
          const expiry = sanitizeSurfaceText(String(body.expiry || '7 天试用').trim()) || '7 天试用';
          const daysMatch = expiry.match(/(\d+)\s*天/);
          const expiresAt = expiry.includes('长期')
            ? 0
            : Date.now() + (daysMatch ? Number(daysMatch[1]) : 7) * 24 * 60 * 60 * 1000;
          const allCaps = store.getState().capabilities.filter(c => c.enabled).map(c => c.id);
          const requestedCaps = Array.isArray(body.caps) && body.caps.length ? body.caps : allCaps.slice(0, 3);
          const personId = `p-${randomUUID().slice(0, 8)}`;
          const bindMode = body.bindMode === 'group_allow' ? 'group_allow' : 'dm_pair';
          const pairCode = (chId !== 'ch-web' && chId !== 'ch-wechat' && bindMode !== 'group_allow')
            ? store.nextPairCode(CHANNEL_PREFIX_MAP[chId] || 'TW')
            : '';
          const urlToken = chId === 'ch-web' ? `tok-${randomUUID().slice(0, 12)}` : '';

          const personRecord = {
            id: personId,
            name,
            role: sanitizeSurfaceText(String(body.role || '外部试用对象').trim()) || '外部试用对象',
            channel: chId === 'ch-wechat' ? '个人微信'
              : chId === 'ch-feishu' ? '飞书'
                : chId === 'ch-wecom' ? '企业微信'
                  : chId === 'ch-slack' ? '合作方 Slack'
                    : '免装试用网页',
            bindMode,
            channelHandle: sanitizeSurfaceText(String(body.channelHandle || '').trim()),
            pairCode,
            urlToken,
            mode,
            expiry,
            expiresAt,
            caps: requestedCaps,
            note: sanitizeSurfaceText(String(body.note || '').trim()),
            enabled: true,
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
