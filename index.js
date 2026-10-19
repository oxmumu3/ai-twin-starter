import { isAbsolute, relative, resolve, sep } from 'node:path';
import { defineTool } from '@deepseek-ai/dsh-tools';
import { initWorkspace, inspectWorkspace, readRunbook } from './src/workspace.mjs';

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

function requireInitializationPolicy(ctx, agent, cwd) {
  const service = agent.ctx?.get?.('sandboxPolicy') ?? ctx.get?.('sandboxPolicy');
  const policy = typeof service?.resolve === 'function' ? service.resolve({ session: agent.session }) : undefined;
  if (!policy || !['workspace-write', 'danger-full-access'].includes(policy.mode)) {
    throw new Error('Initialization requires a writable sandbox policy; read-only, missing or unknown policies are refused');
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

/** Register an initializer; mounting it never initializes files or starts a bot. */
export function apply(ctx) {
  ctx.tools.register(defineTool({
    name: 'agent_twin',
    description: 'Initialize or inspect a local AI twin starter in the current host working directory. Use init only when the user requests setup: it creates a new .agent-twin directory and refuses to overwrite one. status reports setup gaps; runbook reads the bundled setup guide. This starter uses your existing work Agent and context. It does not connect a channel, copy private context, send messages, register schedules, or run in the background. First configure your own owner, channel authorization and permissions, then complete a dry run before separately enabling a runtime.',
    parameters: {
      operation: {
        type: 'string', required: true, enum: ['init', 'status', 'runbook'],
        description: 'init creates a disabled starter; status checks setup; runbook returns the setup guide.',
      },
    },
    output: {
      schema: { type: 'object', additionalProperties: true },
      render: (_args, value) => [{ type: 'text', text: value.text ?? JSON.stringify(value) }],
    },
    async execute(args, execution) {
      if (Object.keys(args).some(key => key !== 'operation')) {
        throw new Error('Only the operation argument is accepted; cwd comes from the host');
      }
      execution.signal.throwIfAborted();
      const cwd = currentDirectory(ctx, execution.agent);
      switch (args.operation) {
        case 'init':
          requireInitializationPolicy(ctx, execution.agent, cwd);
          return initWorkspace(cwd);
        case 'status': return inspectWorkspace(cwd);
        case 'runbook': return { operation: 'runbook', text: await readRunbook(cwd) };
        default: throw new Error('Unknown agent_twin operation');
      }
    },
  }));
}
