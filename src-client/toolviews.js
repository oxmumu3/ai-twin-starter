/**
 * Inline `tool.call.toolview` cards rendered directly inside DSH chat streams
 * for `twin_status`, `twin_publish_workspace`, `twin_grant_access`, and `twin_inbox`.
 * Uses Dot V2 warm-paper & pine-green editorial tokens with rem typography and zero emojis.
 */
import React, { useEffect, useRef, useState } from 'react';
const h = React.createElement;
import {
  copyToClipboard,
  detectHostDarkMode,
  runTwinAction
} from './api.js';
import { ensureTwinStyles } from './styles.js';

function parseToolPayload(block) {
  if (!block) return null;
  const contents = Array.isArray(block.content) ? block.content : [];
  for (const part of contents) {
    if (part && part.type === 'text' && typeof part.text === 'string') {
      try {
        return JSON.parse(part.text);
      } catch {
        return { summary: part.text };
      }
    }
  }
  return null;
}

function parseRawArgs(block) {
  if (block?.args && typeof block.args === 'object') return block.args;
  const raw = block?.call?.argsRaw;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return {};
}

function useToolCardChrome() {
  const ref = useRef(null);
  const [scheme, setScheme] = useState('light');

  useEffect(() => {
    ensureTwinStyles();
    const update = () => setScheme(detectHostDarkMode(ref.current) ? 'dark' : 'light');
    update();
    if (typeof MutationObserver !== 'function') return;
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'data-color-scheme', 'style'] });
    if (document.body) {
      obs.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme', 'data-color-scheme', 'style'] });
    }
    return () => obs.disconnect();
  }, []);

  return { ref, scheme };
}

function CardShell({ toolLabel, pillText, pillTone = 'ok', phase, block, children }) {
  const { ref, scheme } = useToolCardChrome();
  const isError = Boolean(block?.isError);
  const running = phase && phase !== 'result';

  return h('div', {
    ref,
    className: 'tw-tv-card',
    'data-tw-scheme': scheme
  },
    h('div', { className: 'tw-tv-head' },
      h('div', { className: 'tw-tv-title-group' },
        h('span', { className: 'tw-tv-kicker' }, 'AI 分身工作台'),
        h('strong', { className: 'tw-tv-title' }, toolLabel)
      ),
      h('span', {
        className: `tw-tv-pill tw-tv-pill--${isError ? 'danger' : (running ? 'muted' : pillTone)}`
      }, isError ? '执行异常' : (running ? '处理中' : pillText))
    ),
    running
      ? h('div', { className: 'tw-tv-body' },
          h('p', { className: 'tw-tv-muted' }, '正在工作区隔离环境核对只读上下文与通道状态…')
        )
      : isError
        ? h('div', { className: 'tw-tv-body' },
            h('p', { className: 'tw-tv-error' }, block?.error?.message || '工具调用未完成，请打开左侧「AI 分身」面板查看详情。')
          )
        : h('div', { className: 'tw-tv-body' }, children)
  );
}

const DUTY_LABELS = {
  shadow: '影子试跑',
  live: '正式值班',
  off: '已暂停'
};

export function TwinStatusToolView(props) {
  const data = parseToolPayload(props.block) || {};
  const [dutyMode, setDutyMode] = useState(data.dutyMode || 'shadow');
  const [busy, setBusy] = useState(false);
  const [tip, setTip] = useState('');

  useEffect(() => {
    if (data.dutyMode) setDutyMode(data.dutyMode);
  }, [data.dutyMode]);

  async function switchDuty(nextMode) {
    if (busy || nextMode === dutyMode) return;
    setBusy(true);
    setTip('');
    try {
      await runTwinAction('set_duty_mode', { dutyMode: nextMode });
      setDutyMode(nextMode);
      setTip(`已切换为「${DUTY_LABELS[nextMode] || nextMode}」`);
    } catch (err) {
      setTip(err?.message || '切换值班模式失败');
    } finally {
      setBusy(false);
    }
  }

  const projects = Array.isArray(data.mountedProjects) ? data.mountedProjects : [];
  const channels = Array.isArray(data.channels) ? data.channels : [];
  const connectedChannels = channels.filter(c => c.enabled && c.configured);

  return h(CardShell, {
    toolLabel: data.twinProfile?.name || 'AI 分身值班状态',
    pillText: DUTY_LABELS[dutyMode] || dutyMode,
    pillTone: dutyMode === 'live' ? 'ok' : (dutyMode === 'off' ? 'muted' : 'amber'),
    phase: props.phase,
    block: props.block
  },
    data.summary && h('p', { className: 'tw-tv-summary' }, data.summary),
    h('div', { className: 'tw-tv-meta-row' },
      h('span', { className: 'tw-tv-chip' }, `已挂载项目 ${projects.length}`),
      h('span', { className: 'tw-tv-chip' }, `在线通道 ${connectedChannels.length}/${channels.length}`),
      h('span', { className: 'tw-tv-chip' }, `待拍板 ${data.pendingCount ?? 0}`),
      h('span', { className: 'tw-tv-chip' }, data.fullBloodAvailable ? '满血 DSH 隔离内核就绪' : '离线规则兜底')
    ),
    data.selfTestResult?.answer && h('div', { className: 'tw-tv-quote' },
      h('div', { className: 'tw-tv-quote-label' }, `自测答复（${data.selfTestResult.basis || '只读核对'}）`),
      h('div', { className: 'tw-tv-quote-text' }, data.selfTestResult.answer)
    ),
    h('div', { className: 'tw-tv-actions' },
      ['shadow', 'live', 'off'].map(mode => h('button', {
        key: mode,
        type: 'button',
        className: `tw-tv-btn ${dutyMode === mode ? 'tw-tv-btn--primary' : 'tw-tv-btn--subtle'}`,
        disabled: busy,
        onClick: () => switchDuty(mode)
      }, DUTY_LABELS[mode])),
      tip && h('span', { className: 'tw-tv-tip', role: 'status' }, tip)
    )
  );
}

export function TwinPublishToolView(props) {
  const data = parseToolPayload(props.block) || {};
  const [dutyMode, setDutyMode] = useState(data.dutyMode || 'shadow');
  const [busy, setBusy] = useState(false);
  const [tip, setTip] = useState('');

  useEffect(() => {
    if (data.dutyMode) setDutyMode(data.dutyMode);
  }, [data.dutyMode]);

  async function enableLiveDuty() {
    if (busy) return;
    setBusy(true);
    setTip('');
    try {
      await runTwinAction('set_duty_mode', { dutyMode: 'live' });
      setDutyMode('live');
      setTip('已开启正式值班模式');
    } catch (err) {
      setTip(err?.message || '切换失败');
    } finally {
      setBusy(false);
    }
  }

  const caps = Array.isArray(data.capabilities) ? data.capabilities : [];
  const proj = data.project || {};

  return h(CardShell, {
    toolLabel: proj.projectName ? `已发布「${proj.projectName}」分身` : '工作区能力发布',
    pillText: DUTY_LABELS[dutyMode] || '已提炼',
    pillTone: dutyMode === 'live' ? 'ok' : 'amber',
    phase: props.phase,
    block: props.block
  },
    data.summary && h('p', { className: 'tw-tv-summary' }, data.summary),
    h('div', { className: 'tw-tv-meta-row' },
      h('span', { className: 'tw-tv-chip' }, `只读文档 ${proj.docCount ?? 0}`),
      h('span', { className: 'tw-tv-chip' }, `屏蔽私密 ${proj.blockedSecretCount ?? 0}`),
      h('span', { className: 'tw-tv-chip' }, `拦截写脚本 ${proj.blockedWriteScriptCount ?? 0}`),
      data.feishuChannel?.connectionMode === 'official_cli' && h('span', { className: 'tw-tv-chip tw-tv-chip--accent' }, '0.2.3 官方飞书已连通')
    ),
    caps.length > 0 && h('div', { className: 'tw-tv-cap-list' },
      caps.slice(0, 4).map(cap => h('div', { key: cap.id || cap.name, className: 'tw-tv-cap-item' },
        h('strong', null, cap.name),
        cap.desc && h('span', null, cap.desc)
      ))
    ),
    h('div', { className: 'tw-tv-actions' },
      dutyMode !== 'live' && h('button', {
        type: 'button',
        className: 'tw-tv-btn tw-tv-btn--primary',
        disabled: busy,
        onClick: enableLiveDuty
      }, '切换到正式值班'),
      tip && h('span', { className: 'tw-tv-tip', role: 'status' }, tip)
    )
  );
}

export function TwinGrantToolView(props) {
  const data = parseToolPayload(props.block) || {};
  const args = parseRawArgs(props.block);
  const [copyTip, setCopyTip] = useState('');
  const person = data.person || {};
  const modeMap = {
    direct: '白名单直答',
    summary: '仅汇总口径',
    confirm: '草稿先审'
  };

  return h(CardShell, {
    toolLabel: person.name ? `已授权「${person.name}」` : '访客隔离授权',
    pillText: modeMap[person.mode] || person.channel || '已开通',
    pillTone: 'ok',
    phase: props.phase,
    block: props.block
  },
    data.summary && h('p', { className: 'tw-tv-summary' }, data.summary),
    h('div', { className: 'tw-tv-meta-row' },
      h('span', { className: 'tw-tv-chip' }, person.role || '协作者'),
      h('span', { className: 'tw-tv-chip' }, person.channel || args.channel || '免装试用网页'),
      h('span', { className: 'tw-tv-chip' }, person.expiry || '剩 7 天试用')
    ),
    data.guestUrl && h('div', { className: 'tw-tv-code-box' },
      h('span', { className: 'tw-tv-code-val' }, data.guestUrl),
      h('button', {
        type: 'button',
        className: 'tw-tv-btn tw-tv-btn--subtle',
        onClick: () => copyToClipboard(data.guestUrl, msg => setCopyTip(msg))
      }, '复制试用链接')
    ),
    data.pairCode && h('div', { className: 'tw-tv-code-box' },
      h('span', { className: 'tw-tv-code-val' }, `一次性配对口令：${data.pairCode}`),
      h('button', {
        type: 'button',
        className: 'tw-tv-btn tw-tv-btn--subtle',
        onClick: () => copyToClipboard(data.pairCode, msg => setCopyTip(msg))
      }, '复制配对码')
    ),
    data.qrAvailable && h('p', { className: 'tw-tv-muted' }, '已生成 5 分钟专属微信 iLink 扫码凭证，可在左侧「AI 分身 -> 服务对象」展开扫码绑定。'),
    copyTip && h('div', { className: 'tw-tv-tip', role: 'status' }, copyTip)
  );
}

function ApprovalCardItem({ item }) {
  const [draft, setDraft] = useState(item.draft || '');
  const [busy, setBusy] = useState(false);
  const [doneText, setDoneText] = useState('');
  const [errText, setErrText] = useState('');

  async function handleApprove(saveRule) {
    if (busy || doneText) return;
    setBusy(true);
    setErrText('');
    try {
      if (saveRule) {
        await runTwinAction('save_approval_as_rule', {
          approvalId: item.id,
          customDraft: draft,
          kind: '规矩',
          ruleText: `同类问题（${String(item.question || '').slice(0, 18)}）按已拍板回复为准`
        });
        setDoneText('已发出回执并记为长期规矩');
      } else {
        const res = await runTwinAction('approve_draft', {
          approvalId: item.id,
          customDraft: draft
        });
        setDoneText(res?.result?.statusLabel || '通道回执已送达');
      }
    } catch (err) {
      setErrText(err?.message || '处理审批失败');
    } finally {
      setBusy(false);
    }
  }

  async function handleDismiss() {
    if (busy || doneText) return;
    setBusy(true);
    setErrText('');
    try {
      await runTwinAction('dismiss_approval', { approvalId: item.id });
      setDoneText('已忽略此条待办');
    } catch (err) {
      setErrText(err?.message || '忽略失败');
    } finally {
      setBusy(false);
    }
  }

  const isDanger = item.tone === 'danger';

  return h('div', { className: `tw-tv-approval ${isDanger ? 'tw-tv-approval--danger' : ''}` },
    h('div', { className: 'tw-tv-approval-head' },
      h('span', { className: `tw-tv-pill tw-tv-pill--${isDanger ? 'danger' : 'amber'}` }, item.tag || '待拍板'),
      h('span', { className: 'tw-tv-approval-who' }, `${item.personName || '访客'} · ${item.channel || ''}`)
    ),
    item.headline && h('div', { className: 'tw-tv-approval-title' }, item.headline),
    item.question && h('div', { className: 'tw-tv-quote' },
      h('div', { className: 'tw-tv-quote-label' }, '对方原问题'),
      h('div', { className: 'tw-tv-quote-text' }, item.question)
    ),
    doneText
      ? h('div', { className: 'tw-tv-receipt', role: 'status' }, doneText)
      : [
          h('label', { key: 'l', className: 'tw-tv-label', htmlFor: `tv-draft-${item.id}` },
            `拟回复草稿${item.basisHint ? `（${item.basisHint}）` : ''}`
          ),
          h('textarea', {
            key: 't',
            id: `tv-draft-${item.id}`,
            className: 'tw-tv-textarea',
            rows: 3,
            value: draft,
            disabled: busy,
            onChange: e => setDraft(e.target.value)
          }),
          errText && h('div', { key: 'e', className: 'tw-tv-error' }, errText),
          h('div', { key: 'a', className: 'tw-tv-actions' },
            h('button', {
              type: 'button',
              className: 'tw-tv-btn tw-tv-btn--primary',
              disabled: busy || !draft.trim(),
              onClick: () => handleApprove(false)
            }, busy ? '发送中…' : (item.primaryActionLabel || '批准发出')),
            item.allowRuleExtract !== false && h('button', {
              type: 'button',
              className: 'tw-tv-btn tw-tv-btn--subtle',
              disabled: busy || !draft.trim(),
              onClick: () => handleApprove(true)
            }, '发出并记为规矩'),
            h('button', {
              type: 'button',
              className: 'tw-tv-btn tw-tv-btn--ghost',
              disabled: busy,
              onClick: handleDismiss
            }, '忽略')
          )
        ]
  );
}

export function TwinInboxToolView(props) {
  const data = parseToolPayload(props.block) || {};
  const approvals = Array.isArray(data.approvals) ? data.approvals : [];
  const deliveries = Array.isArray(data.recentDeliveries) ? data.recentDeliveries : [];

  return h(CardShell, {
    toolLabel: '收件箱与红线拍板',
    pillText: approvals.length > 0 ? `${approvals.length} 条待拍板` : '已清空',
    pillTone: approvals.length > 0 ? 'amber' : 'ok',
    phase: props.phase,
    block: props.block
  },
    data.summary && h('p', { className: 'tw-tv-summary' }, data.summary),
    data.resolved?.reply && h('div', { className: 'tw-tv-receipt', role: 'status' },
      `${data.resolved.statusLabel || '已完成'}：${String(data.resolved.reply).slice(0, 80)}`
    ),
    approvals.length > 0
      ? h('div', { className: 'tw-tv-approval-list' },
          approvals.map(item => h(ApprovalCardItem, { key: item.id, item }))
        )
      : h('p', { className: 'tw-tv-muted' },
          deliveries.length > 0
            ? `近期已送达 ${deliveries.length} 条记录（最近：${deliveries[0].who} · ${deliveries[0].statusLabel}）。`
            : '当前没有需要你本人拍板的越权拦截或待补口径问题。'
        )
  );
}
