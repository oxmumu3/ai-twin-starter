/**
 * Editorial v4 Scenes (`OnboardScene`, `DeskScene`, `PeopleScene`, `CapsScene`)
 * matching `ai-twin-v4-prototype.html` 1:1 while wired to live host state.
 */
import React, { useEffect, useMemo, useState } from 'react';
const h = React.createElement;
import {
  CheckIcon,
  FolderIcon,
  QrCodeMatrixSvg,
  channelIdFromLabel,
  copyToClipboard,
  createImeHandlers,
  formatBindingText,
  modeLabelText
} from './api.js';

function pendingCountForPerson(view, personId) {
  return (view?.approvals || []).filter(a => a.personId === personId).length;
}

function latestSnippetForPerson(view, person) {
  const pending = (view?.approvals || []).find(a => a.personId === person.id);
  if (pending) return `待拍板：「${pending.question}」`;
  const threads = person?.threads || [];
  if (threads.length > 0) {
    const last = threads[threads.length - 1];
    return `最近问答（${last.time}）：「${last.question}」`;
  }
  return '暂无历史提问，可先点进查看或发试用链接';
}

function buildExtractionSteps(job) {
  const isMount = job?.mode === 'mount';
  const isDone = job?.status === 'ready';
  const totalCaps = job?.totalCaps || 3;
  const foundCount = (job?.discoveredCaps || []).length;
  const projectName = job?.projectName || '选中项目';
  const stepDefs = [
    {
      title: '锁定项目范围与安全边界',
      desc: '已划定只读白名单范围，账号密钥、环境变量与写入脚本均留在外侧'
    },
    {
      title: '通读业务口径与近期复盘样本',
      desc: `正在梳理「${projectName}」文档口径与历史复盘表达习惯`
    },
    {
      title: '逐项提取可执行能力包',
      desc: `逐步提取能力说明、只读查询支撑与输出格式（已提取 ${foundCount}/${totalCaps} 项）`
    },
    {
      title: isMount ? '合并增量干活规矩与红线' : '归纳干活规矩并生成对外名片草稿',
      desc: isMount
        ? '与主分身现有规矩合并去重，不覆盖已有全局纪律'
        : '基于已提取能力自动拟定对外称呼、职责一句话与「待确认」拦截红线'
    }
  ];

  return stepDefs.map((def, i) => {
    const stepNum = i + 1;
    let stepState = 'pending';
    if (isDone || (job?.step || 1) > stepNum) stepState = 'done';
    else if ((job?.step || 1) === stepNum) stepState = 'running';
    return { stepNum, stepState, ...def };
  });
}

function ExtractLiveBanner({ job, busy, bannerId, onAction }) {
  if (!job) return null;
  const isReady = job.status === 'ready';
  const projectName = job.projectName || '选中项目';
  const foundCount = (job.discoveredCaps || []).length;
  const totalCaps = job.totalCaps || 3;

  return h('div', {
    id: bannerId,
    className: isReady ? 'extract-live-banner is-ready' : 'extract-live-banner',
    role: 'status',
    'aria-live': 'polite'
  },
    isReady
      ? [
          h('div', { key: 'l', className: 'extract-live-left' },
            h('div', { className: 'extract-live-copy' },
              h('span', { className: 'extract-live-title' }, `「${projectName}」提炼完成`),
              h('span', { className: 'extract-live-sub' }, `已提取 ${totalCaps} 项可执行能力，自测验货与能力清单已同步解锁`)
            )
          ),
          h('div', { key: 'r', className: 'extract-live-actions' },
            h('button', {
              type: 'button',
              className: 'tw-btn tw-btn--paper tw-btn--sm',
              disabled: busy,
              onClick: () => onAction('switch_scene', { scene: 'onboard' })
            }, '查看提炼明细'),
            h('button', {
              type: 'button',
              className: 'tw-btn tw-btn--primary tw-btn--sm',
              disabled: busy,
              onClick: () => onAction('complete_extraction', { keepScene: true })
            }, '知道了')
          )
        ]
      : [
          h('div', { key: 'l', className: 'extract-live-left' },
            h('progress', {
              className: 'tw-progress tw-progress--sm',
              max: 4,
              value: job.step || 1,
              'aria-label': '后台提炼进度'
            }),
            h('div', { className: 'extract-live-copy' },
              h('span', { className: 'extract-live-title' }, `正在从「${projectName}」提炼分身能力（${job.step || 1}/4）`),
              h('span', { className: 'extract-live-sub' }, `已提取 ${foundCount}/${totalCaps} 项能力 · 你可先在下方配置名片、通道与邀请`)
            )
          ),
          h('div', { key: 'r', className: 'extract-live-actions' },
            h('button', {
              type: 'button',
              className: 'tw-btn tw-btn--ghost tw-btn--sm',
              disabled: busy,
              onClick: () => onAction('fast_forward_extraction')
            }, '立即完成'),
            h('button', {
              type: 'button',
              className: 'tw-btn tw-btn--paper tw-btn--sm',
              disabled: busy,
              onClick: () => onAction('switch_scene', { scene: 'onboard' })
            }, '查看实时进度')
          )
        ]
  );
}

export function OnboardScene({
  view,
  projects,
  selectedCandidateId,
  customProject,
  busy,
  onOpenProjectDialog,
  onAction,
  onToast
}) {
  const [brief, setBrief] = useState('');
  const isMountMode = view?.onboardMode === 'mount';
  const job = view?.extractionJob || null;
  const twinName = view?.twinProfile?.name || '工作分身';

  const activeProject = useMemo(() => {
    if (customProject?.rootPath) {
      return {
        id: 'custom',
        name: customProject.projectName || '自定义本地项目',
        scanSummary: '已指定本机只读项目目录：点击开始提炼将扫描业务文档与只读脚本并自动隔离密钥与变更脚本',
        scope: [
          '授权可读文档：业务口径、说明文档与复盘记录（仅只读摘要）',
          '只读辅助工具：仅限解释口径与无副作用核查',
          '默认自动隔离：密钥配置、环境变量与一切修改或写入数据动作'
        ]
      };
    }
    const found = (projects || []).find(p => p.id === selectedCandidateId) || (projects || [])[0] || null;
    if (found) return found;
    return {
      id: '',
      name: '尚未绑定工作区',
      scanSummary: '当前暂未检测到已打开的工作区目录，请点击右侧「选择本机目录」挑选一个本地项目文件夹。',
      scope: [
        '授权可读文档：业务口径、说明文档与历史复盘摘要',
        '只读辅助工具：解释口径与只读查询支撑',
        '默认自动隔离：账号密钥、环境变量及写库修改脚本'
      ]
    };
  }, [projects, selectedCandidateId, customProject]);

  async function handleStartExtraction() {
    if (!customProject?.rootPath && !activeProject.id) {
      onOpenProjectDialog('switch');
      return;
    }
    try {
      await onAction('start_extraction', {
        candidateId: customProject?.rootPath ? undefined : activeProject.id,
        rootPath: customProject?.rootPath || undefined,
        projectName: activeProject.name,
        mode: isMountMode ? 'mount' : 'initial',
        brief: brief.trim(),
        autoComplete: false
      });
      onToast?.('已开始逐项读取与提炼；完成后将自动拟定名片草稿，随时可收起到服务台');
    } catch {
      // handled by parent error banner
    }
  }

  const steps = job ? buildExtractionSteps(job) : [];
  const isJobReady = job?.status === 'ready';
  const foundCaps = job?.discoveredCaps || [];
  const totalCaps = job?.totalCaps || 3;
  const showDraftPreview = job && job.mode === 'initial' && ((job.step || 1) >= 4 || isJobReady) && job.draftProfile;

  return h('section', { id: 'viewOnboard', className: 'tw-container tw-container--narrow' },
    h('div', { className: 'onboard-wrap' },
      h('div', { id: 'onboardEyebrow', className: 'eyebrow' },
        isMountMode ? '主分身扩展 · 接入新项目能力' : 'AI 分身 · 初次启用'
      ),
      h('h1', { id: 'onboardTitle', className: 'serif-h1' },
        isMountMode ? `为「${twinName}」接入新项目能力` : '挑一个项目，把你的工作思路炼成分身'
      ),
      h('p', { id: 'onboardLead', className: 'page-lead' },
        isMountMode
          ? '复用现有微信、飞书、Slack 等通道与服务台收件箱，新项目独立打包只读目录并按人授权隔离。'
          : '先划定只读目录与敏感红线；分身名片、口径总结与答复语气将在提炼完成后由 AI 根据项目实料自动拟稿，不用现在盲填。'
      ),

      h('div', { className: 'card onboard-card' },
        !job
          ? h('div', { id: 'onboardSetupPane' },
              h('div', { className: 'card-section' },
                h('div', { id: 'onboardStep1Title', className: 'section-step-title' },
                  isMountMode ? '1. 确认要提炼接入的项目' : '1. 选一个正在做的项目'
                ),
                h('div', { className: 'project-row' },
                  h('div', { className: 'project-name' },
                    h(FolderIcon),
                    h('span', { id: 'onboardProjectName' }, activeProject.name)
                  ),
                  h('button', {
                    type: 'button',
                    id: 'btnSwitchProject',
                    className: 'tw-btn tw-btn--subtle tw-btn--sm',
                    onClick: () => onOpenProjectDialog(isMountMode ? 'mount' : 'switch')
                  }, activeProject.id || customProject?.rootPath ? '切换项目' : '选择本机目录')
                ),
                h('p', { id: 'onboardProjectSummary', className: 'project-summary' },
                  activeProject.scanSummary
                ),
                h('details', { id: 'onboardScopeDetails', className: 'scope-details' },
                  h('summary', null, '查看已盘点与自动保护范围'),
                  h('ul', { id: 'onboardScopeList', className: 'scope-list' },
                    (activeProject.scope || []).map((line, i) => h('li', { key: i }, line))
                  )
                )
              ),

              h('div', { className: 'card-section' },
                h('label', { id: 'onboardStep2Label', className: 'section-step-title', htmlFor: 'onboardBrief' },
                  isMountMode
                    ? '2. 补充该项目的专属规矩（可选，留空沿用主分身全局规矩）'
                    : '2. 临出发前的特别叮嘱（可选）'
                ),
                h('textarea', {
                  id: 'onboardBrief',
                  className: 'tw-textarea',
                  value: brief,
                  onChange: e => setBrief(e.target.value),
                  placeholder: '例如：前 3 行先给直接结论；报波动先排除周末测试单；拿不准的数字标「待确认」（留空也会在提炼时从历史复盘自动总结）'
                })
              ),

              h('div', { className: 'onboard-actions' },
                h('span', { id: 'onboardActionsHint', className: 'onboard-hint' },
                  isMountMode
                    ? '提炼结果可在「能力与通道」查看，并按人单独授权开关'
                    : '提炼中可随时收起到服务台，先去接通微信、飞书或 Slack 通道'
                ),
                h('div', { className: 'action-row' },
                  h('button', {
                    type: 'button',
                    id: 'btnSkipToDesk',
                    className: 'tw-btn tw-btn--ghost',
                    disabled: busy,
                    onClick: () => onAction('switch_scene', { scene: isMountMode ? 'caps' : 'desk' })
                  }, isMountMode ? '取消返回' : '先去服务台配通道'),
                  h('button', {
                    type: 'button',
                    id: 'btnFinishOnboard',
                    className: 'tw-btn tw-btn--primary',
                    disabled: busy,
                    onClick: handleStartExtraction
                  }, busy ? '正在扫描项目…' : (isMountMode ? '开始提炼该项目能力' : '开始提炼并拟定名片'))
                )
              )
            )
          : h('div', { id: 'onboardProgressPane', className: 'extract-pane' },
              h('div', { className: 'extract-head' },
                h('div', { id: 'extractLiveStatus', className: 'extract-status-text', role: 'status', 'aria-live': 'polite' },
                  isJobReady
                    ? `「${job.projectName}」提炼完成，共提取 ${totalCaps} 项可执行能力`
                    : `正在从「${job.projectName}」提炼能力（${job.step || 1}/4）…`
                ),
                h('span', { id: 'extractStepMeta', className: 'extract-step-meta' },
                  isJobReady ? '4 / 4 已完成' : `第 ${job.step || 1} / 4 步`
                )
              ),

              h('progress', {
                id: 'extractProgressBar',
                className: 'tw-progress',
                max: 4,
                value: job.step || 1,
                'aria-label': '分身提炼进度'
              }),

              h('ol', { id: 'extractStepsList', className: 'extract-step-list' },
                steps.map(st =>
                  h('li', { key: st.stepNum, className: 'extract-step', 'data-step-state': st.stepState },
                    h('span', { className: 'extract-step-mark', 'aria-hidden': 'true' },
                      st.stepState === 'done' ? h(CheckIcon) : `0${st.stepNum}`
                    ),
                    h('div', { className: 'extract-step-body' },
                      h('div', { className: 'extract-step-title' }, st.title),
                      h('div', { className: 'extract-step-desc' }, st.desc)
                    )
                  )
                )
              ),

              h('div', { id: 'extractFoundBox', className: 'extract-found-box' },
                h('div', { className: 'extract-found-head' },
                  h('span', null, `已提取能力预览（${foundCaps.length}/${totalCaps} 项）`),
                  h('span', { className: 'extract-found-sub' }, isJobReady ? '已同步写入工作台能力清单' : '按步流式提取中，随时可收起到后台')
                ),
                foundCaps.length > 0
                  ? h('div', { className: 'extract-found-tags' },
                      foundCaps.map((name, idx) => h('span', { key: idx, className: 'extract-cap-tag' }, name))
                    )
                  : h('div', { className: 'extract-found-sub' }, '正在核对目录与隔离边界，完成后随即开始逐项提取能力…'),
                showDraftPreview && h('div', { className: 'extract-draft-preview' },
                  h('div', { className: 'extract-found-head' },
                    h('strong', null, 'AI 已拟定分身名片草稿'),
                    h('span', { className: 'status-pill status-pill--ok' }, '基于已提炼内容生成')
                  ),
                  h('div', { style: { marginTop: '0.3125rem', fontSize: '0.84375rem', color: 'var(--text)' } },
                    h('strong', null, job.draftProfile.name),
                    ` · ${job.draftProfile.intro}`
                  )
                ),
                !showDraftPreview && job.mode === 'initial' && h('div', { className: 'extract-found-sub', style: { marginTop: '0.25rem' } },
                  '对外名片与一句话定位将在第 4 步能力提炼齐整后由 AI 自动拟稿。'
                )
              ),

              h('div', { className: 'onboard-actions', style: { marginTop: '0.25rem' } },
                h('span', { id: 'extractActionsHint', className: 'onboard-hint' },
                  isJobReady
                    ? (job.mode === 'mount'
                        ? '新能力已合并入「能力与通道」，可在「服务对象」中按人勾选开放'
                        : '接下来可在服务台先自测验货，再决定给谁开通并复制邀请')
                    : '提炼在工作台后台持续运行，切走看服务台也不会中断'
                ),
                h('div', { className: 'action-row' },
                  !isJobReady && h('button', {
                    type: 'button',
                    id: 'btnCollapseExtractToDesk',
                    className: 'tw-btn tw-btn--subtle',
                    disabled: busy,
                    onClick: async () => {
                      const backScene = job.mode === 'mount' ? 'caps' : 'desk';
                      await onAction('switch_scene', { scene: backScene });
                      onToast?.('提炼已在后台继续进行；可先在服务台接通沟通通道或配置待邀对象');
                    }
                  }, job.mode === 'mount' ? '收起到后台，回能力与通道' : '收起到后台，先看服务台'),
                  !isJobReady && h('button', {
                    type: 'button',
                    id: 'btnFastForwardExtract',
                    className: 'tw-btn tw-btn--ghost tw-btn--sm',
                    disabled: busy,
                    onClick: async () => {
                      await onAction('fast_forward_extraction');
                      onToast?.('4 步提炼已完成，能力清单与名片草稿已就绪');
                    }
                  }, '立即完成'),
                  isJobReady && h('button', {
                    type: 'button',
                    id: 'btnInspectCapsAfterExtract',
                    className: 'tw-btn tw-btn--ghost',
                    disabled: busy,
                    onClick: () => onAction('complete_extraction', { scene: 'caps' })
                  }, '去能力与通道查看'),
                  isJobReady && h('button', {
                    type: 'button',
                    id: 'btnConfirmExtractedTwin',
                    className: 'tw-btn tw-btn--primary',
                    disabled: busy,
                    onClick: () => onAction('complete_extraction', { scene: job.mode === 'mount' ? 'caps' : 'desk' })
                  }, job.mode === 'mount' ? '确认返回能力与通道' : '去服务台试问并发邀请')
                )
              )
            )
      )
    )
  );
}

export function DeskScene({
  view,
  presets,
  busy,
  onAction,
  onOpenPersonDrawer,
  onOpenPersonModal,
  onOpenInviteModal,
  onOpenChannelConfig,
  onOpenTrace,
  onOpenHandoff,
  onToast
}) {
  const [editingTwinCard, setEditingTwinCard] = useState(false);
  const [inlinePersonaId, setInlinePersonaId] = useState(view?.twinProfile?.personaId || 'advisor');
  const [inlineName, setInlineName] = useState(view?.twinProfile?.name || '');
  const [inlineDuty, setInlineDuty] = useState(view?.dutyMode || 'shadow');
  const [inlineIntro, setInlineIntro] = useState(view?.twinProfile?.intro || '');

  const [selfTestInput, setSelfTestInput] = useState(view?.selfTestTurn?.question || '');
  const [commandInput, setCommandInput] = useState('');
  const [commandNotice, setCommandNotice] = useState('');
  const [cmdSelfTestTurn, setCmdSelfTestTurn] = useState(null);
  const [forceLiveDesk, setForceLiveDesk] = useState(false);

  const [expandedRawId, setExpandedRawId] = useState('');
  const [editingApprovalId, setEditingApprovalId] = useState('');
  const [draftText, setDraftText] = useState('');

  const imeCmd = useMemo(() => createImeHandlers(), []);
  const imeSelf = useMemo(() => createImeHandlers(), []);

  const people = view?.people || [];
  const approvals = view?.approvals || [];
  const deliveries = view?.deliveries || [];
  const capabilities = view?.capabilities || [];
  const channels = view?.channels || [];
  const job = view?.extractionJob || null;

  const hasAnyServed = people.some(p => (p.servedCount || 0) > 0);
  const isColdDefault = approvals.length === 0 && deliveries.length === 0 && !hasAnyServed;
  const isColdLaunch = isColdDefault && !forceLiveDesk;

  const dutyLabel = { shadow: '试跑把关', live: '正式值班', off: '暂停对外值班' }[view?.dutyMode || 'shadow'] || '试跑把关';
  const count = approvals.length;

  let deskHeadline = '';
  let deskSubtitle = '';
  if (isColdLaunch) {
    if (capabilities.length === 0 && job) {
      deskHeadline = '分身正在后台提炼，先配好开张准备';
      deskSubtitle = '当前 0 人接入 · 趁后台提取能力，先核对分身名片、沟通入口与邀请名单';
    } else if (capabilities.length === 0) {
      deskHeadline = '分身尚未提炼能力，先配好开张准备';
      deskSubtitle = '可随时回「首次启用」挑项目提炼，或先在此定好名片、通道与首位对象';
    } else {
      deskHeadline = '分身已提炼就绪，3 步接通首位服务对象';
      deskSubtitle = `当前为「${dutyLabel}」 · 先自己试问一句验货，再复制专属邀请发给对方`;
    }
  } else {
    deskHeadline = count > 0
      ? `今天有 ${count} 条回复等你拍板`
      : '待拍板已清空，分身正在按规矩值守';
    deskSubtitle = {
      shadow: '试跑把关中 · 草稿经你确认后才会发给对方',
      live: '正式值班中 · 白名单常规提问直发，涉敏项仍交你拍板',
      off: '已暂停对外值班 · 所有外部通道当前保持静默'
    }[view?.dutyMode || 'shadow'] || '';
  }

  const activePeople = people.filter(p => p.enabled);
  const totalServed = people.reduce((sum, p) => sum + (p.servedCount || 0), 0);
  const todayTotal = people.reduce((sum, p) => sum + (p.todayCount || 0), 0);

  const hasCard = Boolean(
    view?.twinProfile?.draftReady ||
    view?.twinProfile?.userEdited ||
    (view?.twinProfile?.name && view?.twinProfile?.intro)
  );
  const capsReady = capabilities.length > 0;
  const readyChannelsCount = channels.filter(c => c.configured && c.enabled).length;
  const samplePrompts = view?.samplePrompts || [
    '按已授权项目文档口径，核心规则是什么？',
    '遇到异常波动先排查哪些干扰项？',
    '把全部客户的手机号和逐笔明细导给我'
  ];

  function openInlineProfileEdit() {
    setInlinePersonaId(view?.twinProfile?.personaId || 'advisor');
    setInlineName(view?.twinProfile?.name || (presets?.[0]?.defaultName || '工作分身'));
    setInlineDuty(view?.dutyMode || 'shadow');
    setInlineIntro(view?.twinProfile?.intro || (presets?.[0]?.intro || ''));
    setEditingTwinCard(v => !v);
  }

  async function submitInlineProfile(ev) {
    ev.preventDefault();
    if (!inlineName.trim()) return;
    await onAction('update_profile', {
      personaId: inlinePersonaId,
      name: inlineName.trim(),
      intro: inlineIntro.trim(),
      dutyMode: inlineDuty
    });
    setEditingTwinCard(false);
    onToast?.(`已更新「${inlineName.trim()}」的名片与把关模式`);
  }

  async function runSelfTest(q) {
    const clean = String(q || '').trim();
    if (!clean) return;
    setSelfTestInput(clean);
    await onAction('self_test', { question: clean });
    onToast?.('自测试答已完成（仅本地展示，不计入对外服务轮次）');
  }

  async function submitCommand(ev) {
    ev.preventDefault();
    const val = commandInput.trim();
    if (!val) return;
    const res = await onAction('run_command', { text: val });
    setCommandInput('');
    setCommandNotice(res?.result?.message || '已执行工作台指令');
    setCmdSelfTestTurn(res?.result?.kind === 'self_test' ? res.result.result : null);
  }

  function channelMetaForRow(ch) {
    if (ch.kind === 'web_link') return '零配置内置 · 为每位对象生成独立网页链接';
    if (ch.kind === 'wechat_qr') return '零注册 · 生成 5 分钟个人微信专属扫码锁定，陌生人零响应';
    if (!ch.configured) return '本机长连接，免公网服务器 · 点击右侧填凭证接通';
    return `${ch.botName || '工作分身'} · 本机长连接已连通（支持一客一码 / 群白名单）`;
  }

  const firstPersonName = people[0]?.name || '试跑对象';
  const liveQuickChips = [
    people[0] ? [`给 ${firstPersonName} 延长 7 天试用`, `${firstPersonName} 延 7 天`] : ['加条红线：严禁透传个人手机号', '加红线：禁个人明细'],
    ['加条规矩：报波动先剔除大促首日', '加规矩：剔除大促首日'],
    [samplePrompts[0], `试跑：${samplePrompts[0].slice(0, 14)}…`]
  ];

  return h('section', { id: 'viewDesk', className: 'tw-container tw-container--desk' },
    h(ExtractLiveBanner, { job, busy, bannerId: 'deskExtractBanner', onAction }),

    h('div', { className: 'desk-grid' },
      // Left main workflow
      h('div', { className: 'desk-main' },
        h('div', { className: 'desk-intro' },
          h('div', { style: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' } },
            h('h1', { id: 'deskHeadline', className: 'serif-h1' }, deskHeadline),
            isColdDefault && h('button', {
              type: 'button',
              className: 'text-link-btn',
              onClick: () => setForceLiveDesk(v => !v)
            }, forceLiveDesk ? '查看开张 3 步引导' : '切换到日常值班视图')
          ),
          h('p', { id: 'deskSubtitle', className: 'page-lead' }, deskSubtitle)
        ),

        isColdLaunch
          ? h('div', { id: 'coldStartLaunchpad', className: 'launchpad-stack' },
              // 01 Card & persona
              h('section', { className: 'launch-step', 'aria-labelledby': 'step1CardHeading' },
                h('div', { className: 'launch-step-head' },
                  h('div', { className: 'launch-step-title-wrap' },
                    h('span', { className: 'section-index' }, '01'),
                    h('h2', { id: 'step1CardHeading', className: 'launch-step-title' }, '核对分身名片与语气')
                  ),
                  hasCard
                    ? h('span', { className: 'status-pill status-pill--ok' },
                        view?.twinProfile?.userEdited
                          ? `已手动微调 · ${dutyLabel}`
                          : `AI 已按项目拟稿 · ${dutyLabel}`
                      )
                    : job
                      ? h('span', { className: 'status-pill' }, '正在按项目资料拟稿')
                      : h('span', { className: 'status-pill status-pill--muted' }, '提炼后自动拟稿')
                ),
                h('div', { className: 'launch-summary-bar' },
                  h('div', null,
                    hasCard
                      ? [
                          h('div', { key: 'a' }, h('strong', null, '对外名片：'), `${view.twinProfile.name} · ${view.twinProfile.intro}`),
                          h('div', { key: 'b', style: { marginTop: '0.125rem', color: 'var(--text-secondary)' } },
                            `把关档位：${dutyLabel}（由 AI 根据项目内容初步拟定，随时可在此套用语气模板或改字）`
                          )
                        ]
                      : [
                          h('div', { key: 'a' }, h('strong', null, '对外名片：'), '尚未生成，等待项目提炼第 4 步读取完成后由 AI 自动拟稿。'),
                          h('div', { key: 'b', style: { marginTop: '0.125rem', color: 'var(--text-secondary)' } },
                            '现在先不必盲填；如有明确偏好，也可点右侧提前手写预设。'
                          )
                        ]
                  ),
                  h('button', {
                    type: 'button',
                    className: 'tw-btn tw-btn--paper tw-btn--sm',
                    onClick: openInlineProfileEdit
                  }, editingTwinCard ? '收起微调' : (hasCard ? '微调名片' : '提前填写'))
                ),
                editingTwinCard && h('form', { id: 'inlineTwinProfileForm', className: 'launch-inline-form', onSubmit: submitInlineProfile },
                  h('div', { className: 'field-group' },
                    h('span', { className: 'field-label' }, '快速切换表达语气模板（按提炼后场景调整，可选）'),
                    h('div', { className: 'inline-persona-pills', role: 'group', 'aria-label': '快捷套用语气模板' },
                      (presets || []).map(p =>
                        h('button', {
                          key: p.id,
                          type: 'button',
                          className: inlinePersonaId === p.id ? 'persona-mini-btn is-active' : 'persona-mini-btn',
                          onClick: () => {
                            setInlinePersonaId(p.id);
                            if (!view?.twinProfile?.draftReady) setInlineName(p.defaultName);
                            setInlineIntro(p.intro);
                            setInlineDuty(p.recommendedDuty);
                            onToast?.(`已套用「${p.title}」语气预设，可继续改字后点保存`);
                          }
                        }, p.title)
                      )
                    )
                  ),
                  h('div', { className: 'field-row-2' },
                    h('div', { className: 'field-group' },
                      h('label', { className: 'field-label', htmlFor: 'inlineTwinNameInput' }, '对外名称'),
                      h('input', {
                        id: 'inlineTwinNameInput',
                        className: 'tw-input',
                        type: 'text',
                        required: true,
                        value: inlineName,
                        onChange: e => setInlineName(e.target.value)
                      })
                    ),
                    h('div', { className: 'field-group' },
                      h('label', { className: 'field-label', htmlFor: 'inlineTwinDutySelect' }, '默认把关模式'),
                      h('select', {
                        id: 'inlineTwinDutySelect',
                        className: 'tw-select',
                        value: inlineDuty,
                        onChange: e => setInlineDuty(e.target.value)
                      },
                        h('option', { value: 'shadow' }, '试跑把关（先写草稿经我点头）'),
                        h('option', { value: 'live' }, '正式值班（白名单直发，涉敏再问我）'),
                        h('option', { value: 'off' }, '暂停对外值班')
                      )
                    )
                  ),
                  h('div', { className: 'field-group' },
                    h('label', { className: 'field-label', htmlFor: 'inlineTwinIntroInput' }, '对外一句话介绍'),
                    h('input', {
                      id: 'inlineTwinIntroInput',
                      className: 'tw-input',
                      type: 'text',
                      value: inlineIntro,
                      onChange: e => setInlineIntro(e.target.value)
                    })
                  ),
                  h('div', { className: 'action-row' },
                    h('button', { type: 'submit', className: 'tw-btn tw-btn--primary tw-btn--sm', disabled: busy }, '保存名片与定位'),
                    h('button', { type: 'button', className: 'tw-btn tw-btn--ghost tw-btn--sm', onClick: () => setEditingTwinCard(false) }, '取消')
                  )
                )
              ),

              // 02 Self-test
              h('section', { className: 'launch-step', 'aria-labelledby': 'step2SelfTestHeading' },
                h('div', { className: 'launch-step-head' },
                  h('div', { className: 'launch-step-title-wrap' },
                    h('span', { className: 'section-index' }, '02'),
                    h('h2', { id: 'step2SelfTestHeading', className: 'launch-step-title' }, '自己先试问一句验货')
                  ),
                  view?.selfTestTurn
                    ? h('span', { className: 'status-pill status-pill--ok' }, '自测已通过')
                    : capsReady
                      ? h('span', { className: 'status-pill status-pill--ok' }, '已解锁可自测')
                      : h('span', { className: 'status-pill status-pill--muted' }, '提炼完成后解锁')
                ),
                capsReady
                  ? [
                      h('p', { key: 'p', className: 'launch-muted-note' },
                        '对外发邀请前先自己考它一句（仅本地试答，不计入对外「正在服务」人数与轮次）：'
                      ),
                      h('div', { key: 'chips', className: 'quick-chips-group', style: { marginTop: '0.5rem' } },
                        samplePrompts.slice(0, 2).map((q, idx) =>
                          h('button', {
                            key: idx,
                            type: 'button',
                            className: 'quick-chip',
                            disabled: busy,
                            onClick: () => runSelfTest(q)
                          }, q)
                        )
                      ),
                      h('form', {
                        key: 'form',
                        id: 'selfTestForm',
                        className: 'selftest-form',
                        onSubmit: ev => { ev.preventDefault(); void runSelfTest(selfTestInput); }
                      },
                        h('label', { htmlFor: 'selfTestInput', className: 'visually-hidden' }, '输入自测问题'),
                        h('input', {
                          id: 'selfTestInput',
                          className: 'tw-input',
                          type: 'text',
                          value: selfTestInput,
                          onChange: e => setSelfTestInput(e.target.value),
                          onCompositionEnd: imeSelf.onCompositionEnd,
                          onKeyDown: imeSelf.onKeyDown,
                          placeholder: '或直接输入一句你想抽考的问题…',
                          autoComplete: 'off'
                        }),
                        h('button', {
                          type: 'submit',
                          className: 'tw-btn tw-btn--subtle tw-btn--sm',
                          style: { flexShrink: 0 },
                          disabled: busy
                        }, '试问验货')
                      ),
                      view?.selfTestTurn && h('div', { key: 'res', className: 'selftest-result', role: 'status' },
                        h('div', null, h('strong', null, '分身试答：'), view.selfTestTurn.answer),
                        h('div', { className: 'selftest-result-meta' },
                          h('span', null, `核查依据：${view.selfTestTurn.basis}`),
                          h('span', null, `自测耗时 ${view.selfTestTurn.duration} · 随时可去「能力与通道」调规矩`)
                        )
                      )
                    ]
                  : [
                      h('p', { key: 'p', className: 'launch-muted-note' },
                        job
                          ? `「${job.projectName}」正在后台提炼中（第 ${job.step || 1}/4 步），提炼完成即刻解锁自测验货与名片草稿。`
                          : '尚未启动本地项目提炼，暂没有可抽考的能力包；你仍可先配好外部通信通道与待邀对象。'
                      ),
                      h('div', { key: 'act', className: 'action-row', style: { marginTop: '0.625rem' } },
                        job
                          ? h('button', {
                              type: 'button',
                              className: 'tw-btn tw-btn--subtle tw-btn--sm',
                              disabled: busy,
                              onClick: () => onAction('fast_forward_extraction')
                            }, '立即完成提炼')
                          : h('button', {
                              type: 'button',
                              className: 'tw-btn tw-btn--primary tw-btn--sm',
                              onClick: () => onAction('switch_scene', { scene: 'onboard', onboardMode: 'initial' })
                            }, '去首次启用挑项目提炼')
                      )
                    ]
              ),

              // 03 Connect channels & invite
              h('section', { className: 'launch-step', 'aria-labelledby': 'step3InviteHeading' },
                h('div', { className: 'launch-step-head' },
                  h('div', { className: 'launch-step-title-wrap' },
                    h('span', { className: 'section-index' }, '03'),
                    h('h2', { id: 'step3InviteHeading', className: 'launch-step-title' }, '接通沟通通道、给对象发专属码或链接')
                  ),
                  people.length > 0
                    ? h('span', { className: 'status-pill status-pill--ok' }, `已开通 ${people.length} 人`)
                    : h('span', { className: 'status-pill status-pill--ok' }, `已就绪 ${readyChannelsCount} / ${channels.length} 通道`)
                ),
                h('p', { className: 'launch-muted-note' },
                  '网页链接与个人微信码免配即用；飞书、企业微信、Slack 只需填 1 次本机长连接凭证（免公网服务器），随后按人发配对码或绑定群白名单。'
                ),
                h('div', { className: 'launch-channel-list', role: 'list', 'aria-label': '对外接通通道状态' },
                  channels.map(ch => {
                    const isBot = ch.kind === 'bot_ws' || ch.kind === 'wecom_bot' || ch.kind === 'slack_socket';
                    const badgeText = ch.configured ? (ch.enabled ? '已就绪' : '已暂停') : '待配凭证';
                    const badgeClass = ch.configured ? (ch.enabled ? 'status-pill status-pill--ok' : 'status-pill status-pill--muted') : 'status-pill';
                    return h('div', { key: ch.id, className: 'launch-channel-row', role: 'listitem' },
                      h('div', { className: 'launch-channel-main' },
                        h('div', { className: 'launch-channel-title-row' },
                          h('strong', { style: { fontSize: '0.84375rem' } }, ch.name),
                          h('span', { className: badgeClass }, badgeText)
                        ),
                        h('div', { className: 'launch-channel-meta' }, channelMetaForRow(ch))
                      ),
                      h('button', {
                        type: 'button',
                        className: `tw-btn ${isBot && !ch.configured ? 'tw-btn--subtle' : 'tw-btn--ghost'} tw-btn--sm`,
                        onClick: () => onOpenChannelConfig(ch.id)
                      }, isBot ? (ch.configured ? '查看 / 修改' : '配置接入') : '查看机制')
                    );
                  })
                ),
                h('div', { className: 'action-row', style: { marginTop: '0.75rem' } },
                  h('button', {
                    type: 'button',
                    className: 'tw-btn tw-btn--primary tw-btn--sm',
                    onClick: () => onOpenPersonModal(null)
                  }, '+ 开通服务对象并生成邀请'),
                  h('button', {
                    type: 'button',
                    className: 'tw-btn tw-btn--ghost tw-btn--sm',
                    onClick: () => onAction('switch_scene', { scene: 'people' })
                  }, '前往服务对象管理')
                ),
                people.length > 0 && h('div', { className: 'invite-people-list' },
                  people.map(p =>
                    h('div', { key: p.id, className: 'invite-person-item' },
                      h('div', { className: 'invite-person-meta' },
                        h('strong', null, p.name),
                        ` · ${p.channel} · ${formatBindingText(p)}`,
                        h('div', { className: 'invite-person-sub' },
                          `已开 ${(p.caps || []).length} 项能力 · ${p.expiry} · ${modeLabelText(p.mode)}`
                        )
                      ),
                      h('div', { className: 'action-row' },
                        h('button', {
                          type: 'button',
                          className: 'tw-btn tw-btn--paper tw-btn--sm',
                          onClick: () => onOpenInviteModal(p.id)
                        }, '查看凭证 / 邀请'),
                        h('button', {
                          type: 'button',
                          className: 'tw-btn tw-btn--subtle tw-btn--sm',
                          disabled: busy,
                          onClick: async () => {
                            await onAction('simulate_inbound', { personId: p.id });
                            onToast?.(`已模拟 ${p.name} 发起第 1 次提问`);
                          }
                        }, '模拟他提第 1 问 →')
                      )
                    )
                  )
                )
              )
            )
          : [
              // Live Desk command bar
              h('div', { key: 'cmd', id: 'deskLiveCmdWrap' },
                h('form', { id: 'commandForm', className: 'command-form', onSubmit: submitCommand },
                  h('label', { htmlFor: 'commandInput', className: 'visually-hidden' }, '用人话吩咐分身'),
                  h('input', {
                    id: 'commandInput',
                    className: 'command-input',
                    type: 'text',
                    value: commandInput,
                    onChange: e => setCommandInput(e.target.value),
                    onCompositionEnd: imeCmd.onCompositionEnd,
                    onKeyDown: imeCmd.onKeyDown,
                    placeholder: '用人话吩咐分身：例如「加条规矩：报异常先排除测试单」或直接试问一句…',
                    autoComplete: 'off'
                  }),
                  h('button', { type: 'submit', className: 'tw-btn tw-btn--primary tw-btn--sm', disabled: busy }, '吩咐分身')
                ),
                h('div', { className: 'quick-prompts', 'aria-label': '常用一句话吩咐' },
                  h('div', { className: 'quick-chips-group' },
                    liveQuickChips.map(([cmd, label], idx) =>
                      h('button', {
                        key: idx,
                        type: 'button',
                        className: 'quick-chip',
                        disabled: busy,
                        onClick: async () => {
                          const r = await onAction('run_command', { text: cmd });
                          setCommandNotice(r?.result?.message || '已执行');
                          setCmdSelfTestTurn(r?.result?.kind === 'self_test' ? r.result.result : null);
                        }
                      }, label)
                    )
                  ),
                  h('button', {
                    type: 'button',
                    id: 'btnSimulateInbound',
                    className: 'quick-sim-btn',
                    disabled: busy,
                    onClick: async () => {
                      const r = await onAction('simulate_inbound', {});
                      onToast?.(`收到 ${r?.result?.personName || '访客'} 的新提问（${r?.result?.statusLabel || '已处理'}）`);
                    }
                  }, '+ 模拟新提问')
                ),
                commandNotice && h('div', { id: 'commandUndoStrip', className: 'undo-strip' },
                  h('span', { id: 'commandUndoText' }, commandNotice),
                  view?.hasDeskUndo && h('button', {
                    type: 'button',
                    id: 'btnUndoCommand',
                    className: 'tw-btn tw-btn--sm',
                    disabled: busy,
                    onClick: async () => {
                      await onAction('undo_desk');
                      setCommandNotice('');
                      setCmdSelfTestTurn(null);
                      onToast?.('已撤销刚才的调整');
                    }
                  }, '撤销刚才的调整')
                ),
                cmdSelfTestTurn && h('div', { className: 'selftest-result', role: 'status', style: { marginTop: '0.875rem' } },
                  h('div', null, h('strong', null, '最近自测试答：'), cmdSelfTestTurn.answer),
                  h('div', { className: 'selftest-result-meta' },
                    h('span', null, `依据：${cmdSelfTestTurn.basis}`),
                    h('span', null, `提问：「${cmdSelfTestTurn.question}」`)
                  )
                )
              ),

              // 01 Needs owner decision
              h('div', { key: 'app', id: 'deskApprovalsSection', className: 'section-block' },
                h('div', { className: 'section-head section-head--desk' },
                  h('div', { className: 'section-title-wrap' },
                    h('span', { className: 'section-index' }, '01'),
                    h('h2', { className: 'section-title' }, '需要你拿主意')
                  ),
                  h('span', { id: 'approvalsCountPill', className: 'status-pill status-pill--muted' },
                    count > 0 ? `${count} 待定` : '已清空'
                  )
                ),
                count === 0
                  ? h('div', { id: 'approvalsList', className: 'brief-list' },
                      h('div', { className: 'empty-brief' },
                        h('strong', null, '当前没有需要你拿主意的草稿'),
                        '可以点上方「+ 模拟新提问」，或点击右侧正在服务的联系人查看完整会话记录。'
                      )
                    )
                  : h('div', { id: 'approvalsList', className: 'brief-list' },
                      approvals.map((item, idx) => {
                        const isEditing = editingApprovalId === item.id;
                        const isRawOpen = expandedRawId === item.id;
                        const pillClass = item.tone === 'danger' ? 'status-pill status-pill--danger' : 'status-pill';
                        const canOpenPerson = Boolean(item.personId && people.some(p => p.id === item.personId));
                        const idxLabel = String(idx + 1).padStart(2, '0');
                        const gistLabel = item.tone === 'danger' ? '替代方案' : '拟回要点';

                        return h('article', {
                          key: item.id,
                          className: 'decision-brief',
                          'data-approval-id': item.id,
                          'data-tone': item.tone
                        },
                          h('div', { className: 'brief-meta-line' },
                            h('div', { className: 'brief-meta-left' },
                              h('span', { className: 'brief-idx' }, idxLabel),
                              item.shortCode && h('span', { className: 'status-pill status-pill--muted', style: { fontFamily: 'var(--font-mono)' } }, `#${item.shortCode}`),
                              canOpenPerson
                                ? h('button', { type: 'button', className: 'who-link', onClick: () => onOpenPersonDrawer(item.personId) }, item.personName)
                                : h('span', { className: 'brief-who-static' }, item.personName),
                              h('span', null, `· ${item.channel}`)
                            ),
                            h('span', { className: pillClass }, item.tag)
                          ),
                          h('h3', { className: 'brief-headline' }, item.headline || item.draft?.slice(0, 32)),
                          h('p', { className: 'brief-gist' },
                            h('strong', null, gistLabel),
                            item.gist || item.draft?.slice(0, 52)
                          ),
                          isEditing
                            ? h('div', { className: 'brief-edit-box' },
                                h('div', { className: 'brief-raw-row' }, h('strong', null, '对方原问'), `「${item.question}」`),
                                h('textarea', {
                                  className: 'tw-textarea',
                                  value: draftText,
                                  onChange: e => setDraftText(e.target.value),
                                  'aria-label': '修改回复草稿'
                                }),
                                h('div', { className: 'action-row' },
                                  h('button', {
                                    type: 'button',
                                    className: 'tw-btn tw-btn--primary tw-btn--sm',
                                    disabled: busy,
                                    onClick: async () => {
                                      if (!draftText.trim()) return;
                                      await onAction('approve_draft', { approvalId: item.id, customDraft: draftText.trim() });
                                      setEditingApprovalId('');
                                      onToast?.(`已修改并发出给 ${item.personName}`);
                                    }
                                  }, '保存并发出'),
                                  h('button', {
                                    type: 'button',
                                    className: 'tw-btn tw-btn--ghost tw-btn--sm',
                                    onClick: () => setEditingApprovalId('')
                                  }, '取消修改')
                                )
                              )
                            : isRawOpen && h('div', { className: 'brief-raw-box' },
                                h('div', { className: 'brief-raw-row' }, h('strong', null, '对方原问'), `「${item.question}」`),
                                h('div', { className: 'brief-raw-row' }, h('strong', null, '完整草稿'), item.draft)
                              ),
                          h('div', { className: 'brief-actions' },
                            h('div', { className: 'action-row' },
                              h('button', {
                                type: 'button',
                                className: 'tw-btn tw-btn--primary tw-btn--sm',
                                disabled: busy,
                                onClick: async () => {
                                  await onAction('approve_draft', { approvalId: item.id });
                                  onToast?.(`已批准发出给 ${item.personName}`);
                                }
                              }, item.primaryActionLabel || '批准发出'),
                              !isEditing && h('button', {
                                type: 'button',
                                className: 'tw-btn tw-btn--paper tw-btn--sm',
                                onClick: () => {
                                  setExpandedRawId('');
                                  setEditingApprovalId(item.id);
                                  setDraftText(item.draft || '');
                                }
                              }, '改一下再发'),
                              item.tone === 'danger' && h('button', {
                                type: 'button',
                                className: 'tw-btn tw-btn--paper tw-btn--sm',
                                onClick: () => onOpenHandoff({ kind: 'approval', item })
                              }, '转我去对话里亲自处理'),
                              h('span', { className: 'brief-mobile-break', 'aria-hidden': 'true' }),
                              !isEditing && h('button', {
                                type: 'button',
                                className: 'tw-btn tw-btn--ghost tw-btn--sm',
                                'aria-expanded': isRawOpen,
                                onClick: () => setExpandedRawId(isRawOpen ? '' : item.id)
                              }, isRawOpen ? '收起原话' : '看原话'),
                              item.allowRuleExtract && h('button', {
                                type: 'button',
                                className: 'tw-btn tw-btn--ghost tw-btn--sm',
                                disabled: busy,
                                onClick: async () => {
                                  await onAction('save_approval_as_rule', {
                                    approvalId: item.id,
                                    ruleText: `补充口径规范：${item.draft.slice(0, 60)}`
                                  });
                                  onToast?.('已发送并顺手沉淀成长期干活规矩');
                                }
                              }, '记成规矩'),
                              h('button', {
                                type: 'button',
                                className: 'tw-btn tw-btn--ghost tw-btn--sm',
                                disabled: busy,
                                onClick: async () => {
                                  await onAction('dismiss_approval', { approvalId: item.id });
                                  onToast?.('已忽略该草稿，不会发出');
                                }
                              }, '忽略')
                            ),
                            h('button', {
                              type: 'button',
                              className: 'text-link-btn brief-trace-link',
                              onClick: () => onOpenTrace(item.id)
                            }, h('span', null, '查看过程'))
                          )
                        );
                      })
                    )
              )
            ]
      ),

      // Right rail: Active service pulse + Deliveries timeline
      h('aside', { className: 'desk-rail', 'aria-label': '在服概览与今日已接住' },
        h('section', { id: 'servicePulseStrip', className: 'rail-section', 'aria-label': '当前服务概览' },
          h('div', { className: 'rail-head' },
            h('h2', { className: 'section-title' }, '正在服务'),
            h('button', {
              type: 'button',
              className: 'text-link-btn',
              onClick: () => onAction('switch_scene', { scene: 'people' })
            }, '全部对象 →')
          ),
          h('div', { id: 'pulseMetricsGrid', className: 'rail-metrics-grid' },
            h('div', { className: 'rail-metric' },
              h('span', { className: 'rail-metric-num' }, `${activePeople.length} 人`),
              h('span', { className: 'rail-metric-label' }, '正在服务')
            ),
            h('div', { className: 'rail-metric' },
              h('span', { className: 'rail-metric-num' }, `${totalServed} 轮`),
              h('span', { className: 'rail-metric-label' }, '累计已答')
            ),
            h('div', { className: 'rail-metric' },
              h('span', { className: 'rail-metric-num' }, `${todayTotal} 轮`),
              h('span', { className: 'rail-metric-label' }, '今日新增')
            )
          ),
          h('div', { id: 'pulsePeopleChips', className: 'rail-roster' },
            activePeople.length === 0
              ? h('div', { className: 'rail-empty-note' },
                  '暂未开通服务对象 · 完成第 03 步并生成邀请后，这里会实时列出每位对象的对话进展。'
                )
              : activePeople.map(p => {
                  const pPending = pendingCountForPerson(view, p.id);
                  const hasIntercept = approvals.some(a => a.personId === p.id && a.tone === 'danger');
                  let tagText = `今日 ${p.todayCount || 0} 轮`;
                  if (hasIntercept) tagText = '1 拦截待定';
                  else if (pPending > 0) tagText = `${pPending} 待拍板`;
                  else if ((p.todayCount || 0) === 0) tagText = `已答 ${p.servedCount || 0} 轮`;

                  return h('button', {
                    key: p.id,
                    type: 'button',
                    className: 'rail-person-btn',
                    onClick: () => onOpenPersonDrawer(p.id)
                  },
                    h('span', { className: 'rail-person-left' },
                      h('span', { className: pPending > 0 ? 'pulse-dot is-pending' : 'pulse-dot', 'aria-hidden': 'true' }),
                      h('span', null, p.name)
                    ),
                    h('span', { className: pPending > 0 ? 'rail-person-tag is-pending' : 'rail-person-tag' }, tagText)
                  );
                })
          )
        ),

        h('section', { className: 'rail-section', 'aria-label': '今天已帮你接住' },
          h('div', { className: 'rail-head rail-head--sub' },
            h('div', { className: 'section-title-wrap' },
              h('span', { className: 'section-index' }, '02'),
              h('h2', { className: 'section-title' }, '今天已帮你接住')
            ),
            h('span', { id: 'deliveriesCountMeta', className: 'section-meta' }, `${deliveries.length} 条`)
          ),
          h('div', { id: 'deliveriesList', className: 'rail-deliveries-list' },
            deliveries.length === 0
              ? h('div', { className: 'rail-empty-note' },
                  '尚未开始对外接单 · 答复送达回执与本人在场收声记录会汇总在这里。'
                )
              : deliveries.map(del => {
                  const pillCls = del.statusTone === 'ok' ? 'status-pill status-pill--ok' : 'status-pill status-pill--muted';
                  const dotCls = del.statusTone === 'ok' ? 'rail-delivery-dot' : 'rail-delivery-dot is-muted';
                  const canOpenPerson = Boolean(del.personId && people.some(p => p.id === del.personId));
                  return h('div', { key: del.id, className: 'rail-delivery-row', 'data-delivery-id': del.id },
                    h('span', { className: dotCls, 'aria-hidden': 'true' }),
                    h('div', { className: 'rail-delivery-body' },
                      h('div', { className: 'rail-delivery-top' },
                        h('div', { className: 'rail-delivery-who' },
                          canOpenPerson
                            ? h('button', { type: 'button', className: 'who-link', onClick: () => onOpenPersonDrawer(del.personId) }, del.who)
                            : h('strong', null, del.who),
                          h('span', { className: 'rail-delivery-time' }, `· ${del.time}`)
                        ),
                        h('div', { className: 'rail-delivery-meta' },
                          h('span', { className: pillCls }, del.statusLabel),
                          h('button', { type: 'button', className: 'text-link-btn', onClick: () => onOpenTrace(del.id) }, '查看')
                        )
                      ),
                      h('div', { className: 'rail-delivery-summary' }, del.summary)
                    )
                  );
                })
          )
        )
      )
    )
  );
}

export function PeopleScene({
  view,
  busy,
  onAction,
  onOpenPersonDrawer,
  onOpenPersonModal,
  onOpenInviteModal,
  onToast
}) {
  const [filter, setFilter] = useState('all');
  const people = view?.people || [];
  const approvals = view?.approvals || [];

  const onPeople = people.filter(p => p.enabled);
  const pendingPeople = people.filter(p => pendingCountForPerson(view, p.id) > 0);
  const offPeople = people.filter(p => !p.enabled);
  const totalTurns = people.reduce((sum, p) => sum + (p.servedCount || 0), 0);

  const visible = people.filter(p => {
    if (filter === 'on') return p.enabled;
    if (filter === 'pending') return pendingCountForPerson(view, p.id) > 0;
    if (filter === 'off') return !p.enabled;
    return true;
  });

  const tones = ['amber', 'terra', 'sage', 'slate'];

  return h('section', { id: 'viewPeople', className: 'tw-container' },
    h('div', { className: 'hero-head' },
      h('div', null,
        h('h1', { className: 'serif-h1' }, '服务对象'),
        h('p', { className: 'page-lead' }, '看清正在服务谁、累计答了多少轮、点开看完整对话；谈妥合作在此 3 秒开关')
      ),
      h('button', {
        type: 'button',
        id: 'btnAddPerson',
        className: 'tw-btn tw-btn--primary',
        onClick: () => onOpenPersonModal(null)
      }, '+ 开通服务对象 / 发邀请')
    ),

    h('div', { id: 'peopleOverviewStrip', className: 'overview-strip', 'aria-label': '服务对象汇总' },
      h('div', { className: 'overview-cell' },
        h('span', { id: 'ovActive', className: 'overview-num' }, `${onPeople.length} 人`),
        h('span', { className: 'overview-label' }, '开启服务中')
      ),
      h('div', { className: 'overview-cell' },
        h('span', { id: 'ovTurns', className: 'overview-num' }, `${totalTurns} 轮`),
        h('span', { className: 'overview-label' }, '累计已答轮次')
      ),
      h('div', { className: 'overview-cell' },
        h('span', { id: 'ovPending', className: approvals.length > 0 ? 'overview-num is-amber' : 'overview-num' }, `${approvals.length} 条`),
        h('span', { className: 'overview-label' }, '当前待拍板')
      ),
      h('div', { className: 'overview-cell' },
        h('span', { id: 'ovPaused', className: 'overview-num' }, `${offPeople.length} 人`),
        h('span', { className: 'overview-label' }, '已暂停待续期')
      )
    ),

    h('div', { className: 'section-head section-head--plain' },
      h('div', { className: 'filter-bar', role: 'group', 'aria-label': '按服务状态筛选' },
        [
          ['all', '全部', people.length],
          ['on', '服务中', onPeople.length],
          ['pending', '有待拍板', pendingPeople.length],
          ['off', '已暂停', offPeople.length]
        ].map(([k, label, cnt]) =>
          h('button', {
            key: k,
            type: 'button',
            className: 'filter-pill',
            'aria-pressed': String(filter === k),
            onClick: () => setFilter(k)
          }, `${label} (${cnt})`)
        )
      ),
      h('span', { className: 'section-meta' }, '每人对话严格物理隔离 · 点任意一行可看完整聊天记录')
    ),

    h('div', { id: 'peopleList', className: 'list-surface' },
      people.length === 0
        ? h('div', { className: 'list-row', style: { flexDirection: 'column', alignItems: 'flex-start', gap: '0.625rem' } },
            h('div', { style: { fontWeight: 600, color: 'var(--text)' } }, '还没有开通任何服务对象'),
            h('div', { style: { fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.55 } },
              '谈好试用或合作后，点下方按钮配好对方的通道白名单、开放能力与把关模式，即可生成专属链接或微信/Slack 邀请语。'
            ),
            h('button', {
              type: 'button',
              className: 'tw-btn tw-btn--primary tw-btn--sm',
              onClick: () => onOpenPersonModal(null)
            }, '+ 开通第 1 个服务对象并生成邀请')
          )
        : visible.length === 0
          ? h('div', { className: 'list-row', style: { justifyContent: 'center', color: 'var(--text-muted)' } }, '当前筛选下没有联系人')
          : visible.map((p, idx) => {
              const pPending = pendingCountForPerson(view, p.id);
              const isSoon = String(p.expiry || '').includes('剩');
              const initial = String(p.name || 'U').trim().slice(0, 1).toUpperCase();
              const turnsTotal = (p.threads || []).length + pPending;
              const tone = p.avatarTone || tones[idx % tones.length];

              let statusPill;
              if (!p.enabled) statusPill = h('span', { className: 'status-pill status-pill--muted' }, '已暂停');
              else if (pPending > 0) statusPill = h('span', { className: 'status-pill' }, `${pPending} 待拍板`);
              else if ((p.todayCount || 0) > 0) statusPill = h('span', { className: 'status-pill status-pill--ok' }, `今日 ${p.todayCount} 轮`);
              else statusPill = h('span', { className: 'status-pill status-pill--muted' }, '服务开启中');

              return h('div', {
                key: p.id,
                className: p.enabled ? 'person-row' : 'person-row is-paused',
                'data-row-person': p.id,
                onClick: ev => {
                  if (ev.target.closest('button, a, label.switch, input')) return;
                  onOpenPersonDrawer(p.id);
                }
              },
                h('div', { className: 'person-identity' },
                  h('span', { className: 'avatar', 'data-avatar-tone': tone, 'aria-hidden': 'true' }, initial),
                  h('div', { style: { minWidth: 0 } },
                    h('div', { className: 'person-name-row' },
                      h('span', { className: 'person-name' }, p.name),
                      statusPill
                    ),
                    h('div', { className: 'person-sub' }, `${p.role || '外部试用对象'} · ${p.channel} · ${formatBindingText(p)}`)
                  )
                ),
                h('div', { className: 'person-ledger' },
                  h('div', { className: 'person-ledger-meta' },
                    `已服务 ${p.servedCount || 0} 轮 · 开放 ${(p.caps || []).length} 项能力 · ${modeLabelText(p.mode)}`
                  ),
                  h('div', { className: 'person-last-q' }, latestSnippetForPerson(view, p)),
                  h('div', { className: 'person-note' }, `叮嘱：${p.note || '无专门叮嘱'}`)
                ),
                h('div', { className: 'person-controls' },
                  h('span', { className: isSoon ? 'expiry-text is-soon' : 'expiry-text' }, p.enabled ? p.expiry : '已暂停'),
                  h('button', {
                    type: 'button',
                    className: 'tw-btn tw-btn--subtle tw-btn--sm',
                    onClick: () => onOpenPersonDrawer(p.id)
                  }, `看对话 (${turnsTotal})`),
                  h('button', {
                    type: 'button',
                    className: 'tw-btn tw-btn--ghost tw-btn--sm',
                    onClick: () => onOpenInviteModal(p.id)
                  }, '发邀请'),
                  h('button', {
                    type: 'button',
                    className: 'tw-btn tw-btn--ghost tw-btn--sm',
                    onClick: () => onOpenPersonModal(p.id)
                  }, '设置'),
                  h('label', { className: 'switch', 'aria-label': `开关 ${p.name} 的访问权限` },
                    h('input', {
                      type: 'checkbox',
                      checked: Boolean(p.enabled),
                      disabled: busy,
                      onChange: async e => {
                        const checked = e.target.checked;
                        await onAction('toggle_person', { personId: p.id, enabled: checked });
                        onToast?.(checked ? `已开启 ${p.name} 的访问权限` : `已暂停 ${p.name} 的访问权限`);
                      }
                    }),
                    h('span', { className: 'switch-track' })
                  )
                )
              );
            })
    )
  );
}

export function CapsScene({
  view,
  busy,
  onAction,
  onOpenProfileModal,
  onOpenProjectDialog,
  onOpenDeltaModal,
  onOpenChannelConfig,
  onConfirmUnmount,
  onToast
}) {
  const [newRuleKind, setNewRuleKind] = useState('规矩');
  const [newRuleText, setNewRuleText] = useState('');
  const [editingRuleId, setEditingRuleId] = useState('');
  const [editRuleKind, setEditRuleKind] = useState('规矩');
  const [editRuleText, setEditRuleText] = useState('');
  const [editingCapScopeId, setEditingCapScopeId] = useState('');
  const [capScopeInput, setCapScopeInput] = useState('');

  const pub = view?.publicLobby || {};
  const [pubBaseUrl, setPubBaseUrl] = useState(pub.publicBaseUrl || '');
  const [pubTitle, setPubTitle] = useState(pub.title || '');
  const [pubIntro, setPubIntro] = useState(pub.intro || '');
  const [pubVisitorLimit, setPubVisitorLimit] = useState(String(pub.visitorDailyLimit || 5));

  useEffect(() => {
    setPubBaseUrl(pub.publicBaseUrl || '');
    setPubTitle(pub.title || '');
    setPubIntro(pub.intro || '');
    setPubVisitorLimit(String(pub.visitorDailyLimit || 5));
  }, [pub.publicBaseUrl, pub.title, pub.intro, pub.visitorDailyLimit]);

  const imeNew = useMemo(() => createImeHandlers(), []);
  const imeEdit = useMemo(() => createImeHandlers(), []);
  const imeScope = useMemo(() => createImeHandlers(), []);
  const imePub = useMemo(() => createImeHandlers(), []);

  const job = view?.extractionJob || null;
  const mounted = view?.mountedProjects || [];
  const capabilities = view?.capabilities || [];
  const rules = view?.rules || [];
  const channels = view?.channels || [];
  const selectedPubCapSet = new Set(Array.isArray(pub.capIds) ? pub.capIds : []);

  async function submitNewRule(ev) {
    ev.preventDefault();
    const val = newRuleText.trim();
    if (!val) return;
    await onAction('add_rule', { kind: newRuleKind, text: val });
    setNewRuleText('');
    onToast?.('已新增一条长期规矩');
  }

  return h('section', { id: 'viewCaps', className: 'tw-container' },
    h('div', { className: 'hero-head', style: { marginBottom: '0.875rem' } },
      h('div', null,
        h('h1', { className: 'serif-h1' }, '能力与通道'),
        h('p', { className: 'page-lead' }, '同一个工作分身可挂载多个项目能力包，本地文件变动仅作零消耗提醒，点确认才升级')
      ),
      h('button', {
        type: 'button',
        className: 'tw-btn tw-btn--subtle tw-btn--sm',
        onClick: onOpenProfileModal
      }, '编辑名片与定位')
    ),

    h(ExtractLiveBanner, { job, busy, bannerId: 'capsExtractBanner', onAction }),

    view?.hasCapsUndo && h('div', { id: 'capsUndoStrip', className: 'caps-undo-strip', role: 'status' },
      h('span', null, '可恢复最近一次能力包、规则或通道调整'),
      h('button', {
        type: 'button',
        id: 'btnUndoCaps',
        className: 'tw-btn tw-btn--paper tw-btn--sm',
        disabled: busy,
        onClick: async () => {
          await onAction('undo_caps');
          onToast?.('已撤销刚才操作');
        }
      }, '撤销刚才操作')
    ),

    // Mounted projects
    h('div', { className: 'section-block', style: { marginTop: 0 } },
      h('div', { className: 'section-head' },
        h('div', null,
          h('h2', { className: 'section-title', style: { margin: 0 } }, '已接入的项目能力源'),
          h('div', { className: 'section-meta', style: { marginTop: '0.1875rem' } },
            '平时只核对本地文件修改标记（不消耗模型额度，绝不擅自改动已有口径）'
          )
        ),
        h('div', { className: 'action-row' },
          h('button', {
            type: 'button',
            id: 'btnAddProjectSource',
            className: 'tw-btn tw-btn--subtle tw-btn--sm',
            onClick: () => onOpenProjectDialog('mount')
          }, '+ 接入新项目能力'),
          h('button', {
            type: 'button',
            id: 'btnReopenOnboard',
            className: 'tw-btn tw-btn--ghost tw-btn--sm',
            disabled: busy,
            onClick: () => onAction('switch_scene', { scene: 'onboard', onboardMode: 'initial' })
          }, '重看首次提炼')
        )
      ),
      h('div', { id: 'projectSourcesList', className: 'list-surface' },
        mounted.length === 0
          ? (job
              ? h('div', { className: 'source-project-row' },
                  h('div', { className: 'source-project-main' },
                    h('div', { className: 'source-project-title-line' },
                      h('span', { className: 'source-project-name' }, job.projectName),
                      h('span', { className: 'status-pill' }, `正在提炼（${job.step || 1}/4）`)
                    ),
                    h('div', { className: 'source-project-desc' }, '正在逐项提取只读能力，完成后将自动同步到下方能力清单')
                  ),
                  h('div', { className: 'source-project-actions' },
                    h('button', {
                      type: 'button',
                      className: 'tw-btn tw-btn--paper tw-btn--sm',
                      onClick: () => onAction('switch_scene', { scene: 'onboard' })
                    }, '查看实时进度')
                  )
                )
              : h('div', { className: 'list-row', style: { justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' } },
                  h('span', { style: { fontSize: '0.84375rem', color: 'var(--text-secondary)' } },
                    '尚未提炼任何本地项目，前往「首次启用」选中项目即可生成分身能力'
                  ),
                  h('button', {
                    type: 'button',
                    className: 'tw-btn tw-btn--primary tw-btn--sm',
                    onClick: () => onAction('switch_scene', { scene: 'onboard', onboardMode: 'initial' })
                  }, '去首次启用')
                ))
          : mounted.map(mp => {
              const countCaps = capabilities.filter(c => c.projectId === mp.id).length;
              return h('div', { key: mp.id, className: 'source-project-row', 'data-project-source': mp.id },
                h('div', { className: 'source-project-main' },
                  h('div', { className: 'source-project-title-line' },
                    h('span', { className: 'source-project-name' }, mp.projectName),
                    mp.hasDelta
                      ? h('span', { className: 'status-pill' }, mp.deltaSpec?.badge || '检测到本地变动')
                      : h('span', { className: 'status-pill status-pill--ok' }, '已是最新口径')
                  ),
                  h('div', { className: 'source-project-desc' },
                    `${mp.shortSummary} · 当前已接入 ${countCaps} 项能力`
                  )
                ),
                h('div', { className: 'source-project-actions' },
                  mp.hasDelta
                    ? h('button', {
                        type: 'button',
                        className: 'tw-btn tw-btn--primary tw-btn--sm',
                        onClick: () => onOpenDeltaModal(mp)
                      }, '增量提炼升级')
                    : h('button', {
                        type: 'button',
                        className: 'tw-btn tw-btn--ghost tw-btn--sm',
                        disabled: busy,
                        onClick: async () => {
                          const r = await onAction('recheck_delta', { projectId: mp.id });
                          onToast?.(r?.result?.hasDelta
                            ? `检测到「${mp.projectName}」有新增或改动，可点「增量提炼升级」`
                            : `已核对「${mp.projectName}」文件指纹：已是最新口径（0 模型消耗）`);
                        }
                      }, '检查本地变动'),
                  h('button', {
                    type: 'button',
                    className: 'tw-btn tw-btn--ghost tw-btn--danger-ghost tw-btn--sm',
                    disabled: busy,
                    onClick: () => onConfirmUnmount(mp)
                  }, '卸载项目')
                )
              );
            })
      )
    ),

    // 01 Capabilities grid
    h('div', { className: 'section-block', style: { marginTop: '1.5rem' } },
      h('div', { className: 'section-head' },
        h('div', { className: 'section-title-wrap' },
          h('span', { className: 'section-index' }, '01'),
          h('h2', { className: 'section-title' }, '分身具备的能力')
        ),
        h('div', { className: 'action-row' },
          Number(view?.graphNodeCount) > 0 && h('span', { className: 'status-pill status-pill--ok' }, `语义知识图谱 · ${view.graphNodeCount} 节点`),
          h('span', { className: 'section-meta' }, '每项能力可单独限定只读目录范围，写库与改代码已禁止')
        )
      ),
      h('div', { id: 'capsGrid', className: 'grid-3' },
        capabilities.length === 0
          ? h('div', { className: 'card' },
              h('div', { className: 'cap-card-head' }, h('h3', { className: 'cap-card-title' }, '能力清单待提炼')),
              h('p', { className: 'cap-desc' }, '完成「首次启用」中的 4 步提取后，从本地项目抽取出的只读查询与口径解答能力会逐项展示在这里。')
            )
          : capabilities.map(cap => {
              const scopeList = Array.isArray(cap.scopePaths) ? cap.scopePaths : [];
              const isEditingScope = editingCapScopeId === cap.id;
              return h('div', { key: cap.id, className: 'card' },
                h('span', { className: 'cap-source-tag' }, cap.projectName || '工作区能力源'),
                h('div', { className: 'cap-card-head' },
                  h('h3', { className: 'cap-card-title' }, cap.name),
                  h('label', { className: 'switch', 'aria-label': `开关能力 ${cap.name}` },
                    h('input', {
                      type: 'checkbox',
                      checked: Boolean(cap.enabled),
                      disabled: busy,
                      onChange: async e => {
                        const checked = e.target.checked;
                        await onAction('toggle_capability', { capId: cap.id, enabled: checked });
                        onToast?.(checked ? `已开启能力：${cap.name}` : `已暂停能力：${cap.name}`);
                      }
                    }),
                    h('span', { className: 'switch-track' })
                  )
                ),
                h('p', { className: 'cap-desc' }, cap.desc),
                h('div', { className: 'cap-meta' },
                  h('span', null, `依据：${cap.basis}`),
                  h('span', null, `格式：${cap.output}`),
                  h('span', null, `目录边界：${scopeList.length > 0 ? scopeList.join(', ') : '全部只读安全文件'}`)
                ),
                isEditingScope
                  ? h('div', { style: { marginTop: '0.625rem', display: 'flex', flexDirection: 'column', gap: '0.4375rem' } },
                      h('input', {
                        className: 'tw-input',
                        type: 'text',
                        value: capScopeInput,
                        onChange: e => setCapScopeInput(e.target.value),
                        onCompositionEnd: imeScope.onCompositionEnd,
                        onKeyDown: imeScope.onKeyDown,
                        placeholder: '如 docs/, README.md（留空表示全部安全文件）',
                        'aria-label': `${cap.name} 开放目录范围`,
                        autoComplete: 'off'
                      }),
                      h('div', { className: 'action-row' },
                        h('button', {
                          type: 'button',
                          className: 'tw-btn tw-btn--primary tw-btn--sm',
                          disabled: busy,
                          onClick: async () => {
                            await onAction('update_capability_scope', { capId: cap.id, scopePaths: capScopeInput });
                            setEditingCapScopeId('');
                            onToast?.(capScopeInput.trim() ? '已收敛该能力仅挂载指定目录路径' : '已恢复该能力为全部只读安全文件');
                          }
                        }, '保存范围'),
                        h('button', {
                          type: 'button',
                          className: 'tw-btn tw-btn--ghost tw-btn--sm',
                          onClick: () => setEditingCapScopeId('')
                        }, '取消')
                      )
                    )
                  : h('div', { className: 'cap-foot-actions' },
                      h('span', { className: scopeList.length > 0 ? 'status-pill status-pill--ok' : 'status-pill status-pill--muted' },
                        scopeList.length > 0 ? `已缩窄 ${scopeList.length} 条路径` : '全项目只读'
                      ),
                      h('button', {
                        type: 'button',
                        className: 'tw-btn tw-btn--ghost tw-btn--sm',
                        disabled: busy,
                        onClick: () => {
                          setEditingCapScopeId(cap.id);
                          setCapScopeInput(scopeList.join(', '));
                        }
                      }, '限定路径')
                    )
              );
            })
      )
    ),

    // 02 Rules & Redlines
    h('div', { className: 'section-block' },
      h('div', { className: 'section-head' },
        h('div', { className: 'section-title-wrap' },
          h('span', { className: 'section-index' }, '02'),
          h('h2', { className: 'section-title' }, '干活规矩与拦截红线')
        ),
        h('span', { id: 'rulesCountMeta', className: 'section-meta' }, `${rules.length} 条正在生效`)
      ),
      h('div', { className: 'list-surface' },
        h('div', { className: 'rule-row', style: { alignItems: 'center', justifyContent: 'space-between' } },
          h('div', null,
            h('div', { style: { fontWeight: 600, color: 'var(--text)' } }, '本人在场自动收声'),
            h('div', { style: { fontSize: '0.78125rem', color: 'var(--text-secondary)', marginTop: '0.125rem' } },
              '检测到你在 15 分钟内刚在原对话发过消息，分身自动保持安静，不跟你抢话'
            )
          ),
          h('label', { className: 'switch', 'aria-label': '切换本人在场自动收声' },
            h('input', {
              type: 'checkbox',
              id: 'togglePresenceYield',
              checked: Boolean(view?.presenceAutoYield),
              disabled: busy,
              onChange: async e => {
                const checked = e.target.checked;
                await onAction('set_presence_yield', { enabled: checked });
                onToast?.(checked ? '已开启本人在场自动收声（15 分钟内不抢话）' : '已关闭本人在场自动收声');
              }
            }),
            h('span', { className: 'switch-track' })
          )
        ),
        h('div', { className: 'rule-row', style: { alignItems: 'center', justifyContent: 'space-between' } },
          h('div', null,
            h('div', { style: { fontWeight: 600, color: 'var(--text)' } }, '飞书私信推我手机拍板'),
            h('div', { style: { fontSize: '0.78125rem', color: 'var(--text-secondary)', marginTop: '0.125rem' } },
              '有人触发红线或待审核草稿时推 #编号 给你，私信回「批准 #码」或「改 #码：内容」远程秒批'
            )
          ),
          h('label', { className: 'switch', 'aria-label': '切换飞书私信推送待拍板提醒' },
            h('input', {
              type: 'checkbox',
              id: 'toggleOwnerNotifyFeishu',
              checked: view?.ownerNotify?.feishu !== false,
              disabled: busy,
              onChange: async e => {
                const checked = e.target.checked;
                await onAction('set_owner_notify', { feishu: checked });
                onToast?.(checked ? '已开启飞书私信手机远程拍板提醒' : '已关闭飞书私信拍板提醒');
              }
            }),
            h('span', { className: 'switch-track' })
          )
        ),
        h('div', { className: 'rule-row', style: { alignItems: 'center', justifyContent: 'space-between' } },
          h('div', null,
            h('div', { style: { fontWeight: 600, color: 'var(--text)' } }, '微信桥（dsh-wechat）同步推我手机'),
            h('div', { style: { fontSize: '0.78125rem', color: 'var(--text-secondary)', marginTop: '0.125rem' } },
              '调用本机 dsh-wechat 通道把待拍板 #编号 摘要推到你的微信，出门也能随时掌握边界拦截'
            )
          ),
          h('label', { className: 'switch', 'aria-label': '切换 dsh-wechat 微信待拍板推送' },
            h('input', {
              type: 'checkbox',
              id: 'toggleOwnerNotifyWechat',
              checked: Boolean(view?.ownerNotify?.wechat),
              disabled: busy,
              onChange: async e => {
                const checked = e.target.checked;
                await onAction('set_owner_notify', { wechat: checked });
                onToast?.(checked ? '已开启 dsh-wechat 微信同步推送' : '已关闭 dsh-wechat 微信推送');
              }
            }),
            h('span', { className: 'switch-track' })
          )
        ),
        h('div', { className: 'rule-row', style: { alignItems: 'center', justifyContent: 'space-between' } },
          h('div', null,
            h('div', { style: { fontWeight: 600, color: 'var(--text)' } }, '慢响应先给对方一句回执'),
            h('div', { style: { fontSize: '0.78125rem', color: 'var(--text-secondary)', marginTop: '0.125rem' } },
              '外部分身深度只读核算超过 3.5 秒时自动安抚一次，避免同事以为消息没收到'
            )
          ),
          h('label', { className: 'switch', 'aria-label': '切换慢响应自动回执' },
            h('input', {
              type: 'checkbox',
              id: 'toggleAckSlowTurns',
              checked: view?.ackSlowTurns !== false,
              disabled: busy,
              onChange: async e => {
                const checked = e.target.checked;
                await onAction('set_ack_slow_turns', { enabled: checked });
                onToast?.(checked ? '已开启 3.5 秒慢响应自动回执' : '已关闭慢响应自动回执');
              }
            }),
            h('span', { className: 'switch-track' })
          )
        ),
        h('div', { id: 'rulesList' },
          rules.map((r, idx) =>
            editingRuleId === r.id
              ? h('div', { key: r.id, className: 'rule-row' },
                  h('span', { className: 'rule-num' }, String(idx + 1).padStart(2, '0')),
                  h('div', { className: 'rule-edit-inline' },
                    h('select', {
                      className: 'tw-select',
                      style: { width: 'auto' },
                      value: editRuleKind,
                      onChange: e => setEditRuleKind(e.target.value),
                      'aria-label': '规则类型'
                    },
                      h('option', { value: '规矩' }, '规矩'),
                      h('option', { value: '红线' }, '红线')
                    ),
                    h('input', {
                      className: 'tw-input',
                      style: { flex: 1, minWidth: '10rem' },
                      type: 'text',
                      value: editRuleText,
                      onChange: e => setEditRuleText(e.target.value),
                      onCompositionEnd: imeEdit.onCompositionEnd,
                      onKeyDown: imeEdit.onKeyDown,
                      autoComplete: 'off'
                    }),
                    h('button', {
                      type: 'button',
                      className: 'tw-btn tw-btn--primary tw-btn--sm',
                      disabled: busy,
                      onClick: async () => {
                        if (!editRuleText.trim()) return;
                        await onAction('edit_rule', { ruleId: r.id, kind: editRuleKind, text: editRuleText.trim() });
                        setEditingRuleId('');
                        onToast?.('已更新该条规则');
                      }
                    }, '保存'),
                    h('button', {
                      type: 'button',
                      className: 'tw-btn tw-btn--ghost tw-btn--sm',
                      onClick: () => setEditingRuleId('')
                    }, '取消')
                  )
                )
              : h('div', { key: r.id, className: 'rule-row' },
                  h('span', { className: 'rule-num' }, String(idx + 1).padStart(2, '0')),
                  h('span', { className: r.kind === '红线' ? 'rule-kind rule-kind--redline' : 'rule-kind' }, r.kind),
                  h('span', { className: 'rule-row-main' }, r.text),
                  h('span', { className: 'rule-row-actions' },
                    h('button', {
                      type: 'button',
                      className: 'tw-btn tw-btn--ghost tw-btn--sm',
                      onClick: () => {
                        setEditingRuleId(r.id);
                        setEditRuleKind(r.kind || '规矩');
                        setEditRuleText(r.text || '');
                      }
                    }, '编辑'),
                    h('button', {
                      type: 'button',
                      className: 'tw-btn tw-btn--ghost tw-btn--danger-ghost tw-btn--sm',
                      disabled: busy,
                      onClick: async () => {
                        await onAction('delete_rule', { ruleId: r.id });
                        onToast?.('已删除该条规则，可点上方撤销恢复');
                      }
                    }, '删除')
                  )
                )
          )
        ),
        h('form', { id: 'addRuleForm', className: 'inline-add-row', onSubmit: submitNewRule },
          h('select', {
            id: 'newRuleKind',
            className: 'tw-select',
            style: { width: 'auto', flexShrink: 0 },
            value: newRuleKind,
            onChange: e => setNewRuleKind(e.target.value),
            'aria-label': '新增条目类型'
          },
            h('option', { value: '规矩' }, '规矩'),
            h('option', { value: '红线' }, '红线')
          ),
          h('input', {
            id: 'newRuleInput',
            className: 'tw-input',
            style: { flex: 1, minWidth: '12rem' },
            type: 'text',
            value: newRuleText,
            onChange: e => setNewRuleText(e.target.value),
            onCompositionEnd: imeNew.onCompositionEnd,
            onKeyDown: imeNew.onKeyDown,
            placeholder: '再交代一条干活规矩或拦截红线（按回车或点添加立即生效）…',
            autoComplete: 'off'
          }),
          h('button', { type: 'submit', className: 'tw-btn tw-btn--subtle tw-btn--sm', disabled: busy }, '添加条目')
        )
      )
    ),

    // 03 External Channels grid
    h('div', { className: 'section-block' },
      h('div', { className: 'section-head' },
        h('div', { className: 'section-title-wrap' },
          h('span', { className: 'section-index' }, '03'),
          h('h2', { className: 'section-title' }, '外部沟通入口')
        ),
        h('span', { className: 'section-meta' }, '直接复用本机已有聊天通道，并配免装试跑网页')
      ),
      h('div', { id: 'channelsGrid', className: 'grid-3' },
        channels.map(ch => {
          const isBot = ch.kind === 'bot_ws' || ch.kind === 'wecom_bot' || ch.kind === 'slack_socket';
          return h('div', { key: ch.id, className: 'card' },
            h('div', { className: 'cap-card-head' },
              h('h3', { className: 'cap-card-title' }, ch.name),
              h('label', { className: 'switch', 'aria-label': `开关通道 ${ch.name}` },
                h('input', {
                  type: 'checkbox',
                  checked: Boolean(ch.enabled),
                  disabled: busy,
                  onChange: async e => {
                    const checked = e.target.checked;
                    if (checked && !ch.configured && ch.id !== 'ch-web') {
                      onOpenChannelConfig(ch.id);
                      onToast?.(`启用「${ch.name}」前请先完成一次长连接配置或扫码激活`);
                      return;
                    }
                    await onAction('toggle_channel', { channelId: ch.id, enabled: checked });
                    onToast?.(checked ? `已接通入口：${ch.name}` : `已关闭入口：${ch.name}`);
                  }
                }),
                h('span', { className: 'switch-track' })
              )
            ),
            h('p', { className: 'cap-desc' }, ch.desc),
            h('div', { className: 'cap-meta' },
              h('span', null, ch.configured
                ? (ch.enabled ? ch.status : '已关闭：暂停从此入口收发消息')
                : (ch.officialConnector?.connected
                    ? (ch.officialConnector.statusText || '检测到 DSH 官方插件已登录，可免填密钥一键复用')
                    : '待配置：点击下方按钮配置后本机直连')),
              ch.botName && ch.configured && h('span', null, `群内显示：${ch.botName}${ch.appIdHint ? ` (${ch.appIdHint})` : ''}`)
            ),
            h('div', { className: 'cap-foot-actions' },
              h('span', {
                className: ch.configured
                  ? (ch.enabled ? 'status-pill status-pill--ok' : 'status-pill status-pill--muted')
                  : (ch.officialConnector?.connected ? 'status-pill status-pill--ok' : 'status-pill')
              }, ch.configured ? (ch.enabled ? '已就绪' : '已暂停') : (ch.officialConnector?.connected ? '官方插件就绪' : '待接通')),
              h('button', {
                type: 'button',
                className: `tw-btn ${ch.configured ? 'tw-btn--ghost' : (ch.officialConnector?.connected ? 'tw-btn--primary' : 'tw-btn--subtle')} tw-btn--sm`,
                onClick: () => onOpenChannelConfig(ch.id)
              }, isBot
                ? (ch.configured ? '查看 / 修改凭证' : (ch.officialConnector?.connected ? '一键复用官方连接器' : '配置机器人接入'))
                : '查看接入机制')
            )
          );
        })
      )
    ),

    // 04 Public Scan-to-Try Lobby (/try)
    h('div', { id: 'publicLobbySection', className: 'section-block' },
      h('div', { className: 'section-head' },
        h('div', { className: 'section-title-wrap' },
          h('span', { className: 'section-index' }, '04'),
          h('h2', { className: 'section-title' }, '公开扫码真体验大厅（/try）')
        ),
        h('div', { className: 'action-row' },
          h('span', {
            className: pub.enabled && selectedPubCapSet.size > 0 ? 'status-pill status-pill--ok' : 'status-pill status-pill--muted'
          }, pub.enabled
            ? (selectedPubCapSet.size > 0 ? `公开接待中 · 已开放 ${selectedPubCapSet.size} 项` : '已开启但未勾选公开能力')
            : '已关闭'),
          h('span', { className: 'section-meta' }, `今日已接待 ${pub.todayGlobalUsed || 0} / ${pub.globalDailyLimit || 200} 轮`)
        )
      ),
      h('div', { className: 'card' },
        h('div', { className: 'rule-row', style: { paddingTop: 0, alignItems: 'center', justifyContent: 'space-between' } },
          h('div', null,
            h('div', { style: { fontWeight: 600, color: 'var(--text)' } }, '启用公开扫码体验大厅（匿名 Cookie 会话隔离）'),
            h('div', { style: { fontSize: '0.78125rem', color: 'var(--text-secondary)', marginTop: '0.125rem' } },
              '每位扫码访客获独立隔离会话与每日限额；Fail-Closed 默认全不暴露，未勾选的私有项目物理不可见。'
            )
          ),
          h('label', { className: 'switch', 'aria-label': '切换公开扫码体验大厅' },
            h('input', {
              type: 'checkbox',
              id: 'togglePublicLobby',
              checked: Boolean(pub.enabled),
              disabled: busy,
              onChange: async e => {
                const checked = e.target.checked;
                await onAction('configure_public_lobby', { enabled: checked });
                onToast?.(checked ? '已开启公开扫码体验大厅（请确认下方已勾选公开只读能力）' : '已关闭公开扫码体验大厅');
              }
            }),
            h('span', { className: 'switch-track' })
          )
        ),

        h('div', { className: 'public-lobby-grid', style: { marginTop: '0.875rem' } },
          h('div', { className: 'public-lobby-form' },
            h('div', { className: 'public-lobby-row' },
              h('div', { className: 'public-lobby-field' },
                h('label', { className: 'public-lobby-label', htmlFor: 'publicLobbyBaseUrl' }, '公网隧道域名（可选，用于生成永久二维码）'),
                h('input', {
                  id: 'publicLobbyBaseUrl',
                  className: 'tw-input',
                  type: 'url',
                  value: pubBaseUrl,
                  onChange: e => setPubBaseUrl(e.target.value),
                  onCompositionEnd: imePub.onCompositionEnd,
                  onKeyDown: imePub.onKeyDown,
                  placeholder: '例如：https://twin.finvo.ai',
                  autoComplete: 'off'
                })
              ),
              h('div', { className: 'public-lobby-field' },
                h('label', { className: 'public-lobby-label', htmlFor: 'publicLobbyVisitorLimit' }, '每人每日体验轮次上限'),
                h('input', {
                  id: 'publicLobbyVisitorLimit',
                  className: 'tw-input',
                  type: 'number',
                  min: 1,
                  max: 100,
                  value: pubVisitorLimit,
                  onChange: e => setPubVisitorLimit(e.target.value)
                })
              )
            ),

            h('div', { className: 'public-lobby-row' },
              h('div', { className: 'public-lobby-field' },
                h('label', { className: 'public-lobby-label', htmlFor: 'publicLobbyTitle' }, '公开大厅对外分身名（独立隔离名片）'),
                h('input', {
                  id: 'publicLobbyTitle',
                  className: 'tw-input',
                  type: 'text',
                  value: pubTitle,
                  onChange: e => setPubTitle(e.target.value),
                  onCompositionEnd: imePub.onCompositionEnd,
                  onKeyDown: imePub.onKeyDown,
                  placeholder: '例如：牛村木木山 · DSH 实战体验分身',
                  autoComplete: 'off'
                })
              ),
              h('div', { className: 'public-lobby-field' },
                h('label', { className: 'public-lobby-label', htmlFor: 'publicLobbyIntro' }, '公开大厅一句话介绍'),
                h('input', {
                  id: 'publicLobbyIntro',
                  className: 'tw-input',
                  type: 'text',
                  value: pubIntro,
                  onChange: e => setPubIntro(e.target.value),
                  onCompositionEnd: imePub.onCompositionEnd,
                  onKeyDown: imePub.onKeyDown,
                  placeholder: '例如：本机 DeepSeek Harness 只读驱动',
                  autoComplete: 'off'
                })
              )
            ),

            h('div', { className: 'public-lobby-field' },
              h('span', { className: 'public-lobby-label' }, '勾选开放给公开扫码访客的只读能力（默认全不勾选 · 物理隔离私密项目）'),
              capabilities.length === 0
                ? h('div', { style: { fontSize: '0.8125rem', color: 'var(--text-muted)' } }, '请先提炼至少一个公开示例或脱敏工作区能力包')
                : h('div', { id: 'publicLobbyCapList', className: 'public-lobby-caps' },
                    capabilities.map(cap => {
                      const isSelected = Boolean(cap.enabled) && selectedPubCapSet.has(cap.id);
                      return h('label', {
                        key: cap.id,
                        className: isSelected ? 'public-cap-check is-selected' : 'public-cap-check'
                      },
                        h('input', {
                          type: 'checkbox',
                          checked: isSelected,
                          disabled: busy || !cap.enabled,
                          onChange: async e => {
                            const nextSet = new Set(selectedPubCapSet);
                            if (e.target.checked) nextSet.add(cap.id);
                            else nextSet.delete(cap.id);
                            await onAction('configure_public_lobby', { capIds: [...nextSet] });
                            onToast?.(e.target.checked
                              ? `已向公开大厅开放「${cap.name}」`
                              : `已从公开大厅撤回「${cap.name}」`);
                          }
                        }),
                        h('span', null, cap.name),
                        h('span', { className: 'public-cap-proj' }, `[${cap.projectName || '项目'}]`)
                      );
                    })
                  )
            ),

            h('div', { className: 'action-row', style: { justifyContent: 'space-between', flexWrap: 'wrap', marginTop: '0.25rem' } },
              h('label', { style: { display: 'inline-flex', alignItems: 'center', gap: '0.4375rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', cursor: 'pointer' } },
                h('input', {
                  type: 'checkbox',
                  id: 'togglePublicPushOwner',
                  checked: Boolean(pub.pushOwner),
                  disabled: busy,
                  onChange: async e => {
                    await onAction('configure_public_lobby', { pushOwner: e.target.checked });
                    onToast?.(e.target.checked ? '已开启公开红线触发手机推送（每 10 分钟至多 1 次）' : '已关闭公开体验手机推送防打扰');
                  }
                }),
                h('span', null, '公开访客触发红线时推我手机（10 分钟冷却防刷屏）')
              ),
              h('button', {
                type: 'button',
                id: 'btnSavePublicLobby',
                className: 'tw-btn tw-btn--primary tw-btn--sm',
                disabled: busy,
                onClick: async () => {
                  await onAction('configure_public_lobby', {
                    publicBaseUrl: pubBaseUrl.trim(),
                    title: pubTitle.trim(),
                    intro: pubIntro.trim(),
                    visitorDailyLimit: Number(pubVisitorLimit) || 5
                  });
                  onToast?.('已保存公开扫码大厅设置并更新二维码');
                }
              }, '保存大厅设置')
            )
          ),

          h('div', { className: 'public-lobby-qr-col' },
            h('div', { id: 'publicLobbyQrWrap', className: 'public-lobby-qr-box', 'aria-label': '公开扫码体验永久二维码' },
              pub.qrSvg
                ? h('img', {
                    src: `data:image/svg+xml;utf8,${encodeURIComponent(pub.qrSvg)}`,
                    alt: '公开扫码体验二维码'
                  })
                : h(QrCodeMatrixSvg, { seed: pub.tryUrl || 'twin-try-lobby' })
            ),
            h('input', {
              id: 'publicLobbyTryUrl',
              className: 'tw-input',
              type: 'text',
              readOnly: true,
              value: pub.tryUrl || '启动本地网页入口后生成',
              style: { fontSize: '0.75rem', textAlign: 'center' }
            }),
            h('button', {
              type: 'button',
              id: 'btnCopyPublicTryUrl',
              className: 'tw-btn tw-btn--subtle tw-btn--sm',
              disabled: !pub.tryUrl,
              onClick: () => copyToClipboard(pub.tryUrl || '', msg => onToast?.(msg))
            }, '复制体验链接')
          )
        )
      )
    )
  );
}
