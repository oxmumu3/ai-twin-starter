import assert from 'node:assert/strict';
import { access, mkdtemp, readdir, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const entry = new URL('../index.js', import.meta.url);

async function plugin() {
  await assert.doesNotReject(access(entry), 'The DSH starter adapter must exist');
  return import(entry);
}

async function fixture(t, options = {}) {
  const cwd = await realpath(await mkdtemp(join(tmpdir(), 'ai-twin-plugin-')));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const registered = [];
  let current = cwd;
  let policy = { mode: 'workspace-write', workspaceRoot: cwd };
  const directory = { get: () => current };
  const sandboxPolicy = { resolve: request => {
    assert.equal(request.session.id, 'synthetic-session');
    return policy;
  } };
  const ctx = {
    tools: { register: definition => registered.push(definition) },
    get: key => ({ workingDirectory: directory, sandboxPolicy })[key],
  };
  const agent = {
    id: 'synthetic-session',
    session: { id: 'synthetic-session', header: { cwd: '/stale-header-must-not-be-used' } },
    ctx: { get: key => ({ workingDirectory: directory, sandboxPolicy })[key] },
  };
  const { apply } = await plugin();
  await apply(ctx);
  assert.equal(registered.length, 1);
  return {
    cwd, ctx, agent, tool: registered[0],
    setDirectory: value => { current = value; },
    setPolicy: value => { policy = value; },
    execute: (args, exec = {}) => registered[0].execute(args, {
      agent, signal: new AbortController().signal, callId: 'synthetic-call', ...exec,
    }),
    ...options,
  };
}

test('starter exposes the host adapter before claiming installation support', async () => {
  const adapter = await plugin();
  assert.equal(typeof adapter.apply, 'function');
});

test('mount registers one tool with no path argument and creates no workspace', async t => {
  const f = await fixture(t);
  assert.equal(f.tool.name, 'agent_twin');
  assert.deepEqual(Object.keys(f.tool.parameters.properties), ['operation']);
  assert.deepEqual(f.tool.parameters.properties.operation.enum, ['init', 'status', 'runbook']);
  assert.deepEqual(await readdir(f.cwd), []);
});

test('init and status use the current host directory and remain disabled', async t => {
  const f = await fixture(t);
  const initialized = await f.execute({ operation: 'init' });
  assert.equal(initialized.initialized, true);
  assert.equal(initialized.enabled, false);
  assert.equal(initialized.ready, false);
  assert.ok(initialized.created.length > 0);
  const status = await f.execute({ operation: 'status' });
  assert.equal(status.directory, join(f.cwd, '.agent-twin'));
  assert.equal(status.initialized, true);
  assert.equal(status.enabled, false);
  assert.deepEqual(status.runtime, {
    connectorRegistered: false, schedulerRegistered: false, backgroundRunning: false,
  });
});

test('an existing starter is refused instead of overwritten', async t => {
  const f = await fixture(t);
  await f.execute({ operation: 'init' });
  await assert.rejects(f.execute({ operation: 'init' }), /exist|already|存在|覆盖/i);
});

test('runbook is available without claiming a background runtime', async t => {
  const f = await fixture(t);
  const result = await f.execute({ operation: 'runbook' });
  assert.equal(typeof result.text, 'string');
  assert.ok(result.text.length > 50);
  assert.deepEqual(await readdir(f.cwd), []);
});

test('no current agent or working directory fails without using the header', async t => {
  const f = await fixture(t);
  await assert.rejects(f.execute({ operation: 'init' }, { agent: undefined }), /session|agent|会话/i);
  f.agent.ctx.get = () => undefined;
  f.ctx.get = () => undefined;
  await assert.rejects(f.execute({ operation: 'init' }), /directory|目录/i);
  assert.deepEqual(await readdir(f.cwd), []);
});

test('a relative or missing projected directory is rejected', async t => {
  const f = await fixture(t);
  f.setDirectory('relative-project');
  await assert.rejects(f.execute({ operation: 'init' }), /absolute|directory|目录/i);
  f.setDirectory(undefined);
  await assert.rejects(f.execute({ operation: 'init' }), /absolute|directory|目录/i);
  assert.deepEqual(await readdir(f.cwd), []);
});

test('each call follows the committed current directory instead of a cached path', async t => {
  const f = await fixture(t);
  const next = await realpath(await mkdtemp(join(tmpdir(), 'ai-twin-moved-')));
  t.after(() => rm(next, { recursive: true, force: true }));
  f.setDirectory(next);
  f.setPolicy({ mode: 'workspace-write', workspaceRoot: next });
  const result = await f.execute({ operation: 'init' });
  assert.equal(result.directory, join(next, '.agent-twin'));
  assert.deepEqual(await readdir(f.cwd), []);
});

test('unknown operations and model-supplied paths cannot reach file writes', async t => {
  const f = await fixture(t);
  await assert.rejects(f.execute({ operation: 'start' }), /operation|enum|invalid|parameter/i);
  await assert.rejects(f.execute({ operation: 'init', cwd: '/tmp/foreign-project' }), /argument|parameter|cwd|field|operation/i);
  assert.deepEqual(await readdir(f.cwd), []);
});

test('an aborted tool call does not initialize files', async t => {
  const f = await fixture(t);
  const controller = new AbortController();
  controller.abort(new Error('synthetic cancellation'));
  await assert.rejects(f.execute({ operation: 'init' }, { signal: controller.signal }), /synthetic cancellation/);
  assert.deepEqual(await readdir(f.cwd), []);
});

test('init respects read-only and rejects missing or unknown sandbox policies', async t => {
  const f = await fixture(t);
  for (const policy of [{ mode: 'read-only', workspaceRoot: f.cwd }, undefined, { mode: 'unknown', workspaceRoot: f.cwd }]) {
    f.setPolicy(policy);
    await assert.rejects(f.execute({ operation: 'init' }), /policy|read-only|sandbox|策略|只读/i);
  }
  assert.deepEqual(await readdir(f.cwd), []);
  f.ctx.get = key => key === 'workingDirectory' ? { get: () => f.cwd } : undefined;
  f.agent.ctx.get = f.ctx.get;
  await assert.rejects(f.execute({ operation: 'init' }), /policy|sandbox|策略/i);
});

test('read operations remain available in read-only mode without changing files', async t => {
  const f = await fixture(t);
  f.setPolicy({ mode: 'read-only', workspaceRoot: f.cwd });
  const result = await f.execute({ operation: 'status' });
  assert.equal(result.initialized, false);
  const guide = await f.execute({ operation: 'runbook' });
  assert.ok(guide.text.length > 50);
  assert.deepEqual(await readdir(f.cwd), []);
});

test('workspace-write rejects current directories outside the policy root', async t => {
  const f = await fixture(t);
  f.setPolicy({ mode: 'workspace-write', workspaceRoot: join(f.cwd, 'foreign-root') });
  await assert.rejects(f.execute({ operation: 'init' }), /workspace|root|outside|sandbox|目录|范围/i);
  assert.deepEqual(await readdir(f.cwd), []);
  f.setPolicy({ mode: 'workspace-write' });
  await assert.rejects(f.execute({ operation: 'init' }), /workspace|root|policy|sandbox|目录|策略/i);
});

test('danger-full-access still writes only to the current host project', async t => {
  const f = await fixture(t);
  f.setPolicy({ mode: 'danger-full-access', workspaceRoot: '/unrelated-root' });
  const result = await f.execute({ operation: 'init' });
  assert.equal(result.directory, join(f.cwd, '.agent-twin'));
});
