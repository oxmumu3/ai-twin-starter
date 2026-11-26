/**
 * Four crisp atomic DSH agent tools paired with `tool.call.toolview` inline chat cards:
 * - `twin_status`: inspect duty state, switch duty mode, probe 0.2.3 connectors, or self-test.
 * - `twin_publish_workspace`: distill a local project into Scoped Twin capabilities + optional official Feishu reuse.
 * - `twin_grant_access`: grant per-caller Scoped Workspace access across Web / WeChat / Feishu / WeCom / Slack.
 * - `twin_inbox`: list pending redline/gap/draft approvals or approve/dismiss them in-place.
 * Strictly omits `required: false` and stays compact under schema size limits.
 */
import { isAbsolute, resolve } from 'node:path';
import { defineTool } from '@deepseek-ai/dsh-tools';
import {
  DUTY_MODES,
  PERSON_MODES,
  redactSecrets,
  sanitizeSurfaceText
} from '../shared/schema.js';
import { createTwinService } from './service.js';

function resolveCallerCwd(ctx, execution) {
  if (!execution?.agent?.session) return '';
  const dirSvc = execution.agent.ctx?.get?.('workingDirectory') ?? ctx.get?.('workingDirectory');
  const cwd = typeof dirSvc?.get === 'function' ? dirSvc.get(execution.agent.session) : '';
  return typeof cwd === 'string' && isAbsolute(cwd) ? resolve(cwd) : '';
}

function getService(runtime) {
  if (!runtime?.store) {
    throw new Error('AI 分身后台服务仍在启动，请稍后重试');
  }
  return runtime.service || createTwinService(runtime);
}

function renderJsonResult(_args, value) {
  return [{ type: 'text', text: JSON.stringify(value) }];
}

export function registerTwinTools(ctx, getRuntime) {
  if (!ctx?.tools || typeof ctx.tools.register !== 'function') return;

  ctx.tools.register(defineTool({
    name: 'twin_status',
    description: 'Inspect AI 分身 duty mode, mounted projects, 5 channels & 0.2.3 official connectors, pending approvals, or switch duty mode / run a read-only self-test.',
    parameters: {
      dutyMode: {
        type: 'string',
        enum: [...DUTY_MODES],
        description: 'Optional new duty mode: shadow, live, or off.'
      },
      probeConnectors: {
        type: 'boolean',
        description: 'Refresh DSH 0.2.3 official Feishu/WeCom connector detection.'
      },
      askSelfTest: {
        type: 'string',
        description: 'Optional read-only test question for the local twin.'
      }
    },
    output: {
      schema: { type: 'object', additionalProperties: true },
      render: renderJsonResult
    },
    async execute(args = {}, execution) {
      execution?.signal?.throwIfAborted?.();
      const rt = getRuntime();
      const svc = getService(rt);

      if (DUTY_MODES.includes(args.dutyMode)) {
        await rt.store.updateState(st => {
          st.dutyMode = args.dutyMode;
          if (st.lifecycleStage === 'cold') st.lifecycleStage = 'desk';
        }, { saveUndo: 'desk' });
      }
      if (args.probeConnectors) {
        await rt.channelManager.probeOfficialConnectors();
      }
      let selfTestResult = null;
      if (typeof args.askSelfTest === 'string' && args.askSelfTest.trim()) {
        selfTestResult = await rt.engine.handleInboundMessage({
          question: args.askSelfTest.trim(),
          isOwnerSelfTest: true
        });
      }

      const snap = await svc.getStatus();
      const dutyLabel = snap.dutyMode === 'live' ? '正式值班' : snap.dutyMode === 'off' ? '已暂停' : '影子试跑';
      const out = {
        kind: 'twin_status',
        summary: `${snap.twinProfile?.name || '工作分身'} · ${dutyLabel} · ${snap.mountedProjects.length} 个项目 · ${snap.approvals.length} 条待拍板`,
        twinProfile: snap.twinProfile,
        dutyMode: snap.dutyMode,
        fullBloodAvailable: snap.fullBloodAvailable,
        mountedProjects: snap.mountedProjects.map(m => ({
          id: m.id,
          projectName: m.projectName,
          docCount: m.docCount,
          blockedSecretCount: m.blockedSecretCount,
          shortSummary: m.shortSummary
        })),
        channels: snap.channels.map(c => ({
          id: c.id,
          name: c.shortLabel || c.name,
          enabled: c.enabled,
          configured: c.configured,
          connectionMode: c.connectionMode || '',
          status: c.status,
          officialConnector: c.officialConnector || null
        })),
        pendingCount: snap.approvals.length,
        peopleCount: snap.people.length,
        selfTestResult
      };
      return JSON.parse(redactSecrets(JSON.stringify(out), rt.store.allSecretValues()));
    }
  }));

  ctx.tools.register(defineTool({
    name: 'twin_publish_workspace',
    description: 'Distill a local project directory into a read-only Scoped Twin workspace (secrets excluded) and optionally reuse DSH 0.2.3 official Feishu connector.',
    parameters: {
      path: {
        type: 'string',
        description: 'Project directory path (defaults to current working directory).'
      },
      brief: {
        type: 'string',
        description: 'Optional boundary instruction or focus note for this workspace.'
      },
      dutyMode: {
        type: 'string',
        enum: [...DUTY_MODES],
        description: 'Optional duty mode after publishing: shadow, live, or off.'
      },
      useOfficialFeishu: {
        type: 'boolean',
        description: 'Connect DSH official Feishu connector if already signed in.'
      }
    },
    output: {
      schema: { type: 'object', additionalProperties: true },
      render: renderJsonResult
    },
    async execute(args = {}, execution) {
      execution?.signal?.throwIfAborted?.();
      const rt = getRuntime();
      const svc = getService(rt);
      const cwd = resolveCallerCwd(ctx, execution);
      const rawPath = typeof args.path === 'string' && args.path.trim() ? args.path.trim() : cwd;
      if (!rawPath) throw new Error('请传入本地项目目录 path，或在工作区会话内调用');
      const rootPath = isAbsolute(rawPath) ? resolve(rawPath) : resolve(cwd || process.cwd(), rawPath);

      const res = await svc.publishWorkspace({
        rootPath,
        brief: args.brief || '',
        dutyMode: args.dutyMode,
        connectOfficialFeishu: Boolean(args.useOfficialFeishu)
      });
      const feishuChannel = res.status.channels.find(c => c.id === 'ch-feishu') || null;
      const out = {
        kind: 'twin_publish_workspace',
        summary: `已提炼「${res.project.projectName}」${res.capabilities.length} 项能力，隔离 ${res.project.blockedSecretCount || 0} 处私密文件`,
        project: {
          id: res.project.id || res.project.projectId,
          projectName: res.project.projectName,
          docCount: res.project.docCount,
          readOnlyToolCount: res.project.readOnlyToolCount,
          blockedSecretCount: res.project.blockedSecretCount,
          blockedWriteScriptCount: res.project.blockedWriteScriptCount,
          shortSummary: res.project.shortSummary
        },
        capabilities: res.capabilities.map(c => ({ id: c.id, name: c.name, desc: c.desc })),
        twinProfile: res.twinProfile,
        dutyMode: res.dutyMode,
        feishuConnect: res.feishuConnect,
        feishuChannel
      };
      return JSON.parse(redactSecrets(JSON.stringify(out), rt.store.allSecretValues()));
    }
  }));

  ctx.tools.register(defineTool({
    name: 'twin_grant_access',
    description: 'Grant a teammate or partner isolated Scoped Twin access on Web, personal WeChat (QR), Feishu, WeCom, or Slack with reply mode and expiry.',
    parameters: {
      name: {
        type: 'string',
        required: true,
        description: 'Caller display name (e.g. 王敏 or 外部代理李总).'
      },
      role: {
        type: 'string',
        description: 'Role label shown on desk.'
      },
      channel: {
        type: 'string',
        enum: ['ch-web', 'ch-wechat', 'ch-feishu', 'ch-wecom', 'ch-slack'],
        description: 'Channel ID (default ch-web).'
      },
      mode: {
        type: 'string',
        enum: [...PERSON_MODES],
        description: 'Reply policy: direct, summary, or confirm.'
      },
      bindMode: {
        type: 'string',
        enum: ['dm_pair', 'group_allow'],
        description: 'DM pairing or @bot group allowlist.'
      },
      channelHandle: {
        type: 'string',
        description: 'Group ID or name when bindMode is group_allow.'
      },
      days: {
        type: 'integer',
        description: 'Trial validity in days (default 7).'
      },
      note: {
        type: 'string',
        description: 'Optional custom tone or boundary reminder for this caller.'
      }
    },
    output: {
      schema: { type: 'object', additionalProperties: true },
      render: renderJsonResult
    },
    async execute(args = {}, execution) {
      execution?.signal?.throwIfAborted?.();
      const rt = getRuntime();
      const svc = getService(rt);
      const granted = await svc.grantAccess({
        name: args.name,
        role: args.role,
        channel: args.channel || 'ch-web',
        mode: args.mode || 'confirm',
        bindMode: args.bindMode || 'dm_pair',
        channelHandle: args.channelHandle || '',
        days: args.days,
        note: args.note || ''
      });
      const out = {
        kind: 'twin_grant_access',
        summary: `已为「${granted.person.name}」开通${granted.person.channel}隔离访问（${granted.person.mode}）`,
        person: {
          id: granted.person.id,
          name: granted.person.name,
          role: granted.person.role,
          channel: granted.person.channel,
          mode: granted.person.mode,
          expiry: granted.person.expiry,
          pairCode: granted.person.pairCode,
          urlToken: granted.person.urlToken
        },
        guestUrl: granted.guestUrl,
        pairCode: granted.person.pairCode || '',
        qrAvailable: Boolean(granted.qr?.qrSvg)
      };
      return JSON.parse(redactSecrets(JSON.stringify(out), rt.store.allSecretValues()));
    }
  }));

  ctx.tools.register(defineTool({
    name: 'twin_inbox',
    description: 'Inspect pending AI 分身 approval drafts, redline blocks, and knowledge gaps, or approve/dismiss an item and optionally save a new rule.',
    parameters: {
      action: {
        type: 'string',
        enum: ['list', 'approve', 'dismiss'],
        description: 'list (default), approve, or dismiss.'
      },
      approvalId: {
        type: 'string',
        description: 'Target approval ID for approve or dismiss.'
      },
      draft: {
        type: 'string',
        description: 'Optional edited reply text when approving.'
      },
      saveAsRule: {
        type: 'boolean',
        description: 'Append approved guidance into rules when true.'
      },
      ruleText: {
        type: 'string',
        description: 'Optional rule text to save when saveAsRule is true.'
      }
    },
    output: {
      schema: { type: 'object', additionalProperties: true },
      render: renderJsonResult
    },
    async execute(args = {}, execution) {
      execution?.signal?.throwIfAborted?.();
      const rt = getRuntime();
      const svc = getService(rt);
      const act = args.action || 'list';
      let resolved = null;
      if (act === 'approve' || act === 'dismiss') {
        resolved = await svc.resolveApproval({
          approvalId: args.approvalId,
          action: act,
          draft: typeof args.draft === 'string' ? sanitizeSurfaceText(args.draft) : undefined,
          saveAsRule: Boolean(args.saveAsRule),
          ruleText: args.ruleText || ''
        });
      }
      const inbox = svc.listInbox();
      const out = {
        kind: 'twin_inbox',
        summary: resolved
          ? `${resolved.action === 'approved' ? '已批准发出' : '已忽略'} ${resolved.approvalId} · 剩余 ${inbox.approvals.length} 条待拍板`
          : `当前 ${inbox.approvals.length} 条待拍板事项 · ${inbox.recentDeliveries.length} 条近期回执`,
        dutyMode: inbox.dutyMode,
        resolved,
        approvals: inbox.approvals.map(a => ({
          id: a.id,
          personId: a.personId,
          personName: a.personName,
          channel: a.channel,
          tone: a.tone,
          tag: a.tag,
          headline: a.headline,
          question: a.question,
          draft: a.draft,
          basisHint: a.basisHint,
          primaryActionLabel: a.primaryActionLabel,
          allowRuleExtract: a.allowRuleExtract
        })),
        recentDeliveries: inbox.recentDeliveries.slice(0, 5)
      };
      return JSON.parse(redactSecrets(JSON.stringify(out), rt.store.allSecretValues()));
    }
  }));
}

export const registerTwinDeskTool = registerTwinTools;
