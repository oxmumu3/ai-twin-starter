/**
 * Client entry point for `@oxmumu3/dsh-agent-twin` (`v0.5.0` -> Dot V2 Editorial v4 UI).
 * Compiled to CJS `window.__ModuleLoader__.load` bundle (`client.js`).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
const h = React.createElement;
import { ensureTwinStyles } from './styles.js';
import {
  BrandUserIcon,
  TwinNavIcon,
  copyToClipboard,
  detectHostDarkMode,
  fetchTwinView,
  optService,
  runTwinAction
} from './api.js';
import {
  CallerPreviewModal,
  ChannelConfigModal,
  ConfirmActionModal,
  DeltaUpgradeModal,
  HandoffModal,
  InviteModal,
  PersonDrawer,
  PersonModal,
  ProfileEditModal,
  ProjectSelectModal,
  TraceModal
} from './modals.js';
import {
  CapsScene,
  DeskScene,
  OnboardScene,
  PeopleScene
} from './scenes.js';
import {
  TwinGrantToolView,
  TwinInboxToolView,
  TwinPublishToolView,
  TwinStatusToolView
} from './toolviews.js';

const PANEL_ID = 'agent-twin';

function TwinWorkbenchRoot({ ctx }) {
  const rootRef = useRef(null);
  const scrollRef = useRef(null);
  const toastTimerRef = useRef(null);

  const [scheme, setScheme] = useState('light');
  const [payload, setPayload] = useState(null);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Project selection state for Onboard & Mount
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [customProject, setCustomProject] = useState(null);
  const [projectDialogMode, setProjectDialogMode] = useState('');

  // Drawer & Dialogs state
  const [drawerPersonId, setDrawerPersonId] = useState('');
  const [personModalState, setPersonModalState] = useState({ open: false, editingId: '', initialDraft: null, draftNonce: 0 });
  const [pendingPersonReturnDraft, setPendingPersonReturnDraft] = useState(null);
  const [invitePersonId, setInvitePersonId] = useState('');
  const [channelModalId, setChannelModalId] = useState('');
  const [previewState, setPreviewState] = useState({ open: false, personId: '', fromInvite: false });
  const [profileOpen, setProfileOpen] = useState(false);
  const [deltaProjectId, setDeltaProjectId] = useState('');
  const [traceItemId, setTraceItemId] = useState('');
  const [handoffTarget, setHandoffTarget] = useState(null);
  const [confirmSpec, setConfirmSpec] = useState(null);

  const showToast = useCallback(msg => {
    const clean = String(msg || '').trim();
    if (!clean) return;
    setToastMsg(clean);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMsg('');
    }, 3000);
  }, []);

  useEffect(() => {
    ensureTwinStyles();
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const updateScheme = () => {
      const dark = detectHostDarkMode(rootRef.current);
      setScheme(dark ? 'dark' : 'light');
    };
    updateScheme();
    if (typeof MutationObserver !== 'function') return;
    const obs = new MutationObserver(updateScheme);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'data-color-scheme', 'style'] });
    if (document.body) {
      obs.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme', 'data-color-scheme', 'style'] });
    }
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    mq?.addEventListener?.('change', updateScheme);
    return () => {
      obs.disconnect();
      mq?.removeEventListener?.('change', updateScheme);
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchTwinView();
      setPayload(next);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(err?.message || '无法连接 AI 分身主机服务');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Live poll ONLY while 4-step extraction is actively running
  const jobStatus = payload?.view?.extractionJob?.status;
  useEffect(() => {
    if (jobStatus === 'ready') {
      setToastMsg(prev => (prev.startsWith('已开始逐项读取与提炼') ? '' : prev));
    }
    if (jobStatus !== 'running') return;
    const timer = setInterval(() => {
      void refresh();
    }, 450);
    return () => clearInterval(timer);
  }, [jobStatus, refresh]);

  const handleAction = useCallback(async (action, args = {}) => {
    setBusy(true);
    setErrorMsg('');
    try {
      const res = await runTwinAction(action, args);
      if (res.view) {
        setPayload(prev => ({ ...(prev || {}), view: res.view }));
      }
      if (action === 'switch_scene' || action === 'complete_extraction') {
        setToastMsg('');
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
      }
      if (action === 'confirm_delta_upgrade') {
        void refresh();
      }
      return res;
    } catch (err) {
      setErrorMsg(err?.message || '操作失败');
      throw err;
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  async function handleHandoffConfirm(target) {
    const uiWs = optService(ctx, 'uiWorkspace');
    const wsReg = optService(ctx, 'workspaceRegistry');
    const layout = optService(ctx, 'layout');

    let draftPrompt = '';
    if (target.kind === 'person') {
      const p = target.person;
      const last = (p.threads || [])[p.threads.length - 1];
      draftPrompt = `请接手处理服务对象「${p.name}」（${p.channel}）的对话：\n最近对话：${last?.question || '需进一步确认'}\n专门叮嘱：${p.note || '无'}`;
    } else {
      const a = target.item;
      draftPrompt = `请接手处理访客「${a.personName}」的问题并起草回复：\n原问：${a.question}\n当前依据线索：${a.basisHint || '需核对最新项目材料'}`;
    }

    try {
      const firstWs = wsReg?.list?.()?.[0];
      if (uiWs && typeof uiWs.startSession === 'function') {
        const session = await uiWs.startSession(firstWs ? { workspaceId: firstWs.id } : {});
        if (session?.id && typeof uiWs.requestDraftInitialization === 'function') {
          await uiWs.requestDraftInitialization(session.id, { prompt: draftPrompt });
        } else if (session?.id && typeof uiWs.openSession === 'function') {
          await uiWs.openSession(session.id);
        }
        if (target.kind === 'approval') {
          await handleAction('dismiss_approval', { approvalId: target.item.id });
        }
        setHandoffTarget(null);
        setDrawerPersonId('');
        layout?.selectPanel?.(null);
        showToast('已转至你的独立工作区会话继续处理');
        return;
      }
      if (uiWs && typeof uiWs.openWorkspace === 'function' && firstWs) {
        await uiWs.openWorkspace(firstWs.id);
        await copyToClipboard(draftPrompt);
        if (target.kind === 'approval') {
          await handleAction('dismiss_approval', { approvalId: target.item.id });
        }
        setHandoffTarget(null);
        setDrawerPersonId('');
        layout?.selectPanel?.(null);
        showToast('已打开工作区对话并将背景信息复制到剪贴板');
        return;
      }
    } catch (err) {
      setErrorMsg(err?.message || '转交宿主工作区会话失败');
      return;
    }

    await copyToClipboard(draftPrompt);
    setHandoffTarget(null);
    showToast('已复制背景提示词到剪贴板，可在工作区新对话中直接粘贴继续');
  }

  const view = payload?.view || null;
  const presets = payload?.presets || [];
  const channelGuides = payload?.channelGuides || {};
  const projects = payload?.projects || [];
  const scene = view?.scene || 'onboard';
  const isOnboard = scene === 'onboard';
  const pendingCount = (view?.approvals || []).length;

  const drawerPerson = (view?.people || []).find(p => p.id === drawerPersonId) || null;
  const editingPerson = personModalState.editingId
    ? ((view?.people || []).find(p => p.id === personModalState.editingId) || null)
    : null;
  const invitePerson = (view?.people || []).find(p => p.id === invitePersonId) || null;
  const activeChannel = (view?.channels || []).find(c => c.id === channelModalId) || null;
  const deltaProject = (view?.mountedProjects || []).find(m => m.id === deltaProjectId) || null;
  const job = view?.extractionJob || null;

  return h('div', {
    ref: rootRef,
    className: 'tw-root',
    'data-agent-twin-workbench': 'v4',
    'data-tw-scheme': scheme
  },
    // Editorial single-row header — hidden on scene === 'onboard'
    h('header', { id: 'pluginHeader', className: 'plugin-header', hidden: isOnboard },
      h('div', { className: 'brand-title' },
        h('span', { className: 'brand-mark' }, h(BrandUserIcon)),
        h('span', { id: 'brandTwinName' }, view?.twinProfile?.name || '工作分身'),
        h('button', {
          type: 'button',
          id: 'btnEditTwinProfile',
          className: 'tw-btn tw-btn--ghost tw-btn--sm brand-edit-btn',
          onClick: () => setProfileOpen(true)
        }, '编辑名片'),
        job && h('button', {
          type: 'button',
          id: 'headerExtractPill',
          className: job.status === 'ready' ? 'header-extract-pill is-ready' : 'header-extract-pill',
          onClick: () => handleAction('switch_scene', { scene: 'onboard' })
        },
          h('span', { className: 'header-extract-pill-dot', 'aria-hidden': 'true' }),
          h('span', { id: 'headerExtractPillText' },
            job.status === 'ready'
              ? `${job.projectName} · 待启用`
              : `提炼中 ${job.step || 1}/4`
          )
        )
      ),

      h('nav', { className: 'header-tabs', role: 'tablist', 'aria-label': '分身工作区' },
        [
          ['desk', '服务台', pendingCount],
          ['people', '服务对象', 0],
          ['caps', '能力与通道', 0]
        ].map(([tabId, label, count]) =>
          h('button', {
            key: tabId,
            type: 'button',
            className: 'tab-btn',
            role: 'tab',
            'data-tab': tabId,
            'aria-selected': String(scene === tabId),
            onClick: () => handleAction('switch_scene', { scene: tabId })
          },
            h('span', null, label),
            count > 0 && h('span', { id: 'tabPendingBadge', className: 'tab-count' }, String(count))
          )
        )
      ),

      h('div', { className: 'duty-switch', role: 'group', 'aria-label': '值班模式切换' },
        [
          ['shadow', '试跑把关'],
          ['live', '正式值班'],
          ['off', '暂停']
        ].map(([duty, label]) =>
          h('button', {
            key: duty,
            type: 'button',
            className: 'duty-btn',
            'data-duty': duty,
            'aria-pressed': String((view?.dutyMode || 'shadow') === duty),
            disabled: busy,
            onClick: async () => {
              await handleAction('set_duty_mode', { dutyMode: duty });
              const labelMap = { shadow: '试跑把关', live: '正式值班', off: '暂停对外值班' };
              showToast(`已切换为：${labelMap[duty]}`);
            }
          },
            h('span', { className: 'duty-dot', 'aria-hidden': 'true' }),
            h('span', null, label)
          )
        )
      )
    ),

    // Main scroll area
    h('main', { ref: scrollRef, id: 'twScroll', className: 'tw-scroll' },
      errorMsg && h('div', { className: 'tw-container' },
        h('div', { className: 'tw-error-banner', role: 'alert' },
          h('span', null, errorMsg),
          h('button', { type: 'button', className: 'tw-btn tw-btn--sm', onClick: () => setErrorMsg('') }, '知道了')
        )
      ),

      !view
        ? h('div', { className: 'tw-container tw-container--narrow' },
            h('div', { className: 'card' },
              errorMsg ? '分身主机暂未响应，请确认插件已启用。' : '正在连接本机分身服务与状态库...'
            )
          )
        : scene === 'onboard'
          ? h(OnboardScene, {
              view,
              projects,
              selectedCandidateId,
              customProject,
              busy,
              onOpenProjectDialog: mode => setProjectDialogMode(mode),
              onAction: handleAction,
              onToast: showToast
            })
          : scene === 'people'
            ? h(PeopleScene, {
                view,
                busy,
                onAction: handleAction,
                onOpenPersonDrawer: id => setDrawerPersonId(id),
                onOpenPersonModal: id => setPersonModalState({ open: true, editingId: id || '', initialDraft: null, draftNonce: Date.now() }),
                onOpenInviteModal: id => setInvitePersonId(id),
                onToast: showToast
              })
            : scene === 'caps'
              ? h(CapsScene, {
                  view,
                  busy,
                  onAction: handleAction,
                  onOpenProfileModal: () => setProfileOpen(true),
                  onOpenProjectDialog: mode => setProjectDialogMode(mode),
                  onOpenDeltaModal: mp => setDeltaProjectId(mp.id),
                  onOpenChannelConfig: chId => setChannelModalId(chId),
                  onConfirmUnmount: mp => setConfirmSpec({
                    title: `卸载「${mp.projectName}」能力包`,
                    message: '仅从当前分身卸载该项目的只读索引，不会删除原项目目录内任何文件；移除后可在上方一键撤销恢复。',
                    confirmLabel: '确认卸载',
                    onConfirm: async () => {
                      await handleAction('unmount_project', { projectId: mp.id });
                      showToast(`已卸载「${mp.projectName}」能力包，可点上方「撤销刚才操作」恢复`);
                    }
                  }),
                  onToast: showToast
                })
              : h(DeskScene, {
                  view,
                  presets,
                  busy,
                  onAction: handleAction,
                  onOpenPersonDrawer: id => setDrawerPersonId(id),
                  onOpenPersonModal: id => setPersonModalState({ open: true, editingId: id || '', initialDraft: null, draftNonce: Date.now() }),
                  onOpenInviteModal: id => setInvitePersonId(id),
                  onOpenChannelConfig: chId => setChannelModalId(chId),
                  onOpenTrace: itemId => setTraceItemId(itemId),
                  onOpenHandoff: target => setHandoffTarget(target),
                  onToast: showToast
                })
    ),

    toastMsg && h('div', { id: 'twToast', className: 'tw-toast', role: 'status', 'aria-live': 'polite' }, toastMsg),

    // Right slide-over drawer + Native Top-Layer dialogs
    h(PersonDrawer, {
      person: drawerPerson,
      view,
      scheme,
      busy,
      onClose: () => setDrawerPersonId(''),
      onAction: handleAction,
      onOpenEditPerson: id => setPersonModalState({ open: true, editingId: id, initialDraft: null, draftNonce: Date.now() }),
      onOpenInvite: id => setInvitePersonId(id),
      onOpenPreview: id => setPreviewState({ open: true, personId: id, fromInvite: false }),
      onOpenTrace: itemId => setTraceItemId(itemId),
      onOpenHandoff: target => setHandoffTarget(target),
      onToast: showToast
    }),

    h(TraceModal, {
      view,
      traceItemId,
      scheme,
      onClose: () => setTraceItemId('')
    }),

    h(PersonModal, {
      open: personModalState.open,
      editingPerson,
      initialDraft: personModalState.initialDraft,
      draftNonce: personModalState.draftNonce,
      view,
      scheme,
      busy,
      onClose: () => {
        setPendingPersonReturnDraft(null);
        setPersonModalState(prev => ({ ...prev, open: false }));
      },
      onJumpChannelConfig: (chId, draft) => {
        setPendingPersonReturnDraft(draft);
        setPersonModalState(prev => ({ ...prev, open: false }));
        setChannelModalId(chId);
      },
      onSavePerson: async formPayload => {
        if (formPayload.isEdit && formPayload.personId) {
          await handleAction('update_person', formPayload);
          setPersonModalState(prev => ({ ...prev, open: false }));
          showToast(`已保存 ${formPayload.name} 的权限设置`);
        } else {
          const res = await handleAction('add_person', formPayload);
          setPersonModalState(prev => ({ ...prev, open: false }));
          const createdId = res?.result?.person?.id;
          if (createdId) {
            setInvitePersonId(createdId);
          }
          showToast(`已为 ${formPayload.name} 开通权限，专属邀请凭证已就绪`);
        }
      },
      onToast: showToast
    }),

    h(InviteModal, {
      person: invitePerson,
      view,
      scheme,
      busy,
      onClose: () => setInvitePersonId(''),
      onAction: handleAction,
      onRefreshView: refresh,
      onOpenPreview: (id, fromInvite) => setPreviewState({ open: true, personId: id, fromInvite: Boolean(fromInvite) }),
      onToast: showToast
    }),

    h(ChannelConfigModal, {
      channel: activeChannel,
      guide: activeChannel ? channelGuides[activeChannel.id] : null,
      scheme,
      busy,
      onClose: meta => {
        setChannelModalId('');
        if (meta?.savedChannelId && pendingPersonReturnDraft) {
          const draft = pendingPersonReturnDraft;
          setPendingPersonReturnDraft(null);
          setPersonModalState({
            open: true,
            editingId: draft.personId || '',
            initialDraft: draft,
            draftNonce: Date.now()
          });
        } else if (!meta?.savedChannelId) {
          setPendingPersonReturnDraft(null);
        }
      },
      onAction: handleAction,
      onToast: showToast
    }),

    h(CallerPreviewModal, {
      open: previewState.open,
      view,
      initialPersonId: previewState.personId,
      fromInvite: previewState.fromInvite,
      scheme,
      busy,
      onClose: () => setPreviewState(prev => ({ ...prev, open: false })),
      onBackToInvite: id => setInvitePersonId(id),
      onAction: handleAction
    }),

    h(ProfileEditModal, {
      open: profileOpen,
      view,
      presets,
      scheme,
      busy,
      onClose: () => setProfileOpen(false),
      onSave: args => handleAction('update_profile', args),
      onToast: showToast
    }),

    h(ProjectSelectModal, {
      mode: projectDialogMode,
      projects,
      selectedCandidateId: selectedCandidateId || (projects[0]?.id || ''),
      mountedProjects: view?.mountedProjects || [],
      scheme,
      busy,
      onClose: () => setProjectDialogMode(''),
      onSelectWorkspace: async (proj, mode) => {
        setProjectDialogMode('');
        if (mode === 'mount') {
          await handleAction('start_extraction', {
            candidateId: proj.id,
            projectName: proj.name,
            mode: 'mount',
            autoComplete: false
          });
          await handleAction('switch_scene', { scene: 'onboard', onboardMode: 'mount' });
          showToast(`开始从「${proj.name}」提炼能力并接入主分身`);
        } else {
          setCustomProject(null);
          setSelectedCandidateId(proj.id);
          showToast(`已切换项目为：${proj.name}`);
        }
      },
      onSelectCustomFolder: async (custom, mode) => {
        setProjectDialogMode('');
        if (mode === 'mount') {
          await handleAction('start_extraction', {
            rootPath: custom.rootPath,
            projectName: custom.projectName,
            mode: 'mount',
            autoComplete: false
          });
          await handleAction('switch_scene', { scene: 'onboard', onboardMode: 'mount' });
          showToast('开始从自定义本地项目提炼能力并接入主分身');
        } else {
          setCustomProject(custom);
          showToast(`已选定本地目录：${custom.projectName || '工作区项目'}`);
        }
      }
    }),

    h(DeltaUpgradeModal, {
      project: deltaProject,
      scheme,
      busy,
      onClose: () => setDeltaProjectId(''),
      onConfirmUpgrade: async projectId => {
        const name = deltaProject?.projectName || '项目';
        await handleAction('confirm_delta_upgrade', { projectId });
        setDeltaProjectId('');
        showToast(`已完成「${name}」增量提炼升级，能力口径已同步`);
      }
    }),

    h(HandoffModal, {
      target: handoffTarget,
      scheme,
      busy,
      onClose: () => setHandoffTarget(null),
      onConfirmHandoff: handleHandoffConfirm
    }),

    h(ConfirmActionModal, {
      spec: confirmSpec,
      scheme,
      busy,
      onClose: () => setConfirmSpec(null)
    })
  );
}

function apply(ctx) {
  function Workbench(props) {
    return h(TwinWorkbenchRoot, { ...props, ctx });
  }
  if (typeof ctx.effect === 'function' && ctx.slots && typeof ctx.slots.register === 'function') {
    ctx.effect(() => ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANEL_ID }, Workbench)));
    ctx.effect(() => ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: PANEL_ID, label: 'AI 分身', order: 6 }, TwinNavIcon)));
    ctx.effect(() => ctx.slots.inject('plugins.row.config', () => ctx.slots.register({ name: 'plugins.row.config', key: 'agent-twin-starter' }, props =>
      props?.view === 'summary'
        ? '1 个主分身 + 多项目只读能力包 · 五通道本机长连接与物理隔离沙箱'
        : h('p', { style: { margin: 0 } }, '所有能力提炼、五通道凭据与值班权限均在左侧「AI 分身」工作台配置与维护。')
    )));
    ctx.effect(() => ctx.slots.inject('tool.call.toolview', function* () {
      yield ctx.slots.register({ name: 'tool.call.toolview', key: 'twin_status' }, TwinStatusToolView);
      yield ctx.slots.register({ name: 'tool.call.toolview', key: 'twin_publish_workspace' }, TwinPublishToolView);
      yield ctx.slots.register({ name: 'tool.call.toolview', key: 'twin_grant_access' }, TwinGrantToolView);
      yield ctx.slots.register({ name: 'tool.call.toolview', key: 'twin_inbox' }, TwinInboxToolView);
    }));
  }
}

export const inject = ['slots'];
export { apply, TwinWorkbenchRoot };
