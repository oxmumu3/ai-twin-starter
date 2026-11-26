/**
 * Core AI Twin engine (`Scoped Twin Session`):
 * - Causal 4-step project extraction & 0-token delta upgrade
 * - Per-caller physical thread isolation & capability whitelist enforcement
 * - 4 backend runtime loops: knowledge-gap (`待补口径`), graceful offline/paused
 *   state, silent daily turn cap (default 30), and 15-min owner presence yield + group @bot gate
 */
import { randomUUID } from 'node:crypto';
import {
  DEFAULT_DAILY_TURN_CAP,
  DEFAULT_PUBLIC_GLOBAL_DAILY_LIMIT,
  DEFAULT_PUBLIC_VISITOR_DAILY_LIMIT,
  PRESENCE_YIELD_MS,
  REDLINE_PATTERNS,
  TWIN_PERSONA_PRESETS,
  channelIdFromSelection,
  channelSelectionLabel,
  normalizePublicLobbyConfig,
  redactSecrets,
  sanitizeSurfaceText
} from '../shared/schema.js';
import { computePolicyDigest } from './fullblood-runner.js';
import { makeApprovalShortCode } from './owner-notifier.js';
import {
  detectProjectDelta,
  materializeScopedWorkspace,
  matchesScopePaths,
  normalizeScopePaths,
  scanProjectDirectory
} from './scanner.js';
import { todayKey } from './store.js';

function nowTimeLabel() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function tokenizeQuery(text) {
  const s = String(text || '').toLowerCase();
  const tokens = new Set(s.match(/[a-z0-9]{2,}/g) || []);
  const cjk = s.match(/[\u4e00-\u9fff]{2,}/g) || [];
  for (const run of cjk) {
    tokens.add(run);
    for (let i = 0; i <= run.length - 2; i++) {
      tokens.add(run.slice(i, i + 2));
    }
  }
  return [...tokens];
}

function scoreSnippetMatch(queryTokens, snippet) {
  if (!queryTokens.length || !snippet) return 0;
  const hay = `${snippet.title || ''} ${snippet.summary || ''}`.toLowerCase();
  const kwSet = new Set((snippet.keywords || []).map(k => String(k).toLowerCase()));
  let score = 0;
  for (const tok of queryTokens) {
    if (kwSet.has(tok)) score += 3;
    else if (hay.includes(tok)) score += 1;
  }
  return score;
}

export function isPersonExpired(person) {
  if (!person) return false;
  if (typeof person.expiresAt === 'number' && person.expiresAt > 0 && Date.now() > person.expiresAt) {
    return true;
  }
  return String(person.expiry || '').trim() === '已过期';
}

export function createTwinEngine({
  store,
  logger = console,
  onDispatchOutbound,
  llmResponder,
  fullBloodRunner = null,
  ownerNotifier = null,
  knowledgeProviders = () => []
}) {
  /** In-memory owner presence timestamps keyed by `<channelId>:<threadKey>` + mirrored to caller state. */
  const ownerPresence = new Map();
  const pendingScans = new Map();
  const scopeQueues = new Map();
  const activeTurns = new Map();
  const MAX_CONCURRENT_PUBLIC_TURNS = 3;
  const MAX_PUBLIC_PENDING_APPROVALS = 10;
  const PUBLIC_PUSH_COOLDOWN_MS = 10 * 60 * 1000;
  let activePublicTurns = 0;
  let lastPublicOwnerPushAt = 0;
  let extractTimer = null;
  let stepChain = Promise.resolve();
  let disposed = false;

  async function enqueueApproval(item, { setDeskOnCold = false } = {}) {
    const withCode = {
      ...item,
      shortCode: item.shortCode || makeApprovalShortCode(item.id)
    };
    await store.updateState(st => {
      if (withCode.isPublicLobby) {
        let keptPublic = 0;
        st.approvals = st.approvals.filter(existing => {
          if (!existing?.isPublicLobby) return true;
          if (keptPublic < MAX_PUBLIC_PENDING_APPROVALS - 1) {
            keptPublic += 1;
            return true;
          }
          return false;
        });
      }
      st.approvals.unshift(withCode);
      if (setDeskOnCold && st.lifecycleStage === 'cold') st.scene = 'desk';
    });

    if (ownerNotifier && typeof ownerNotifier.notifyPendingApproval === 'function') {
      let allowPush = true;
      if (withCode.isPublicLobby) {
        const pubCfg = store.getState().publicLobby;
        const now = Date.now();
        allowPush = Boolean(pubCfg?.pushOwner) && (now - lastPublicOwnerPushAt >= PUBLIC_PUSH_COOLDOWN_MS);
        if (allowPush) lastPublicOwnerPushAt = now;
      }
      if (allowPush) {
        await ownerNotifier.notifyPendingApproval(withCode).catch(err =>
          logger?.warn?.('[agent-twin] ownerNotifier push warning:', err?.message)
        );
      }
    }
    return withCode;
  }

  function serializeScope(scopeKey, task) {
    const key = String(scopeKey || 'default');
    const prev = scopeQueues.get(key) || Promise.resolve();
    const run = prev.catch(() => {}).then(task);
    const tail = run.then(() => {}, () => {});
    tail.finally(() => {
      if (scopeQueues.get(key) === tail) scopeQueues.delete(key);
    });
    scopeQueues.set(key, tail);
    return run;
  }

  async function enrichScanWithFullBlood(scan, { brief = '' } = {}) {
    if (!fullBloodRunner?.isAvailable?.() || disposed) return scan;
    try {
      const { sandboxDir } = await materializeScopedWorkspace({
        rootDir: store.paths.rootDir,
        scopeKey: `distill-${scan.projectId}`,
        mountedProjects: [{ id: scan.projectId, projectName: scan.projectName, rootPath: scan.rootPath }],
        capabilities: scan.capabilities
      });
      const distilled = await fullBloodRunner.runProjectDistillation({
        sandboxCwd: sandboxDir,
        projectName: scan.projectName,
        brief,
        scan
      });
      if (Array.isArray(distilled?.capabilities) && distilled.capabilities.length > 0) {
        scan.capabilities = distilled.capabilities.slice(0, 6).map((c, idx) => ({
          id: `cap-${scan.projectId}-ai-${idx + 1}`,
          projectId: scan.projectId,
          projectName: scan.projectName,
          name: sanitizeSurfaceText(String(c.name || `${scan.projectName} · 能力 ${idx + 1}`)).slice(0, 48),
          enabled: true,
          scopePaths: normalizeScopePaths(c.scopePaths || []),
          desc: sanitizeSurfaceText(String(c.desc || '')).slice(0, 180) || '依据已授权项目实料提炼的只读能力。',
          basis: sanitizeSurfaceText(String(c.basis || `${scan.docCount} 份授权只读文档`)).slice(0, 80),
          output: sanitizeSurfaceText(String(c.output || '先给结论，再说明依据来源')).slice(0, 80)
        }));
      }
      if (typeof distilled?.twinName === 'string' && distilled.twinName.trim()) {
        scan.draftProfile = {
          name: sanitizeSurfaceText(distilled.twinName.trim()).slice(0, 32),
          intro: sanitizeSurfaceText(String(distilled.twinIntro || scan.draftProfile?.intro || '')).slice(0, 140),
          recommendedDuty: ['shadow', 'live', 'off'].includes(distilled.recommendedDuty) ? distilled.recommendedDuty : 'shadow'
        };
      }
      if (Array.isArray(distilled?.samplePrompts) && distilled.samplePrompts.length >= 2) {
        scan.samplePrompts = distilled.samplePrompts.slice(0, 3).map(q => sanitizeSurfaceText(String(q || '')).trim()).filter(Boolean);
      }
    } catch (err) {
      logger?.warn?.('[agent-twin] full-blood distillation fallback used:', err?.message);
    }
    return scan;
  }

  function clearExtractTimer() {
    if (extractTimer) {
      clearInterval(extractTimer);
      extractTimer = null;
    }
  }

  function commitScanIntoState(st, scan, { brief = '', mode = 'initial' } = {}) {
    if (!scan) return;
    if (!st.mountedProjects.some(m => m.id === scan.projectId)) {
      st.mountedProjects.push({
        id: scan.projectId,
        projectName: scan.projectName,
        rootPath: scan.rootPath,
        fileCount: scan.fileCount,
        docCount: scan.docCount,
        readOnlyToolCount: scan.readOnlyToolCount,
        blockedSecretCount: scan.blockedSecretCount,
        blockedWriteScriptCount: scan.blockedWriteScriptCount,
        shortSummary: scan.shortSummary,
        fingerprintCount: Object.keys(scan.fingerprints || {}).length,
        lastCheckedAt: scan.scannedAt
      });
    }

    for (const cap of scan.capabilities || []) {
      if (!st.capabilities.some(c => c.id === cap.id)) {
        st.capabilities.push(cap);
      }
    }

    const trimmedBrief = sanitizeSurfaceText(String(brief || '').trim());
    if (trimmedBrief && !st.rules.some(r => r.text === trimmedBrief)) {
      st.rules.push({
        id: `r-extract-${Date.now()}`,
        kind: '规矩',
        text: trimmedBrief
      });
    }

    if (mode === 'initial' && !st.twinProfile?.userEdited && scan.draftProfile) {
      st.twinProfile = {
        personaId: st.twinProfile?.personaId || 'advisor',
        name: scan.draftProfile.name,
        intro: scan.draftProfile.intro,
        draftReady: true,
        userEdited: false
      };
      st.dutyMode = scan.draftProfile.recommendedDuty || 'shadow';
    }

    st.pendingDeltaByProject[scan.projectId] = false;
    st.lifecycleStage = 'mature';
  }

  function presenceKey(channelId, threadKey) {
    return `${channelId || 'unknown'}:${threadKey || 'default'}`;
  }

  function recordOwnerPresence(channelId, threadKey, ts = Date.now()) {
    ownerPresence.set(presenceKey(channelId, threadKey), ts);
  }

  function isOwnerPresentRecently(channelId, threadKey, now = Date.now()) {
    const s = store.getState();
    if (!s.presenceAutoYield) return false;
    const last = ownerPresence.get(presenceKey(channelId, threadKey));
    if (!last) return false;
    return now - last < PRESENCE_YIELD_MS;
  }

  /**
   * Execute bounded read-only project extraction and optionally apply immediately
   * (or run in causal 4 steps updating `state.extractionJob`).
   */
  async function startExtraction({ rootPath, projectName, mode = 'initial', brief = '', ownerName = '', autoComplete = false, skipModelDistill = false }) {
    if (!rootPath) throw new Error('请选择一个本地项目目录后再开始提炼');
    clearExtractTimer();
    pendingScans.clear();

    const scan = await scanProjectDirectory(rootPath, { projectName, ownerName });

    const persistIndex = async targetScan => {
      await store.writeProjectIndex(targetScan.projectId, {
        projectId: targetScan.projectId,
        projectName: targetScan.projectName,
        rootPath: targetScan.rootPath,
        fileCount: targetScan.fileCount,
        docCount: targetScan.docCount,
        readOnlyToolCount: targetScan.readOnlyToolCount,
        blockedSecretCount: targetScan.blockedSecretCount,
        blockedWriteScriptCount: targetScan.blockedWriteScriptCount,
        fingerprints: targetScan.fingerprints,
        snippets: targetScan.snippets,
        capabilities: targetScan.capabilities,
        samplePrompts: targetScan.samplePrompts,
        scanSummary: targetScan.scanSummary,
        shortSummary: targetScan.shortSummary,
        scope: targetScan.scope,
        draftProfile: targetScan.draftProfile,
        updatedAt: targetScan.scannedAt
      });
    };

    if (autoComplete) {
      if (!skipModelDistill) {
        await enrichScanWithFullBlood(scan, { brief });
      }
      await persistIndex(scan);
      await store.updateState(st => {
        st.onboardMode = mode;
        commitScanIntoState(st, scan, { brief, mode });
        st.extractionJob = null;
        st.scene = mode === 'mount' ? 'caps' : 'desk';
      });
      return scan;
    }

    await persistIndex(scan);
    const jobId = `job-${randomUUID().slice(0, 8)}`;
    const cleanBrief = sanitizeSurfaceText(String(brief || '').trim());
    const distillPromise = !skipModelDistill && fullBloodRunner?.isAvailable?.()
      ? enrichScanWithFullBlood(scan, { brief: cleanBrief }).then(async updated => {
          await persistIndex(updated);
          return updated;
        }).catch(() => scan)
      : Promise.resolve(scan);

    const allCapNames = scan.capabilities.map(c => c.name);
    pendingScans.set(jobId, { scan, brief: cleanBrief, mode, committed: false, distillPromise });

    await store.updateState(st => {
      st.onboardMode = mode;
      st.extractionJob = {
        id: jobId,
        projectId: scan.projectId,
        projectName: scan.projectName,
        rootPath: scan.rootPath,
        mode,
        brief: cleanBrief,
        status: 'running',
        step: 1,
        totalSteps: 4,
        totalCaps: allCapNames.length,
        discoveredCaps: [],
        draftProfile: scan.draftProfile
      };
    });

    if (!disposed) {
      extractTimer = setInterval(() => {
        stepChain = stepChain.then(async () => {
          if (disposed) return;
          const stJob = store.getState().extractionJob;
          if (!stJob || stJob.id !== jobId || stJob.status === 'ready') {
            clearExtractTimer();
            return;
          }
          const nextStep = Math.min(4, (stJob.step || 1) + 1);
          const rec = pendingScans.get(jobId);
          if (nextStep >= 4 && rec?.distillPromise) {
            await rec.distillPromise;
          }
          const activeCaps = (rec?.scan?.capabilities || []).map(c => c.name);
          await store.updateState(st => {
            if (!st.extractionJob || st.extractionJob.id !== jobId) return;
            st.extractionJob.step = nextStep;
            st.extractionJob.totalCaps = activeCaps.length;
            st.extractionJob.draftProfile = rec?.scan?.draftProfile || st.extractionJob.draftProfile;
            if (nextStep === 2) {
              st.extractionJob.discoveredCaps = activeCaps.slice(0, 1);
            } else if (nextStep === 3) {
              st.extractionJob.discoveredCaps = activeCaps.slice(0, Math.min(2, activeCaps.length));
            } else if (nextStep >= 4) {
              st.extractionJob.status = 'ready';
              st.extractionJob.discoveredCaps = activeCaps;
              if (rec && !rec.committed) {
                commitScanIntoState(st, rec.scan, { brief: rec.brief, mode: rec.mode });
                rec.committed = true;
              }
            }
          });
          if (nextStep >= 4) clearExtractTimer();
        }).catch(err => logger?.warn?.('[agent-twin] extraction step tick error:', err?.message));
      }, 600);
      extractTimer.unref?.();
    }

    return scan;
  }

  async function resolvePendingScan(job) {
    if (!job) return null;
    const rec = pendingScans.get(job.id);
    if (rec) {
      if (rec.distillPromise) await rec.distillPromise;
      return rec;
    }
    if (job.projectId) {
      const idx = await store.readProjectIndex(job.projectId);
      if (idx) {
        return { scan: idx, brief: job.brief || '', mode: job.mode || 'initial', committed: false };
      }
    }
    return null;
  }

  async function fastForwardExtraction() {
    clearExtractTimer();
    await stepChain;
    const job = store.getState().extractionJob;
    if (!job) return { ready: false };
    const rec = await resolvePendingScan(job);
    await store.updateState(st => {
      if (!st.extractionJob || st.extractionJob.id !== job.id) return;
      if (rec && !rec.committed) {
        commitScanIntoState(st, rec.scan, { brief: rec.brief, mode: rec.mode });
        rec.committed = true;
      }
      st.extractionJob.step = 4;
      st.extractionJob.status = 'ready';
      st.extractionJob.draftProfile = rec?.scan?.draftProfile || st.extractionJob.draftProfile;
      if (rec?.scan?.capabilities) {
        st.extractionJob.discoveredCaps = rec.scan.capabilities.map(c => c.name);
        st.extractionJob.totalCaps = rec.scan.capabilities.length;
      }
    });
    return { ready: true };
  }

  async function completeExtractionJob(targetScene = 'desk', opts = {}) {
    clearExtractTimer();
    await stepChain;
    const job = store.getState().extractionJob;
    const rec = await resolvePendingScan(job);
    await store.updateState(st => {
      if (rec && !rec.committed) {
        commitScanIntoState(st, rec.scan, { brief: rec.brief, mode: rec.mode });
        rec.committed = true;
      }
      st.extractionJob = null;
      st.lifecycleStage = 'mature';
      if (!opts.keepScene) {
        st.scene = targetScene;
      }
    });
    if (job?.id) pendingScans.delete(job.id);
  }

  function dispose() {
    disposed = true;
    clearExtractTimer();
    pendingScans.clear();
  }

  async function recheckProjectDelta(projectId) {
    const s = store.getState();
    const mp = s.mountedProjects.find(m => m.id === projectId);
    if (!mp) throw new Error('未找到已挂载的项目能力包');
    const prevIdx = await store.readProjectIndex(projectId);
    const delta = await detectProjectDelta(mp.rootPath, prevIdx || {});
    await store.updateState(st => {
      const target = st.mountedProjects.find(m => m.id === projectId);
      if (target) {
        target.deltaSpec = delta.hasDelta ? delta.deltaSpec : null;
        target.lastCheckedAt = new Date().toISOString();
      }
      st.pendingDeltaByProject[projectId] = delta.hasDelta;
    });
    return delta;
  }

  async function confirmDeltaUpgrade(projectId) {
    const s = store.getState();
    const mp = s.mountedProjects.find(m => m.id === projectId);
    if (!mp) throw new Error('未找到需要增量升级的项目');
    const scan = await scanProjectDirectory(mp.rootPath, { projectName: mp.projectName, projectId });
    await store.writeProjectIndex(projectId, {
      projectId,
      projectName: scan.projectName,
      rootPath: scan.rootPath,
      fingerprints: scan.fingerprints,
      snippets: scan.snippets,
      scanSummary: scan.scanSummary,
      shortSummary: scan.shortSummary,
      scope: scan.scope,
      draftProfile: scan.draftProfile,
      updatedAt: scan.scannedAt
    });
    await store.updateState(st => {
      const idx = st.mountedProjects.findIndex(m => m.id === projectId);
      if (idx !== -1) {
        st.mountedProjects[idx] = {
          ...st.mountedProjects[idx],
          fileCount: scan.fileCount,
          docCount: scan.docCount,
          readOnlyToolCount: scan.readOnlyToolCount,
          blockedSecretCount: scan.blockedSecretCount,
          blockedWriteScriptCount: scan.blockedWriteScriptCount,
          shortSummary: scan.shortSummary,
          deltaSpec: null,
          lastCheckedAt: scan.scannedAt
        };
      }
      for (const cap of scan.capabilities) {
        const cIdx = st.capabilities.findIndex(c => c.id === cap.id);
        if (cIdx === -1) st.capabilities.push(cap);
        else {
          st.capabilities[cIdx] = {
            ...cap,
            enabled: st.capabilities[cIdx].enabled,
            scopePaths: normalizeScopePaths(st.capabilities[cIdx].scopePaths || cap.scopePaths || [])
          };
        }
      }
      st.pendingDeltaByProject[projectId] = false;
    });
    return scan;
  }

  async function gatherAuthorizedSnippets(personCaps, question) {
    const s = store.getState();
    const enabledCaps = s.capabilities.filter(c => c.enabled && (!Array.isArray(personCaps) || personCaps.includes(c.id)));
    const enabledCapIds = new Set(enabledCaps.map(c => c.id));
    const projectIds = new Set(enabledCaps.map(c => c.projectId));
    const qTokens = tokenizeQuery(question);
    const matches = [];
    for (const pid of projectIds) {
      const index = await store.readProjectIndex(pid);
      if (!index || !Array.isArray(index.snippets)) continue;
      const projCaps = enabledCaps.filter(c => c.projectId === pid);
      const normalizedLists = projCaps.map(c => normalizeScopePaths(c.scopePaths));
      const restrictByPaths = projCaps.length > 0 && normalizedLists.every(list => list.length > 0);
      const unionPaths = restrictByPaths ? [...new Set(normalizedLists.flat())] : [];
      for (const sn of index.snippets) {
        const capMatch = !Array.isArray(sn.capIds) || sn.capIds.some(cid => enabledCapIds.has(cid));
        if (!capMatch) continue;
        if (restrictByPaths && sn.relPath && !matchesScopePaths(sn.relPath, unionPaths)) continue;
        const score = scoreSnippetMatch(qTokens, sn);
        if (score > 0) matches.push({ score, projectName: index.projectName, snippet: sn });
      }
    }
    matches.sort((a, b) => b.score - a.score);
    return matches;
  }

  function detectRedlineViolation(question, person) {
    const q = String(question || '');
    if (REDLINE_PATTERNS.pii.test(q)) {
      return { kind: 'pii', label: '待拍板 + 敏感拦截', reason: '对方请求原始个人手机号或逐笔明细' };
    }
    if (REDLINE_PATTERNS.writeAction.test(q)) {
      return { kind: 'write', label: '写操作已拦截', reason: '对方请求修改代码、写库或执行变更操作' };
    }
    if (REDLINE_PATTERNS.commitment.test(q)) {
      return { kind: 'commitment', label: '待拍板 + 商务边界', reason: '涉及未公开排期或报价承诺，需本人确认' };
    }
    if (person?.mode === 'summary' && /(明细|列表|逐条|名单)/.test(q)) {
      return { kind: 'summary_only', label: '只给汇总约束', reason: '该对象限制为汇总口径，不可返回单条明细' };
    }
    return null;
  }

  async function queryExternalProviders(question, person, activeCaps) {
    const providers = typeof knowledgeProviders === 'function' ? knowledgeProviders() : knowledgeProviders;
    const out = [];
    for (const p of providers || []) {
      if (typeof p?.query !== 'function') continue;
      try {
        const items = await p.query(question, { person, activeCaps });
        if (Array.isArray(items)) {
          for (const it of items.slice(0, 5)) {
            if (it?.title || it?.summary) {
              out.push({
                score: Number(it.score) || 4,
                projectName: sanitizeSurfaceText(String(it.source || p.name || '外部知识源')),
                snippet: {
                  title: sanitizeSurfaceText(String(it.title || '结构化知识')),
                  summary: sanitizeSurfaceText(String(it.summary || it.content || ''))
                }
              });
            }
          }
        }
      } catch (err) {
        logger?.warn?.('[agent-twin] knowledge provider query failed:', err?.message);
      }
    }
    return out;
  }

  async function recordTurnDelivery({
    person,
    isPublicVisitor,
    visitorId,
    cleanQ,
    replyText,
    capLabel,
    statusLabel,
    statusTone = 'ok',
    basisHint,
    channelId,
    trace,
    approvalId = '',
    shortCode = '',
    dshSessionId = '',
    policyDigest = '',
    countTurn = true
  }) {
    const turn = {
      id: `th-${randomUUID().slice(0, 8)}`,
      time: nowTimeLabel(),
      capLabel,
      question: cleanQ,
      reply: replyText,
      statusLabel,
      statusTone,
      basisHint,
      approvalId,
      shortCode,
      trace
    };
    if (isPublicVisitor && visitorId) {
      await store.appendVisitorTurn(visitorId, turn, {
        countTurn,
        dshSessionId,
        lastPolicyDigest: policyDigest
      });
      await store.incrementPublicLobbyUsage();
    } else if (person) {
      await store.appendCallerTurn(person.id, turn, {
        countTurn,
        dshSessionId,
        lastPolicyDigest: policyDigest
      });
    }

    await store.updateState(st => {
      if (!isPublicVisitor && person) {
        const target = st.people.find(p => p.id === person.id);
        if (target) {
          target.servedCount = (target.servedCount || 0) + 1;
          target.lastActive = '刚刚';
        }
      }
      st.deliveries.unshift({
        id: `del-${randomUUID().slice(0, 8)}`,
        personId: person?.id || '',
        isPublicLobby: Boolean(isPublicVisitor),
        time: nowTimeLabel(),
        who: person?.name || '访客',
        whoNote: person?.role || '公开扫码体验',
        channel: channelSelectionLabel(channelId),
        summary: replyText.slice(0, 52),
        statusLabel,
        statusTone,
        trace
      });
      st.deliveries = st.deliveries.slice(0, 40);
    });
    return turn;
  }

  /**
   * Shared Scoped Twin execution kernel for private callers and fail-closed `/try` public visitors.
   */
  function executeCoreTurn({
    person = null,
    twinProfile,
    activeCaps,
    cleanQ,
    channelId = 'ch-web',
    replyContext = {},
    isOwnerSelfTest = false,
    sandboxOnly = false,
    forceDeterministic = false,
    onProgress = null,
    threadAdapter = null,
    materializeScopeKey = 'selftest',
    turnLockKey = 'selftest',
    reuseSandbox = false,
    isPublicVisitor = false,
    visitorId = '',
    dailyLimit = 0,
    globalDailyLimit = 0
  }) {
    return serializeScope(turnLockKey, async () => {
      const s = store.getState();
      const secretVals = store.allSecretValues();
      const latestThread = threadAdapter && !sandboxOnly && !isOwnerSelfTest
        ? await threadAdapter.readThread()
        : null;
      const currentTodayCount = latestThread?.dailyTurns?.date === todayKey()
        ? (latestThread.dailyTurns.count || 0)
        : 0;

      if (dailyLimit > 0 && currentTodayCount >= dailyLimit) {
        return isPublicVisitor
          ? {
              action: 'rate_limited',
              limitReached: true,
              remainingTurns: 0,
              visitorDailyLimit: dailyLimit,
              statusLabel: '你今日的体验次数已用完',
              reply: `你今天在本公开大厅的 ${dailyLimit} 轮免费体验次数已用完（会话独立计数）。如果觉得效果不错，按下方「30 秒自建同款分身」提示在 DeepSeek Harness 中安装即可无限使用！`
            }
          : {
              action: 'rate_limited',
              statusLabel: '已达单日回复上限',
              reply: '今天的分身自动化答疑已达到单日轮次上限，避免刷屏与过度消耗。如有紧急问题请直接联系项目负责人，本工具无任何付费升级限制。'
            };
      }

      if (isPublicVisitor && globalDailyLimit > 0) {
        const globalToday = s.publicLobbyUsage?.date === todayKey() ? (s.publicLobbyUsage.count || 0) : 0;
        if (globalToday >= globalDailyLimit) {
          return {
            action: 'rate_limited',
            limitReached: true,
            remainingTurns: 0,
            visitorDailyLimit: dailyLimit,
            statusLabel: '公开体验今日总接待已满',
            reply: `本机公开大厅今日 ${globalDailyLimit} 轮免费接待总上限已满（防刷熔断），明日自动恢复；也可按底部教程 30 秒把自己的工作区部署为同款 AI 分身。`
          };
        }
      }

      const turnTrackId = randomUUID().slice(0, 8);
      const visitorDailyLimit = dailyLimit || DEFAULT_PUBLIC_VISITOR_DAILY_LIMIT;
      const remainingAfterTurn = isPublicVisitor
        ? Math.max(0, visitorDailyLimit - (currentTodayCount + 1))
        : undefined;

      activeTurns.set(turnTrackId, {
        id: turnTrackId,
        callerId: person?.id || 'selftest',
        personName: person?.name || '本机自测',
        channelId,
        question: cleanQ.slice(0, 64),
        startedAt: Date.now(),
        latestStep: null
      });

      const emitProgress = step => {
        if (!step) return;
        const entry = activeTurns.get(turnTrackId);
        if (entry) entry.latestStep = step;
        if (typeof onProgress === 'function') {
          try {
            onProgress(step);
          } catch {
            // ignore streaming listener errors
          }
        }
      };

      try {
        emitProgress({
          phase: 'auth',
          title: '核对身份与能力范围',
          detail: person ? `${person.name} · 独立隔离会话` : '本机只读自测'
        });

        const externalKnowledge = await queryExternalProviders(cleanQ, person, activeCaps);
        if (externalKnowledge.length > 0) {
          emitProgress({
            phase: 'graph',
            title: '命中语义知识图谱',
            detail: `${externalKnowledge.length} 条关联口径`
          });
        }

        // Path A: Full-Blooded Native DSH Agent Session + Thin Harness
        if (!forceDeterministic && fullBloodRunner?.isAvailable?.()) {
          try {
            const startedAt = Date.now();
            const runMaterialize = () => materializeScopedWorkspace({
              rootDir: store.paths.rootDir,
              scopeKey: materializeScopeKey,
              mountedProjects: s.mountedProjects,
              capabilities: s.capabilities,
              allowedCapIds: activeCaps,
              reuseIfUnchanged: reuseSandbox
            });
            const mat = reuseSandbox
              ? await serializeScope(`materialize-${materializeScopeKey}`, runMaterialize)
              : await runMaterialize();

            const digest = computePolicyDigest({
              twinProfile,
              rules: s.rules,
              mode: person?.mode || 'direct',
              note: person?.note || '',
              activeCaps
            });
            const canReuseSession = Boolean(threadAdapter && !sandboxOnly && !isOwnerSelfTest && latestThread?.dshSessionId);
            const includeFullPolicy = !canReuseSession || latestThread?.lastPolicyDigest !== digest;

            const aiRes = await fullBloodRunner.runCallerTurn({
              callerId: person?.id || 'selftest',
              sessionId: canReuseSession ? latestThread.dshSessionId : '',
              sandboxCwd: mat.sandboxDir,
              twinProfile,
              rules: s.rules,
              person,
              question: cleanQ,
              externalKnowledge: externalKnowledge.map(k => k.snippet),
              includeFullPolicy,
              onProgress: emitProgress
            });

            if (threadAdapter && (canReuseSession || (!sandboxOnly && !isOwnerSelfTest && aiRes.sessionId))) {
              await threadAdapter.updateMeta({
                dshSessionId: aiRes.sessionId || latestThread?.dshSessionId || '',
                lastPolicyDigest: digest
              });
            }

            const linkedProjects = mat.linkedProjects;
            const policyDigest = digest;

          const durationSec = `${Math.max(0.2, (Date.now() - startedAt) / 1000).toFixed(1)} 秒`;
          const cleanReply = redactSecrets(sanitizeSurfaceText(aiRes.reply), secretVals);
          const steps = Array.isArray(aiRes.traceSteps) && aiRes.traceSteps.length > 0
            ? aiRes.traceSteps
            : [{ title: '只读核对授权沙箱', detail: linkedProjects.map(p => `${p.name}(${p.linkedCount}份)`).join('、') || '授权口径范围' }];

          if (aiRes.decision === 'REDLINE') {
            if (sandboxOnly) {
              return {
                action: 'redline_intercepted',
                statusLabel: '待拍板 + 敏感拦截',
                reply: cleanReply,
                reason: aiRes.reason || '命中红线拦截'
              };
            }
            const appItem = {
              id: `app-red-${randomUUID().slice(0, 8)}`,
              personId: person?.id || 'p-self',
              personName: person?.name || '自测预演',
              isPublicLobby: Boolean(isPublicVisitor),
              visitorId: isPublicVisitor ? visitorId : '',
              channel: `${channelSelectionLabel(channelId)} · ${nowTimeLabel()}`,
              tone: 'danger',
              tag: '待拍板 + 敏感拦截',
              headline: `${person?.name || '访客'} 触发红线拦截：${aiRes.reason || '涉敏或越界请求'}`,
              gist: '满血分身核对规则后已自动拦截越权内容，并拟好安全替代回复等你确认。',
              question: cleanQ,
              draft: cleanReply,
              primaryActionLabel: '批准发出安全回复',
              allowRuleExtract: false,
              basisHint: `规则与红线拦截（${aiRes.reason || '安全边界'}）`,
              replyContext,
              trace: {
                intro: `${person?.name || '访客'} 的消息经隔离分身语义审查命中工作台红线。`,
                steps,
                techNote: '隔离只读沙箱 + 模型外双层校验：敏感目录已物理剔除，拦截未外发。'
              }
            };
            const savedRedline = await enqueueApproval(appItem, { setDeskOnCold: true });
            const safeFallbackReply = isPublicVisitor
              ? `这个问题涉及敏感边界或未公开事项，已实时拦截并生成待拍板卡片 #${savedRedline.shortCode}。你可以在下方体验常规问题，或点击底部用 30 秒把自己的工作区部署成同款分身。`
              : '这个问题涉及敏感边界或需本人拍板事项，已转呈负责人确认，稍后答复你。';

            if (isPublicVisitor) {
              await recordTurnDelivery({
                person,
                isPublicVisitor: true,
                visitorId,
                cleanQ,
                replyText: safeFallbackReply,
                capLabel: '敏感红线拦截',
                statusLabel: `已拦下 · #${savedRedline.shortCode}`,
                statusTone: 'warn',
                basisHint: appItem.basisHint,
                channelId,
                trace: appItem.trace,
                approvalId: savedRedline.id,
                shortCode: savedRedline.shortCode,
                dshSessionId: aiRes.sessionId || '',
                policyDigest
              });
            }

            return {
              action: 'pending_approval',
              isPublicLobby: Boolean(isPublicVisitor),
              approvalId: savedRedline.id,
              shortCode: savedRedline.shortCode,
              statusLabel: isPublicVisitor ? `已拦下 · 待拍板 #${savedRedline.shortCode}` : '已拦下并待本人拍板',
              draft: cleanReply,
              safeFallbackReply,
              ...(isPublicVisitor ? { reply: safeFallbackReply, remainingTurns: remainingAfterTurn, visitorDailyLimit } : {})
            };
          }

          if (aiRes.decision === 'GAP') {
            if (sandboxOnly) {
              return {
                action: 'knowledge_gap',
                statusLabel: '触发待补口径（沙箱预览）',
                reply: cleanReply
              };
            }
            if (isOwnerSelfTest) {
              const selfRes = {
                question: cleanQ,
                answer: cleanReply,
                basis: '隔离工作区实查（未命中明确口径 · 已标待补）',
                duration: durationSec
              };
              await store.updateState(st => { st.selfTestTurn = selfRes; });
              return { action: 'replied', ...selfRes, reply: selfRes.answer };
            }
            const gapItem = {
              id: `app-gap-${randomUUID().slice(0, 8)}`,
              personId: person.id,
              personName: person.name,
              isPublicLobby: Boolean(isPublicVisitor),
              visitorId: isPublicVisitor ? visitorId : '',
              channel: `${channelSelectionLabel(channelId)} · ${nowTimeLabel()}`,
              tone: 'amber',
              tag: '待补口径',
              headline: `${person.name} 问到授权资料外问题，待你补充口径`,
              gist: cleanReply.slice(0, 64),
              question: cleanQ,
              draft: cleanReply,
              primaryActionLabel: '补好并回复对方',
              allowRuleExtract: true,
              basisHint: aiRes.reason || '授权资料核查未覆盖',
              replyContext,
              trace: {
                intro: `${person.name} 的问题超出当前已授权项目文档覆盖范围。`,
                steps,
                techNote: '宁可转交负责人补充口径，绝不编造数字或越权读取未授权目录。'
              }
            };
            const savedGap = await enqueueApproval(gapItem);
            const gapHoldingReply = isPublicVisitor
              ? `这个问题暂未收录在当前公开体验工作区的授权资料中（已记入待补口径 #${savedGap.shortCode}），严禁编造答案。`
              : '这个问题暂未在我当前掌握的公开口径文档中明确定义，我已转请负责人核实补充，确认后会第一时间给你答复。';
            if (isPublicVisitor) {
              await recordTurnDelivery({
                person,
                isPublicVisitor: true,
                visitorId,
                cleanQ,
                replyText: gapHoldingReply,
                capLabel: '待补口径边界',
                statusLabel: `待补口径 · #${savedGap.shortCode}`,
                statusTone: 'warn',
                basisHint: gapItem.basisHint,
                channelId,
                trace: gapItem.trace,
                approvalId: savedGap.id,
                shortCode: savedGap.shortCode,
                dshSessionId: aiRes.sessionId || '',
                policyDigest
              });
            }
            return {
              action: 'knowledge_gap',
              isPublicLobby: Boolean(isPublicVisitor),
              approvalId: savedGap.id,
              shortCode: savedGap.shortCode,
              statusLabel: isPublicVisitor ? `待补口径 · #${savedGap.shortCode}` : '待补口径已转服务台',
              reply: gapHoldingReply,
              ...(isPublicVisitor ? { remainingTurns: remainingAfterTurn, visitorDailyLimit } : {})
            };
          }

          if (sandboxOnly) {
            return {
              action: 'replied',
              statusLabel: '满血沙箱试答（未写入外部记录）',
              reply: cleanReply,
              basis: linkedProjects.map(p => p.name).join('、') || '授权只读工作区'
            };
          }

          if (isOwnerSelfTest) {
            const selfRes = {
              question: cleanQ,
              answer: cleanReply,
              basis: `${linkedProjects.map(p => p.name).join('、') || '授权工作区'}（满血只读实查 · ${steps.length} 步）`,
              duration: durationSec
            };
            await store.updateState(st => { st.selfTestTurn = selfRes; });
            return { action: 'replied', ...selfRes, reply: cleanReply };
          }

          const trace = {
            intro: `收到 ${person.name} 通过「${channelSelectionLabel(channelId)}」的提问，已在独立只读工作区完成满血核查。`,
            steps,
            techNote: isPublicVisitor
              ? '公开体验会话按匿名 Cookie 隔离，与私有项目工作区物理分离。'
              : '单人会话物理隔离与独立 DSH 会话上下文，不含他人历史或密钥文件。'
          };

          const shouldAutoReply = isPublicVisitor
            ? true
            : (s.dutyMode === 'live' && (person.mode === 'direct' || person.mode === 'summary'));
          if (shouldAutoReply) {
            const statusLabel = isPublicVisitor ? '满血只读解答完成' : '通道回执已送达';
            const turn = await recordTurnDelivery({
              person,
              isPublicVisitor,
              visitorId,
              cleanQ,
              replyText: cleanReply,
              capLabel: linkedProjects[0]?.name || '只读核查',
              statusLabel,
              statusTone: 'ok',
              basisHint: `已实查「${linkedProjects.map(p => p.name).join('、') || '授权工作区'}」`,
              channelId,
              trace,
              dshSessionId: aiRes.sessionId || latestThread?.dshSessionId || '',
              policyDigest
            });
            return {
              action: 'replied',
              reply: cleanReply,
              statusLabel,
              turn,
              ...(isPublicVisitor ? { remainingTurns: remainingAfterTurn, visitorDailyLimit } : {})
            };
          }

          const draftApproval = {
            id: `app-${randomUUID().slice(0, 8)}`,
            personId: person.id,
            personName: person.name,
            channel: `${channelSelectionLabel(channelId)} · ${nowTimeLabel()}`,
            tone: 'amber',
            tag: '待过目草稿',
            headline: `${person.name} 提问：${cleanQ.slice(0, 26)}`,
            gist: cleanReply.slice(0, 56),
            question: cleanQ,
            draft: cleanReply,
            primaryActionLabel: '批准发出',
            allowRuleExtract: true,
            basisHint: `已实查「${linkedProjects.map(p => p.name).join('、') || '授权工作区'}」`,
            replyContext,
            trace
          };
          const savedDraft = await enqueueApproval(draftApproval);
          return {
            action: 'pending_approval',
            approvalId: savedDraft.id,
            shortCode: savedDraft.shortCode,
            statusLabel: '草稿待本人拍板',
            draft: cleanReply
          };
        } catch (err) {
          logger?.warn?.('[agent-twin] full-blood turn error, falling back to deterministic engine:', err?.message);
        }
      }

      // Path B: Deterministic Offline Fallback
      const violation = detectRedlineViolation(cleanQ, person);

      if (violation) {
        const draft = violation.kind === 'write'
          ? '按只读安全红线，分身无权修改代码、写入数据库或执行变更脚本；我已将你的诉求转交给负责人本人评估处理。'
          : violation.kind === 'commitment'
            ? '具体排期、商务报价或未公开策略需要由负责人本人核定；已将你的诉求转入待办，确认后第一时间回复你。'
            : '按只读隐私红线，不能提供逐笔客户手机号或原始流水明细；如需分析波动结构，我可以先为你整理脱敏汇总占比趋势。';

        if (sandboxOnly) {
          return {
            action: 'redline_intercepted',
            statusLabel: violation.label,
            reply: draft,
            reason: violation.reason
          };
        }

        const appItem = {
          id: `app-red-${randomUUID().slice(0, 8)}`,
          personId: person?.id || 'p-self',
          personName: person?.name || '自测预演',
          isPublicLobby: Boolean(isPublicVisitor),
          visitorId: isPublicVisitor ? visitorId : '',
          channel: `${channelSelectionLabel(channelId)} · ${nowTimeLabel()}`,
          tone: 'danger',
          tag: violation.label,
          headline: `${person?.name || '访客'} 触发红线拦截：${violation.reason}`,
          gist: '已自动挡回越权明细或变更操作，并准备好安全替代回复等你确认。',
          question: cleanQ,
          draft,
          primaryActionLabel: '批准发出安全回复',
          allowRuleExtract: false,
          basisHint: `红线规则触发（${violation.reason}）`,
          replyContext,
          trace: {
            intro: `${person?.name || '访客'} 的消息触发了工作台安全红线。`,
            steps: [
              { title: '边界校验命中红线', detail: violation.reason },
              { title: '生成脱敏替代答复', detail: '阻断原始字段或写操作，待本人审核发出。' }
            ],
            techNote: '红线规则先于任何资料检索执行，零越权泄露风险。'
          }
        };

        const savedViolation = await enqueueApproval(appItem, { setDeskOnCold: true });
        const safeFallbackReply = isPublicVisitor
          ? `这个问题涉及敏感边界或未公开事项，已实时拦截并生成待拍板卡片 #${savedViolation.shortCode}。你可以在下方体验常规问题，或点击底部用 30 秒把自己的工作区部署成同款分身。`
          : '这个问题涉及敏感边界或需本人拍板事项，已转呈负责人确认，稍后答复你。';

        if (isPublicVisitor) {
          await recordTurnDelivery({
            person,
            isPublicVisitor: true,
            visitorId,
            cleanQ,
            replyText: safeFallbackReply,
            capLabel: violation.label,
            statusLabel: `已拦下 · #${savedViolation.shortCode}`,
            statusTone: 'warn',
            basisHint: appItem.basisHint,
            channelId,
            trace: appItem.trace,
            approvalId: savedViolation.id,
            shortCode: savedViolation.shortCode
          });
        }

        return {
          action: 'pending_approval',
          isPublicLobby: Boolean(isPublicVisitor),
          approvalId: savedViolation.id,
          shortCode: savedViolation.shortCode,
          statusLabel: isPublicVisitor ? `已拦下 · 待拍板 #${savedViolation.shortCode}` : '已拦下并待本人拍板',
          draft,
          safeFallbackReply,
          ...(isPublicVisitor ? { reply: safeFallbackReply, remainingTurns: remainingAfterTurn, visitorDailyLimit } : {})
        };
      }

      const localMatches = await gatherAuthorizedSnippets(activeCaps, cleanQ);
      const matches = [...externalKnowledge, ...localMatches].sort((a, b) => b.score - a.score);
      const hasCustomKnowledge = matches.length > 0 && matches[0].score >= 2;
      const isExplicitGapPrompt = /(未公开|内部底价|定价策略|内幕|保密|还没写)/.test(cleanQ);

      if (!hasCustomKnowledge || isExplicitGapPrompt) {
        const gapDraft = '感谢提问，这块暂未写入当前已授权的项目口径文档，我已向负责人提交待补口径说明，确认准确边界后会补充回复你。';
        if (sandboxOnly) {
          return {
            action: 'knowledge_gap',
            statusLabel: '触发待补口径（沙箱预览）',
            reply: '这个问题涉及尚未写入授权资料库的口径细节，我先记下并转负责人「待补口径」补充，确认后第一时间答复你。'
          };
        }

        if (isOwnerSelfTest) {
          const selfRes = {
            question: cleanQ,
            answer: '在当前授权的只读项目文档中未命中足够支撑（触发「待补口径」保护，未瞎编回答）；若来自真实访客，会自动向你服务台发起口径补充卡片。',
            basis: '本地授权范围核查（未超出授权文件夹）',
            duration: '0.2 秒'
          };
          await store.updateState(st => { st.selfTestTurn = selfRes; });
          return { action: 'replied', ...selfRes, reply: selfRes.answer };
        }

        const gapItem = {
          id: `app-gap-${randomUUID().slice(0, 8)}`,
          personId: person.id,
          personName: person.name,
          isPublicLobby: Boolean(isPublicVisitor),
          visitorId: isPublicVisitor ? visitorId : '',
          channel: `${channelSelectionLabel(channelId)} · ${nowTimeLabel()}`,
          tone: 'amber',
          tag: '待补口径',
          headline: `${person.name} 问到授权资料外问题，待你补充口径`,
          gist: '已先礼貌告知正在核实（严禁胡编），等你填补结论后可顺手记成长期规矩。',
          question: cleanQ,
          draft: gapDraft,
          primaryActionLabel: '补好并回复对方',
          allowRuleExtract: true,
          basisHint: '知识缺口拦截 · 未发现公开授权依据',
          replyContext,
          trace: {
            intro: `${person.name} 的问题超出当前已提取能力文档覆盖范围。`,
            steps: [
              { title: '在授权文档索引中检索', detail: '未找到满足置信度的授权片段。' },
              { title: '拒绝幻觉编造并升级待补口径', detail: '保留人工补充口供，确认后可一键沉淀为长期规矩。' }
            ],
            techNote: '知识边界守卫拦截：宁可标待补口径，绝不编造数字或越权读取未授权目录。'
          }
        };

        const savedGapB = await enqueueApproval(gapItem);
        const politeHoldingReply = isPublicVisitor
          ? `这个问题暂未收录在当前公开体验工作区的授权资料中（已记入待补口径 #${savedGapB.shortCode}），严禁编造答案。`
          : '这个问题暂未在我当前掌握的公开口径文档中明确定义，我已转请负责人核实补充，确认后会第一时间给你答复。';

        if (isPublicVisitor) {
          await recordTurnDelivery({
            person,
            isPublicVisitor: true,
            visitorId,
            cleanQ,
            replyText: politeHoldingReply,
            capLabel: '待补口径边界',
            statusLabel: `待补口径 · #${savedGapB.shortCode}`,
            statusTone: 'warn',
            basisHint: gapItem.basisHint,
            channelId,
            trace: gapItem.trace,
            approvalId: savedGapB.id,
            shortCode: savedGapB.shortCode
          });
        }

        return {
          action: 'knowledge_gap',
          isPublicLobby: Boolean(isPublicVisitor),
          approvalId: savedGapB.id,
          shortCode: savedGapB.shortCode,
          statusLabel: isPublicVisitor ? `待补口径 · #${savedGapB.shortCode}` : '待补口径已转服务台',
          reply: politeHoldingReply,
          ...(isPublicVisitor ? { remainingTurns: remainingAfterTurn, visitorDailyLimit } : {})
        };
      }

      emitProgress({
        phase: 'doc',
        title: '核对授权文档口径',
        detail: `${matches[0].projectName} · ${matches[0].snippet.title}`
      });

      const top = matches[0];
      let generatedReply = `根据「${top.projectName} · ${top.snippet.title}」的只读口径说明：${top.snippet.summary}`;
      if (typeof llmResponder === 'function') {
        try {
          const custom = await llmResponder({ question: cleanQ, matches: matches.slice(0, 3), rules: s.rules, person });
          if (typeof custom === 'string' && custom.trim()) {
            generatedReply = redactSecrets(sanitizeSurfaceText(custom.trim()), secretVals);
          }
        } catch (err) {
          logger?.warn?.('[agent-twin] llmResponder fallback used:', err?.message);
        }
      }

      if (person?.note) {
        generatedReply += `（注：按「${sanitizeSurfaceText(person.note)}」约定整理）`;
      }

      if (sandboxOnly) {
        return {
          action: 'replied',
          statusLabel: '沙箱试答（未写入外部记录）',
          reply: generatedReply,
          basis: `${top.projectName} · ${top.snippet.title}`
        };
      }

      if (isOwnerSelfTest) {
        const selfRes = {
          question: cleanQ,
          answer: generatedReply,
          basis: `${top.projectName} · ${top.snippet.title}（仅本地自测）`,
          duration: '0.4 秒'
        };
        await store.updateState(st => { st.selfTestTurn = selfRes; });
        return { action: 'replied', ...selfRes, reply: generatedReply };
      }

      const trace = {
        intro: `收到 ${person.name} 通过「${channelSelectionLabel(channelId)}」的提问，已在独立沙箱内完成只读核对。`,
        steps: [
          { title: '核对白名单与能力范围', detail: `仅检索 ${person.name} 已获授权的 ${matches.length} 处片段。` },
          { title: '依据授权文档生成结论', detail: `引用「${top.projectName} · ${top.snippet.title}」，过滤私密字段。` }
        ],
        techNote: '单人会话物理隔离存档，不含其他访客历史或敏感文件路径。'
      };

      const shouldAutoReply = isPublicVisitor
        ? true
        : (s.dutyMode === 'live' && (person.mode === 'direct' || person.mode === 'summary'));
      if (shouldAutoReply) {
        const statusLabel = isPublicVisitor ? '只读口径解答完成' : '通道回执已送达';
        const turn = await recordTurnDelivery({
          person,
          isPublicVisitor,
          visitorId,
          cleanQ,
          replyText: generatedReply,
          capLabel: top.snippet.title,
          statusLabel,
          statusTone: 'ok',
          basisHint: `已核对「${top.snippet.title}」`,
          channelId,
          trace
        });
        return {
          action: 'replied',
          reply: generatedReply,
          statusLabel,
          turn,
          ...(isPublicVisitor ? { remainingTurns: remainingAfterTurn, visitorDailyLimit } : {})
        };
      }

      const draftApproval = {
        id: `app-${randomUUID().slice(0, 8)}`,
        personId: person.id,
        personName: person.name,
        channel: `${channelSelectionLabel(channelId)} · ${nowTimeLabel()}`,
        tone: 'amber',
        tag: '待过目草稿',
        headline: `${person.name} 提问：${cleanQ.slice(0, 26)}`,
        gist: generatedReply.slice(0, 56),
        question: cleanQ,
        draft: generatedReply,
        primaryActionLabel: '批准发出',
        allowRuleExtract: true,
        basisHint: `已核对「${top.snippet.title}」`,
        replyContext,
        trace
      };
      const savedDraftB = await enqueueApproval(draftApproval);
      return {
        action: 'pending_approval',
        approvalId: savedDraftB.id,
        shortCode: savedDraftB.shortCode,
        statusLabel: '草稿待本人拍板',
        draft: generatedReply
      };
    } finally {
      activeTurns.delete(turnTrackId);
    }
    });
  }

  /**
   * Core Scoped Twin Session runtime handler for external named callers and self-tests.
   */
  async function handleInboundMessage({
    personId,
    question,
    channelId = 'ch-web',
    threadKey = '',
    isGroup = false,
    mentionsBot = true,
    isOwnerSelfTest = false,
    sandboxOnly = false,
    replyContext = {},
    forceDeterministic = false,
    onProgress = null
  }) {
    const s = store.getState();
    const secretVals = store.allSecretValues();
    const cleanQ = redactSecrets(sanitizeSurfaceText(String(question || '').trim()), secretVals);
    if (!cleanQ) throw new Error('提问内容不能为空');

    if (!isOwnerSelfTest && s.dutyMode === 'off') {
      return {
        action: 'paused',
        statusLabel: '工作分身当前暂停对外值班',
        reply: '工作分身当前已暂停对外值班，暂时停止自动回复。工具内不设任何收费门槛，重要事项请直接联系项目负责人。'
      };
    }

    const person = personId ? s.people.find(p => p.id === personId) : null;

    if (!isOwnerSelfTest && !sandboxOnly) {
      if (!person) {
        return { action: 'ignored', reason: 'unknown_caller' };
      }
      if (!person.enabled || isPersonExpired(person)) {
        return {
          action: 'paused',
          statusLabel: '当前访问权限已暂停',
          reply: `你好 ${person.name}，当前的分身试用或服务权限已暂停。本工具不收取任何费用，如需恢复请直接联系负责人打开开关。`
        };
      }
      if (isGroup && !mentionsBot) {
        return { action: 'ignored', reason: 'group_not_mentioned' };
      }
      if (threadKey && isOwnerPresentRecently(channelId, threadKey)) {
        const yieldNotice = {
          id: `del-yield-${Date.now()}`,
          personId: person.id,
          time: nowTimeLabel(),
          who: person.name,
          whoNote: person.role,
          channel: channelSelectionLabel(channelId),
          summary: '检测到本人在原会话 15 分钟内发言，分身自动收声未抢答',
          statusLabel: '本人在场自动收声',
          statusTone: 'muted',
          trace: {
            intro: '15 分钟内检测到负责人在同一会话亲自回复过，触发本人在场收声保护。',
            steps: [{ title: '检测最近真人互动', detail: '保持现场沟通顺畅，不做重复插话。' }],
            techNote: '15 分钟计时窗口自动刷新。'
          }
        };
        await store.updateState(st => {
          st.deliveries.unshift(yieldNotice);
          st.deliveries = st.deliveries.slice(0, 40);
        });
        return { action: 'yielded', statusLabel: '本人在场自动收声', delivery: yieldNotice };
      }
    }

    const activeCaps = person ? person.caps : s.capabilities.filter(c => c.enabled).map(c => c.id);
    const scopeKey = person && !isOwnerSelfTest ? `caller-${person.id}` : 'selftest';

    return executeCoreTurn({
      person,
      twinProfile: s.twinProfile,
      activeCaps,
      cleanQ,
      channelId,
      replyContext,
      isOwnerSelfTest,
      sandboxOnly,
      forceDeterministic,
      onProgress,
      threadAdapter: person
        ? {
            readThread: () => store.readCallerThread(person.id),
            updateMeta: patch => store.updateCallerMeta(person.id, patch)
          }
        : null,
      materializeScopeKey: scopeKey,
      turnLockKey: scopeKey,
      reuseSandbox: false,
      isPublicVisitor: false,
      dailyLimit: (!isOwnerSelfTest && !sandboxOnly) ? (s.dailyTurnCap || DEFAULT_DAILY_TURN_CAP) : 0
    });
  }

  /**
   * Fail-closed handler for anonymous visitors on the `/try` Public Scan-to-Try Lobby.
   */
  async function handlePublicVisitorMessage({
    visitorId,
    question,
    forceDeterministic = false,
    onProgress = null
  }) {
    const s = store.getState();
    const secretVals = store.allSecretValues();
    const cleanQ = redactSecrets(sanitizeSurfaceText(String(question || '').trim()), secretVals);
    if (!cleanQ) throw new Error('提问内容不能为空');

    if (s.dutyMode === 'off') {
      return {
        action: 'paused',
        statusLabel: '工作分身当前暂停对外值班',
        reply: '本分身当前处于暂停对外值班状态，欢迎随时按底部指引 30 秒在 DeepSeek Harness 自建自己的隔离 AI 分身。'
      };
    }

    const publicCfg = normalizePublicLobbyConfig(s.publicLobby);
    if (!publicCfg.enabled) {
      return {
        action: 'paused',
        statusLabel: '公开体验大厅未开启',
        reply: '工作区负责人尚未开启公开扫码体验大厅，请先在工作台「能力与通道 -> 公开扫码真体验大厅」开启并勾选允许对外展示的只读能力。'
      };
    }

    // Fail-Closed: NEVER fall back to all enabled capabilities when capIds is empty
    const configuredCapSet = new Set(publicCfg.capIds || []);
    const allowedCaps = s.capabilities.filter(c => c.enabled && configuredCapSet.has(c.id));
    const allowedCapIds = allowedCaps.map(c => c.id);
    if (allowedCapIds.length === 0) {
      return {
        action: 'paused',
        statusLabel: '暂未勾选公开体验能力',
        reply: '为严守 Fail-Closed 安全默认，负责人尚未在工作台勾选任何可对外体验的只读能力项，当前拒绝访问任何工作区文件。'
      };
    }

    if (activePublicTurns >= MAX_CONCURRENT_PUBLIC_TURNS) {
      const busyErr = new Error('当前同时在线体验人数较多，请稍等 10 秒后再试。');
      busyErr.statusCode = 429;
      throw busyErr;
    }

    const visitorDailyLimit = Math.max(1, publicCfg.visitorDailyLimit || DEFAULT_PUBLIC_VISITOR_DAILY_LIMIT);
    const globalDailyLimit = Math.max(1, publicCfg.globalDailyLimit || DEFAULT_PUBLIC_GLOBAL_DAILY_LIMIT);
    const allowedProjectNames = [...new Set(allowedCaps.map(c => c.projectName).filter(Boolean))].join('、') || '公开授权工作区';
    // Strict Persona Isolation: never inherit private workspace title/intro (e.g. unrelated client projects)
    const effectiveTwinProfile = {
      personaId: 'advisor',
      name: publicCfg.title || `${allowedProjectNames} · 公开体验分身`,
      intro: publicCfg.intro || `由本机 DeepSeek Harness 只读驱动，仅可查「${allowedProjectNames}」已勾选能力，私有项目物理隔离不可见。`
    };
    const shortTag = String(visitorId).slice(-4).toUpperCase();
    const virtualPerson = {
      id: `vis-${String(visitorId).slice(0, 12)}`,
      name: `扫码访客 #${shortTag}`,
      role: '公开扫码体验',
      channel: '公开扫码体验',
      mode: publicCfg.mode === 'direct' ? 'direct' : 'summary',
      caps: allowedCapIds,
      enabled: true,
      isPublicVisitor: true
    };

    activePublicTurns += 1;
    try {
      return await executeCoreTurn({
        person: virtualPerson,
        twinProfile: effectiveTwinProfile,
        activeCaps: allowedCapIds,
        cleanQ,
        channelId: 'ch-public-try',
        isOwnerSelfTest: false,
        sandboxOnly: false,
        forceDeterministic,
        onProgress,
        threadAdapter: {
          readThread: () => store.readVisitorThread(visitorId),
          updateMeta: patch => store.updateVisitorMeta(visitorId, patch)
        },
        materializeScopeKey: 'public-lobby',
        turnLockKey: `visitor-${visitorId}`,
        reuseSandbox: true,
        isPublicVisitor: true,
        visitorId,
        dailyLimit: visitorDailyLimit,
        globalDailyLimit
      });
    } finally {
      activePublicTurns = Math.max(0, activePublicTurns - 1);
    }
  }

  async function approveDraft(approvalId, customDraft = null) {
    const s = store.getState();
    const idx = s.approvals.findIndex(a => a.id === approvalId);
    if (idx === -1) throw new Error('该待办草稿已处理或不存在');
    const item = s.approvals[idx];
    const finalReply = sanitizeSurfaceText(
      typeof customDraft === 'string' && customDraft.trim() ? customDraft.trim() : item.draft
    );

    const person = s.people.find(p => p.id === item.personId);
    let dispatchStatus = item.isPublicLobby ? '公开体验已审阅存档' : '已调用通道接口发出';
    if (person && typeof onDispatchOutbound === 'function') {
      try {
        const res = await onDispatchOutbound(person, finalReply, item.replyContext || {});
        if (res?.delivered) dispatchStatus = '通道回执已送达';
      } catch (err) {
        logger?.warn?.('[agent-twin] outbound dispatch notice:', err?.message);
      }
    }

    const approvedTurn = {
      id: `th-ap-${randomUUID().slice(0, 8)}`,
      time: nowTimeLabel(),
      capLabel: item.tag,
      question: item.question,
      reply: finalReply,
      statusLabel: dispatchStatus,
      statusTone: 'ok',
      basisHint: item.basisHint || '经负责人审核发出',
      trace: item.trace
    };

    if (item.isPublicLobby && item.visitorId) {
      await store.appendVisitorTurn(item.visitorId, approvedTurn, { countTurn: false });
    } else if (person) {
      await store.appendCallerTurn(person.id, approvedTurn, { countTurn: true });
    }

    await store.updateState(st => {
      st.approvals = st.approvals.filter(a => a.id !== approvalId);
      if (person) {
        const target = st.people.find(p => p.id === person.id);
        if (target) {
          target.servedCount = (target.servedCount || 0) + 1;
          target.lastActive = '刚刚';
        }
      }
      st.deliveries.unshift({
        id: `del-${randomUUID().slice(0, 8)}`,
        personId: item.personId,
        time: nowTimeLabel(),
        who: item.personName,
        whoNote: person?.role || '服务台测试',
        channel: item.channel.split(' · ')[0],
        summary: finalReply.slice(0, 52),
        statusLabel: dispatchStatus,
        statusTone: 'ok',
        trace: item.trace
      });
      st.deliveries = st.deliveries.slice(0, 40);
    }, { saveUndo: 'desk' });

    return { ok: true, statusLabel: dispatchStatus, reply: finalReply };
  }

  /**
   * Natural-language command bar processor for owner desk.
   */
  async function executeOwnerCommand(rawText) {
    const text = sanitizeSurfaceText(String(rawText || '').trim());
    if (!text) throw new Error('请输入指令或试跑提问');

    if (text.startsWith('加条红线') || text.startsWith('加红线') || text.startsWith('红线')) {
      const clean = text.replace(/^(加条红线|加红线|红线)[:：]?\s*/, '') || text;
      await store.updateState(st => {
        st.rules.push({ id: `r-${randomUUID().slice(0, 6)}`, kind: '红线', text: clean });
      }, { saveUndo: 'desk' });
      return { ok: true, kind: 'rule', message: `已新增拦截红线：${clean}` };
    }

    if (text.startsWith('加条规矩') || text.startsWith('加规矩') || text.startsWith('补充规矩') || text.includes('规矩：')) {
      const clean = text.replace(/^(加条规矩|加规矩|补充规矩|规矩)[:：]?\s*/, '') || text;
      await store.updateState(st => {
        st.rules.push({ id: `r-${randomUUID().slice(0, 6)}`, kind: '规矩', text: clean });
      }, { saveUndo: 'desk' });
      return { ok: true, kind: 'rule', message: `已记下新规矩：${clean}` };
    }

    const s = store.getState();
    const matchedPerson = s.people.find(p => text.includes(p.name));
    if (matchedPerson && (text.includes('暂停') || text.includes('关闭') || text.includes('停用'))) {
      await store.updateState(st => {
        const p = st.people.find(x => x.id === matchedPerson.id);
        if (p) { p.enabled = false; p.expiry = '已暂停'; }
      }, { saveUndo: 'desk' });
      return { ok: true, kind: 'person_toggle', message: `已暂停 ${matchedPerson.name} 的访问权限` };
    }
    if (matchedPerson && (text.includes('延长') || text.includes('恢复') || text.includes('开启'))) {
      const daysMatch = text.match(/(\d+)\s*天/);
      const days = daysMatch ? Number(daysMatch[1]) : 7;
      await store.updateState(st => {
        const p = st.people.find(x => x.id === matchedPerson.id);
        if (p) {
          p.enabled = true;
          p.expiry = `剩 ${days} 天试用`;
          p.expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;
        }
      }, { saveUndo: 'desk' });
      return { ok: true, kind: 'person_extend', message: `已为 ${matchedPerson.name} 开启并延长 ${days} 天试用权限` };
    }

    const testPrompt = text.replace(/^试跑提问[:：]?\s*/, '');
    const res = await handleInboundMessage({ question: testPrompt, isOwnerSelfTest: true });
    return { ok: true, kind: 'self_test', message: '已完成一轮本地只读试答', result: res };
  }

  /**
   * Execute an owner mobile/DM approval command parsed by `parseOwnerMobileCommand`.
   */
  async function resolveRemoteOwnerCommand(cmd) {
    if (!cmd || !cmd.kind) return '未识别的管理指令，可发送「待办」查看待拍板项。';
    const approvals = store.getState().approvals || [];

    if (cmd.kind === 'list') {
      if (approvals.length === 0) {
        return '当前没有待你拍板的草稿或红线拦截。';
      }
      const lines = approvals.slice(0, 5).map(a => {
        const code = a.shortCode || makeApprovalShortCode(a.id);
        return `• #${code}｜${a.personName}（${a.tag}）：${sanitizeSurfaceText(a.question || '').slice(0, 36)}`;
      });
      lines.push('', '回复「批准 #码」或「改 #码：你的最终回复」或「忽略 #码」即可远程拍板。');
      return lines.join('\n');
    }

    if (approvals.length === 0) {
      return '当前没有待处理的拍板项。';
    }

    const codeQuery = String(cmd.code || '').trim().toUpperCase();
    const target = codeQuery
      ? approvals.find(a =>
          (a.shortCode || makeApprovalShortCode(a.id)).toUpperCase() === codeQuery ||
          String(a.id || '').toUpperCase() === codeQuery
        )
      : approvals[0];

    if (!target) {
      return `未找到编号 #${codeQuery} 对应的待拍板项，请发送「待办」查看当前有效编号。`;
    }

    const resolvedCode = target.shortCode || makeApprovalShortCode(target.id);
    if (cmd.kind === 'dismiss') {
      await store.updateState(st => {
        st.approvals = st.approvals.filter(a => a.id !== target.id);
      }, { saveUndo: 'desk' });
      return `已忽略来自 ${target.personName} 的待办（#${resolvedCode}），不会对外发送。`;
    }

    if (cmd.kind === 'approve') {
      const res = await approveDraft(target.id, null);
      return `已拍板发出给 ${target.personName}（#${resolvedCode} · ${res.statusLabel}）。`;
    }

    if (cmd.kind === 'edit') {
      const res = await approveDraft(target.id, cmd.text);
      return `已按你的修改发出给 ${target.personName}（#${resolvedCode} · ${res.statusLabel}）。`;
    }

    if (cmd.kind === 'rule') {
      const cleanRule = sanitizeSurfaceText(String(cmd.text || '').trim());
      const res = await approveDraft(target.id, cleanRule);
      if (cleanRule) {
        await store.updateState(st => {
          if (!st.rules.some(r => r.text === cleanRule)) {
            st.rules.push({
              id: `r-mob-${randomUUID().slice(0, 6)}`,
              kind: '规矩',
              text: cleanRule
            });
          }
        }, { saveUndo: 'desk' });
      }
      return `已回复 ${target.personName} 并记为长期规矩（#${resolvedCode} · ${res.statusLabel}）。`;
    }

    return '未识别的操作指令。';
  }

  return {
    startExtraction,
    fastForwardExtraction,
    completeExtractionJob,
    recheckProjectDelta,
    confirmDeltaUpgrade,
    handleInboundMessage,
    handlePublicVisitorMessage,
    approveDraft,
    executeOwnerCommand,
    resolveRemoteOwnerCommand,
    getActiveTurns: () => [...activeTurns.values()],
    recordOwnerPresence,
    isOwnerPresentRecently,
    dispose,
    getPersonaPresets: () => TWIN_PERSONA_PRESETS,
    normalizeChannelId: channelIdFromSelection
  };
}
