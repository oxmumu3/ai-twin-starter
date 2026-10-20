import { isAbsolute, relative, resolve, sep } from 'node:path';
import { defineTool } from '@deepseek-ai/dsh-tools';
import { initWorkspace, inspectWorkspace, readRunbook } from './src/workspace.mjs';
import { prepareDistillation, applyDistillation, inspectDistillation, refreshDistillation, readKnowledge } from './src/distill.mjs';
import { createSlackAdapter, probeChannel, tickChannel, inspectChannel } from './src/channel.mjs';
import { inventoryMaterials, prepareMaterials, applyMaterials, inspectMaterials, prepareDistillationFromMaterials } from './src/materials.mjs';
import { mountNativeTwin } from './src/native-plugin.mjs';
export { Config } from './src/native-config.mjs';
export { mountNativeTwin } from './src/native-plugin.mjs';

export const name = 'agent-twin-starter';
export const inject = ['tools'];

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

function requireReadPolicy(ctx, agent, cwd) {
  const service = agent.ctx?.get?.('sandboxPolicy') ?? ctx.get?.('sandboxPolicy');
  const policy = typeof service?.resolve === 'function' ? service.resolve({ session: agent.session }) : undefined;
  if (!policy || !['read-only', 'workspace-write', 'danger-full-access'].includes(policy.mode)) {
    throw new Error('Material reads require a known host sandbox policy');
  }
  if (policy.mode !== 'danger-full-access') {
    if (typeof policy.workspaceRoot !== 'string' || !isAbsolute(policy.workspaceRoot)) {
      throw new Error('Material reads require an absolute host sandbox workspace root');
    }
    const path = relative(resolve(policy.workspaceRoot), cwd);
    if (path === '..' || path.startsWith(`..${sep}`) || isAbsolute(path)) {
      throw new Error('The current directory is outside the readable sandbox workspace root');
    }
  }
}

const inputsByOperation = {
  init: [], status: [], runbook: [],
  distill_prepare: ['entries'], distill_apply: ['batchId', 'cards'], distill_status: [], distill_refresh: [], knowledge_read: [],
  channel_probe: [], channel_status: [], channel_tick: [],
  materials_inventory: ['roots'], materials_prepare: ['entries'], materials_apply: ['batchId', 'packet'],
  materials_status: [], materials_distill: [],
};

function validateOperationInputs(args) {
  const allowed = inputsByOperation[args.operation];
  if (!allowed || Object.keys(args).some(key => key !== 'operation' && !allowed.includes(key))) {
    throw new Error('Unexpected operation argument; paths, tokens and sending flags cannot be supplied by the model');
  }
  if (['distill_prepare', 'materials_prepare'].includes(args.operation) && (!Array.isArray(args.entries) || args.entries.length === 0)) {
    throw new Error(`${args.operation} requires explicit entries`);
  }
  if (args.operation === 'distill_apply' && (typeof args.batchId !== 'string' || !args.batchId.trim() || !Array.isArray(args.cards))) {
    throw new Error('distill_apply requires batchId and cards from the prepared batch');
  }
  if (args.operation === 'materials_inventory' && (!Array.isArray(args.roots) || args.roots.length === 0)) {
    throw new Error('materials_inventory requires explicit relative directory roots');
  }
  if (args.operation === 'materials_apply' && (typeof args.batchId !== 'string' || !args.batchId.trim() || !args.packet || typeof args.packet !== 'object' || Array.isArray(args.packet))) {
    throw new Error('materials_apply requires batchId and packet from the prepared materials batch');
  }
}

const sourceRefs = {
  type: 'array', required: true,
  items: {
    type: 'object', additionalProperties: false,
    properties: {
      sourceId: { type: 'string', required: true },
      startLine: { type: 'integer', required: true }, endLine: { type: 'integer', required: true },
    },
  },
};

/** Register the compatible tool and optional native panel. A fresh install never enables service. */
export function apply(ctx, config = {}) {
  if (typeof ctx.inject === 'function') {
    ctx.inject(['connection', 'workspaceRegistry', 'sessionController'], async scope => {
      // Cordis accepts void or a disposer, never the runtime object returned
      // by our public installation helper. Returning that object unloads the
      // just-registered HTTP routes as an "Invalid effect" failure.
      await mountNativeTwin(scope, config);
    });
  }
  ctx.tools.register(defineTool({
    name: 'agent_twin',
    description: 'Build a twin from the current work Agent in four steps: prepare scattered project materials; distill private source-backed knowledge/judgment/workflow/tool cards; verify a locally authorized Slack channel with read-only checks; set permissions and perform a forced dry run. init creates a new disabled .agent-twin directory without overwriting existing work. materials_inventory reads bounded metadata only in explicitly selected relative directory roots. materials_prepare reads only user-selected files; the Agent organizes them into a private source-backed packet for materials_apply, separating background, knowledge, decisions, workflows, cases, tools and bundles, plus gaps. Preparing materials is not distillation or proof of tool execution. materials_distill prepares a distillation batch from the current selected packet sources; the Agent must still extract and apply cards. Direct distill_prepare remains available for already prepared files. distill_apply separates documented facts from candidates with exact sourceRefs; distill_refresh reports source changes without rewriting cards. Before using distilled knowledge, call knowledge_read: it returns only current documented cards and excludes stale/candidate cards. This is private internal context, not a package to forward to a visitor; use only the caller-authorized scope and do not expose the whole private knowledge pack. channel_probe and channel_tick use only a local environment token and explicit local configuration; token values are never model arguments. channel_tick always uses dryRun:true and performs no sending or business actions, even when enabled:false. This tool does not start a scheduler or background bot. The optional native Web service is configured and explicitly enabled by the owner in its separate panel. Installation, saved materials, distilled knowledge, verified read-only channels and autonomous service are separate proof states.',
    parameters: {
      operation: {
        type: 'string', required: true, enum: Object.keys(inputsByOperation),
        description: 'Initialize; inventory/prepare/apply/inspect materials and prepare their distillation; prepare/apply/inspect/refresh cards; read current private knowledge; probe/inspect/dry-run Slack; or read the runbook.',
      },
      roots: {
        type: 'array', items: { type: 'string' },
        description: 'materials_inventory only: explicit relative directory roots inside the current project; "." means the current project. Bounded metadata only, without reading file contents or following symbolic links.',
      },
      entries: {
        type: 'array', items: { type: 'string' },
        description: 'materials_prepare or distill_prepare only: explicit user-selected relative .md/.txt files inside the current project. Never infer permission to read candidate files, credentials, private chats or other directories.',
      },
      batchId: { type: 'string', description: 'materials_apply or distill_apply only: exact batchId returned by the corresponding prepare operation.' },
      packet: {
        type: 'object', additionalProperties: false,
        description: 'materials_apply only: a private project material packet grounded in the prepared sources. Tool entries require toolStatus; other kinds must omit it. Summaries require sourceRefs; gaps record missing information rather than supported facts.',
        properties: {
          project: {
            type: 'object', required: true, additionalProperties: false,
            properties: {
              title: { type: 'string', required: true }, summary: { type: 'string', required: true }, sourceRefs,
            },
          },
          materials: {
            type: 'array', required: true,
            items: {
              type: 'object', additionalProperties: false,
              properties: {
                id: { type: 'string', required: true },
                kind: { type: 'string', required: true, enum: ['background', 'knowledge', 'decision', 'workflow', 'case', 'tool', 'bundle'] },
                title: { type: 'string', required: true }, summary: { type: 'string', required: true }, sourceRefs,
                selectedForDistillation: { type: 'boolean', required: true },
                toolStatus: { type: 'string', enum: ['available', 'needs_connection', 'needs_development'] },
              },
            },
          },
          gaps: {
            type: 'array', required: true,
            items: {
              type: 'object', additionalProperties: false,
              properties: { id: { type: 'string', required: true }, description: { type: 'string', required: true } },
            },
          },
        },
      },
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
            sourceRefs,
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
        case 'materials_inventory':
          requireReadPolicy(ctx, execution.agent, cwd);
          return inventoryMaterials(cwd, args.roots);
        case 'materials_prepare':
          requireWritePolicy(ctx, execution.agent, cwd);
          return prepareMaterials(cwd, args.entries);
        case 'materials_apply':
          requireWritePolicy(ctx, execution.agent, cwd);
          return applyMaterials(cwd, args.batchId, args.packet);
        case 'materials_status':
          requireReadPolicy(ctx, execution.agent, cwd);
          return inspectMaterials(cwd);
        case 'materials_distill':
          requireWritePolicy(ctx, execution.agent, cwd);
          return prepareDistillationFromMaterials(cwd);
        default: throw new Error('Unknown agent_twin operation');
      }
    },
  }));
}
