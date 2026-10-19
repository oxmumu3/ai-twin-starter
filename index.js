import { isAbsolute, relative, resolve, sep } from 'node:path';
import { defineTool } from '@deepseek-ai/dsh-tools';
import { initWorkspace, inspectWorkspace, readRunbook } from './src/workspace.mjs';
import { prepareDistillation, applyDistillation, inspectDistillation, refreshDistillation, readKnowledge } from './src/distill.mjs';
import { createSlackAdapter, probeChannel, tickChannel, inspectChannel } from './src/channel.mjs';

export const name = 'agent-twin-starter';
export const inject = ['tools', 'workingDirectory', 'sandboxPolicy'];

function currentDirectory(ctx, agent) {
  if (!agent?.session) throw new Error('A current local agent session is required / 需要当前本地会话');
  const directory = agent.ctx?.get?.('workingDirectory') ?? ctx.get?.('workingDirectory');
  const cwd = typeof directory?.get === 'function' ? directory.get(agent.session) : undefined;
  if (typeof cwd !== 'string' || !isAbsolute(cwd)) {
    throw new Error('The host must provide a current absolute working directory / 宿主未提供当前绝对工作目录');
  }
  return resolve(cwd);
}

function requireWritePolicy(ctx, agent, cwd) {
  const service = agent.ctx?.get?.('sandboxPolicy') ?? ctx.get?.('sandboxPolicy');
  const policy = typeof service?.resolve === 'function' ? service.resolve({ session: agent.session }) : undefined;
  if (!policy || !['workspace-write', 'danger-full-access'].includes(policy.mode)) {
    throw new Error('This operation requires a writable sandbox policy; read-only, missing or unknown policies are refused');
  }
  if (policy.mode === 'workspace-write') {
    if (typeof policy.workspaceRoot !== 'string' || !isAbsolute(policy.workspaceRoot)) {
      throw new Error('A workspace-write sandbox policy must provide its absolute workspace root');
    }
    const path = relative(resolve(policy.workspaceRoot), cwd);
    if (path === '..' || path.startsWith(`..${sep}`) || isAbsolute(path)) {
      throw new Error('The current directory is outside the writable sandbox workspace root');
    }
  }
}

const inputsByOperation = {
  init: [], status: [], runbook: [],
  distill_prepare: ['entries'], distill_apply: ['batchId', 'cards'], distill_status: [], distill_refresh: [], knowledge_read: [],
  channel_probe: [], channel_status: [], channel_tick: [],
};

function validateOperationInputs(args) {
  const allowed = inputsByOperation[args.operation];
  if (!allowed || Object.keys(args).some(key => key !== 'operation' && !allowed.includes(key))) {
    throw new Error('Unexpected operation argument; paths, tokens and sending flags cannot be supplied by the model');
  }
  if (args.operation === 'distill_prepare' && (!Array.isArray(args.entries) || args.entries.length === 0)) {
    throw new Error('distill_prepare requires explicit entries');
  }
  if (args.operation === 'distill_apply' && (typeof args.batchId !== 'string' || !args.batchId.trim() || !Array.isArray(args.cards))) {
    throw new Error('distill_apply requires batchId and cards from the prepared batch');
  }
}

/** Mounting registers tools only: no file selection, Slack access or polling starts. */
export function apply(ctx) {
  ctx.tools.register(defineTool({
    name: 'agent_twin',
    description: 'Build a twin from the current work Agent in three steps: distill explicitly selected project files into private source-backed knowledge/judgment/workflow/tool cards; verify a locally authorized Slack channel with read-only checks; inspect permissions and perform a forced dry run. init creates a new disabled .agent-twin directory without overwriting existing work. For distillation, call distill_prepare with user-selected relative entries, reason over the returned scoped sources, then call distill_apply with documented facts separated from candidates and exact sourceRefs. distill_refresh reports source changes without rewriting cards. Before using distilled knowledge, call knowledge_read: it returns only current documented cards and excludes stale/candidate cards. This is private internal context, not a package to forward to a visitor; use only the caller-authorized scope and do not expose the whole private knowledge pack. channel_probe and channel_tick use only a local environment token and explicit local configuration; token values are never model arguments. channel_tick always uses dryRun:true and performs no sending or business actions, even when enabled:false. No scheduler or background bot is registered. A verified read-only channel or saved knowledge does not prove autonomous service or message delivery.',
    parameters: {
      operation: {
        type: 'string', required: true, enum: Object.keys(inputsByOperation),
        description: 'Initialize; prepare/apply/inspect/refresh distillation; read current private knowledge; probe/inspect/dry-run Slack; or read the runbook.',
      },
      entries: {
        type: 'array', items: { type: 'string' },
        description: 'distill_prepare only: explicit user-selected relative .md/.txt files inside the current project. Never infer permission to scan the project, credentials, private chats or other directories.',
      },
      batchId: { type: 'string', description: 'distill_apply only: exact batchId returned by distill_prepare.' },
      cards: {
        type: 'array', description: 'distill_apply only: private reusable cards grounded in the prepared sources; semantic extraction belongs to the current Agent.',
        items: {
          type: 'object', additionalProperties: false,
          properties: {
            id: { type: 'string', required: true },
            kind: { type: 'string', required: true, enum: ['knowledge', 'judgment', 'workflow', 'tool'] },
            title: { type: 'string', required: true }, content: { type: 'string', required: true },
            when: { type: 'string', required: true, description: 'When the card applies.' },
            limits: { type: 'string', required: true, description: 'Evidence, authorization or applicability limits.' },
            sourceRefs: {
              type: 'array', required: true,
              items: {
                type: 'object', additionalProperties: false,
                properties: {
                  sourceId: { type: 'string', required: true },
                  startLine: { type: 'integer', required: true }, endLine: { type: 'integer', required: true },
                },
              },
            },
            status: { type: 'string', required: true, enum: ['documented', 'candidate'] },
          },
        },
      },
    },
    output: {
      schema: { type: 'object', additionalProperties: true },
      render: (_args, value) => [{ type: 'text', text: value.text ?? JSON.stringify(value) }],
    },
    async execute(args, execution) {
      validateOperationInputs(args);
      execution.signal.throwIfAborted();
      const cwd = currentDirectory(ctx, execution.agent);
      switch (args.operation) {
        case 'init':
          requireWritePolicy(ctx, execution.agent, cwd);
          return initWorkspace(cwd);
        case 'status': return inspectWorkspace(cwd);
        case 'runbook': return { operation: 'runbook', text: await readRunbook(cwd) };
        case 'distill_prepare':
          requireWritePolicy(ctx, execution.agent, cwd);
          return prepareDistillation(cwd, args.entries);
        case 'distill_apply':
          requireWritePolicy(ctx, execution.agent, cwd);
          return applyDistillation(cwd, args.batchId, args.cards);
        case 'distill_status': return inspectDistillation(cwd);
        case 'distill_refresh': return refreshDistillation(cwd);
        case 'knowledge_read': return readKnowledge(cwd);
        case 'channel_probe':
          requireWritePolicy(ctx, execution.agent, cwd);
          return probeChannel(cwd, createSlackAdapter({ signal: execution.signal }));
        case 'channel_status': return inspectChannel(cwd);
        case 'channel_tick':
          requireWritePolicy(ctx, execution.agent, cwd);
          return tickChannel(cwd, createSlackAdapter({ signal: execution.signal }), { dryRun: true });
        default: throw new Error('Unknown agent_twin operation');
      }
    },
  }));
}
