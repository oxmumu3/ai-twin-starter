import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Context } from '@deepseek-ai/cordis';
import * as plugin from '../index.js';

test('index.js preserves agent_twin compatibility while mounting v0.5.0 workbench host and returning void from inject', async t => {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'twin-compat-')));
  const dshHome = join(root, 'dsh');
  const cwd = join(root, 'work');
  await mkdir(join(dshHome, 'profiles', 'desktop'), { recursive: true });
  await mkdir(cwd, { recursive: true });
  await writeFile(join(cwd, 'notes.md'), '# Note\nSafe read-only material.\n', 'utf8');

  const prevHome = process.env.DSH_HOME;
  process.env.DSH_HOME = dshHome;

  assert.equal(plugin.name, 'agent-twin-starter');
  assert.deepEqual(plugin.inject, ['tools']);
  assert.ok(plugin.Config);

  const tools = [];
  const routes = [];
  const ctx = new Context();
  ctx.baseUrl = `file://${join(dshHome, 'profiles', 'desktop')}/`;
  ctx.provide('tools', { register: tDef => tools.push(tDef) });
  ctx.provide('connection', {
    fetch: {
      register(spec) {
        routes.push(spec);
        return () => {
          const i = routes.indexOf(spec);
          if (i !== -1) routes.splice(i, 1);
        };
      }
    }
  });
  ctx.provide('workingDirectory', { get: () => cwd });
  ctx.provide('sandboxPolicy', { resolve: () => ({ mode: 'workspace-write', workspaceRoot: cwd }) });

  let fiber = null;
  t.after(async () => {
    await fiber?.dispose?.();
    await ctx.fiber.dispose();
    if (prevHome === undefined) delete process.env.DSH_HOME;
    else process.env.DSH_HOME = prevHome;
    await rm(root, { recursive: true, force: true });
  });

  fiber = ctx.plugin(plugin, { guestPort: 0 });
  await fiber;
  const children = [...ctx.registry.entries()]
    .flatMap(([, runtime]) => [...runtime.fibers])
    .filter(child => child.parent.fiber.uid === fiber.uid);
  for (const child of children) {
    await (typeof child.await === 'function' ? child.await() : child);
  }
  assert.ok(children.every(child => child.state === 2), 'child inject fiber must reach ACTIVE (state 2)');

  const legacyTool = tools.find(tDef => tDef.name === 'agent_twin');
  const deskTool = tools.find(tDef => tDef.name === 'twin_desk');
  assert.ok(legacyTool, 'legacy agent_twin tool must remain registered');
  assert.ok(deskTool, 'new twin_desk tool must be registered');
  assert.ok(routes.some(r => r.path === '/api/agent_twin/status'), 'v0.5.0 HTTP routes must remain registered (void inject return)');

  const execCtx = {
    signal: new AbortController().signal,
    agent: { session: 's1', ctx }
  };
  const inv = await legacyTool.execute({ operation: 'materials_inventory', roots: ['.'] }, execCtx);
  assert.ok(inv.entries.some(e => e.path === 'notes.md'));
  const status = await legacyTool.execute({ operation: 'status' }, execCtx);
  assert.equal(status.initialized, false);

  await fiber.dispose();
  assert.equal(routes.length, 0, 'disposing plugin fiber must remove HTTP routes');
});
