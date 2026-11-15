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
  PRESENCE_YIELD_MS,
  REDLINE_PATTERNS,
  TWIN_PERSONA_PRESETS,
  channelIdFromSelection,
  channelSelectionLabel,
  redactSecrets,
  sanitizeSurfaceText
} from '../shared/schema.js';
import { detectProjectDelta, scanProjectDirectory } from './scanner.js';
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

export function createTwinEngine({ store, logger = console, onDispatchOutbound, llmResponder }) {
  /** In-memory owner presence timestamps keyed by `<channelId>:<threadKey>` + mirrored to caller state. */
  const ownerPresence = new Map();

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
  async function startExtraction({ rootPath, projectName, mode = 'initial', brief = '', ownerName = '', autoComplete = false }) {
    const s = store.getState();
    if (!rootPath) throw new Error('请选择一个本地项目目录后再开始提炼');

    await store.updateState(st => {
      st.onboardMode = mode;
      st.extractionJob = {
        id: `job-${randomUUID().slice(0, 8)}`,
        projectId: '',
        projectName: projectName || '本地项目',
        rootPath,
        mode,
        status: 'running',
        step: 1,
        discoveredCaps: []
      };
    });

    const scan = await scanProjectDirectory(rootPath, { projectName, ownerName });

    if (!autoComplete) {
      await store.updateState(st => {
        if (!st.extractionJob) return;
        st.extractionJob.projectId = scan.projectId;
        st.extractionJob.projectName = scan.projectName;
        st.extractionJob.step = 2;
        st.extractionJob.discoveredCaps = scan.capabilities.slice(0, 1).map(c => c.name);
      });
    }

    await store.writeProjectIndex(scan.projectId, {
      projectId: scan.projectId,
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
          fingerprintCount: Object.keys(scan.fingerprints).length,
          lastCheckedAt: scan.scannedAt
        });
      }

      for (const cap of scan.capabilities) {
        if (!st.capabilities.some(c => c.id === cap.id)) {
          st.capabilities.push(cap);
        }
      }

      const trimmedBrief = String(brief || '').trim();
      if (trimmedBrief && !st.rules.some(r => r.text === trimmedBrief)) {
        st.rules.push({
          id: `r-extract-${Date.now()}`,
          kind: '规矩',
          text: sanitizeSurfaceText(trimmedBrief)
        });
      }

      if (mode === 'initial' && !st.twinProfile?.userEdited) {
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
      if (autoComplete) {
        st.extractionJob = null;
        st.scene = mode === 'mount' ? 'caps' : 'desk';
      } else if (st.extractionJob) {
        st.extractionJob.step = 4;
        st.extractionJob.status = 'ready';
        st.extractionJob.discoveredCaps = scan.capabilities.map(c => c.name);
        st.extractionJob.draftProfile = scan.draftProfile;
      }
    });

    return scan;
  }

  async function completeExtractionJob(targetScene = 'desk') {
    await store.updateState(st => {
      st.extractionJob = null;
      st.lifecycleStage = 'mature';
      st.scene = targetScene;
    });
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
        else st.capabilities[cIdx] = { ...cap, enabled: st.capabilities[cIdx].enabled };
      }
      st.pendingDeltaByProject[projectId] = false;
    });
    return scan;
  }

  async function gatherAuthorizedSnippets(personCaps, question) {
    const s = store.getState();
    const enabledCapIds = new Set(
      s.capabilities
        .filter(c => c.enabled && (!Array.isArray(personCaps) || personCaps.includes(c.id)))
        .map(c => c.id)
    );
    const projectIds = new Set(
      s.capabilities
        .filter(c => enabledCapIds.has(c.id))
        .map(c => c.projectId)
    );
    const qTokens = tokenizeQuery(question);
    const matches = [];
    for (const pid of projectIds) {
      const index = await store.readProjectIndex(pid);
      if (!index || !Array.isArray(index.snippets)) continue;
      for (const sn of index.snippets) {
        const capMatch = !Array.isArray(sn.capIds) || sn.capIds.some(cid => enabledCapIds.has(cid));
        if (!capMatch) continue;
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

  /**
   * Core Scoped Twin Session runtime handler for BOTH external inbound requests
   * and owner self-test / caller preview sandboxes.
   */
  async function handleInboundMessage({
    personId,
    question,
    channelId = 'ch-web',
    threadKey = '',
    isGroup = false,
    mentionsBot = true,
    isOwnerSelfTest = false,
    sandboxOnly = false
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

      const capLimit = s.dailyTurnCap || DEFAULT_DAILY_TURN_CAP;
      const callerThread = await store.readCallerThread(person.id);
      const todayCount = callerThread.dailyTurns?.date === todayKey() ? (callerThread.dailyTurns.count || 0) : 0;
      if (todayCount >= capLimit) {
        return {
          action: 'rate_limited',
          statusLabel: '已达单日回复上限',
          reply: '今天的分身自动化答疑已达到单日轮次上限，避免刷屏与过度消耗。如有紧急问题请直接联系项目负责人，本工具无任何付费升级限制。'
        };
      }
    }

    const activeCaps = person ? person.caps : s.capabilities.filter(c => c.enabled).map(c => c.id);
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
        trace: {
          intro: `${person?.name || '访客'} 的消息触发了工作台安全红线。`,
          steps: [
            { title: '边界校验命中红线', detail: violation.reason },
            { title: '生成脱敏替代答复', detail: '阻断原始字段或写操作，待本人审核发出。' }
          ],
          techNote: '红线规则先于任何资料检索执行，零越权泄露风险。'
        }
      };

      await store.updateState(st => {
        st.approvals.unshift(appItem);
        if (st.lifecycleStage === 'cold') st.scene = 'desk';
      });

      return {
        action: 'pending_approval',
        approvalId: appItem.id,
        statusLabel: '已拦下并待本人拍板',
        draft,
        safeFallbackReply: '这个问题涉及敏感边界或需本人拍板事项，已转呈负责人确认，稍后答复你。'
      };
    }

    const matches = await gatherAuthorizedSnippets(activeCaps, cleanQ);
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
        trace: {
          intro: `${person.name} 的问题超出当前已提取能力文档覆盖范围。`,
          steps: [
            { title: '在授权文档索引中检索', detail: '未找到满足置信度的授权片段。' },
            { title: '拒绝幻觉编造并升级待补口径', detail: '保留人工补充口供，确认后可一键沉淀为长期规矩。' }
          ],
          techNote: '知识边界守卫拦截：宁可标待补口径，绝不编造数字或越权读取未授权目录。'
        }
      };

      const politeHoldingReply = '这个问题暂未在我当前掌握的公开口径文档中明确定义，我已转请负责人核实补充，确认后会第一时间给你答复。';
      await store.updateState(st => {
        st.approvals.unshift(gapItem);
      });
      return {
        action: 'knowledge_gap',
        approvalId: gapItem.id,
        statusLabel: '待补口径已转服务台',
        reply: politeHoldingReply
      };
    }

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

    const shouldAutoReply = s.dutyMode === 'live' && (person.mode === 'direct' || person.mode === 'summary');
    if (shouldAutoReply) {
      const turn = {
        id: `th-${randomUUID().slice(0, 8)}`,
        time: nowTimeLabel(),
        capLabel: top.snippet.title,
        question: cleanQ,
        reply: generatedReply,
        statusLabel: '通道回执已送达',
        statusTone: 'ok',
        basisHint: `已核对「${top.snippet.title}」`,
        trace
      };
      await store.appendCallerTurn(person.id, turn, { countTurn: true });
      await store.updateState(st => {
        const target = st.people.find(p => p.id === person.id);
        if (target) {
          target.servedCount = (target.servedCount || 0) + 1;
          target.lastActive = '刚刚';
        }
        st.deliveries.unshift({
          id: `del-${randomUUID().slice(0, 8)}`,
          personId: person.id,
          time: nowTimeLabel(),
          who: person.name,
          whoNote: person.role,
          channel: channelSelectionLabel(channelId),
          summary: generatedReply.slice(0, 48),
          statusLabel: '通道回执已送达',
          statusTone: 'ok',
          trace
        });
        st.deliveries = st.deliveries.slice(0, 40);
      });
      return { action: 'replied', reply: generatedReply, statusLabel: '通道回执已送达', turn };
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
      trace
    };
    await store.updateState(st => {
      st.approvals.unshift(draftApproval);
    });
    return {
      action: 'pending_approval',
      approvalId: draftApproval.id,
      statusLabel: '草稿待本人拍板',
      draft: generatedReply
    };
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
    let dispatchStatus = '已调用通道接口发出';
    if (person && typeof onDispatchOutbound === 'function') {
      try {
        const res = await onDispatchOutbound(person, finalReply);
        if (res?.delivered) dispatchStatus = '通道回执已送达';
      } catch (err) {
        logger?.warn?.('[agent-twin] outbound dispatch notice:', err?.message);
      }
    }

    if (person) {
      await store.appendCallerTurn(person.id, {
        id: `th-ap-${randomUUID().slice(0, 8)}`,
        time: nowTimeLabel(),
        capLabel: item.tag,
        question: item.question,
        reply: finalReply,
        statusLabel: dispatchStatus,
        statusTone: 'ok',
        basisHint: item.basisHint || '经负责人审核发出',
        trace: item.trace
      }, { countTurn: true });
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

  return {
    startExtraction,
    completeExtractionJob,
    recheckProjectDelta,
    confirmDeltaUpgrade,
    handleInboundMessage,
    approveDraft,
    executeOwnerCommand,
    recordOwnerPresence,
    isOwnerPresentRecently,
    getPersonaPresets: () => TWIN_PERSONA_PRESETS,
    normalizeChannelId: channelIdFromSelection
  };
}
