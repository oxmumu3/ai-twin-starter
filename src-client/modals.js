/**
 * Native Top-Layer Drawer & Modals (`v4.2`) for `@oxmumu3/dsh-agent-twin`
 * complying with `modern-web-guidance` (`dialog`, `light-dismiss-a-dialog`,
 * `animate-to-from-top-layer`) and matching `ai-twin-v4-prototype.html`.
 */
import React, { useEffect, useMemo, useState } from 'react';
const h = React.createElement;
import {
  CloseIcon,
  QrCodeMatrixSvg,
  channelIdFromLabel,
  copyToClipboard,
  createImeHandlers,
  findTraceEntry,
  formatBindingText,
  modeLabelText,
  useDialogController
} from './api.js';

function buildInviteMessage(person, view) {
  if (!person) return '';
  const chId = channelIdFromLabel(person.channel);
  const channels = view?.channels || [];
  const ch = channels.find(c => c.id === chId) || {};
  const project = view?.mountedProjects?.[0];
  const projectName = project?.projectName || '工作区项目';
  const twinName = view?.twinProfile?.name || '工作分身';
  const capNames = (view?.capabilities || [])
    .filter(c => (person.caps || []).includes(c.id))
    .map(c => c.name);
  const capPreview = capNames.length > 0 ? capNames.join('、') : `${(person.caps || []).length} 项只读核数能力`;

  if (chId === 'ch-web') {
    const url = person.guestUrl || '本机已生成独立试用网址';
    return `你好 ${person.name}，我把最近整理的「${projectName}」指标口径与只读分析能力整理成了专属分身「${twinName}」（为你开放了「${capPreview}」，${person.expiry}，无任何收费环节）。\n\n点开链接就能直接问：${url}\n有任何需要细化口径或对比基线的地方，直接给我反馈就行。`;
  }
  if (chId === 'ch-wechat') {
    return `你好 ${person.name}，我为你开好了微信工作分身「${twinName}」（开放「${capPreview}」，${person.expiry}）。\n\n请用微信扫一扫下面这张 5 分钟专属绑定码即可建立 1 对 1 白名单；绑定后直接发问题过来即可，涉敏明细会先转我本人点头确认。`;
  }
  const botName = ch.botName || twinName;
  const chLabel = ch.shortLabel || person.channel || '协作频道';
  if (person.bindMode === 'group_allow' || (!person.pairCode && person.channelHandle)) {
    const groupLabel = person.channelHandle || '专属工作群';
    return `Hi ${person.name}，已在 ${chLabel}「${groupLabel}」接入工作分身「${botName}」（开放「${capPreview}」，${person.expiry}）。\n直接在群里 @${botName} 提问即可核对口径与异常波动；若我本人刚回复过则分身会自动收声。`;
  }
  return `Hi ${person.name}，已在 ${chLabel} 为你开通「${botName}」一对一白名单权限（开放「${capPreview}」，${person.expiry}）。\n请在 ${chLabel} 搜索并私聊「${botName}」，发送一次性配对口令「${person.pairCode || '已签发'}」完成绑定后即可开始提问。`;
}

export function PersonDrawer({
  person,
  view,
  scheme,
  busy,
  onClose,
  onAction,
  onOpenEditPerson,
  onOpenInvite,
  onOpenPreview,
  onOpenTrace,
  onOpenHandoff,
  onToast
}) {
  const open = Boolean(person);
  const ref = useDialogController(open, onClose);
  const [tab, setTab] = useState('chat');
  const [noteInput, setNoteInput] = useState('');
  const [editingApprovalId, setEditingApprovalId] = useState('');
  const [draftText, setDraftText] = useState('');
  const imeNote = useMemo(() => createImeHandlers(), []);

  useEffect(() => {
    if (!open || !person?.id) return;
    setTab('chat');
    setNoteInput('');
    setEditingApprovalId('');
    setDraftText('');
  }, [open, person?.id]);

  const tones = ['amber', 'terra', 'sage', 'slate'];
  const personIdx = person ? Math.max(0, (view?.people || []).findIndex(x => x.id === person.id)) : 0;
  const tone = person?.avatarTone || tones[personIdx % tones.length];
  const initial = person ? String(person.name || 'U').trim().slice(0, 1).toUpperCase() : 'U';

  const threads = person?.threads || [];
  const pendingItems = person ? (view?.approvals || []).filter(a => a.personId === person.id) : [];
  const capNames = person
    ? (view?.capabilities || []).filter(c => (person.caps || []).includes(c.id)).map(c => c.name)
    : [];

  return h('dialog', {
    ref,
    id: 'personDrawer',
    className: 'tw-dlg drawer-dialog',
    closedby: 'any',
    'data-tw-scheme': scheme,
    'aria-labelledby': 'drawerTitle'
  },
    person && [
      h('div', { key: 'head', className: 'drawer-head' },
        h('div', { className: 'drawer-who' },
          h('span', { id: 'drawerAvatar', className: 'avatar', 'data-avatar-tone': tone, 'aria-hidden': 'true' }, initial),
          h('div', { className: 'drawer-who-text' },
            h('h2', { id: 'drawerTitle', className: 'drawer-name' }, person.name),
            h('div', { id: 'drawerSub', className: 'drawer-sub' },
              `${person.role || '外部试用对象'} · ${person.channel}${person.enabled ? '' : ' · 已暂停'}`
            )
          )
        ),
        h('div', { className: 'drawer-head-actions' },
          h('div', { className: 'seg-group', role: 'group', 'aria-label': '抽屉视图切换' },
            h('button', {
              type: 'button',
              className: 'seg-btn',
              'aria-pressed': String(tab === 'chat'),
              onClick: () => setTab('chat')
            }, '会话'),
            h('button', {
              type: 'button',
              className: 'seg-btn',
              'aria-pressed': String(tab === 'meta'),
              onClick: () => setTab('meta')
            }, '摘要与备注')
          ),
          h('button', {
            type: 'button',
            id: 'btnCloseDrawer',
            className: 'dlg-close',
            'aria-label': '关闭对话详情抽屉',
            onClick: onClose
          }, h(CloseIcon))
        )
      ),

      h('div', { key: 'chat', id: 'drawerChatPanel', className: 'drawer-chat', hidden: tab !== 'chat' },
        threads.length === 0 && pendingItems.length === 0
          ? h('div', { className: 'chat-sys-note', style: { marginTop: '1.5rem' } },
              '还没有对话记录，发出试用链接后对话会实时呈现在这里。'
            )
          : [
              ...threads.map(t => {
                const isDigest = String(t.question || '').startsWith('（定时订阅）');
                return h('div', { key: t.id, className: 'chat-exchange', 'data-thread-id': t.id },
                  h('div', { className: 'chat-time-sep' }, t.time),
                  isDigest
                    ? h('div', { className: 'chat-sys-note' }, `定时推送 · ${t.question.replace(/^（定时订阅）\s*/, '')}`)
                    : h('div', { className: 'msg-row msg-row--caller' },
                        h('div', { className: 'msg-bubble msg-bubble--caller' }, t.question)
                      ),
                  h('div', { className: 'msg-row msg-row--twin' },
                    h('div', { className: 'msg-bubble msg-bubble--twin' }, t.reply),
                    h('div', { className: 'msg-foot' },
                      h('span', null, t.statusLabel),
                      h('span', { 'aria-hidden': 'true' }, '·'),
                      h('button', {
                        type: 'button',
                        className: 'msg-trace-btn',
                        onClick: () => onOpenTrace(t.id)
                      }, '查看过程')
                    )
                  )
                );
              }),
              ...pendingItems.map(item => {
                const isEditing = editingApprovalId === item.id;
                const pendingTime = String(item.channel || '').split(' · ')[1] || '刚刚';
                const kickerLabel = item.tone === 'danger' ? '已拦下敏感明细 · 待你确认' : `分身拟回 · ${item.tag}`;
                return h('div', { key: item.id, className: 'chat-exchange' },
                  h('div', { className: 'chat-time-sep' }, pendingTime),
                  h('div', { className: 'msg-row msg-row--caller' },
                    h('div', { className: 'msg-bubble msg-bubble--caller' }, item.question)
                  ),
                  h('div', { className: 'msg-row msg-row--twin msg-row--draft' },
                    h('div', {
                      className: 'msg-bubble msg-bubble--draft',
                      'data-approval-id': item.id,
                      'data-tone': item.tone
                    },
                      h('div', { className: 'draft-kicker' },
                        h('span', null, kickerLabel),
                        h('span', { className: 'draft-sync-note' }, '与服务台同步')
                      ),
                      isEditing
                        ? h('div', { className: 'field-group' },
                            h('textarea', {
                              className: 'tw-textarea',
                              value: draftText,
                              onChange: e => setDraftText(e.target.value),
                              'aria-label': '改写回复草稿'
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
                                  onToast?.(`已批准并发出给 ${person.name}`);
                                }
                              }, '保存并发出'),
                              h('button', {
                                type: 'button',
                                className: 'tw-btn tw-btn--ghost tw-btn--sm',
                                onClick: () => setEditingApprovalId('')
                              }, '取消修改')
                            )
                          )
                        : [
                            h('div', { key: 'txt' }, item.draft),
                            h('div', { key: 'act', className: 'action-row' },
                              h('button', {
                                type: 'button',
                                className: 'tw-btn tw-btn--primary tw-btn--sm',
                                disabled: busy,
                                onClick: async () => {
                                  await onAction('approve_draft', { approvalId: item.id });
                                  onToast?.(`已批准并发出给 ${person.name}`);
                                }
                              }, item.primaryActionLabel || '批准发出'),
                              h('button', {
                                type: 'button',
                                className: 'tw-btn tw-btn--subtle tw-btn--sm',
                                onClick: () => {
                                  setEditingApprovalId(item.id);
                                  setDraftText(item.draft || '');
                                }
                              }, '改一下再发'),
                              item.tone === 'danger' && h('button', {
                                type: 'button',
                                className: 'tw-btn tw-btn--subtle tw-btn--sm',
                                onClick: () => onOpenHandoff({ kind: 'approval', item })
                              }, '转我去对话里亲自处理'),
                              h('button', {
                                type: 'button',
                                className: 'msg-trace-btn',
                                onClick: () => onOpenTrace(item.id)
                              }, '查看过程')
                            )
                          ]
                    )
                  )
                );
              })
            ],
        !person.enabled && h('div', { className: 'chat-sys-note' }, '当前已暂停此人的访问权限，可在「摘要与备注」中恢复')
      ),

      h('div', { key: 'meta', id: 'drawerMetaPanel', className: 'drawer-meta', hidden: tab !== 'meta' },
        h('section', { className: 'meta-section', 'aria-labelledby': 'metaSecSummaryTitle' },
          h('div', { id: 'metaSecSummaryTitle', className: 'meta-section-head' },
            h('span', null, h('span', { className: 'meta-section-idx' }, '01'), '服务摘要')
          ),
          h('div', { className: 'meta-kv-list' },
            h('div', { className: 'meta-kv-row meta-kv-row--center' },
              h('span', { className: 'meta-kv-label' }, '访问权限'),
              h('label', { className: 'switch', 'aria-label': '切换此人的访问权限' },
                h('input', {
                  type: 'checkbox',
                  checked: Boolean(person.enabled),
                  disabled: busy,
                  onChange: async e => {
                    const checked = e.target.checked;
                    await onAction('toggle_person', { personId: person.id, enabled: checked });
                    onToast?.(checked ? `已开启 ${person.name} 的访问权限` : `已暂停 ${person.name} 的访问权限`);
                  }
                }),
                h('span', { className: 'switch-track' })
              )
            ),
            h('div', { className: 'meta-kv-row' },
              h('span', { className: 'meta-kv-label' }, '累计已服务'),
              h('span', { className: 'meta-kv-val' }, `已服务 ${person.servedCount || 0} 轮`)
            ),
            h('div', { className: 'meta-kv-row' },
              h('span', { className: 'meta-kv-label' }, '回复尺度'),
              h('span', { className: 'meta-kv-val' }, modeLabelText(person.mode))
            ),
            h('div', { className: 'meta-kv-row' },
              h('span', { className: 'meta-kv-label' }, '开放能力'),
              h('span', { className: 'meta-kv-val' }, `${capNames.join('、') || '暂未勾选'}${person.digest ? ' · 含每日 09:00 早报' : ''}`)
            ),
            h('div', { className: 'meta-kv-row' },
              h('span', { className: 'meta-kv-label' }, '有效期限'),
              h('span', { className: 'meta-kv-val' }, `${person.enabled ? person.expiry : '已暂停'} · 最近互动 ${person.lastActive || '暂无'}`)
            )
          )
        ),

        h('section', { className: 'meta-section', 'aria-labelledby': 'metaSecNoteTitle' },
          h('div', { id: 'metaSecNoteTitle', className: 'meta-section-head' },
            h('span', null, h('span', { className: 'meta-section-idx' }, '02'), '专门叮嘱与备注')
          ),
          h('div', { id: 'drawerNoteDisplay', className: 'meta-note-current' },
            `当前叮嘱：${person.note || '暂无特别叮嘱，可在下方直接补充'}`
          ),
          h('form', {
            id: 'drawerNoteForm',
            className: 'drawer-note-form',
            onSubmit: async ev => {
              ev.preventDefault();
              if (!noteInput.trim()) return;
              await onAction('update_person_note', { personId: person.id, note: noteInput.trim() });
              setNoteInput('');
              onToast?.(`已更新对 ${person.name} 的专门叮嘱`);
            }
          },
            h('input', {
              id: 'drawerNoteInput',
              className: 'tw-input',
              type: 'text',
              value: noteInput,
              onChange: e => setNoteInput(e.target.value),
              onCompositionEnd: imeNote.onCompositionEnd,
              onKeyDown: imeNote.onKeyDown,
              placeholder: '补一条给他的专门叮嘱（例如：英文问也带中文核心术语）…',
              autoComplete: 'off'
            }),
            h('button', { type: 'submit', className: 'tw-btn tw-btn--primary tw-btn--sm', disabled: busy }, '记下叮嘱')
          ),
          h('div', { className: 'meta-hint' }, '仅对这位联系人单独生效，不影响其他人；会话记录按访客独立隔离存档。')
        ),

        h('section', { className: 'meta-section', 'aria-labelledby': 'metaSecActionsTitle' },
          h('div', { id: 'metaSecActionsTitle', className: 'meta-section-head' },
            h('span', null, h('span', { className: 'meta-section-idx' }, '03'), '权限与接手操作')
          ),
          h('div', { className: 'action-row' },
            h('button', {
              type: 'button',
              className: 'tw-btn tw-btn--subtle tw-btn--sm',
              onClick: () => onOpenEditPerson(person.id)
            }, '改权限与范围'),
            h('button', {
              type: 'button',
              className: 'tw-btn tw-btn--ghost tw-btn--sm',
              onClick: () => onOpenInvite(person.id)
            }, '查看接入凭证 / 发邀请'),
            h('button', {
              type: 'button',
              className: 'tw-btn tw-btn--ghost tw-btn--sm',
              onClick: () => onOpenPreview(person.id)
            }, '对方视角预览'),
            h('button', {
              type: 'button',
              className: 'tw-btn tw-btn--ghost tw-btn--sm',
              onClick: () => onOpenHandoff({ kind: 'person', person })
            }, '转原生对话亲自接手')
          )
        )
      )
    ]
  );
}

export function TraceModal({ view, traceItemId, scheme, onClose }) {
  const found = findTraceEntry(view, traceItemId);
  const open = Boolean(traceItemId && found);
  const ref = useDialogController(open, onClose);
  const [techOpen, setTechOpen] = useState(false);

  useEffect(() => {
    if (open) setTechOpen(false);
  }, [open, traceItemId]);

  return h('dialog', {
    ref,
    id: 'traceDialog',
    className: 'tw-dlg',
    closedby: 'any',
    'data-tw-scheme': scheme,
    'aria-labelledby': 'traceDlgTitle'
  },
    found && [
      h('div', { key: 'h', className: 'dlg-head' },
        h('h3', { id: 'traceDlgTitle', className: 'dlg-title' }, `${found.label} · 查证过程`),
        h('button', { type: 'button', className: 'dlg-close', 'aria-label': '关闭弹窗', onClick: onClose }, h(CloseIcon))
      ),
      h('div', { key: 'b', className: 'dlg-body' },
        h('div', { style: { fontSize: '0.84375rem', color: 'var(--text-secondary)' } }, found.trace?.intro || ''),
        h('ol', { className: 'trace-steps' },
          (found.trace?.steps || []).map((s, idx) =>
            h('li', { key: idx },
              h('strong', null, s.title),
              h('span', null, s.detail)
            )
          )
        ),
        h('details', { className: 'tech-details', open: techOpen, onToggle: e => setTechOpen(e.currentTarget.open) },
          h('summary', null, '展开底层安全记录（仅供排查）'),
          h('p', null, found.trace?.techNote || '只读隔离沙箱运行，敏感路径与密钥已屏蔽。')
        )
      ),
      h('div', { key: 'f', className: 'dlg-foot' },
        h('button', { type: 'button', className: 'tw-btn tw-btn--primary', onClick: onClose }, '关闭')
      )
    ]
  );
}

export function PersonModal({
  open,
  editingPerson,
  initialDraft,
  draftNonce,
  view,
  scheme,
  busy,
  onClose,
  onJumpChannelConfig,
  onSavePerson,
  onToast
}) {
  const ref = useDialogController(open, onClose);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [channel, setChannel] = useState('免装试用网页');
  const [expiry, setExpiry] = useState('剩 7 天试用');
  const [bindMode, setBindMode] = useState('dm_pair');
  const [channelHandle, setChannelHandle] = useState('');
  const [mode, setMode] = useState('confirm');
  const [caps, setCaps] = useState([]);
  const [digest, setDigest] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    if (initialDraft) {
      setName(initialDraft.name || '');
      setRole(initialDraft.role || '外部试用对象');
      setChannel(initialDraft.channel || '免装试用网页');
      setExpiry(initialDraft.expiry || '剩 7 天试用');
      setBindMode(initialDraft.bindMode || 'dm_pair');
      setChannelHandle(initialDraft.channelHandle || '');
      setMode(initialDraft.mode || 'confirm');
      setCaps(Array.isArray(initialDraft.caps) ? initialDraft.caps : []);
      setDigest(Boolean(initialDraft.digest));
      setEnabled(Boolean(initialDraft.enabled));
      setNote(initialDraft.note || '');
      return;
    }
    if (editingPerson) {
      setName(editingPerson.name || '');
      setRole(editingPerson.role || '外部试用对象');
      const chId = channelIdFromLabel(editingPerson.channel);
      setChannel(
        chId === 'ch-wechat' ? '个人微信'
          : chId === 'ch-feishu' ? '飞书'
            : chId === 'ch-wecom' ? '企业微信'
              : chId === 'ch-slack' ? '合作方 Slack'
                : '免装试用网页'
      );
      setExpiry(editingPerson.expiry || '剩 7 天试用');
      setBindMode(editingPerson.bindMode === 'group_allow' ? 'group_allow' : 'dm_pair');
      setChannelHandle(editingPerson.channelHandle || '');
      setMode(editingPerson.mode || 'confirm');
      setCaps(Array.isArray(editingPerson.caps) ? editingPerson.caps : []);
      setDigest(Boolean(editingPerson.digest));
      setEnabled(Boolean(editingPerson.enabled));
      setNote(editingPerson.note || '');
      return;
    }
    setName('');
    setRole('外部试跑伙伴');
    setChannel('免装试用网页');
    setExpiry('剩 7 天试用');
    setBindMode('dm_pair');
    setChannelHandle('');
    setMode('confirm');
    setCaps((view?.capabilities || []).filter(c => c.enabled).slice(0, 3).map(c => c.id));
    setDigest(false);
    setEnabled(true);
    setNote('');
  }, [open, editingPerson?.id, draftNonce]);

  const targetChId = channelIdFromLabel(channel);
  const targetCh = (view?.channels || []).find(c => c.id === targetChId) || { id: 'ch-web', configured: true, shortLabel: '网页' };
  const isBot = targetChId === 'ch-feishu' || targetChId === 'ch-wecom' || targetChId === 'ch-slack';
  const botUnconfigured = isBot && !targetCh.configured;

  const handleLabelMap = {
    'ch-feishu': { label: '允许介入的飞书群聊名称或群 ID', ph: '例如：项目联合对齐群' },
    'ch-wecom': { label: '允许介入的企微外部群名称', ph: '例如：项目外部试跑群' },
    'ch-slack': { label: '允许介入的 Slack 频道名称', ph: '例如：#ext-growth' }
  };
  const hSpec = handleLabelMap[targetChId] || { label: '白名单群聊 / 频道名', ph: '例如：#ext-project' };

  async function submitForm(ev) {
    ev.preventDefault();
    if (!name.trim()) return;
    if (botUnconfigured) {
      onToast?.(`请先接通「${targetCh.shortLabel}」底座通道凭证`);
      return;
    }
    await onSavePerson({
      isEdit: Boolean(editingPerson),
      personId: editingPerson?.id,
      name: name.trim(),
      role: role.trim() || '外部试用对象',
      channel,
      expiry,
      bindMode: isBot ? bindMode : targetCh.kind,
      channelHandle: isBot && bindMode === 'group_allow' ? channelHandle.trim() : '',
      mode,
      caps,
      digest,
      enabled,
      note: note.trim()
    });
  }

  return h('dialog', {
    ref,
    id: 'personDialog',
    className: 'tw-dlg',
    closedby: 'any',
    'data-tw-scheme': scheme,
    'aria-labelledby': 'personDlgTitle'
  },
    h('div', { className: 'dlg-head' },
      h('h3', { id: 'personDlgTitle', className: 'dlg-title' },
        editingPerson ? `调整 ${editingPerson.name} 的访问权限` : '开通服务对象与邀请权限'
      ),
      h('button', { type: 'button', className: 'dlg-close', 'aria-label': '取消并关闭', onClick: onClose }, h(CloseIcon))
    ),
    h('form', { id: 'personForm', style: { display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }, onSubmit: submitForm },
      h('div', { className: 'dlg-body' },
        h('p', { className: 'launch-muted-note' },
          editingPerson
            ? '可随时修改只读能力范围、回复尺度、有效天数或开关状态。'
            : '选定对象、绑定来往通道并指定只读能力后，保存即可发出专属邀请。'
        ),
        h('div', { className: 'field-row-2' },
          h('div', { className: 'field-group' },
            h('label', { className: 'field-label', htmlFor: 'dlgName' }, '怎么称呼'),
            h('input', {
              id: 'dlgName',
              className: 'tw-input',
              type: 'text',
              required: true,
              value: name,
              onChange: e => setName(e.target.value),
              placeholder: '例如：林总 / 合作方'
            })
          ),
          h('div', { className: 'field-group' },
            h('label', { className: 'field-label', htmlFor: 'dlgRole' }, '身份备注'),
            h('input', {
              id: 'dlgRole',
              className: 'tw-input',
              type: 'text',
              value: role,
              onChange: e => setRole(e.target.value),
              placeholder: '例如：外部试跑客户'
            })
          )
        ),
        h('div', { className: 'field-row-2' },
          h('div', { className: 'field-group' },
            h('label', { className: 'field-label', htmlFor: 'dlgChannel' }, '来往方式'),
            h('select', {
              id: 'dlgChannel',
              className: 'tw-select',
              value: channel,
              onChange: e => setChannel(e.target.value)
            },
              h('option', { value: '免装试用网页' }, '免装试用网页（免配置 · 生成专属试跑链接）'),
              h('option', { value: '个人微信' }, '个人微信（免配置 · 生成一对一扫码二维码）'),
              h('option', { value: '飞书' }, '飞书 / Lark（配对码私聊 或 指定项目群）'),
              h('option', { value: '企业微信' }, '企业微信（客户互通群 或 成员配对码）'),
              h('option', { value: '合作方 Slack' }, 'Slack（指定频道白名单 或 成员配对码）')
            )
          ),
          h('div', { className: 'field-group' },
            h('label', { className: 'field-label', htmlFor: 'dlgExpiry' }, '有效期安排'),
            h('select', {
              id: 'dlgExpiry',
              className: 'tw-select',
              value: expiry,
              onChange: e => setExpiry(e.target.value)
            },
              h('option', { value: '长期有效' }, '长期有效'),
              h('option', { value: '剩 6 天试用' }, '6 天试用'),
              h('option', { value: '剩 7 天试用' }, '7 天试用'),
              h('option', { value: '剩 14 天试用' }, '14 天试用'),
              h('option', { value: '至 12-31' }, '至 12-31'),
              h('option', { value: '已暂停' }, '暂停中')
            )
          )
        ),

        h('div', { className: 'field-group' },
          h('div', { className: 'field-hint-box' },
            targetChId === 'ch-web'
              ? '保存后自动生成独立网页链接：对方浏览器打开即可提问，无需登录、无收费墙，会话数据与他人严格物理隔离。'
              : targetChId === 'ch-wechat'
                ? '零公众号注册：保存后生成 5 分钟有效的一对一微信绑定二维码，对方微信扫码锁定后才可对话，陌生人零响应。'
                : botUnconfigured
                  ? `尚未接入「${targetCh.name}」。只需 1 次填入开放平台凭证开启本机长连接（免公网服务器），随后即可为对象发配对码或绑定群聊。`
                  : bindMode === 'group_allow'
                    ? `仅在指定群聊/频道内 @ ${targetCh.botName || '分身'} 时才介入核数；若你本人 15 分钟内刚发言会自动收声。`
                    : '保存后即刻生成唯一私聊配对口令，对方私聊机器人发送该口令后才正式绑定白名单。'
          ),
          botUnconfigured && h('div', { className: 'field-warn-box' },
            h('div', null, h('strong', null, `需要先接通「${targetCh.shortLabel}」底座通道`)),
            h('div', { style: { color: 'var(--text-secondary)' } },
              '完成后会自动回到此弹窗继续填写，已输入的对象名称与勾选能力会为你保留。'
            ),
            h('button', {
              type: 'button',
              className: 'tw-btn tw-btn--primary tw-btn--sm',
              onClick: () => onJumpChannelConfig(targetCh.id, {
                personId: editingPerson?.id || '',
                name, role, channel, expiry, bindMode, channelHandle, mode, caps, digest, enabled, note
              })
            }, `先去配置并接通${targetCh.shortLabel}`)
          ),
          isBot && !botUnconfigured && [
            h('div', { key: 'bm', className: 'field-group' },
              h('span', { className: 'field-label' }, '通过此通道怎么识别对方并开始对话？'),
              h('div', { className: 'radio-stack' },
                h('label', { className: 'choice-row' },
                  h('input', { type: 'radio', name: 'dlgBindMode', value: 'dm_pair', checked: bindMode !== 'group_allow', onChange: () => setBindMode('dm_pair') }),
                  h('span', null, h('strong', null, '私聊一客一码配对'), ' — 生成一次性配对口令，对方私聊发给机器人即绑定个人权限')
                ),
                h('label', { className: 'choice-row' },
                  h('input', { type: 'radio', name: 'dlgBindMode', value: 'group_allow', checked: bindMode === 'group_allow', onChange: () => setBindMode('group_allow') }),
                  h('span', null, h('strong', null, '指定群聊 / 频道白名单'), ' — 把机器人拉进群，仅该白名单群内 @分身 才会作答')
                )
              )
            ),
            bindMode === 'group_allow' && h('div', { key: 'bh', className: 'field-group' },
              h('label', { className: 'field-label', htmlFor: 'dlgChannelHandle' }, hSpec.label),
              h('input', {
                id: 'dlgChannelHandle',
                className: 'tw-input',
                type: 'text',
                value: channelHandle,
                onChange: e => setChannelHandle(e.target.value),
                placeholder: hSpec.ph,
                autoCorrect: 'off',
                autoCapitalize: 'none',
                spellCheck: false
              })
            )
          ]
        ),

        h('div', { className: 'field-group' },
          h('span', { className: 'field-label' }, '他提问时，分身怎么回？'),
          h('div', { className: 'radio-stack' },
            h('label', { className: 'choice-row' },
              h('input', { type: 'radio', name: 'dlgMode', value: 'direct', checked: mode === 'direct', onChange: () => setMode('direct') }),
              h('span', null, h('strong', null, '白名单直接答'), ' — 开放能力内查清后直接发给对方，省心省力')
            ),
            h('label', { className: 'choice-row' },
              h('input', { type: 'radio', name: 'dlgMode', value: 'confirm', checked: mode === 'confirm', onChange: () => setMode('confirm') }),
              h('span', null, h('strong', null, '每次先写草稿给我看'), ' — 我点头确认后才发出去')
            ),
            h('label', { className: 'choice-row' },
              h('input', { type: 'radio', name: 'dlgMode', value: 'summary', checked: mode === 'summary', onChange: () => setMode('summary') }),
              h('span', null, h('strong', null, '只给汇总，禁个人明细'), ' — 自动挡掉手机号和单条明细')
            )
          )
        ),

        h('div', { className: 'field-group' },
          h('span', { className: 'field-label' }, '开放给他使用的能力'),
          h('div', { className: 'check-stack' },
            (view?.capabilities || []).length === 0
              ? h('div', { className: 'field-hint-box' }, '暂未提取项目能力，可在「首次启用」提取后随时回来勾选。')
              : (view?.capabilities || []).map(cap =>
                  h('label', { key: cap.id, className: 'choice-row' },
                    h('input', {
                      type: 'checkbox',
                      checked: caps.includes(cap.id),
                      onChange: e => setCaps(prev => e.target.checked ? [...prev, cap.id] : prev.filter(id => id !== cap.id))
                    }),
                    h('span', null, h('strong', null, cap.name), `（${cap.basis}）`)
                  )
                )
          )
        ),

        h('div', { className: 'field-group' },
          h('label', { className: 'choice-row' },
            h('input', { type: 'checkbox', checked: digest, onChange: e => setDigest(e.target.checked) }),
            h('span', null, '每天 09:00 顺带发一份核心指标早报给他')
          ),
          h('label', { className: 'choice-row' },
            h('input', { type: 'checkbox', checked: enabled, onChange: e => setEnabled(e.target.checked) }),
            h('span', null, '开启此人的当前访问权限')
          )
        ),

        h('div', { className: 'field-group' },
          h('label', { className: 'field-label', htmlFor: 'dlgNote' }, '一句专门叮嘱（如语气、语言习惯）'),
          h('textarea', {
            id: 'dlgNote',
            className: 'tw-textarea',
            value: note,
            onChange: e => setNote(e.target.value),
            placeholder: '例如：外部试跑期间，只给汇总口径不给个人明细'
          })
        )
      ),
      h('div', { className: 'dlg-foot' },
        h('button', { type: 'button', className: 'tw-btn tw-btn--ghost', onClick: onClose }, '取消'),
        h('button', { type: 'submit', id: 'btnSavePersonDlg', className: 'tw-btn tw-btn--primary', disabled: busy || botUnconfigured },
          editingPerson ? '保存修改' : '保存并生成专属邀请'
        )
      )
    )
  );
}

export function InviteModal({
  person,
  view,
  scheme,
  busy,
  onClose,
  onAction,
  onRefreshView,
  onOpenPreview,
  onToast
}) {
  const open = Boolean(person);
  const ref = useDialogController(open, onClose);
  const [inviteMsg, setInviteMsg] = useState('');
  const [urlCopyTip, setUrlCopyTip] = useState('');
  const [pairCopyTip, setPairCopyTip] = useState('');
  const [fullCopyTip, setFullCopyTip] = useState('');

  useEffect(() => {
    if (!open || !person?.id) return;
    setInviteMsg(buildInviteMessage(person, view));
    setUrlCopyTip('');
    setPairCopyTip('');
    setFullCopyTip('');
  }, [open, person?.id, person?.urlToken, person?.pairCode, person?.qrToken]);

  const chId = person ? channelIdFromLabel(person.channel) : 'ch-web';
  const ch = (view?.channels || []).find(c => c.id === chId) || {};

  useEffect(() => {
    if (!open || chId !== 'ch-wechat' || person?.wechatBound || typeof onRefreshView !== 'function') return;
    const timer = setInterval(() => {
      void onRefreshView();
    }, 2500);
    return () => clearInterval(timer);
  }, [open, chId, person?.id, person?.wechatBound, onRefreshView]);
  const isGroupMode = (chId === 'ch-feishu' || chId === 'ch-wecom' || chId === 'ch-slack') &&
    (person?.bindMode === 'group_allow' || (!person?.pairCode && person?.channelHandle));
  const capNames = person
    ? (view?.capabilities || []).filter(c => (person.caps || []).includes(c.id)).map(c => c.name)
    : [];

  return h('dialog', {
    ref,
    id: 'inviteDialog',
    className: 'tw-dlg',
    closedby: 'any',
    'data-tw-scheme': scheme,
    'aria-labelledby': 'inviteDlgTitle'
  },
    person && [
      h('div', { key: 'h', className: 'dlg-head' },
        h('h3', { id: 'inviteDlgTitle', className: 'dlg-title' }, `为 ${person.name} 准备的专属接入凭证`),
        h('button', { type: 'button', className: 'dlg-close', 'aria-label': '关闭弹窗', onClick: onClose }, h(CloseIcon))
      ),
      h('div', { key: 'b', className: 'dlg-body' },
        h('div', { className: 'invite-summary-strip' },
          h('div', null, h('strong', null, '接通方式：'), `${ch.name || person.channel} · ${formatBindingText(person)}`),
          h('div', { style: { marginTop: '0.1875rem' } },
            h('strong', null, `开放能力（${capNames.length} 项）：`),
            capNames.join('、') || '暂未勾选能力'
          ),
          h('div', { style: { marginTop: '0.1875rem' } },
            h('strong', null, '把关与期限：'),
            `${modeLabelText(person.mode)} · ${person.expiry}`
          )
        ),

        chId === 'ch-web' && h('div', { className: 'field-group' },
          h('label', { className: 'field-label', htmlFor: 'inviteUrlInput' }, '专属免装网页链接（浏览器打开即问，无收费步骤）'),
          h('div', { className: 'copy-row' },
            h('input', { id: 'inviteUrlInput', className: 'tw-input', type: 'text', readOnly: true, value: person.guestUrl || '' }),
            h('span', { className: 'copy-wrap' },
              h('button', {
                type: 'button',
                id: 'btnCopyInviteUrl',
                className: 'tw-btn tw-btn--subtle tw-btn--sm',
                onClick: () => copyToClipboard(person.guestUrl || '', msg => setUrlCopyTip(msg))
              }, '复制链接'),
              urlCopyTip && h('span', { className: 'copy-tip', role: 'status' }, urlCopyTip)
            )
          )
        ),

        chId === 'ch-wechat' && h('div', { className: 'field-group' },
          h('span', { className: 'field-label' }, '专属微信一对一绑定二维码（对方微信扫一扫即锁定，5 分钟内有效）'),
          h('div', { className: 'invite-qr-box' },
            h('div', { id: 'inviteQrSvgWrap', className: 'invite-qr-svg', 'aria-label': '专属微信绑定二维码' },
              person.qrSvg
                ? h('img', {
                    src: `data:image/svg+xml;utf8,${encodeURIComponent(person.qrSvg)}`,
                    alt: '专属微信绑定二维码',
                    style: { width: '100%', height: '100%', display: 'block', borderRadius: '0.375rem' }
                  })
                : h(QrCodeMatrixSvg, { seed: `${person.id}:${person.qrToken || person.name}` })
            ),
            h('div', { className: 'invite-qr-info' },
              h('div', null,
                h('span', {
                  id: 'wechatQrStatusPill',
                  className: person.wechatBound ? 'status-pill status-pill--ok' : 'status-pill'
                }, person.wechatBound ? '已完成一对一微信绑定' : '等待对方微信扫码 · 05:00 有效')
              ),
              h('p', { className: 'launch-muted-note' },
                person.wechatBound
                  ? `${person.name} 的微信账号已与当前只读白名单绑定成功；对方现在发来的消息将按「${modeLabelText(person.mode)}」处理，其他好友完全无感。`
                  : `此二维码仅限 ${person.name} 单人单次绑定，扫码并点击确认后立即失效；未入名单的其他微信好友完全看不到你的工作分身。`
              ),
              h('div', { className: 'action-row' },
                h('button', {
                  type: 'button',
                  id: 'btnRefreshWechatQr',
                  className: 'tw-btn tw-btn--subtle tw-btn--sm',
                  disabled: busy,
                  onClick: async () => {
                    await onAction('issue_wechat_qr', { personId: person.id });
                    onToast?.('已刷新 5 分钟微信一对一绑定二维码');
                  }
                }, '刷新二维码'),
                !person.wechatBound && h('button', {
                  type: 'button',
                  id: 'btnSimWechatScan',
                  className: 'tw-btn tw-btn--paper tw-btn--sm',
                  disabled: busy,
                  onClick: async () => {
                    await onAction('confirm_wechat_scan', { personId: person.id, qrToken: person.qrToken });
                    onToast?.(`已模拟 ${person.name} 微信扫码绑定，白名单已生效`);
                  }
                }, '模拟对方已扫码锁定')
              )
            )
          )
        ),

        (chId === 'ch-feishu' || chId === 'ch-wecom' || chId === 'ch-slack') && h('div', { className: 'field-group' },
          h('span', { className: 'field-label' }, `${ch.shortLabel || person.channel} 接入凭证与对方激活步骤`),
          !isGroupMode && h('div', { className: 'invite-pair-box' },
            h('div', null,
              h('div', { className: 'invite-pair-hint' }, '对方私聊机器人发送以下一次性口令完成绑定：'),
              h('div', { id: 'invitePairCode', className: 'invite-pair-code' }, person.pairCode || '待重置')
            ),
            h('span', { className: 'copy-wrap' },
              h('button', {
                type: 'button',
                id: 'btnCopyPairCode',
                className: 'tw-btn tw-btn--subtle tw-btn--sm',
                onClick: () => copyToClipboard(person.pairCode || '', msg => setPairCopyTip(msg))
              }, '复制配对码'),
              pairCopyTip && h('span', { className: 'copy-tip', role: 'status' }, pairCopyTip)
            )
          ),
          h('div', { className: 'invite-bot-guide' },
            isGroupMode
              ? [
                  h('strong', { key: 't' }, '群聊白名单模式（免私聊配对）：'),
                  h('div', { key: 's1' }, `1. 确保已在「${person.channelHandle || '指定群聊'}」添加机器人「${ch.botName || '工作分身'}」；`),
                  h('div', { key: 's2' }, `2. 对方在群内 @${ch.botName || '工作分身'} 提问即可触发；其他未入白名单群聊完全静默。`)
                ]
              : [
                  h('strong', { key: 't' }, '私聊一客一码防串扰机制：'),
                  h('div', { key: 's1' }, `1. 把配对口令「${person.pairCode || ''}」与下方话术一并发给 ${person.name}；`),
                  h('div', { key: 's2' }, `2. 对方在 ${ch.shortLabel || person.channel} 私聊「${ch.botName || '工作分身'}」发送该口令后，本机即锁定其身份为唯一白名单会话。`)
                ]
          )
        ),

        h('div', { className: 'field-group' },
          h('label', { className: 'field-label', htmlFor: 'inviteMessageText' }, '可直接发给对方的邀请话术（按需改写）'),
          h('textarea', {
            id: 'inviteMessageText',
            className: 'tw-textarea',
            value: inviteMsg,
            onChange: e => setInviteMsg(e.target.value)
          })
        )
      ),
      h('div', { key: 'f', className: 'dlg-foot' },
        !isGroupMode && h('button', {
          type: 'button',
          id: 'btnRegenerateInvite',
          className: 'tw-btn tw-btn--ghost',
          style: { marginRight: 'auto' },
          disabled: busy,
          onClick: async () => {
            await onAction('regenerate_invite', { personId: person.id });
            onToast?.(chId === 'ch-web' ? '已签发新的专属试跑链接（旧链接作废）' : '已重置邀请凭证（旧凭证立即作废）');
          }
        }, chId === 'ch-web' ? '重置短链接' : (chId === 'ch-wechat' ? '重置二维码' : '重置配对口令')),
        h('button', {
          type: 'button',
          className: 'tw-btn tw-btn--paper',
          onClick: () => { onClose(); onOpenPreview(person.id, true); }
        }, '对方视角预览'),
        h('button', { type: 'button', className: 'tw-btn tw-btn--ghost', onClick: onClose }, '稍后发送'),
        h('button', {
          type: 'button',
          id: 'btnSimInviteFirstAsk',
          className: 'tw-btn tw-btn--subtle',
          disabled: busy,
          onClick: async () => {
            await onAction('simulate_inbound', { personId: person.id });
            onClose();
            onToast?.(`已模拟 ${person.name} 发起第 1 次提问`);
          }
        }, '模拟他点开并提第 1 问'),
        h('span', { className: 'copy-wrap' },
          h('button', {
            type: 'button',
            id: 'btnCopyInviteFull',
            className: 'tw-btn tw-btn--primary',
            onClick: () => copyToClipboard(inviteMsg, msg => setFullCopyTip(msg))
          }, '复制整段邀请语'),
          fullCopyTip && h('span', { className: 'copy-tip', role: 'status' }, fullCopyTip)
        )
      )
    ]
  );
}

export function ChannelConfigModal({
  channel,
  guide,
  scheme,
  busy,
  onClose,
  onAction,
  onToast
}) {
  const open = Boolean(channel);
  const ref = useDialogController(open, onClose);
  const [wecomMode, setWecomMode] = useState('aibot');
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [botName, setBotName] = useState('工作分身');
  const [agentId, setAgentId] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!open || !channel?.id) return;
    setWecomMode(channel.wecomMode || 'aibot');
    setAppId('');
    setAppSecret('');
    setBotName(channel.botName || '工作分身');
    setAgentId('');
    setLocalError('');
  }, [open, channel?.id]);

  const isBot = channel && (channel.kind === 'bot_ws' || channel.kind === 'wecom_bot' || channel.kind === 'slack_socket');
  const activeGuide = guide?.modes ? guide.modes[wecomMode] : guide;

  async function submitChannel(ev) {
    ev.preventDefault();
    if (!channel || !isBot) return;
    setLocalError('');
    if (!appId.trim() || !appSecret.trim()) {
      setLocalError('请先填写完整的开放平台应用凭证');
      return;
    }
    if (channel.id === 'ch-wecom' && wecomMode === 'corpapp' && !agentId.trim()) {
      setLocalError('企业自建应用模式需要填写 AgentId');
      return;
    }
    try {
      await onAction('configure_channel', {
        channelId: channel.id,
        botName: botName.trim() || '工作分身',
        appId: appId.trim(),
        appSecret: appSecret.trim(),
        wecomMode: channel.id === 'ch-wecom' ? wecomMode : undefined,
        agentId: agentId.trim() || undefined
      });
      onToast?.(`「${channel.shortLabel}」本机长连接验证通过并已启用`);
      onClose({ savedChannelId: channel.id });
    } catch (err) {
      setLocalError(err?.message || '长连接握手校验失败，请检查凭证与本机网络');
    }
  }

  return h('dialog', {
    ref,
    id: 'channelConfigDialog',
    className: 'tw-dlg',
    closedby: 'any',
    'data-tw-scheme': scheme,
    'aria-labelledby': 'channelCfgTitle'
  },
    channel && [
      h('div', { key: 'h', className: 'dlg-head' },
        h('h3', { id: 'channelCfgTitle', className: 'dlg-title' },
          isBot ? (guide?.title || `配置 ${channel.name}`) : `${channel.name} · 接入机制说明`
        ),
        h('button', { type: 'button', className: 'dlg-close', 'aria-label': '关闭弹窗', onClick: () => onClose() }, h(CloseIcon))
      ),
      h('form', { id: 'channelConfigForm', style: { display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }, onSubmit: submitChannel },
        h('div', { className: 'dlg-body' },
          !isBot
            ? [
                channel.id === 'ch-wechat'
                  ? h('div', { key: 'g', className: 'cfg-guide-box' },
                      h('div', null, h('strong', null, '零公众号 / 零企业认证机制：'), '直接依托本机微信接入通道，为每位被服务对象生成 5 分钟有效的专属 1 对 1 扫码凭证。'),
                      h('ol', { className: 'cfg-steps-ol' },
                        h('li', null, '无需注册公众号或企微后台，也不用把全部好友放进来'),
                        h('li', null, '在「服务对象」中新增个人微信对象并生成专属二维码'),
                        h('li', null, '对方扫码确认后仅绑定该位联系人，其他微信联系人消息全部静默忽略')
                      )
                    )
                  : h('div', { key: 'g', className: 'cfg-guide-box' },
                      h('div', null, h('strong', null, '零配置独立试用网页：'), '专为外部伙伴或临时协作者准备，打开即问、不绑定任何 IM 账号。'),
                      h('ol', { className: 'cfg-steps-ol' },
                        h('li', null, '在「服务对象」中选「免装试用网页」即可生成本机隔离网页链接'),
                        h('li', null, '每人拥有独立的只读能力勾选、过期天数与会话隔离沙箱'),
                        h('li', null, '试用结束一键拨动开关或到期自动失效，无需对方安装任何客户端')
                      )
                    ),
                h('div', { key: 'hint', className: 'field-hint-box' },
                  channel.id === 'ch-wechat'
                    ? (channel.qrUrl
                        ? `当前活跃扫码口令已生成（有效期 5 分钟）。状态：${channel.status}`
                        : '点击下方即可生成 5 分钟个人微信专属扫码凭证，或直接在「服务对象」里指定具体对象发码。')
                    : '内置网页通道随开随用，完全免费且无额外配置步骤。'
                )
              ]
            : [
                (channel.id === 'ch-feishu' || channel.id === 'ch-wecom') && h('div', { key: 'official', className: 'official-conn-box' },
                  h('div', { className: 'official-conn-head' },
                    h('span', { className: 'official-conn-title' }, 'DSH 0.2.3 官方连接器一键复用（推荐 · 免填密钥）'),
                    h('span', {
                      className: channel.officialConnector?.connected ? 'status-pill status-pill--ok' : 'status-pill'
                    }, channel.officialConnector?.connected
                      ? `官方已登录${channel.officialConnector.userName ? ` · ${channel.officialConnector.userName}` : ''}`
                      : (channel.officialConnector?.installed ? '已装待授权' : '未装官方插件'))
                  ),
                  h('p', { className: 'official-conn-status' },
                    channel.officialConnector?.statusText || '可直接复用 DeepSeek Harness 官方飞书 / 企微连接器 OAuth，无需另行创建开放平台密钥。'
                  ),
                  h('div', { className: 'action-row' },
                    h('button', {
                      type: 'button',
                      id: 'btnConnectOfficialChannel',
                      className: 'tw-btn tw-btn--primary tw-btn--sm',
                      disabled: busy,
                      onClick: async () => {
                        setLocalError('');
                        try {
                          const res = await onAction('connect_official_channel', {
                            channelId: channel.id,
                            botName: botName.trim() || '工作分身'
                          });
                          if (res?.result?.ok) {
                            onToast?.(`已复用「${channel.shortLabel}」DSH 官方连接器并开始值班`);
                            onClose({ savedChannelId: channel.id });
                          }
                        } catch (err) {
                          setLocalError(err?.message || '连接官方插件失败，可点右侧拉起官方授权或改用下方自建凭证');
                        }
                      }
                    }, '一键复用官方连接器'),
                    h('button', {
                      type: 'button',
                      id: 'btnAuthOfficialChannel',
                      className: 'tw-btn tw-btn--subtle tw-btn--sm',
                      disabled: busy,
                      onClick: async () => {
                        setLocalError('');
                        try {
                          const res = await onAction('connect_official_channel', {
                            channelId: channel.id,
                            botName: botName.trim() || '工作分身',
                            triggerAuth: true
                          });
                          if (res?.result?.authStarted) {
                            onToast?.(res.result.statusText || '已拉起官方插件授权流程，完成登录后再点一键复用');
                          } else if (res?.result?.ok) {
                            onToast?.(`已复用「${channel.shortLabel}」DSH 官方连接器`);
                            onClose({ savedChannelId: channel.id });
                          }
                        } catch (err) {
                          setLocalError(err?.message || '检测官方授权失败');
                        }
                      }
                    }, '检测 / 拉起官方授权')
                  )
                ),
                h('div', { key: 'g', className: 'cfg-guide-box' },
                  h('div', null, h('strong', null, '本机长连接接入指引（无需公网服务器 / 域名）：')),
                  h('ol', { className: 'cfg-steps-ol' },
                    (activeGuide?.steps || []).map((step, i) => h('li', { key: i }, step))
                  )
                ),
                channel.id === 'ch-wecom' && h('div', { key: 'wc', className: 'field-group' },
                  h('span', { className: 'field-label' }, '选择企业微信接入方式'),
                  h('div', { className: 'radio-stack' },
                    h('label', { className: 'choice-row' },
                      h('input', { type: 'radio', name: 'cfgWecomMode', value: 'aibot', checked: wecomMode === 'aibot', onChange: () => setWecomMode('aibot') }),
                      h('span', null, h('strong', null, '智能机器人长连接（推荐）'), ' — 企微管理后台新建智能机器人即可本机直连，无需域名备案与公网服务器')
                    ),
                    h('label', { className: 'choice-row' },
                      h('input', { type: 'radio', name: 'cfgWecomMode', value: 'corpapp', checked: wecomMode === 'corpapp', onChange: () => setWecomMode('corpapp') }),
                      h('span', null, h('strong', null, '企业自建应用'), ' — 已有企业后台且需更细组织权限时选用，需填写 CorpID、AgentId 与应用密钥')
                    )
                  )
                ),
                h('div', { key: 'f1', className: 'field-row-2' },
                  h('div', { className: 'field-group' },
                    h('label', { className: 'field-label', htmlFor: 'cfgAppId' }, activeGuide?.appIdLabel || '应用凭证'),
                    h('input', {
                      id: 'cfgAppId',
                      className: 'tw-input',
                      type: 'text',
                      value: appId,
                      onChange: e => setAppId(e.target.value),
                      placeholder: channel.appIdHint ? `已保存（${channel.appIdHint}），重填可更新` : (activeGuide?.appIdPh || ''),
                      autoComplete: 'off',
                      autoCorrect: 'off',
                      autoCapitalize: 'none',
                      spellCheck: false
                    })
                  ),
                  h('div', { className: 'field-group' },
                    h('label', { className: 'field-label', htmlFor: 'cfgBotName' }, '群内显示名称'),
                    h('input', {
                      id: 'cfgBotName',
                      className: 'tw-input',
                      type: 'text',
                      value: botName,
                      onChange: e => setBotName(e.target.value),
                      autoComplete: 'off'
                    })
                  )
                ),
                h('div', { key: 'f2', className: 'field-group' },
                  h('label', { className: 'field-label', htmlFor: 'cfgAppSecret' }, activeGuide?.secretLabel || '应用密钥（Secret）'),
                  h('input', {
                    id: 'cfgAppSecret',
                    className: 'tw-input',
                    type: 'password',
                    value: appSecret,
                    onChange: e => setAppSecret(e.target.value),
                    placeholder: channel.hasSecret ? '已存于本机 0600 凭据库，如需更换请重填' : (activeGuide?.secretPh || ''),
                    autoComplete: 'off',
                    autoCorrect: 'off',
                    autoCapitalize: 'none',
                    spellCheck: false
                  })
                ),
                channel.id === 'ch-wecom' && wecomMode === 'corpapp' && h('div', { key: 'ag', className: 'field-group' },
                  h('label', { className: 'field-label', htmlFor: 'cfgExtraAgentId' }, '自建应用编号（AgentId）'),
                  h('input', {
                    id: 'cfgExtraAgentId',
                    className: 'tw-input',
                    type: 'text',
                    value: agentId,
                    onChange: e => setAgentId(e.target.value),
                    placeholder: '例如：1000042',
                    autoComplete: 'off'
                  })
                ),
                localError && h('div', { key: 'err', className: 'field-warn-box', role: 'alert' }, localError)
              ]
        ),
        h('div', { className: 'dlg-foot' },
          isBot && channel.configured && h('button', {
            type: 'button',
            id: 'btnDisconnectChannel',
            className: 'tw-btn tw-btn--ghost tw-btn--danger-ghost',
            style: { marginRight: 'auto' },
            disabled: busy,
            onClick: async () => {
              await onAction('disconnect_channel', { channelId: channel.id });
              onToast?.(`已断开「${channel.name}」并清除本机保存的密钥`);
              onClose();
            }
          }, '断开并清空凭证'),
          h('button', { type: 'button', className: 'tw-btn tw-btn--ghost', onClick: () => onClose() }, isBot ? '取消' : '关闭'),
          channel.id === 'ch-wechat' && h('button', {
            type: 'button',
            className: 'tw-btn tw-btn--primary',
            disabled: busy,
            onClick: async () => {
              await onAction('issue_wechat_qr', {});
              onToast?.('已签发 5 分钟专属扫码凭证，可直接在「服务对象」中绑定具体联系人');
            }
          }, '生成 5 分钟扫码口令'),
          isBot && h('button', {
            type: 'submit',
            id: 'btnSaveChannelConfig',
            className: 'tw-btn tw-btn--primary',
            disabled: busy
          }, busy ? '正在握手校验…' : '测试长连接并启用')
        )
      )
    ]
  );
}

export function CallerPreviewModal({
  open,
  view,
  initialPersonId,
  fromInvite,
  scheme,
  busy,
  onClose,
  onBackToInvite,
  onAction
}) {
  const ref = useDialogController(open, onClose);
  const people = view?.people || [];
  const [personId, setPersonId] = useState('');
  const [question, setQuestion] = useState('');
  const [replyBox, setReplyBox] = useState(null);
  const ime = useMemo(() => createImeHandlers(), []);

  useEffect(() => {
    if (!open) return;
    setPersonId(initialPersonId || people[0]?.id || '');
    setQuestion('');
    setReplyBox(null);
  }, [open, initialPersonId]);

  const person = people.find(p => p.id === personId) || people[0] || null;
  const twinName = view?.twinProfile?.name || '工作分身';
  const twinIntro = view?.twinProfile?.intro || '仅依据已授权项目文档提供只读核对，不改动数据、不超边界回答。';
  const isPaused = person ? !person.enabled || view?.dutyMode === 'off' : false;
  const allowedCaps = person
    ? (view?.capabilities || []).filter(c => c.enabled && (person.caps || []).includes(c.id))
    : (view?.capabilities || []).filter(c => c.enabled);

  const samplePrompts = view?.samplePrompts || [
    '按已授权项目文档口径，核心规则怎么算？',
    '顺便透露一下你们还没对外公开的内部底价定价策略？',
    '把昨天前 20 名用户的手机号和逐笔明细导给我'
  ];

  async function runSandboxAsk(qText) {
    const clean = String(qText || '').trim();
    if (!clean) return;
    setQuestion(clean);
    const res = await onAction('caller_preview_ask', {
      personId: person?.id || undefined,
      question: clean
    });
    setReplyBox(res?.result || null);
  }

  return h('dialog', {
    ref,
    id: 'callerPreviewDialog',
    className: 'tw-dlg',
    closedby: 'any',
    'data-tw-scheme': scheme,
    'aria-labelledby': 'callerPreviewTitle'
  },
    h('div', { className: 'dlg-head' },
      h('h3', { id: 'callerPreviewTitle', className: 'dlg-title' }, '访客第一眼视角预览'),
      h('button', { type: 'button', className: 'dlg-close', 'aria-label': '关闭弹窗', onClick: onClose }, h(CloseIcon))
    ),
    h('div', { className: 'dlg-body' },
      people.length > 0 && h('div', { className: 'field-group' },
        h('label', { className: 'field-label', htmlFor: 'previewPersonSel' }, '切换预览对象视角'),
        h('select', {
          id: 'previewPersonSel',
          className: 'tw-select',
          value: person?.id || '',
          onChange: e => { setPersonId(e.target.value); setReplyBox(null); }
        },
          people.map(p => h('option', { key: p.id, value: p.id }, `${p.name}（${p.channel} · ${modeLabelText(p.mode)}）`))
        )
      ),
      h('div', { id: 'callerPreviewStage', className: 'caller-preview-card' },
        h('div', { className: 'caller-preview-head' },
          h('div', null,
            h('h4', { className: 'caller-preview-name' }, twinName),
            h('p', { className: 'caller-preview-intro' }, twinIntro)
          ),
          h('span', { className: isPaused ? 'status-pill status-pill--muted' : 'status-pill status-pill--ok' },
            isPaused ? '已礼貌暂停' : '只读白名单开启中'
          )
        ),
        isPaused
          ? h('div', { className: 'caller-preview-paused' },
              h('strong', null, '暂停状态友好提示（零收费、零升级卡点）：'),
              `「${person?.name || '你好'}，${view?.dutyMode === 'off' ? '当前工作分身暂歇值班，已记录来访提示' : '当前分身试用已暂歇或到期'}，请直接与项目负责人联系，无需任何付费操作。」`
            )
          : h('div', null,
              h('div', { style: { fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem' } },
                `向你开放的 ${allowedCaps.length} 项只读核数能力：`
              ),
              h('div', { className: 'caller-preview-caps' },
                allowedCaps.length > 0
                  ? allowedCaps.map(c => h('span', { key: c.id, className: 'caller-preview-cap-tag' }, c.name))
                  : h('span', { className: 'caller-preview-cap-tag' }, '当前仅可查阅口径摘要')
              )
            )
      ),

      !isPaused && h('div', { id: 'callerPreviewAskSection', className: 'field-group' },
        h('span', { className: 'field-label' }, '在访客沙箱内试问一句（不影响外部真实记录，可验证红线/缺口拦截）'),
        h('div', { className: 'quick-chips-group' },
          samplePrompts.map((q, idx) =>
            h('button', {
              key: idx,
              type: 'button',
              className: 'quick-chip',
              disabled: busy,
              onClick: () => runSandboxAsk(q)
            }, idx === 0 ? '核对指标口径' : idx === 1 ? '触发待补口径 / 边界' : '触发红线拦截')
          )
        ),
        h('form', {
          id: 'callerPreviewAskForm',
          className: 'inline-add-row',
          style: { padding: 0, borderTop: 0, background: 'transparent' },
          onSubmit: ev => { ev.preventDefault(); void runSandboxAsk(question); }
        },
          h('input', {
            id: 'callerPreviewAskInput',
            className: 'tw-input',
            style: { flex: 1, minWidth: '12rem' },
            type: 'text',
            value: question,
            onChange: e => setQuestion(e.target.value),
            onCompositionEnd: ime.onCompositionEnd,
            onKeyDown: ime.onKeyDown,
            placeholder: '输入访客问题试试实际效果…',
            autoComplete: 'off'
          }),
          h('button', { type: 'submit', className: 'tw-btn tw-btn--primary tw-btn--sm', disabled: busy }, '模拟提问')
        ),
        replyBox && h('div', { id: 'callerPreviewReplyBox', className: 'caller-preview-reply', role: 'status' },
          h('div', null, h('strong', null, `${replyBox.statusLabel || '访客沙箱效果'}：`), replyBox.reply),
          h('div', {
            style: {
              marginTop: '0.375rem',
              fontSize: '0.75rem',
              color: replyBox.action === 'redline_intercepted'
                ? 'var(--danger)'
                : replyBox.action === 'knowledge_gap'
                  ? 'var(--amber)'
                  : 'var(--accent)'
            }
          }, replyBox.action === 'redline_intercepted'
            ? '拦截说明：真实来信会在你的服务台同步生成「敏感拦截待拍板」。'
            : replyBox.action === 'knowledge_gap'
              ? '缺口护栏：宁可转负责人标「待补口径」，绝不编造或读取未授权目录。'
              : `隔离说明：仅在 ${person?.name || '独立访客'} 个人沙箱内运行，其他服务对象完全不可见。`)
        )
      )
    ),
    h('div', { className: 'dlg-foot' },
      fromInvite && person && h('button', {
        type: 'button',
        className: 'tw-btn tw-btn--subtle',
        onClick: () => { onClose(); onBackToInvite(person.id); }
      }, '返回凭证弹窗'),
      h('button', { type: 'button', className: 'tw-btn tw-btn--primary', onClick: onClose }, '关闭预览')
    )
  );
}

export function ProfileEditModal({ open, view, presets, scheme, busy, onClose, onSave, onToast }) {
  const ref = useDialogController(open, onClose);
  const [personaId, setPersonaId] = useState('advisor');
  const [name, setName] = useState('');
  const [dutyMode, setDutyMode] = useState('shadow');
  const [intro, setIntro] = useState('');

  useEffect(() => {
    if (!open) return;
    setPersonaId(view?.twinProfile?.personaId || 'advisor');
    setName(view?.twinProfile?.name || '工作分身');
    setDutyMode(view?.dutyMode || 'shadow');
    setIntro(view?.twinProfile?.intro || '依据已授权项目文档提供只读口径解答，涉敏明细转负责人确认');
  }, [open]);

  return h('dialog', {
    ref,
    id: 'profileEditDialog',
    className: 'tw-dlg',
    closedby: 'any',
    'data-tw-scheme': scheme,
    'aria-labelledby': 'profileEditTitle'
  },
    h('div', { className: 'dlg-head' },
      h('h3', { id: 'profileEditTitle', className: 'dlg-title' }, '编辑分身名片与表达定位'),
      h('button', { type: 'button', className: 'dlg-close', 'aria-label': '关闭弹窗', onClick: onClose }, h(CloseIcon))
    ),
    h('form', {
      style: { display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 },
      onSubmit: async ev => {
        ev.preventDefault();
        if (!name.trim()) return;
        await onSave({ personaId, name: name.trim(), intro: intro.trim(), dutyMode });
        onToast?.('已保存分身对外名片与表达定位');
        onClose();
      }
    },
      h('div', { className: 'dlg-body' },
        h('div', { className: 'field-group' },
          h('span', { className: 'field-label' }, '快捷套用表达语气模板'),
          h('div', { className: 'inline-persona-pills', role: 'group', 'aria-label': '分身语气模板' },
            (presets || []).map(p =>
              h('button', {
                key: p.id,
                type: 'button',
                className: personaId === p.id ? 'persona-mini-btn is-active' : 'persona-mini-btn',
                onClick: () => {
                  setPersonaId(p.id);
                  setIntro(p.intro);
                  setDutyMode(p.recommendedDuty);
                }
              }, p.title)
            )
          )
        ),
        h('div', { className: 'field-row-2' },
          h('div', { className: 'field-group' },
            h('label', { className: 'field-label', htmlFor: 'profileNameInput' }, '对外名片名称'),
            h('input', {
              id: 'profileNameInput',
              className: 'tw-input',
              type: 'text',
              required: true,
              value: name,
              onChange: e => setName(e.target.value),
              autoComplete: 'off'
            })
          ),
          h('div', { className: 'field-group' },
            h('label', { className: 'field-label', htmlFor: 'profileDutySelect' }, '默认对外把关档位'),
            h('select', {
              id: 'profileDutySelect',
              className: 'tw-select',
              value: dutyMode,
              onChange: e => setDutyMode(e.target.value)
            },
              h('option', { value: 'shadow' }, '试跑把关（先拟草稿经我点头）'),
              h('option', { value: 'live' }, '正式值班（白名单直发，涉敏再问我）'),
              h('option', { value: 'off' }, '暂停对外值班（外部入口优雅告休）')
            )
          )
        ),
        h('div', { className: 'field-group' },
          h('label', { className: 'field-label', htmlFor: 'profileIntroInput' }, '一句话对外介绍（显示在访客网页与 IM 欢迎语顶部）'),
          h('textarea', {
            id: 'profileIntroInput',
            className: 'tw-textarea',
            required: true,
            value: intro,
            onChange: e => setIntro(e.target.value)
          })
        )
      ),
      h('div', { className: 'dlg-foot' },
        h('button', { type: 'button', className: 'tw-btn tw-btn--ghost', onClick: onClose }, '取消'),
        h('button', { type: 'submit', className: 'tw-btn tw-btn--primary', disabled: busy }, '保存名片与定位')
      )
    )
  );
}

export function ProjectSelectModal({
  mode,
  projects,
  selectedCandidateId,
  mountedProjects,
  scheme,
  busy,
  onClose,
  onSelectWorkspace,
  onSelectCustomFolder
}) {
  const open = Boolean(mode);
  const ref = useDialogController(open, onClose);
  const [customPath, setCustomPath] = useState('');
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    if (!open) return;
    setCustomPath('');
    setCustomName('');
  }, [open, mode]);

  const isMount = mode === 'mount';

  return h('dialog', {
    ref,
    id: 'projectDialog',
    className: 'tw-dlg',
    closedby: 'any',
    'data-tw-scheme': scheme,
    'aria-labelledby': 'projectDlgTitle'
  },
    h('div', { className: 'dlg-head' },
      h('h3', { id: 'projectDlgTitle', className: 'dlg-title' },
        isMount ? '接入新项目能力到主分身' : '选择要提炼的项目'
      ),
      h('button', { type: 'button', className: 'dlg-close', 'aria-label': '关闭弹窗', onClick: onClose }, h(CloseIcon))
    ),
    h('div', { className: 'dlg-body' },
      isMount && h('p', { className: 'launch-muted-note' },
        '对外仍然是同一个工作分身，只为它追加新项目的只读能力与口径说明；可去「能力与通道」按需开关或卸载。'
      ),
      (projects || []).length > 0 && h('div', { className: 'delta-diff-list' },
        projects.map(proj => {
          const isCurrent = selectedCandidateId === proj.id;
          const isMounted = (mountedProjects || []).some(mp => mp.projectName === proj.name);
          return h('div', { key: proj.id, className: 'delta-diff-item' },
            h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' } },
              h('div', { style: { minWidth: 0, flex: '1 1 14rem' } },
                h('div', { className: 'delta-diff-head' },
                  h('span', null, proj.name),
                  isCurrent && !isMount && h('span', { className: 'status-pill status-pill--ok' }, '当前已选'),
                  isMount && isMounted && h('span', { className: 'status-pill status-pill--muted' }, '已接入'),
                  proj.isTempWorkspace && h('span', { className: 'status-pill status-pill--muted' }, '测试工作区')
                ),
                h('div', { className: 'delta-diff-desc', style: { marginTop: '0.1875rem' } }, proj.shortSummary)
              ),
              h('button', {
                type: 'button',
                className: isCurrent ? 'tw-btn tw-btn--paper tw-btn--sm' : 'tw-btn tw-btn--primary tw-btn--sm',
                disabled: busy,
                onClick: () => onSelectWorkspace(proj, mode)
              }, isMount ? '从此项目提炼接入' : (isCurrent ? '保持选用' : '选择该项目'))
            )
          );
        })
      ),

      h('details', { className: 'tech-details', open: (projects || []).length === 0 },
        h('summary', null, '指定本机其他项目文件夹（只读扫描，不改动原目录）'),
        h('form', {
          className: 'field-group',
          style: { marginTop: '0.75rem' },
          onSubmit: ev => {
            ev.preventDefault();
            if (!customPath.trim()) return;
            onSelectCustomFolder({ rootPath: customPath.trim(), projectName: customName.trim() || undefined }, mode);
          }
        },
          h('div', { className: 'field-group' },
            h('label', { className: 'field-label', htmlFor: 'customProjPath' }, '本机项目绝对目录'),
            h('input', {
              id: 'customProjPath',
              className: 'tw-input',
              type: 'text',
              value: customPath,
              onChange: e => setCustomPath(e.target.value),
              placeholder: '/Users/.../my-project'
            })
          ),
          h('div', { className: 'field-group' },
            h('label', { className: 'field-label', htmlFor: 'customProjName' }, '对外显示名称（不含本地路径）'),
            h('input', {
              id: 'customProjName',
              className: 'tw-input',
              type: 'text',
              value: customName,
              onChange: e => setCustomName(e.target.value),
              placeholder: '例如：增长复盘口径库'
            })
          ),
          h('div', { className: 'action-row' },
            h('button', { type: 'submit', className: 'tw-btn tw-btn--primary tw-btn--sm', disabled: busy || !customPath.trim() },
              isMount ? '选定并提炼接入' : '选定此项目目录'
            )
          )
        )
      )
    ),
    h('div', { className: 'dlg-foot' },
      h('button', { type: 'button', className: 'tw-btn tw-btn--ghost', onClick: onClose }, '取消')
    )
  );
}

export function DeltaUpgradeModal({ project, scheme, busy, onClose, onConfirmUpgrade }) {
  const open = Boolean(project);
  const ref = useDialogController(open, onClose);
  const spec = project?.deltaSpec || {};

  return h('dialog', {
    ref,
    id: 'deltaUpgradeDialog',
    className: 'tw-dlg',
    closedby: 'any',
    'data-tw-scheme': scheme,
    'aria-labelledby': 'deltaDlgTitle'
  },
    project && [
      h('div', { key: 'h', className: 'dlg-head' },
        h('h3', { id: 'deltaDlgTitle', className: 'dlg-title' }, `${project.projectName} · 增量变动核对`),
        h('button', { type: 'button', className: 'dlg-close', 'aria-label': '关闭弹窗', onClick: onClose }, h(CloseIcon))
      ),
      h('div', { key: 'b', className: 'dlg-body' },
        h('p', { className: 'delta-intro' },
          spec.intro || '平时仅核对本地文件修改标记（不消耗模型额度，绝不擅自改写已有口径）。检测到变动如下：'
        ),
        h('div', { className: 'delta-diff-list' },
          (spec.items || []).map((item, idx) =>
            h('div', { key: idx, className: 'delta-diff-item' },
              h('div', { className: 'delta-diff-head' },
                h('span', { className: item.safe ? 'delta-diff-kind is-safe' : 'delta-diff-kind' }, item.kind),
                h('span', null, item.title)
              ),
              h('div', { className: 'delta-diff-desc' }, item.desc)
            )
          )
        )
      ),
      h('div', { key: 'f', className: 'dlg-foot' },
        h('button', { type: 'button', className: 'tw-btn tw-btn--ghost', onClick: onClose }, '暂不升级'),
        h('button', {
          type: 'button',
          id: 'btnConfirmDeltaUpgrade',
          className: 'tw-btn tw-btn--primary',
          disabled: busy,
          onClick: () => onConfirmUpgrade(project.id)
        }, '确认纳入分身')
      )
    ]
  );
}

export function HandoffModal({ target, scheme, busy, onClose, onConfirmHandoff }) {
  const open = Boolean(target);
  const ref = useDialogController(open, onClose);

  return h('dialog', {
    ref,
    id: 'handoffDialog',
    className: 'tw-dlg',
    closedby: 'any',
    'data-tw-scheme': scheme,
    'aria-labelledby': 'handoffDlgTitle'
  },
    target && [
      h('div', { key: 'h', className: 'dlg-head' },
        h('h3', { id: 'handoffDlgTitle', className: 'dlg-title' }, '转入原生对话亲自处理'),
        h('button', { type: 'button', className: 'dlg-close', 'aria-label': '关闭弹窗', onClick: onClose }, h(CloseIcon))
      ),
      h('div', { key: 'b', className: 'dlg-body' },
        target.kind === 'person'
          ? h('div', { style: { fontSize: '0.84375rem', color: 'var(--text)' } },
              h('strong', null, '将带入新对话的内容：'),
              h('br'),
              `1. ${target.person.name}（${target.person.channel}）近 ${(target.person.threads || []).length} 轮完整沟通记录；`,
              h('br'),
              '2. 分身当前生效的红线边界与专门叮嘱，由你直接接手深聊。'
            )
          : h('div', { style: { fontSize: '0.84375rem', color: 'var(--text)' } },
              h('strong', null, '将带入新对话的内容：'),
              h('br'),
              `1. ${target.item.personName} 的原问：「${target.item.question}」`,
              h('br'),
              '2. 分身已拦截的敏感点与提前算好的脱敏汇总方案。'
            ),
        h('p', { style: { margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' } },
          '点击「带上下文打开新对话」会拉起一条宿主独立工作区会话，自动带好对方原问与上下文，无需重述背景。'
        )
      ),
      h('div', { key: 'f', className: 'dlg-foot' },
        h('button', { type: 'button', className: 'tw-btn tw-btn--ghost', onClick: onClose }, '先留在这'),
        h('button', {
          type: 'button',
          id: 'btnConfirmHandoff',
          className: 'tw-btn tw-btn--primary',
          disabled: busy,
          onClick: () => onConfirmHandoff(target)
        }, '带上下文打开新对话')
      )
    ]
  );
}

export function ConfirmActionModal({ spec, scheme, busy, onClose }) {
  const open = Boolean(spec);
  const ref = useDialogController(open, onClose);

  return h('dialog', {
    ref,
    className: 'tw-dlg',
    closedby: 'any',
    'data-tw-scheme': scheme,
    'aria-labelledby': 'confirmDlgTitle'
  },
    spec && [
      h('div', { key: 'h', className: 'dlg-head' },
        h('h3', { id: 'confirmDlgTitle', className: 'dlg-title' }, spec.title || '确认操作'),
        h('button', { type: 'button', className: 'dlg-close', 'aria-label': '关闭弹窗', onClick: onClose }, h(CloseIcon))
      ),
      h('div', { key: 'b', className: 'dlg-body' },
        h('p', { style: { margin: 0, fontSize: '0.84375rem', color: 'var(--text-secondary)' } }, spec.message)
      ),
      h('div', { key: 'f', className: 'dlg-foot' },
        h('button', { type: 'button', className: 'tw-btn tw-btn--ghost', onClick: onClose }, '取消'),
        h('button', {
          type: 'button',
          className: 'tw-btn tw-btn--primary',
          disabled: busy,
          onClick: async () => {
            await spec.onConfirm?.();
            onClose();
          }
        }, spec.confirmLabel || '确认执行')
      )
    ]
  );
}
