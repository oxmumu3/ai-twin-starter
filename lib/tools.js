/**
 * Workbench agent tool (`twin_desk`, Step 3) for inspecting approvals, adding rules,
 * switching duty modes, checking 0-token project deltas, and sandbox testing.
 * Strictly avoids `required: false` on optional tool schema properties.
 */
import { defineTool } from '@deepseek-ai/dsh-tools';
import {
  DUTY_MODES,
  RULE_KINDS,
  redactSecrets,
  sanitizeSurfaceText
} from '../shared/schema.js';

export function registerTwinDeskTool(ctx, getRuntime) {
  if (!ctx?.tools || typeof ctx.tools.register !== 'function') return;

  ctx.tools.register(defineTool({
    name: 'twin_desk',
    description: 'Inspect or operate the AI 分身 service desk: check duty status, list pending approval drafts or knowledge gaps, approve drafts, append rules/redlines, toggle shadow/live/off duty modes, detect 0-token project deltas, or run read-only sandbox questions.',
    parameters: {
      action: {
        type: 'string',
        required: true,
        enum: ['status', 'list_approvals', 'approve_draft', 'add_rule', 'set_duty_mode', 'check_project_delta', 'sandbox_ask'],
        description: 'Service desk action to run.'
      },
      approvalId: {
        type: 'string',
        description: 'approve_draft only: identifier of the pending approval draft.'
      },
      customDraft: {
        type: 'string',
        description: 'approve_draft only: optional edited reply text overriding the draft.'
      },
      ruleKind: {
        type: 'string',
        enum: [...RULE_KINDS],
        description: 'add_rule only: 规矩 or 红线.'
      },
      ruleText: {
        type: 'string',
        description: 'add_rule only: plain-language behavioral rule or boundary.'
      },
      dutyMode: {
        type: 'string',
        enum: [...DUTY_MODES],
        description: 'set_duty_mode only: shadow, live, or off.'
      },
      projectId: {
        type: 'string',
        description: 'check_project_delta only: mounted project ID to inspect.'
      },
      personId: {
        type: 'string',
        description: 'sandbox_ask only: caller profile ID to simulate.'
      },
      question: {
        type: 'string',
        description: 'sandbox_ask only: test question to run against authorized snippets.'
      }
    },
    output: {
      schema: { type: 'object', additionalProperties: true },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }]
    },
    async execute(args, execution) {
      execution?.signal?.throwIfAborted?.();
      const rt = getRuntime?.();
      if (!rt) {
        throw new Error('AI 分身工作台服务尚未就绪，请等待插件加载完成');
      }
      const { store, engine, guestServer } = rt;
      const secretVals = store.allSecretValues();

      switch (args.action) {
        case 'status': {
          const s = store.getState();
          return {
            ok: true,
            lifecycleStage: s.lifecycleStage,
            dutyMode: s.dutyMode,
            presenceAutoYield: s.presenceAutoYield,
            mountedProjects: s.mountedProjects.length,
            activeCapabilities: s.capabilities.filter(c => c.enabled).length,
            pendingApprovals: s.approvals.length,
            guestBaseUrl: guestServer?.getBaseUrl?.() || ''
          };
        }
        case 'list_approvals': {
          const s = store.getState();
          return {
            ok: true,
            approvals: s.approvals.map(a => ({
              id: a.id,
              tag: a.tag,
              personName: a.personName,
              headline: redactSecrets(sanitizeSurfaceText(a.headline), secretVals),
              question: redactSecrets(sanitizeSurfaceText(a.question), secretVals),
              draft: redactSecrets(sanitizeSurfaceText(a.draft), secretVals)
            }))
          };
        }
        case 'approve_draft': {
          if (!args.approvalId) throw new Error('approve_draft requires approvalId');
          return engine.approveDraft(args.approvalId, args.customDraft ?? null);
        }
        case 'add_rule': {
          const text = sanitizeSurfaceText(String(args.ruleText || '').trim());
          if (!text) throw new Error('add_rule requires ruleText');
          const kind = RULE_KINDS.includes(args.ruleKind) ? args.ruleKind : '规矩';
          await store.updateState(st => {
            st.rules.push({ id: `r-tool-${Date.now()}`, kind, text });
          }, { saveUndo: 'desk' });
          return { ok: true, kind, text };
        }
        case 'set_duty_mode': {
          if (!DUTY_MODES.includes(args.dutyMode)) throw new Error('Invalid dutyMode');
          await store.updateState(st => {
            st.dutyMode = args.dutyMode;
          }, { saveUndo: 'desk' });
          return { ok: true, dutyMode: args.dutyMode };
        }
        case 'check_project_delta': {
          const s = store.getState();
          const pid = args.projectId || s.mountedProjects[0]?.id;
          if (!pid) return { ok: true, hasDelta: false, reason: '尚无已挂载项目' };
          return engine.recheckProjectDelta(pid);
        }
        case 'sandbox_ask': {
          if (!args.question) throw new Error('sandbox_ask requires question');
          return engine.handleInboundMessage({
            personId: args.personId || '',
            question: args.question,
            channelId: 'ch-web',
            sandboxOnly: true
          });
        }
        default:
          throw new Error(`Unsupported twin_desk action: ${args.action}`);
      }
    }
  }));
}
