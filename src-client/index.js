/**
 * Client entry point for `@oxmumu3/dsh-agent-twin` (`v0.5.0`).
 * Compiled to CJS `window.__ModuleLoader__.load` bundle (`client.js`).
 */
import React, { useCallback, useEffect, useState } from 'react';
const h = React.createElement;
import { ensureTwinStyles } from './styles.js';
import {
  TwinNavIcon,
  fetchTwinView,
  optService,
  runTwinAction
} from './api.js';
import {
  CallerPreviewModal,
  ChannelConfigModal,
  ConfirmActionModal,
  EditDraftModal,
  InvitePersonModal,
  PersonDrawer,
  ProfileEditModal
} from './modals.js';
import {
  CapsScene,
  DeskScene,
  OnboardScene,
  PeopleScene
} from './scenes.js';

const PANEL_ID = 'agent-twin';

function TwinWorkbenchRoot({ ctx }) {
  const [payload, setPayload] = useState(null);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const [editingApproval, setEditingApproval] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPersonId, setPreviewPersonId] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [activeChannel, setActiveChannel] = useState(null);
  const [confirmSpec, setConfirmSpec] = useState(null);

  useEffect(() => {
    ensureTwinStyles();
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

  const handleAction = useCallback(async (action, args = {}) => {
    setBusy(true);
    setErrorMsg('');
    try {
      const res = await runTwinAction(action, args);
      if (res.view) {
        setPayload(prev => ({ ...(prev || {}), view: res.view }));
      }
      if (action === 'start_extraction' || action === 'confirm_delta_upgrade') {
        void refresh();
      }
      if (res.result?.message) {
        setToastMsg(res.result.message);
      } else if (res.result?.statusLabel) {
        setToastMsg(res.result.statusLabel);
      }
      return res;
    } catch (err) {
      setErrorMsg(err?.message || '操作失败');
      throw err;
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  async function handleHandoffToOwner(approval) {
    const uiWs = optService(ctx, 'uiWorkspace');
    const wsReg = optService(ctx, 'workspaceRegistry');
    const layout = optService(ctx, 'layout');
    const draftPrompt = `请接手处理访客「${approval.personName}」的问题并起草回复：\n原问：${approval.question}\n当前依据线索：${approval.basisHint || '需核对最新项目材料'}`;

    try {
      const firstWs = wsReg?.list?.()?.[0];
      if (uiWs && typeof uiWs.startSession === 'function') {
        const session = await uiWs.startSession(firstWs ? { workspaceId: firstWs.id } : {});
        if (session?.id && typeof uiWs.requestDraftInitialization === 'function') {
          await uiWs.requestDraftInitialization(session.id, { prompt: draftPrompt });
        } else if (session?.id && typeof uiWs.openSession === 'function') {
          await uiWs.openSession(session.id);
        }
        await handleAction('dismiss_approval', { approvalId: approval.id });
        layout?.selectPanel?.(null);
        setToastMsg('已转至你的独立工作区会话继续处理');
        return;
      }
      if (uiWs && typeof uiWs.openWorkspace === 'function' && firstWs) {
        await uiWs.openWorkspace(firstWs.id);
        await handleAction('dismiss_approval', { approvalId: approval.id });
        layout?.selectPanel?.(null);
        setToastMsg('已打开工作区会话接手处理');
        return;
      }
    } catch (err) {
      setErrorMsg(err?.message || '转交宿主工作区会话失败');
      return;
    }
    setToastMsg('已记录待本人接手（可在宿主工作区对话中直接粘贴原问回复，或点击「改一下再发」）');
  }

  const view = payload?.view || null;
  const presets = payload?.presets || [];
  const channelGuides = payload?.channelGuides || {};
  const projects = payload?.projects || [];
  const scene = view?.scene || 'onboard';
  const selectedPerson = (view?.people || []).find(p => p.id === selectedPersonId) || null;
  const pendingCount = (view?.approvals || []).length;

  const tabs = [
    ...(view?.lifecycleStage === 'cold' || scene === 'onboard'
      ? [['onboard', view?.onboardMode === 'mount' ? '挂载能力包' : '首次提炼']]
      : []),
    ['desk', '我的工作台', pendingCount],
    ['people', '我开通的人', (view?.people || []).length],
    ['caps', '分身本事与通道', (view?.capabilities || []).length]
  ];

  return h('div', { className: 'tw-root', 'data-agent-twin-workbench': 'v4' },
    h('header', { className: 'tw-topbar' },
      h('div', { className: 'tw-brand' },
        h('div', { className: 'tw-brand-mark' }, h(TwinNavIcon)),
        h('div', null,
          h('h1', { className: 'tw-brand-title' }, 'AI 分身工作台'),
          h('p', { className: 'tw-brand-sub' }, '1 个主分身 + 多项目只读能力包 · 本地隔离沙箱')
        )
      ),
      h('nav', { className: 'tw-tabs', 'aria-label': '工作台场景切换' },
        tabs.map(([id, label, count]) => h('button', {
          key: id,
          type: 'button',
          className: scene === id ? 'tw-tab is-active' : 'tw-tab',
          'aria-current': scene === id ? 'page' : undefined,
          onClick: () => handleAction('switch_scene', { scene: id })
        },
          label,
          typeof count === 'number' && h('span', { className: 'tw-badge' }, String(count))
        )),
        h('button', {
          type: 'button',
          className: 'tw-btn',
          disabled: busy,
          onClick: refresh
        }, '刷新')
      )
    ),
    h('main', { className: 'tw-scroll' },
      h('div', { className: 'tw-container', style: { marginBottom: (errorMsg || toastMsg) ? '0.85rem' : 0 } },
        errorMsg && h('div', { className: 'tw-banner is-danger', role: 'alert' },
          h('span', null, errorMsg),
          h('button', { type: 'button', className: 'tw-btn', onClick: () => setErrorMsg('') }, '知道了')
        ),
        toastMsg && !errorMsg && h('div', { className: 'tw-banner', role: 'status' },
          h('span', null, toastMsg),
          h('button', { type: 'button', className: 'tw-btn', onClick: () => setToastMsg('') }, '收起')
        )
      ),
      !view ? h('div', { className: 'tw-container' },
        h('div', { className: 'tw-card' }, errorMsg ? '分身主机暂未响应，请确认插件已启用并点击刷新。' : '正在连接本机分身服务与状态库...')
      ) : scene === 'onboard'
        ? h(OnboardScene, {
            view,
            projects,
            presets,
            busy,
            onAction: handleAction,
            onOpenInvite: () => setInviteOpen(true)
          })
        : scene === 'people'
          ? h(PeopleScene, {
              view,
              busy,
              onAction: handleAction,
              onOpenInvite: () => setInviteOpen(true),
              onSelectPerson: id => setSelectedPersonId(id),
              onOpenPreview: id => { setPreviewPersonId(id); setPreviewOpen(true); }
            })
          : scene === 'caps'
            ? h(CapsScene, {
                view,
                busy,
                onAction: handleAction,
                onOpenChannel: ch => setActiveChannel(ch),
                onConfirm: spec => setConfirmSpec(spec)
              })
            : h(DeskScene, {
                view,
                busy,
                onAction: handleAction,
                onEditDraft: app => setEditingApproval(app),
                onOpenPreview: id => { setPreviewPersonId(id || ''); setPreviewOpen(true); },
                onOpenProfileEdit: () => setProfileOpen(true),
                onOpenInvite: () => setInviteOpen(true),
                onHandoffToOwner: handleHandoffToOwner
              })
    ),
    h(EditDraftModal, {
      approval: editingApproval,
      busy,
      onClose: () => setEditingApproval(null),
      onSubmit: async (approvalId, customDraft) => {
        await handleAction('approve_draft', { approvalId, customDraft });
        setEditingApproval(null);
      },
      onSaveAsRule: async (approvalId, customDraft, ruleText) => {
        await handleAction('save_approval_as_rule', { approvalId, customDraft, ruleText, kind: '规矩' });
        setEditingApproval(null);
      }
    }),
    h(InvitePersonModal, {
      open: inviteOpen,
      view,
      busy,
      onClose: () => setInviteOpen(false),
      onCreated: payload => handleAction('add_person', payload)
    }),
    h(CallerPreviewModal, {
      open: previewOpen,
      view,
      initialPersonId: previewPersonId,
      onClose: () => setPreviewOpen(false)
    }),
    h(ProfileEditModal, {
      open: profileOpen,
      view,
      presets,
      busy,
      onClose: () => setProfileOpen(false),
      onSave: args => handleAction('update_profile', args)
    }),
    h(PersonDrawer, {
      person: selectedPerson,
      view,
      busy,
      onClose: () => setSelectedPersonId(''),
      onAction: handleAction,
      onOpenPreview: id => { setPreviewPersonId(id); setPreviewOpen(true); },
      onConfirm: spec => setConfirmSpec(spec)
    }),
    h(ChannelConfigModal, {
      channel: activeChannel,
      guide: activeChannel ? channelGuides[activeChannel.id] : null,
      busy,
      onClose: () => setActiveChannel(null),
      onAction: handleAction,
      onConfirm: spec => setConfirmSpec(spec)
    }),
    h(ConfirmActionModal, {
      confirmSpec,
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
  }
}

export const inject = ['slots'];
export { apply, TwinWorkbenchRoot };
