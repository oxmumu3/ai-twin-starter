import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Context } from '@deepseek-ai/cordis';
import * as plugin from '../index.js';

test('index.js registers 4 atomic tools (<5000B schema), exposes agentTwin service, checks locale parity, and disposes cleanly', async t => {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'twin-compat-')));
  const dshHome = join(root, 'dsh');
  const cwd = join(root, 'work');
  await mkdir(join(dshHome, 'profiles', 'desktop'), { recursive: true });
  await mkdir(cwd, { recursive: true });
  await writeFile(join(cwd, 'notes.md'), '# ROI 口径\n\nD7 净回本口径以退款扣除后的净营收计算。\n', 'utf8');

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

  assert.equal(tools.find(tDef => tDef.name === 'agent_twin'), undefined, 'monolith agent_twin tool must be retired');
  const names = tools.map(tDef => tDef.name).sort();
  assert.deepEqual(names, ['twin_grant_access', 'twin_inbox', 'twin_publish_workspace', 'twin_status']);

  const schemaJson = JSON.stringify(tools.map(tDef => ({
    name: tDef.name,
    description: tDef.description,
    parameters: tDef.parameters
  })));
  assert.equal(schemaJson.includes('"required":false'), false, 'never emit required:false');
  assert.ok(Buffer.byteLength(schemaJson, 'utf8') < 5000, '4 atomic tool schemas must fit < 5000 bytes');
  assert.ok(routes.some(r => r.path === '/api/agent_twin/status'), 'HTTP routes must remain registered');

  // Verify exposed ctx.get('agentTwin') service & external semantic knowledge provider hook
  const twinService = ctx.get('agentTwin');
  assert.ok(twinService, 'agentTwin Cordis service must be provided and set');
  assert.equal(twinService.version, '0.6.3');
  assert.equal(twinService.features.toolViews, true);
  assert.equal(twinService.features.streamingProgress, true);
  assert.equal(twinService.features.scopePathIsolation, true);
  assert.equal(twinService.features.semanticGraph, true);
  assert.equal(twinService.features.mobileOwnerApproval, true);
  assert.equal(twinService.features.publicTryLobby, true);

  const unregister = twinService.registerKnowledgeProvider({
    name: 'semantic-graph-test',
    async query(question) {
      if (question.includes('指标图谱')) {
        return [{ title: '语义口径卡', summary: '指标节点先验证真实文件再答复。' }];
      }
      return [];
    }
  });

  const publishTool = tools.find(tDef => tDef.name === 'twin_publish_workspace');
  const pubOut = await publishTool.execute(
    { path: cwd, brief: '保持只读核对' },
    { signal: new AbortController().signal, agent: { session: 's1', ctx } }
  );
  assert.equal(pubOut.kind, 'twin_publish_workspace');
  assert.ok(pubOut.capabilities.length >= 1);

  const granted = await twinService.grantAccess({ name: '图谱测试员', mode: 'direct' });
  const res = await twinService.queryScopedTwin({
    personId: granted.person.id,
    question: '请说明指标图谱口径',
    sandboxOnly: true
  });
  assert.equal(res.action, 'replied');
  assert.ok(res.reply.includes('指标节点先验证真实文件再答复'));
  unregister();

  // Verify locale/zh.json and locale/en.json key parity
  const zh = JSON.parse(await readFile(new URL('../locale/zh.json', import.meta.url), 'utf8'));
  const en = JSON.parse(await readFile(new URL('../locale/en.json', import.meta.url), 'utf8'));
  assert.deepEqual(Object.keys(zh).sort(), Object.keys(en).sort());
  assert.deepEqual(Object.keys(zh.meta).sort(), Object.keys(en.meta).sort());
  assert.deepEqual(Object.keys(zh.tools).sort(), Object.keys(en.tools).sort());

  await fiber.dispose();
  assert.equal(routes.length, 0, 'disposing plugin fiber must remove HTTP routes');
  assert.equal(ctx.get('agentTwin', false), undefined, 'disposing plugin fiber must clear agentTwin service');
});
