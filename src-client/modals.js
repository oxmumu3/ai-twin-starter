/**
 * Native `<dialog closedby="any">` modals and caller detail drawer (`v4.1`).
 */
import React, { useEffect, useState } from 'react';
const h = React.createElement;
import {
  channelIdFromSelection,
  formatBindingText,
  formatModeLabel
} from '../shared/schema.js';
import {
  CloseIcon,
  copyToClipboard,
  runTwinAction,
  useDialogController
} from './api.js';

function TwinDialog({ id, open, title, isDrawer = false, onClose, children }) {
  const ref = useDialogController(open, onClose);
  return h('dialog', {
    id,
    ref,
    closedby: 'any',
    className: isDrawer ? 'tw-dialog tw-drawer' : 'tw-dialog',
    'aria-label': title
  },
    h('div', { className: 'tw-dialog-head' },
      h('h3', { className: 'tw-h2' }, title),
      h('button', {
        type: 'button',
        className: 'tw-btn',
        'aria-label': '关闭弹窗',
        onClick: onClose
      }, h(CloseIcon))
    ),
    h('div', { className: 'tw-dialog-body' }, open ? children : null)
  );
}

function EditDraftModal({ approval, busy, onClose, onSubmit, onSaveAsRule }) {
  const [text, setText] = useState('');
  const [ruleText, setRuleText] = useState('');

  useEffect(() => {
    setText(approval?.draft || '');
    setRuleText('');
  }, [approval]);

  return h(TwinDialog, {
    id: 'editDraftDialog',
    open: Boolean(approval),
    title: approval?.tone === 'danger' ? '调整替代安全回复（红线拦截）' : '调整草稿并回复对方',
    onClose
  },
    approval && h(React.Fragment, null,
      h('div', { className: 'tw-muted' }, `对象：${approval.personName} · 来源：${approval.channel}`),
      h('div', { className: 'tw-draft-box' }, `对方问题：${approval.question}`),
      h('label', { className: 'tw-field' },
        h('span', { className: 'tw-label' }, '由你审校后的最终回复'),
        h('textarea', {
          className: 'tw-textarea',
          value: text,
          onChange: e => setText(e.target.value),
          rows: 4
        })
      ),
      approval.allowRuleExtract && h('label', { className: 'tw-field' },
        h('span', { className: 'tw-label' }, '顺手沉淀为长期规矩（可选）'),
        h('input', {
          className: 'tw-input',
          type: 'text',
          placeholder: '例如：对外统一定为 T+1 对账完成后的口径',
          value: ruleText,
          onChange: e => setRuleText(e.target.value)
        })
      ),
      h('div', { className: 'tw-actions' },
        h('button', {
          type: 'button',
          className: 'tw-btn tw-btn-primary',
          disabled: busy || !text.trim(),
          onClick: () => onSubmit(approval.id, text)
        }, '批准并立即发出'),
        approval.allowRuleExtract && h('button', {
          type: 'button',
          className: 'tw-btn',
          disabled: busy || !(ruleText.trim() || text.trim()),
          onClick: () => onSaveAsRule(approval.id, text, ruleText.trim() || text.trim())
        }, '发送并记成长期规矩')
      )
    )
  );
}

function InvitePersonModal({ open, view, busy, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [channel, setChannel] = useState('免装试用网页');
  const [bindMode, setBindMode] = useState('dm_pair');
  const [channelHandle, setChannelHandle] = useState('');
  const [mode, setMode] = useState('confirm');
  const [expiry, setExpiry] = useState('7 天试用');
  const [note, setNote] = useState('');
  const [selectedCaps, setSelectedCaps] = useState([]);
  const [createdResult, setCreatedResult] = useState(null);
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setRole('');
      setChannel('免装试用网页');
      setBindMode('dm_pair');
      setChannelHandle('');
      setMode('confirm');
      setExpiry('7 天试用');
      setNote('');
      setCreatedResult(null);
      setCopyStatus('');
      const enabledCaps = (view?.capabilities || []).filter(c => c.enabled).map(c => c.id);
      setSelectedCaps(enabledCaps.slice(0, 3));
    }
    // Reset only when opening; otherwise view refresh clears the newly issued credential.
  }, [open]);

  const chId = channelIdFromSelection(channel);
  const supportsGroup = chId === 'ch-feishu' || chId === 'ch-wecom' || chId === 'ch-slack';

  async function submitCreate() {
    const res = await onCreated({
      name,
      role,
      channel,
      bindMode: supportsGroup ? bindMode : 'dm_pair',
      channelHandle: supportsGroup && bindMode === 'group_allow' ? channelHandle : '',
      mode,
      expiry,
      note,
      caps: selectedCaps
    });
    if (res?.result?.person) {
      const createdPerson = res.view?.people?.find(p => p.id === res.result.person.id) || res.result.person;
      setCreatedResult({ person: createdPerson, qr: res.result.qr });
    }
  }

  return h(TwinDialog, {
    id: 'invitePersonDialog',
    open,
    title: createdResult ? '邀请凭证已生成' : '开通服务对象与发邀请',
    onClose
  },
    createdResult ? h('div', { className: 'tw-field' },
      h('p', { className: 'tw-muted' }, `已为「${createdResult.person.name}」生成专属隔离通道与白名单权限：`),
      createdResult.person.guestUrl && h('div', { className: 'tw-draft-box' },
        h('div', null, '免装试用链接：'),
        h('strong', null, createdResult.person.guestUrl)
      ),
      createdResult.person.pairCode && h('div', { className: 'tw-draft-box' },
        h('div', null, '一客一码私聊配对口令：'),
        h('strong', null, createdResult.person.pairCode)
      ),
      createdResult.qr?.qrUrl && h('div', { className: 'tw-draft-box' },
        h('div', null, '微信 5 分钟专属扫码凭证（对方扫一扫即锁定）：'),
        h('div', { style: { wordBreak: 'break-all' } }, createdResult.qr.qrUrl)
      ),
      h('div', { className: 'tw-actions' },
        (createdResult.person.guestUrl || createdResult.person.pairCode || createdResult.qr?.qrUrl) && h('button', {
          type: 'button',
          className: 'tw-btn tw-btn-primary',
          onClick: () => copyToClipboard(createdResult.person.guestUrl || createdResult.person.pairCode || createdResult.qr?.qrUrl, setCopyStatus)
        }, '复制发给对方'),
        h('button', {
          type: 'button',
          className: 'tw-btn',
          onClick: onClose
        }, '完成关闭')
      ),
      h('span', { className: 'tw-copy-status', role: 'status', 'aria-live': 'polite' }, copyStatus)
    ) : h(React.Fragment, null,
      h('div', { className: 'tw-grid-2' },
        h('label', { className: 'tw-field' },
          h('span', { className: 'tw-label' }, '对象称呼'),
          h('input', {
            id: 'inviteNameInput',
            className: 'tw-input',
            placeholder: '如：陈总 / 华东运营小周',
            value: name,
            onChange: e => setName(e.target.value)
          })
        ),
        h('label', { className: 'tw-field' },
          h('span', { className: 'tw-label' }, '身份或协作关系'),
          h('input', {
            className: 'tw-input',
            placeholder: '如：外部试跑合作方',
            value: role,
            onChange: e => setRole(e.target.value)
          })
        )
      ),
      h('div', { className: 'tw-grid-2' },
        h('label', { className: 'tw-field' },
          h('span', { className: 'tw-label' }, '开通通道'),
          h('select', {
            id: 'inviteChannelSelect',
            className: 'tw-select',
            value: channel,
            onChange: e => setChannel(e.target.value)
          },
            h('option', { value: '免装试用网页' }, '免装试用网页（零配置生成隔离链接）'),
            h('option', { value: '个人微信' }, '个人微信（5 分钟一客一码扫一扫）'),
            h('option', { value: '飞书' }, '飞书 / Lark 机器人'),
            h('option', { value: '企业微信' }, '企业微信机器人'),
            h('option', { value: '合作方 Slack' }, 'Slack 团队 / 合作频道')
          )
        ),
        h('label', { className: 'tw-field' },
          h('span', { className: 'tw-label' }, '答复边界'),
          h('select', {
            className: 'tw-select',
            value: mode,
            onChange: e => setMode(e.target.value)
          },
            h('option', { value: 'confirm' }, '每条先草稿给我看'),
            h('option', { value: 'direct' }, '白名单直接答'),
            h('option', { value: 'summary' }, '只给汇总（禁个人明细）')
          )
        )
      ),
      supportsGroup && h('div', { className: 'tw-grid-2' },
        h('label', { className: 'tw-field' },
          h('span', { className: 'tw-label' }, '接入形式'),
          h('select', {
            className: 'tw-select',
            value: bindMode,
            onChange: e => setBindMode(e.target.value)
          },
            h('option', { value: 'dm_pair' }, '一客一码私聊配对'),
            h('option', { value: 'group_allow' }, '指定群白名单（仅响应 @机器人）')
          )
        ),
        bindMode === 'group_allow' && h('label', { className: 'tw-field' },
          h('span', { className: 'tw-label' }, '白名单群名或群聊 ID'),
          h('input', {
            className: 'tw-input',
            placeholder: '如：华东项目对齐群 或 oc_xxx',
            value: channelHandle,
            onChange: e => setChannelHandle(e.target.value)
          })
        )
      ),
      h('div', { className: 'tw-grid-2' },
        h('label', { className: 'tw-field' },
          h('span', { className: 'tw-label' }, '有效期（纯工具内置限期）'),
          h('select', {
            className: 'tw-select',
            value: expiry,
            onChange: e => setExpiry(e.target.value)
          },
            h('option', { value: '7 天试用' }, '7 天试用'),
            h('option', { value: '30 天试用' }, '30 天试用'),
            h('option', { value: '长期有效' }, '长期有效')
          )
        ),
        h('label', { className: 'tw-field' },
          h('span', { className: 'tw-label' }, '特别约定备注（可选）'),
          h('input', {
            className: 'tw-input',
            placeholder: '如：只看华东汇总，不透底价',
            value: note,
            onChange: e => setNote(e.target.value)
          })
        )
      ),
      h('div', { className: 'tw-field' },
        h('span', { className: 'tw-label' }, '授权开放的能力包'),
        h('div', { className: 'tw-actions' },
          (view?.capabilities || []).filter(c => c.enabled).map(cap => {
            const checked = selectedCaps.includes(cap.id);
            return h('label', { key: cap.id, className: 'tw-switch' },
              h('input', {
                type: 'checkbox',
                checked,
                onChange: () => setSelectedCaps(prev => checked ? prev.filter(x => x !== cap.id) : [...prev, cap.id])
              }),
              cap.name
            );
          })
        )
      ),
      h('div', { className: 'tw-actions' },
        h('button', {
          id: 'btnSubmitInvitePerson',
          type: 'button',
          className: 'tw-btn tw-btn-primary',
          disabled: busy || !name.trim(),
          onClick: submitCreate
        }, '生成专属隔离入口')
      )
    )
  );
}

function CallerPreviewModal({ open, view, initialPersonId, onClose }) {
  const people = view?.people || [];
  const [personId, setPersonId] = useState('');
  const [question, setQuestion] = useState('核心口径包含哪些边界？');
  const [previewTurn, setPreviewTurn] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setPersonId(initialPersonId || people[0]?.id || '');
      setPreviewTurn(null);
    }
  }, [open, initialPersonId, people.length]);

  const person = people.find(p => p.id === personId) || people[0] || null;
  const isPaused = view?.dutyMode === 'off' || (person && !person.enabled);
  const authorizedCaps = (view?.capabilities || []).filter(
    c => c.enabled && (!person || !Array.isArray(person.caps) || person.caps.includes(c.id))
  );

  async function askSandbox() {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const res = await runTwinAction('caller_preview_ask', {
        personId: person?.id || '',
        question: question.trim()
      });
      setPreviewTurn(res.result);
    } finally {
      setLoading(false);
    }
  }

  return h(TwinDialog, {
    id: 'callerPreviewDialog',
    open,
    title: '客户视角真机预览（纯沙箱，不写入外部台账）',
    onClose
  },
    h('label', { className: 'tw-field' },
      h('span', { className: 'tw-label' }, '模拟来访对象'),
      h('select', {
        className: 'tw-select',
        value: person?.id || '',
        onChange: e => { setPersonId(e.target.value); setPreviewTurn(null); }
      },
        people.length ? people.map(p => h('option', { key: p.id, value: p.id }, `${p.name}（${p.channel} · ${formatModeLabel(p.mode)}）`)) : h('option', { value: '' }, '默认访客沙箱')
      )
    ),
    h('div', { className: 'tw-card' },
      h('div', { className: 'tw-h3' }, view?.twinProfile?.name || '工作分身'),
      h('p', { className: 'tw-muted', style: { marginTop: '0.2rem' } }, view?.twinProfile?.intro || '依据已授权项目文档提供只读答疑'),
      h('div', { className: 'tw-actions', style: { marginTop: '0.55rem' } },
        authorizedCaps.length
          ? authorizedCaps.map(c => h('span', { key: c.id, className: 'tw-badge' }, c.name))
          : h('span', { className: 'tw-badge' }, '暂未开放可见能力项')
      )
    ),
    isPaused && h('div', { className: 'tw-banner is-warn' },
      '访客此时会看到「当前暂停值班 / 权限已暂停」礼貌提示（不收任何费用，无兑换码墙）。'
    ),
    h('div', { className: 'tw-field' },
      h('span', { className: 'tw-label' }, '以对方身份试发一句问题'),
      h('div', { className: 'tw-actions' },
        h('input', {
          id: 'callerPreviewInput',
          className: 'tw-input',
          style: { flex: 1 },
          value: question,
          onChange: e => setQuestion(e.target.value)
        }),
        h('button', {
          id: 'btnRunCallerPreview',
          type: 'button',
          className: 'tw-btn tw-btn-primary',
          disabled: loading || !question.trim(),
          onClick: askSandbox
        }, loading ? '推演中...' : '试发检验')
      )
    ),
    previewTurn && h('div', { className: 'tw-draft-box' },
      h('div', { className: 'tw-badge is-ok', style: { marginBottom: '0.35rem' } }, previewTurn.statusLabel || '沙箱试答'),
      h('div', null, previewTurn.reply || previewTurn.reason || '已模拟处理')
    )
  );
}

function ProfileEditModal({ open, view, presets, busy, onClose, onSave }) {
  const [personaId, setPersonaId] = useState('advisor');
  const [name, setName] = useState('');
  const [intro, setIntro] = useState('');
  const [dutyMode, setDutyMode] = useState('shadow');

  useEffect(() => {
    if (open) {
      setPersonaId(view?.twinProfile?.personaId || 'advisor');
      setName(view?.twinProfile?.name || '工作分身');
      setIntro(view?.twinProfile?.intro || '');
      setDutyMode(view?.dutyMode || 'shadow');
    }
  }, [open]);

  function applyPreset(preset) {
    setPersonaId(preset.id);
    setName(preset.defaultName);
    setIntro(preset.intro);
    setDutyMode(preset.recommendedDuty);
  }

  return h(TwinDialog, {
    id: 'profileEditDialog',
    open,
    title: '编辑分身定位与对外名片',
    onClose
  },
    h('div', { className: 'tw-field' },
      h('span', { className: 'tw-label' }, '快速套用推荐人设'),
      h('div', { className: 'tw-actions' },
        (presets || []).map(p => h('button', {
          key: p.id,
          type: 'button',
          className: personaId === p.id ? 'tw-btn tw-btn-primary' : 'tw-btn',
          onClick: () => applyPreset(p)
        }, p.title))
      )
    ),
    h('label', { className: 'tw-field' },
      h('span', { className: 'tw-label' }, '分身对外名称'),
      h('input', {
        id: 'profileNameInput',
        className: 'tw-input',
        value: name,
        onChange: e => setName(e.target.value)
      })
    ),
    h('label', { className: 'tw-field' },
      h('span', { className: 'tw-label' }, '一句话对外介绍（显示在访客网页与名片首行）'),
      h('textarea', {
        id: 'profileIntroInput',
        className: 'tw-textarea',
        value: intro,
        onChange: e => setIntro(e.target.value)
      })
    ),
    h('label', { className: 'tw-field' },
      h('span', { className: 'tw-label' }, '默认对外值班方式'),
      h('select', {
        className: 'tw-select',
        value: dutyMode,
        onChange: e => setDutyMode(e.target.value)
      },
        h('option', { value: 'shadow' }, '只出草稿我来批（推荐起步）'),
        h('option', { value: 'live' }, '开启自动托管（按对象白名单）'),
        h('option', { value: 'off' }, '暂停对外值班')
      )
    ),
    h('div', { className: 'tw-actions' },
      h('button', {
        id: 'btnSaveProfileModal',
        type: 'button',
        className: 'tw-btn tw-btn-primary',
        disabled: busy || !name.trim(),
        onClick: async () => {
          await onSave({ personaId, name: name.trim(), intro: intro.trim(), dutyMode });
          onClose();
        }
      }, '保存名片设置')
    )
  );
}

function PersonDrawer({ person, view, busy, onClose, onAction, onOpenPreview, onConfirm }) {
  const [copyStatus, setCopyStatus] = useState('');
  const [selectedCaps, setSelectedCaps] = useState([]);

  useEffect(() => {
    setSelectedCaps(person?.caps || []);
  }, [person?.id, (person?.caps || []).join(',')]);

  useEffect(() => {
    setCopyStatus('');
  }, [person?.id]);

  const chId = channelIdFromSelection(person?.channel);
  const inviteCredential = chId === 'ch-web'
    ? person?.guestUrl
    : (person?.pairCode || person?.channelHandle || '');

  return h(TwinDialog, {
    id: 'personDetailDrawer',
    open: Boolean(person),
    isDrawer: true,
    title: person ? `${person.name} · 访问边界与隔离会话` : '服务对象详情',
    onClose
  },
    person && h(React.Fragment, null,
      h('div', { className: 'tw-card' },
        h('div', { className: 'tw-h3' }, `${person.role} · ${person.channel}`),
        h('p', { className: 'tw-muted', style: { marginTop: '0.2rem' } },
          `${formatBindingText(person)} · 今日已问 ${person.todayCount || 0} / ${view?.dailyTurnCap || 30} 轮 · ${person.expiry}`
        ),
        inviteCredential && h('div', { className: 'tw-draft-box', style: { marginTop: '0.6rem' } },
          chId === 'ch-web' ? '专属免装网页：' : '当前邀请 / 绑定标识：',
          h('strong', { style: { wordBreak: 'break-all' } }, inviteCredential)
        ),
        h('div', { className: 'tw-actions', style: { marginTop: '0.6rem' } },
          inviteCredential && h('button', {
            type: 'button',
            className: 'tw-btn tw-btn-primary',
            onClick: () => copyToClipboard(inviteCredential, setCopyStatus)
          }, '复制凭证给对方'),
          h('button', {
            type: 'button',
            className: 'tw-btn',
            onClick: () => onOpenPreview(person.id)
          }, '客户视角预览'),
          h('button', {
            type: 'button',
            className: 'tw-btn',
            disabled: busy,
            onClick: () => onConfirm({
              title: '重签邀请凭证？',
              message: `重签后，「${person.name}」原有的链接或配对码立即失效，并解除此前已绑定的外部聊天账号。`,
              onAccept: () => onAction('regenerate_invite', { personId: person.id })
            })
          }, '重签邀请凭证')
        ),
        h('span', { className: 'tw-copy-status', role: 'status', 'aria-live': 'polite' }, copyStatus)
      ),
      h('div', { className: 'tw-field' },
        h('span', { className: 'tw-label' }, '答复边界模式'),
        h('select', {
          className: 'tw-select',
          value: person.mode,
          disabled: busy,
          onChange: e => onAction('update_person_mode', { personId: person.id, mode: e.target.value })
        },
          h('option', { value: 'confirm' }, '每条先草稿给我看'),
          h('option', { value: 'direct' }, '白名单直接答'),
          h('option', { value: 'summary' }, '只给汇总（禁个人明细）')
        )
      ),
      h('div', { className: 'tw-field' },
        h('span', { className: 'tw-label' }, '允许读取的项目能力项'),
        h('div', { className: 'tw-actions' },
          (view?.capabilities || []).map(cap => {
            const has = selectedCaps.includes(cap.id);
            return h('label', { key: cap.id, className: 'tw-switch' },
              h('input', {
                type: 'checkbox',
                checked: has,
                onChange: () => {
                  const next = has ? selectedCaps.filter(x => x !== cap.id) : [...selectedCaps, cap.id];
                  setSelectedCaps(next);
                  onAction('update_person_caps', { personId: person.id, caps: next });
                }
              }),
              cap.name
            );
          })
        )
      ),
      h('div', { className: 'tw-field' },
        h('span', { className: 'tw-label' }, '单人物理隔离历史对话'),
        (person.threads || []).length ? (person.threads || []).map(t => h('div', { key: t.id, className: 'tw-card' },
          h('div', { className: 'tw-muted' }, `${t.time || ''} · ${t.capLabel || ''} · ${t.statusLabel || ''}`),
          h('div', { style: { fontWeight: 600, marginTop: '0.25rem' } }, `问：${t.question}`),
          h('div', { style: { marginTop: '0.25rem' } }, `答：${t.reply}`)
        )) : h('p', { className: 'tw-muted' }, '该对象专属文件夹内暂无外部问答记录。')
      )
    )
  );
}

function ChannelConfigModal({ channel, guide, busy, onClose, onAction, onConfirm }) {
  const [wecomMode, setWecomMode] = useState('aibot');
  const [botName, setBotName] = useState('工作分身');
  const [appId, setAppId] = useState('');
  const [agentId, setAgentId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [qrResult, setQrResult] = useState(null);
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    if (channel) {
      setWecomMode(channel.wecomMode || 'aibot');
      setBotName(channel.botName || '工作分身');
      setAppId('');
      setAgentId('');
      setAppSecret('');
      setQrResult(channel.qrUrl ? { qrUrl: channel.qrUrl } : null);
      setCopyStatus('');
    }
  }, [channel]);

  const activeGuide = channel?.id === 'ch-wecom'
    ? (guide?.modes?.[wecomMode] || guide?.modes?.aibot)
    : guide;

  return h(TwinDialog, {
    id: 'channelConfigDialog',
    open: Boolean(channel),
    title: channel?.id === 'ch-wechat'
      ? '个人微信 · 本机 5 分钟扫码激活'
      : (guide?.title || `配置 ${channel?.name || ''}`),
    onClose
  },
    channel && (channel.id === 'ch-wechat' ? h('div', { className: 'tw-field' },
      h('p', { className: 'tw-muted' }, '无需注册公众号或备案域名。点击下方签发 5 分钟专属扫码凭证，仅绑定扫码通过的指定对象，陌生人零响应。'),
      qrResult?.qrUrl && h('div', { className: 'tw-draft-box' },
        h('div', null, '当前有效 5 分钟微信扫码凭证：'),
        h('strong', { style: { wordBreak: 'break-all' } }, qrResult.qrUrl)
      ),
      h('div', { className: 'tw-actions' },
        h('button', {
          type: 'button',
          className: 'tw-btn tw-btn-primary',
          disabled: busy,
          onClick: async () => {
            const res = await onAction('issue_wechat_qr', {});
            if (res?.result) setQrResult(res.result);
          }
        }, qrResult?.qrUrl ? '重新生成 5 分钟码' : '生成 5 分钟扫码凭证'),
        qrResult?.qrUrl && h('button', {
          type: 'button',
          className: 'tw-btn',
          onClick: () => copyToClipboard(qrResult.qrUrl, setCopyStatus)
        }, '复制扫码口令'),
        qrResult?.qrUrl && h('button', {
          type: 'button',
          className: 'tw-btn',
          disabled: busy,
          onClick: async () => {
            await onAction('confirm_wechat_scan', { qrToken: qrResult.qrToken });
            onClose();
          }
        }, '确认我已本机扫码'),
        channel.configured && h('button', {
          type: 'button',
          className: 'tw-btn tw-btn-danger',
          disabled: busy,
          onClick: () => onConfirm({
            title: '断开个人微信通道？',
            message: '断开后立即关闭微信连接并从本机 0600 凭据库抹除登录凭证。',
            onAccept: async () => { await onAction('disconnect_channel', { channelId: 'ch-wechat' }); onClose(); }
          })
        }, '断开并清除凭据')
      ),
      h('span', { className: 'tw-copy-status', role: 'status', 'aria-live': 'polite' }, copyStatus)
    ) : h(React.Fragment, null,
      channel.id === 'ch-wecom' && h('div', { className: 'tw-seg' },
        h('button', {
          type: 'button',
          className: wecomMode === 'aibot' ? 'tw-seg-btn is-active' : 'tw-seg-btn',
          onClick: () => setWecomMode('aibot')
        }, '智能机器人长连接（推荐免备案）'),
        h('button', {
          type: 'button',
          className: wecomMode === 'corpapp' ? 'tw-seg-btn is-active' : 'tw-seg-btn',
          onClick: () => setWecomMode('corpapp')
        }, '企业自建应用')
      ),
      activeGuide?.steps && h('ol', { className: 'tw-card', style: { margin: 0, paddingLeft: '1.6rem', fontSize: '0.84rem' } },
        activeGuide.steps.map((s, idx) => h('li', { key: idx, style: { marginBottom: '0.3rem' } }, s))
      ),
      h('label', { className: 'tw-field' },
        h('span', { className: 'tw-label' }, '机器人显示名称'),
        h('input', {
          className: 'tw-input',
          value: botName,
          onChange: e => setBotName(e.target.value)
        })
      ),
      h('label', { className: 'tw-field' },
        h('span', { className: 'tw-label' }, activeGuide?.appIdLabel || 'App ID'),
        h('input', {
          className: 'tw-input',
          placeholder: channel.appIdHint ? `当前已保存：${channel.appIdHint}` : (activeGuide?.appIdPh || ''),
          value: appId,
          onChange: e => setAppId(e.target.value)
        })
      ),
      channel.id === 'ch-wecom' && wecomMode === 'corpapp' && h('label', { className: 'tw-field' },
        h('span', { className: 'tw-label' }, '自建应用 AgentId'),
        h('input', {
          className: 'tw-input',
          placeholder: '如：1000002',
          value: agentId,
          onChange: e => setAgentId(e.target.value)
        })
      ),
      h('label', { className: 'tw-field' },
        h('span', { className: 'tw-label' }, activeGuide?.secretLabel || 'Secret / Bot Token'),
        h('input', {
          className: 'tw-input',
          type: 'password',
          placeholder: channel.hasSecret ? '已存在本机加密密钥，留新值覆盖' : (activeGuide?.secretPh || ''),
          value: appSecret,
          onChange: e => setAppSecret(e.target.value)
        })
      ),
      h('div', { className: 'tw-actions' },
        h('button', {
          type: 'button',
          className: 'tw-btn tw-btn-primary',
          disabled: busy || !appId.trim() || !appSecret.trim(),
          onClick: async () => {
            await onAction('configure_channel', {
              channelId: channel.id,
              botName,
              appId: appId.trim(),
              agentId: agentId.trim(),
              appSecret: appSecret.trim(),
              wecomMode
            });
            onClose();
          }
        }, '校验并保存本机直连'),
        channel.configured && h('button', {
          type: 'button',
          className: 'tw-btn tw-btn-danger',
          disabled: busy,
          onClick: () => onConfirm({
            title: `断开 ${channel.shortLabel}？`,
            message: '断开后立即停止本机长连接，并清除 0600 凭据库中保存的应用密钥。',
            onAccept: async () => { await onAction('disconnect_channel', { channelId: channel.id }); onClose(); }
          })
        }, '断开并清除凭据')
      )
    ))
  );
}

function ConfirmActionModal({ confirmSpec, busy, onClose }) {
  return h(TwinDialog, {
    id: 'confirmActionDialog',
    open: Boolean(confirmSpec),
    title: confirmSpec?.title || '确认操作',
    onClose
  },
    confirmSpec && h(React.Fragment, null,
      h('p', { className: 'tw-muted', style: { fontSize: '0.9rem', color: 'var(--tw-ink)' } }, confirmSpec.message),
      h('div', { className: 'tw-actions' },
        h('button', { type: 'button', className: 'tw-btn', onClick: onClose }, '先不改'),
        h('button', {
          type: 'button',
          className: 'tw-btn tw-btn-danger',
          disabled: busy,
          onClick: async () => {
            await confirmSpec.onAccept?.();
            onClose();
          }
        }, '确认继续')
      )
    )
  );
}

export {
  TwinDialog,
  EditDraftModal,
  InvitePersonModal,
  CallerPreviewModal,
  ProfileEditModal,
  PersonDrawer,
  ChannelConfigModal,
  ConfirmActionModal
};
