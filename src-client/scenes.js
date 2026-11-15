/**
 * The 4 Editorial Scenes of AI 分身 (`v4.1`):
 * 1. `OnboardScene` (causal 4-step local read-only extraction + background minimize + Step 4 profile draft)
 * 2. `DeskScene` (duty switchboard, approvals + danger draft edit, owner session handoff, deliveries, command bar)
 * 3. `PeopleScene` (per-caller whitelist, isolated sessions, daily cap telemetry)
 * 4. `CapsScene` (multi-project capability packs, 0-token delta sensing, 5 local-first channels, rules/redlines)
 */
import React, { useEffect, useState } from 'react';
const h = React.createElement;
import {
  formatBindingText,
  formatModeLabel
} from '../shared/schema.js';

const STEP_LABELS = [
  { step: 1, title: '1. 读取授权项目', detail: '遍历文档与结构说明' },
  { step: 2, title: '2. 提炼只读能力包', detail: '聚合口径与主题片段' },
  { step: 3, title: '3. 剥离密钥与写脚本', detail: '拦截隐私字段与变更脚手架' },
  { step: 4, title: '4. 生成定位与名片', detail: '草拟人设、介绍与初始档位' }
];

function OnboardScene({ view, projects, presets, busy, onAction, onOpenInvite }) {
  const job = view?.extractionJob || null;
  const isMount = view?.onboardMode === 'mount';
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [manualRootPath, setManualRootPath] = useState('');
  const [projectName, setProjectName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [brief, setBrief] = useState('');
  const [optimisticStep, setOptimisticStep] = useState(0);

  const [draftName, setDraftName] = useState('');
  const [draftIntro, setDraftIntro] = useState('');
  const [draftPersonaId, setDraftPersonaId] = useState('advisor');
  const [draftDuty, setDraftDuty] = useState('shadow');
  const [selfTestQ, setSelfTestQ] = useState('');

  useEffect(() => {
    if (projects?.length && !selectedCandidateId) {
      setSelectedCandidateId(projects[0].id);
      setProjectName(projects[0].name || '');
    }
  }, [projects, selectedCandidateId]);

  useEffect(() => {
    if (job?.status === 'ready') {
      setDraftName(view?.twinProfile?.name || job?.draftProfile?.name || '工作分身');
      setDraftIntro(view?.twinProfile?.intro || job?.draftProfile?.intro || '依据已授权项目文档提供只读答疑');
      setDraftPersonaId(view?.twinProfile?.personaId || 'advisor');
      setDraftDuty(view?.dutyMode || job?.draftProfile?.recommendedDuty || 'shadow');
      setOptimisticStep(4);
    }
  }, [job?.status, job?.id]);

  const activeStep = job?.status === 'ready'
    ? 4
    : Math.max(optimisticStep, job?.step || 0);

  async function beginExtraction() {
    setOptimisticStep(1);
    const t1 = setTimeout(() => setOptimisticStep(s => (s < 2 ? 2 : s)), 160);
    const t2 = setTimeout(() => setOptimisticStep(s => (s < 3 ? 3 : s)), 320);
    try {
      await onAction('start_extraction', {
        candidateId: manualRootPath.trim() ? '' : selectedCandidateId,
        rootPath: manualRootPath.trim(),
        projectName: projectName.trim() || undefined,
        ownerName: ownerName.trim() || undefined,
        brief: brief.trim() || undefined,
        mode: isMount ? 'mount' : 'initial',
        autoComplete: false
      });
      setOptimisticStep(4);
    } catch (err) {
      setOptimisticStep(0);
      throw err;
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
    }
  }

  return h('div', { className: 'tw-container' },
    h('section', { className: 'tw-card' },
      h('div', { className: 'tw-card-head' },
        h('div', null,
          h('h2', { className: 'tw-h2' }, isMount ? '为现有主分身挂载新项目能力包' : '首次只读提炼 · 从现有项目长出你的工作分身'),
          h('p', { className: 'tw-muted', style: { marginTop: '0.25rem' } },
            '全程只读授权项目文档；自动隔离密钥、凭据与写脚本；提炼过程中可随时收起到后台浏览工作台。'
          )
        ),
        activeStep > 0 && activeStep < 4 && h('button', {
          id: 'btnMinimizeExtraction',
          type: 'button',
          className: 'tw-btn',
          onClick: () => onAction('minimize_extraction', {})
        }, '收起到后台看工作台')
      ),
      h('div', { className: 'tw-step-list', style: { marginBottom: '1rem' } },
        STEP_LABELS.map(item => {
          const done = activeStep > item.step || job?.status === 'ready';
          const current = activeStep === item.step && job?.status !== 'ready';
          return h('div', {
            key: item.step,
            className: `tw-step ${done ? 'is-done' : current ? 'is-active' : ''}`
          },
            h('div', { style: { fontWeight: 650 } }, item.title),
            h('div', { className: 'tw-muted', style: { marginTop: '0.2rem' } }, item.detail)
          );
        })
      ),
      (!job || job.status !== 'ready') && h('div', { className: 'tw-field' },
        h('div', { className: 'tw-grid-2' },
          h('label', { className: 'tw-field' },
            h('span', { className: 'tw-label' }, '从当前 Harness 工作区选取项目'),
            h('select', {
              id: 'onboardProjectSelect',
              className: 'tw-select',
              value: selectedCandidateId,
              disabled: busy,
              onChange: e => {
                setSelectedCandidateId(e.target.value);
                const found = (projects || []).find(p => p.id === e.target.value);
                if (found) setProjectName(found.name);
              }
            },
              (projects || []).length
                ? projects.map(p => h('option', { key: p.id, value: p.id }, p.name))
                : h('option', { value: '' }, '当前未挂载工作区（请在右侧输入本机目录）')
            )
          ),
          h('label', { className: 'tw-field' },
            h('span', { className: 'tw-label' }, '分身显示项目别名（对外可见名称，不含物理路径）'),
            h('input', {
              id: 'onboardProjectAlias',
              className: 'tw-input',
              placeholder: '如：华东经营复盘项目',
              value: projectName,
              onChange: e => setProjectName(e.target.value)
            })
          )
        ),
        h('details', { className: 'tw-trace', open: !(projects || []).length },
          h('summary', null, (projects || []).length ? '或手工指定本机其他只读项目目录' : '指定本机只读项目目录'),
          h('div', { className: 'tw-grid-2', style: { marginTop: '0.55rem' } },
            h('label', { className: 'tw-field' },
              h('span', { className: 'tw-label' }, '本地目录绝对路径（仅用于后台建立只读索引）'),
              h('input', {
                id: 'onboardFolderInput',
                className: 'tw-input',
                placeholder: '例如 /Users/.../my-project',
                value: manualRootPath,
                onChange: e => setManualRootPath(e.target.value)
              })
            ),
            h('label', { className: 'tw-field' },
              h('span', { className: 'tw-label' }, '我的称呼（用于生成分身名片）'),
              h('input', {
                className: 'tw-input',
                placeholder: '如：项目负责人',
                value: ownerName,
                onChange: e => setOwnerName(e.target.value)
              })
            )
          )
        ),
        h('label', { className: 'tw-field' },
          h('span', { className: 'tw-label' }, '先嘱咐几句分身规矩（可选）'),
          h('textarea', {
            className: 'tw-textarea',
            placeholder: '例如：先复述对方诉求再回答；遇到没写的口径直接标成待补口径，严禁编造。',
            value: brief,
            onChange: e => setBrief(e.target.value)
          })
        ),
        h('div', { className: 'tw-actions' },
          h('button', {
            id: 'btnStartExtraction',
            type: 'button',
            className: 'tw-btn tw-btn-primary',
            disabled: busy || (!selectedCandidateId && !manualRootPath.trim()),
            onClick: beginExtraction
          }, busy ? '正在扫描并安全剥离...' : (isMount ? '开始只读扫描并挂载能力' : '开始只读提炼并生成分身')),
          view?.lifecycleStage === 'mature' && h('button', {
            type: 'button',
            className: 'tw-btn',
            onClick: () => onAction('switch_scene', { scene: 'desk' })
          }, '返回工作台')
        )
      )
    ),
    job?.status === 'ready' && h('section', { className: 'tw-card' },
      h('div', { className: 'tw-card-head' },
        h('div', null,
          h('h2', { className: 'tw-h2' }, `第 4 步 · 已从「${job.projectName}」提炼能力并草拟分身名片`),
          h('p', { className: 'tw-muted', style: { marginTop: '0.2rem' } },
            '能力项由文档真实提炼；下方定位与名片已依据项目自动生成，你可以切换人设或微调后启用。'
          )
        )
      ),
      h('div', { className: 'tw-actions', style: { marginBottom: '0.85rem' } },
        (job.discoveredCaps || []).map((c, idx) => h('span', { key: idx, className: 'tw-badge is-ok' }, c))
      ),
      !isMount && h('div', { className: 'tw-field' },
        h('span', { className: 'tw-label' }, '选一个默认定位人设（自动匹配推荐值班方式）'),
        h('div', { className: 'tw-actions', style: { marginBottom: '0.6rem' } },
          (presets || []).map(p => h('button', {
            key: p.id,
            type: 'button',
            className: draftPersonaId === p.id ? 'tw-btn tw-btn-primary' : 'tw-btn',
            onClick: () => {
              setDraftPersonaId(p.id);
              setDraftName(p.defaultName);
              setDraftIntro(p.intro);
              setDraftDuty(p.recommendedDuty);
            }
          }, p.title))
        ),
        h('div', { className: 'tw-grid-2' },
          h('label', { className: 'tw-field' },
            h('span', { className: 'tw-label' }, '分身对外名称'),
            h('input', {
              className: 'tw-input',
              value: draftName,
              onChange: e => setDraftName(e.target.value)
            })
          ),
          h('label', { className: 'tw-field' },
            h('span', { className: 'tw-label' }, '初始值班模式'),
            h('select', {
              className: 'tw-select',
              value: draftDuty,
              onChange: e => setDraftDuty(e.target.value)
            },
              h('option', { value: 'shadow' }, '只出草稿我来批（最稳妥）'),
              h('option', { value: 'live' }, '白名单直接答'),
              h('option', { value: 'off' }, '暂不对外，先保留在本地')
            )
          )
        ),
        h('label', { className: 'tw-field', style: { marginTop: '0.5rem' } },
          h('span', { className: 'tw-label' }, '对外一句话介绍'),
          h('input', {
            className: 'tw-input',
            value: draftIntro,
            onChange: e => setDraftIntro(e.target.value)
          })
        )
      ),
      h('div', { className: 'tw-card', style: { marginTop: '0.85rem', background: 'var(--tw-sunken)' } },
        h('div', { className: 'tw-label', style: { marginBottom: '0.35rem' } }, '上线前先试问一句（仅本人沙箱预演，不留对外痕迹）'),
        h('div', { className: 'tw-actions' },
          h('input', {
            className: 'tw-input',
            style: { flex: 1 },
            placeholder: '如：这个项目能对外讲哪些内容？',
            value: selfTestQ,
            onChange: e => setSelfTestQ(e.target.value)
          }),
          h('button', {
            type: 'button',
            className: 'tw-btn',
            disabled: busy || !selfTestQ.trim(),
            onClick: () => onAction('self_test', { question: selfTestQ.trim() })
          }, '试问分身')
        ),
        view?.selfTestTurn && h('div', { className: 'tw-draft-box', style: { marginTop: '0.55rem' } },
          h('div', { className: 'tw-muted' }, `依据：${view.selfTestTurn.basis}（${view.selfTestTurn.duration}）`),
          h('div', { style: { marginTop: '0.25rem' } }, view.selfTestTurn.answer)
        )
      ),
      h('div', { className: 'tw-actions', style: { marginTop: '0.95rem' } },
        h('button', {
          id: 'btnCompleteOnboard',
          type: 'button',
          className: 'tw-btn tw-btn-primary',
          disabled: busy,
          onClick: async () => {
            if (!isMount && draftName.trim()) {
              await onAction('update_profile', {
                personaId: draftPersonaId,
                name: draftName.trim(),
                intro: draftIntro.trim(),
                dutyMode: draftDuty
              });
            }
            await onAction('complete_extraction', { scene: isMount ? 'caps' : 'desk' });
          }
        }, isMount ? '确认新能力包并回到能力页' : '确认名片并进入工作台'),
        !isMount && h('button', {
          type: 'button',
          className: 'tw-btn',
          disabled: busy,
          onClick: async () => {
            if (draftName.trim()) {
              await onAction('update_profile', {
                personaId: draftPersonaId,
                name: draftName.trim(),
                intro: draftIntro.trim(),
                dutyMode: draftDuty
              });
            }
            await onAction('complete_extraction', { scene: 'desk' });
            onOpenInvite();
          }
        }, '启用并顺便开通第一位试用对象')
      )
    )
  );
}

function DeskScene({
  view,
  busy,
  onAction,
  onEditDraft,
  onOpenPreview,
  onOpenProfileEdit,
  onOpenInvite,
  onHandoffToOwner
}) {
  const [commandText, setCommandText] = useState('');
  const people = view?.people || [];
  const enabledPeopleCount = people.filter(p => p.enabled).length;
  const enabledCapsCount = (view?.capabilities || []).filter(c => c.enabled).length;
  const approvals = view?.approvals || [];
  const deliveries = view?.deliveries || [];
  const hasAnyDelta = (view?.mountedProjects || []).some(p => p.hasDelta);

  async function submitCommand() {
    if (!commandText.trim()) return;
    await onAction('run_command', { text: commandText.trim() });
    setCommandText('');
  }

  return h('div', { className: 'tw-container' },
    view?.extractionJob && h('div', { className: 'tw-banner' },
      h('span', null, view.extractionJob.status === 'ready'
        ? `「${view.extractionJob.projectName}」已完成能力提炼与名片草拟，点右侧定稿生效。`
        : `分身正在后台只读提炼「${view.extractionJob.projectName}」...`),
      h('button', {
        type: 'button',
        className: 'tw-btn tw-btn-primary',
        onClick: () => onAction('switch_scene', { scene: 'onboard' })
      }, view.extractionJob.status === 'ready' ? '去第 4 步定稿名片' : '查看提炼进度')
    ),
    view?.dutyMode === 'off' && h('div', { className: 'tw-banner is-warn' },
      h('span', null, '当前已暂停对外值班：所有外部访客或群聊提问都会收到礼貌暂停提示，不会盲目应答。'),
      h('button', {
        type: 'button',
        className: 'tw-btn',
        disabled: busy,
        onClick: () => onAction('set_duty_mode', { dutyMode: 'shadow' })
      }, '恢复「只出草稿我来批」')
    ),
    hasAnyDelta && h('div', { className: 'tw-banner' },
      h('span', null, '检测到已挂载项目文档发生本机变动（0-Token 增量感应），等待你确认升级能力包。'),
      h('button', {
        type: 'button',
        className: 'tw-btn tw-btn-primary',
        onClick: () => onAction('switch_scene', { scene: 'caps' })
      }, '查看变动并确认升级')
    ),
    h('section', { className: 'tw-status-strip' },
      h('div', { style: { minWidth: 0, flex: '1 1 240px' } },
        h('div', { className: 'tw-actions' },
          h('strong', { style: { fontSize: '1.02rem' } }, view?.twinProfile?.name || '工作分身'),
          h('button', {
            id: 'btnEditTwinProfile',
            type: 'button',
            className: 'tw-btn',
            onClick: onOpenProfileEdit
          }, '编辑名片')
        ),
        h('p', { className: 'tw-muted', style: { marginTop: '0.25rem' } },
          view?.twinProfile?.intro || '在授权项目只读范围与红线内替你答疑与汇总，绝不编造依据'
        )
      ),
      h('div', { className: 'tw-actions' },
        h('div', { className: 'tw-seg', role: 'group', 'aria-label': '对外值班方式' },
          [
            ['shadow', '只出草稿我来批'],
            ['live', '开启自动托管'],
            ['off', '暂停值班']
          ].map(([mode, label]) => h('button', {
            key: mode,
            type: 'button',
            className: view?.dutyMode === mode ? 'tw-seg-btn is-active' : 'tw-seg-btn',
            disabled: busy,
            onClick: () => onAction('set_duty_mode', { dutyMode: mode })
          }, label))
        ),
        h('label', { className: 'tw-switch' },
          h('input', {
            type: 'checkbox',
            checked: Boolean(view?.presenceAutoYield),
            disabled: busy,
            onChange: e => onAction('set_presence_yield', { enabled: e.target.checked })
          }),
          '本人在场 15 分钟自动收声'
        ),
        h('button', {
          id: 'btnPreviewCallerView',
          type: 'button',
          className: 'tw-btn',
          onClick: () => onOpenPreview()
        }, '客户视角预览'),
        h('button', {
          id: 'btnDeskInvite',
          type: 'button',
          className: 'tw-btn tw-btn-primary',
          onClick: onOpenInvite
        }, '+ 开通服务对象 / 发邀请')
      )
    ),
    h('section', { className: 'tw-metrics' },
      h('div', { className: 'tw-metric' },
        h('div', { className: 'tw-muted' }, '白名单服务对象'),
        h('div', { className: 'tw-metric-num' }, `${enabledPeopleCount} / ${people.length}`)
      ),
      h('div', { className: 'tw-metric' },
        h('div', { className: 'tw-muted' }, '当前开放能力项'),
        h('div', { className: 'tw-metric-num' }, `${enabledCapsCount}`)
      ),
      h('div', { className: 'tw-metric' },
        h('div', { className: 'tw-muted' }, '待拍板与待补口径'),
        h('div', { className: 'tw-metric-num' }, `${approvals.length}`)
      )
    ),
    view?.hasDeskUndo && h('div', { id: 'deskUndoStrip', className: 'tw-undo-strip' },
      h('span', null, '工作台刚完成一次操作。如有误点可立即撤回。'),
      h('button', {
        type: 'button',
        className: 'tw-btn',
        disabled: busy,
        onClick: () => onAction('undo_desk', {})
      }, '撤销上一步操作')
    ),
    h('section', { className: 'tw-field' },
      h('div', { className: 'tw-card-head', style: { marginBottom: 0 } },
        h('h2', { className: 'tw-h2' }, `需要你拿主意（${approvals.length}）`),
        h('span', { className: 'tw-muted' }, '所有越权边界、待补口径与影子模式草稿都在这里人工定音')
      ),
      approvals.length ? approvals.map(app => h('article', {
        key: app.id,
        className: app.tone === 'danger' ? 'tw-approval is-danger' : 'tw-approval'
      },
        h('div', { className: 'tw-card-head', style: { marginBottom: 0 } },
          h('div', { className: 'tw-actions' },
            h('span', { className: `tw-badge ${app.tone === 'danger' ? 'is-danger' : 'is-amber'}` }, app.tag),
            h('strong', null, app.headline)
          ),
          h('span', { className: 'tw-muted' }, app.channel)
        ),
        h('p', { className: 'tw-muted' }, app.gist),
        h('div', { className: 'tw-draft-box' },
          h('div', { className: 'tw-muted', style: { marginBottom: '0.25rem' } }, `原问：${app.question}`),
          h('div', null, app.draft)
        ),
        h('div', { className: 'tw-actions' },
          h('button', {
            type: 'button',
            className: 'tw-btn tw-btn-primary',
            disabled: busy,
            onClick: () => onAction('approve_draft', { approvalId: app.id })
          }, app.primaryActionLabel || '批准发出'),
          h('button', {
            type: 'button',
            className: 'tw-btn',
            disabled: busy,
            onClick: () => onEditDraft(app)
          }, '改一下再发'),
          h('button', {
            type: 'button',
            className: 'tw-btn',
            disabled: busy,
            onClick: () => onHandoffToOwner(app)
          }, '转我本人进会话处理'),
          app.allowRuleExtract && h('button', {
            type: 'button',
            className: 'tw-btn',
            disabled: busy,
            onClick: () => onAction('save_approval_as_rule', { approvalId: app.id, ruleText: app.draft, kind: '规矩' })
          }, '发出并记成长期规矩'),
          h('button', {
            type: 'button',
            className: 'tw-btn',
            disabled: busy,
            onClick: () => onAction('dismiss_approval', { approvalId: app.id })
          }, '先搁置')
        ),
        app.trace && h('details', { className: 'tw-trace' },
          h('summary', null, '查看只读核对依据与审计轨迹'),
          h('p', { className: 'tw-muted', style: { margin: '0.35rem 0' } }, app.trace.intro),
          (app.trace.steps || []).map((st, i) => h('div', { key: i, className: 'tw-muted' }, `${i + 1}. ${st.title}：${st.detail}`)),
          app.trace.techNote && h('div', { className: 'tw-muted', style: { marginTop: '0.25rem' } }, app.trace.techNote)
        )
      )) : h('div', { className: 'tw-card' },
        h('h3', { className: 'tw-h3' }, '目前没有积压待拍板事项'),
        h('p', { className: 'tw-muted', style: { marginTop: '0.25rem' } },
          '你可以点击上方「客户视角预览」检验分身回答口径，或在下方指令栏试跑一句提问。'
        )
      )
    ),
    h('section', { className: 'tw-card' },
      h('div', { className: 'tw-card-head' },
        h('div', null,
          h('h2', { className: 'tw-h2' }, '直接给分身交代新规矩 / 本地试问'),
          h('p', { className: 'tw-muted', style: { marginTop: '0.2rem' } },
            '支持自然语言指令，例如「加条红线：报价与排期一律转我」、「暂停某位对象」或直接输入提问测试口吻。'
          )
        )
      ),
      h('div', { className: 'tw-actions' },
        h('input', {
          id: 'deskCommandInput',
          className: 'tw-input',
          style: { flex: 1 },
          placeholder: '输入指令或试跑提问，如：加条规矩：先复述诉求再给前 3 行结论',
          value: commandText,
          onChange: e => setCommandText(e.target.value),
          onKeyDown: e => { if (e.key === 'Enter') submitCommand(); }
        }),
        h('button', {
          id: 'btnDeskCommandSubmit',
          type: 'button',
          className: 'tw-btn tw-btn-primary',
          disabled: busy || !commandText.trim(),
          onClick: submitCommand
        }, '执行指令')
      ),
      view?.selfTestTurn && h('div', { className: 'tw-draft-box', style: { marginTop: '0.65rem' } },
        h('div', { className: 'tw-muted' }, `自测问：${view.selfTestTurn.question} · ${view.selfTestTurn.basis}`),
        h('div', { style: { marginTop: '0.25rem' } }, view.selfTestTurn.answer)
      )
    ),
    h('section', { className: 'tw-card' },
      h('div', { className: 'tw-card-head' },
        h('h2', { className: 'tw-h2' }, `最近值班记录（${deliveries.length}）`),
        h('span', { className: 'tw-muted' }, '自动回复、本人拍板回执及在场自动收声均留痕可查')
      ),
      deliveries.length ? deliveries.map(d => h('div', { key: d.id, className: 'tw-row', style: { alignItems: 'flex-start', flexDirection: 'column', gap: '0.25rem' } },
        h('div', { style: { display: 'flex', width: '100%', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' } },
          h('div', { className: 'tw-actions' },
            h('strong', null, d.who),
            h('span', { className: 'tw-muted' }, `${d.channel} · ${d.time}`),
            h('span', { className: `tw-badge ${d.statusTone === 'ok' ? 'is-ok' : ''}` }, d.statusLabel)
          )
        ),
        h('div', { className: 'tw-muted', style: { color: 'var(--tw-ink)' } }, d.summary),
        d.trace && h('details', { className: 'tw-trace', style: { width: '100%' } },
          h('summary', null, '查看审计细节'),
          h('div', { className: 'tw-muted' }, d.trace.intro),
          (d.trace.steps || []).map((st, idx) => h('div', { key: idx, className: 'tw-muted' }, `${idx + 1}. ${st.title}：${st.detail}`))
        )
      )) : h('p', { className: 'tw-muted' }, '尚无外部服务投递记录。开通首位服务对象后，每笔回复都会实时显示在这里。')
    )
  );
}

function PeopleScene({ view, busy, onAction, onOpenInvite, onSelectPerson, onOpenPreview }) {
  const people = view?.people || [];
  return h('div', { className: 'tw-container' },
    h('section', { className: 'tw-card' },
      h('div', { className: 'tw-card-head' },
        h('div', null,
          h('h2', { className: 'tw-h2' }, '我开通的人 · 单人白名单与物理隔离会话'),
          h('p', { className: 'tw-muted', style: { marginTop: '0.25rem' } },
            '每人使用独立物理隔离文件夹存储对话；默认单人单日上限 30 轮防刷屏；零付费墙或兑换码限制。'
          )
        ),
        h('button', {
          id: 'btnAddPerson',
          type: 'button',
          className: 'tw-btn tw-btn-primary',
          onClick: onOpenInvite
        }, '+ 开通服务对象 / 发邀请')
      ),
      people.length ? h('div', { style: { overflowX: 'auto' } },
        h('table', { className: 'tw-table' },
          h('thead', null,
            h('tr', null,
              h('th', null, '服务对象'),
              h('th', null, '开通通道与绑定'),
              h('th', null, '答复边界'),
              h('th', null, '状态与今日频次'),
              h('th', null, '开关'),
              h('th', null, '操作')
            )
          ),
          h('tbody', null,
            people.map(p => h('tr', { key: p.id, className: 'is-row-clickable' },
              h('td', null,
                h('div', { style: { fontWeight: 600 } }, p.name),
                h('div', { className: 'tw-muted' }, p.role)
              ),
              h('td', { 'data-label': '通道' },
                h('div', null, p.channel),
                h('div', { className: 'tw-muted' }, formatBindingText(p))
              ),
              h('td', { 'data-label': '答复边界' }, formatModeLabel(p.mode)),
              h('td', { 'data-label': '状态' },
                h('div', null, p.expiry),
                h('div', { className: 'tw-muted' }, `今日 ${p.todayCount || 0}/${view?.dailyTurnCap || 30} 轮 · 累计 ${p.servedCount || 0} 次`)
              ),
              h('td', { 'data-label': '启用开关' },
                h('input', {
                  type: 'checkbox',
                  'aria-label': `切换 ${p.name} 启用状态`,
                  checked: Boolean(p.enabled),
                  disabled: busy,
                  onChange: e => onAction('toggle_person', { personId: p.id, enabled: e.target.checked })
                })
              ),
              h('td', null,
                h('div', { className: 'tw-actions' },
                  h('button', {
                    type: 'button',
                    className: 'tw-btn',
                    onClick: () => onSelectPerson(p.id)
                  }, '详情与对话'),
                  h('button', {
                    type: 'button',
                    className: 'tw-btn',
                    onClick: () => onOpenPreview(p.id)
                  }, '客户视角')
                )
              )
            ))
          )
        )
      ) : h('div', { className: 'tw-draft-box' }, '暂未开通任何外部或内部试用对象。点击右上角「+ 开通服务对象 / 发邀请」，一键生成专属网页链接、5 分钟微信扫码凭证或群白名单。')
    )
  );
}

function CapsScene({ view, busy, onAction, onOpenChannel, onConfirm }) {
  const [newKind, setNewKind] = useState('规矩');
  const [newText, setNewText] = useState('');
  const [editingRuleId, setEditingRuleId] = useState('');
  const [editingRuleText, setEditingRuleText] = useState('');
  const [editingRuleKind, setEditingRuleKind] = useState('规矩');

  const mountedProjects = view?.mountedProjects || [];
  const capabilities = view?.capabilities || [];
  const channels = view?.channels || [];
  const rules = view?.rules || [];

  return h('div', { className: 'tw-container' },
    view?.hasCapsUndo && h('div', { id: 'capsUndoStrip', className: 'tw-undo-strip' },
      h('span', null, '刚调整了能力包、通道或规矩设置。'),
      h('button', {
        type: 'button',
        className: 'tw-btn',
        disabled: busy,
        onClick: () => onAction('undo_caps', {})
      }, '撤销本页改动')
    ),
    h('section', { className: 'tw-card' },
      h('div', { className: 'tw-card-head' },
        h('div', null,
          h('h2', { className: 'tw-h2' }, `已挂载的项目能力包（${mountedProjects.length}）`),
          h('p', { className: 'tw-muted', style: { marginTop: '0.2rem' } },
            '采用「1 个主分身 + 多项目只读能力包」架构；0-Token 本地mtime感知变动后等待你点按确认升级。'
          )
        ),
        h('button', {
          id: 'btnMountProject',
          type: 'button',
          className: 'tw-btn tw-btn-primary',
          onClick: () => onAction('switch_scene', { scene: 'onboard', onboardMode: 'mount' })
        }, '+ 挂载新项目')
      ),
      mountedProjects.length ? h('div', { className: 'tw-grid-2' },
        mountedProjects.map(mp => h('article', { key: mp.id, className: 'tw-card' },
          h('div', { className: 'tw-card-head' },
            h('div', null,
              h('h3', { className: 'tw-h3' }, mp.projectName),
              h('p', { className: 'tw-muted', style: { marginTop: '0.2rem' } },
                `${mp.docCount} 篇只读文档 · 已隔离 ${mp.blockedSecretCount} 项凭据 / ${mp.blockedWriteScriptCount} 个写脚本`
              )
            ),
            mp.hasDelta && h('span', { className: 'tw-badge is-amber' }, '检测到变动')
          ),
          h('p', { className: 'tw-muted' }, mp.shortSummary),
          mp.deltaSpec && h('div', { className: 'tw-banner is-warn', style: { marginTop: '0.6rem' } },
            h('div', { style: { flex: 1 } },
              h('div', { style: { fontWeight: 600 } }, mp.deltaSpec.badge || '检测到项目变动'),
              mp.deltaSpec.intro && h('div', { className: 'tw-muted' }, mp.deltaSpec.intro),
              (mp.deltaSpec.items || []).map((it, i) => h('div', { key: i, className: 'tw-muted' }, `${it.title}：${it.desc}`))
            ),
            h('button', {
              type: 'button',
              className: 'tw-btn tw-btn-primary',
              disabled: busy,
              onClick: () => onAction('confirm_delta_upgrade', { projectId: mp.id })
            }, '确认升级分身')
          ),
          h('div', { className: 'tw-actions', style: { marginTop: '0.65rem' } },
            h('button', {
              type: 'button',
              className: 'tw-btn',
              disabled: busy,
              onClick: () => onAction('recheck_delta', { projectId: mp.id })
            }, '重新检测变动'),
            h('button', {
              type: 'button',
              className: 'tw-btn tw-btn-danger',
              disabled: busy,
              onClick: () => onConfirm({
                title: `卸载「${mp.projectName}」能力包？`,
                message: '卸载仅移除分身对该项目文档的索引引用，绝不会修改或删除你原本的任何项目文件。',
                onAccept: () => onAction('unmount_project', { projectId: mp.id })
              })
            }, '卸载项目')
          )
        ))
      ) : h('div', { className: 'tw-draft-box' }, '暂未挂载任何项目能力包。点击右上角「+ 挂载新项目」开始只读提炼。')
    ),
    h('section', { className: 'tw-card' },
      h('div', { className: 'tw-card-head' },
        h('h2', { className: 'tw-h2' }, `分身已掌握的只读能力项（${capabilities.length}）`),
        h('span', { className: 'tw-muted' }, '关闭某项开关后，分身将拒绝检索该主题资料')
      ),
      capabilities.length ? h('div', null,
        capabilities.map(cap => h('div', { key: cap.id, className: 'tw-row' },
          h('div', null,
            h('div', { style: { fontWeight: 600 } },
              cap.name,
              h('span', { className: 'tw-badge', style: { marginLeft: '0.45rem' } }, cap.projectName || '已授权项目')
            ),
            h('div', { className: 'tw-muted' }, cap.scope || cap.summary)
          ),
          h('label', { className: 'tw-switch' },
            h('input', {
              type: 'checkbox',
              checked: Boolean(cap.enabled),
              disabled: busy,
              onChange: e => onAction('toggle_capability', { capId: cap.id, enabled: e.target.checked })
            }),
            cap.enabled ? '开放' : '收起'
          )
        ))
      ) : h('p', { className: 'tw-muted' }, '尚无提炼出的能力项。')
    ),
    h('section', { className: 'tw-card' },
      h('div', { className: 'tw-card-head' },
        h('h2', { className: 'tw-h2' }, '五类本地直连接待通道'),
        h('span', { className: 'tw-muted' }, '均在本机执行长连接或扫码鉴权，所有应用 Secret 仅存于本机 0600 凭据库')
      ),
      h('div', { className: 'tw-grid-2' },
        channels.map(ch => h('article', { key: ch.id, className: 'tw-card' },
          h('div', { className: 'tw-card-head' },
            h('div', null,
              h('h3', { className: 'tw-h3' }, ch.name),
              h('div', { className: 'tw-actions', style: { marginTop: '0.25rem' } },
                h('span', { className: `tw-badge ${ch.enabled ? 'is-ok' : ''}` }, ch.enabled ? '已启用' : '未启用'),
                ch.appIdHint && h('span', { className: 'tw-badge' }, ch.appIdHint)
              )
            ),
            ch.id !== 'ch-web' && h('input', {
              type: 'checkbox',
              'aria-label': `开关 ${ch.name}`,
              checked: Boolean(ch.enabled),
              disabled: busy || (!ch.configured && !ch.enabled),
              onChange: e => onAction('toggle_channel', { channelId: ch.id, enabled: e.target.checked })
            })
          ),
          h('p', { className: 'tw-muted' }, ch.desc),
          h('p', { className: 'tw-muted', style: { marginTop: '0.35rem', color: 'var(--tw-ink)' } }, ch.status),
          ch.id !== 'ch-web' && h('div', { className: 'tw-actions', style: { marginTop: '0.65rem' } },
            h('button', {
              type: 'button',
              className: 'tw-btn',
              onClick: () => onOpenChannel(ch)
            }, ch.id === 'ch-wechat' ? '生成 5 分钟微信码 / 扫码管理' : (ch.configured ? '重新配置 / 断开' : '引导配置连接'))
          )
        ))
      )
    ),
    h('section', { className: 'tw-card' },
      h('div', { className: 'tw-card-head' },
        h('h2', { className: 'tw-h2' }, `说话规矩与安全红线（${rules.length}）`),
        h('span', { className: 'tw-muted' }, '红线规则始终先于资料检索执行')
      ),
      h('div', { className: 'tw-actions', style: { marginBottom: '0.85rem' } },
        h('select', {
          id: 'newRuleKind',
          className: 'tw-select',
          style: { width: 'auto' },
          value: newKind,
          onChange: e => setNewKind(e.target.value)
        },
          h('option', { value: '规矩' }, '规矩'),
          h('option', { value: '红线' }, '红线')
        ),
        h('input', {
          id: 'newRuleText',
          className: 'tw-input',
          style: { flex: 1 },
          placeholder: '新增一条清晰的大白话规则，例如：遇到未公开定价策略必须由本人确认',
          value: newText,
          onChange: e => setNewText(e.target.value)
        }),
        h('button', {
          id: 'btnAddRule',
          type: 'button',
          className: 'tw-btn tw-btn-primary',
          disabled: busy || !newText.trim(),
          onClick: async () => {
            await onAction('add_rule', { kind: newKind, text: newText.trim() });
            setNewText('');
          }
        }, '添加')
      ),
      rules.map(r => h('div', { key: r.id, className: 'tw-row' },
        editingRuleId === r.id ? h('div', { className: 'tw-actions', style: { flex: 1 } },
          h('select', {
            className: 'tw-select',
            style: { width: 'auto' },
            value: editingRuleKind,
            onChange: e => setEditingRuleKind(e.target.value)
          },
            h('option', { value: '规矩' }, '规矩'),
            h('option', { value: '红线' }, '红线')
          ),
          h('input', {
            className: 'tw-input',
            style: { flex: 1 },
            value: editingRuleText,
            onChange: e => setEditingRuleText(e.target.value)
          }),
          h('button', {
            type: 'button',
            className: 'tw-btn tw-btn-primary',
            disabled: busy || !editingRuleText.trim(),
            onClick: async () => {
              await onAction('edit_rule', { ruleId: r.id, kind: editingRuleKind, text: editingRuleText.trim() });
              setEditingRuleId('');
            }
          }, '保存'),
          h('button', {
            type: 'button',
            className: 'tw-btn',
            onClick: () => setEditingRuleId('')
          }, '取消')
        ) : h(React.Fragment, null,
          h('div', { style: { flex: 1 } },
            h('span', { className: `tw-badge ${r.kind === '红线' ? 'is-danger' : ''}`, style: { marginRight: '0.45rem' } }, r.kind),
            r.text
          ),
          h('div', { className: 'tw-actions' },
            h('button', {
              type: 'button',
              className: 'tw-btn',
              onClick: () => {
                setEditingRuleId(r.id);
                setEditingRuleKind(r.kind);
                setEditingRuleText(r.text);
              }
            }, '编辑'),
            h('button', {
              type: 'button',
              className: 'tw-btn tw-btn-danger',
              disabled: busy,
              onClick: () => onAction('delete_rule', { ruleId: r.id })
            }, '删除')
          )
        )
      ))
    )
  );
}

export {
  OnboardScene,
  DeskScene,
  PeopleScene,
  CapsScene
};
