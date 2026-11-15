import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Context } from '@deepseek-ai/cordis';
import { mountTwinHost } from '../lib/host.js';
import { registerTwinDeskTool } from '../lib/tools.js';

function createMockConnection() {
  const routes = [];
  return {
    routes,
    fetch: {
      register(spec) {
        routes.push(spec);
        return () => {
          const idx = routes.indexOf(spec);
          if (idx !== -1) routes.splice(idx, 1);
        };
      }
    }
  };
}

async function callRoute(routes, path, method = 'GET', { headers = {}, body } = {}) {
  const entry = routes.find(r => r.path === path && r.methods.includes(method));
  assert.ok(entry, `Route ${method} ${path} must be registered`);
  const req = new Request(`http://127.0.0.1:3000${path}`, {
    method,
    headers,
    body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined
  });
  return entry.fetch(req);
}

test('Store 0600 secrets, non-destructive legacy import, HTTP security guards, twin_desk tool & clean dispose', async t => {
  const dshHome = await mkdtemp(join(tmpdir(), 'twin-host-'));
  const legacyDir = join(dshHome, 'profiles', 'desktop', 'data', 'agent-twin-native');
  const projDir = join(dshHome, 'demo-proj');
  await mkdir(legacyDir, { recursive: true });
  await mkdir(join(projDir, 'docs'), { recursive: true });
  await writeFile(join(projDir, 'docs', 'ops.md'), '# 对外排班与口径\n\n支持 7 天免装试用与汇总归因。\n', 'utf8');

  const legacyPath = join(legacyDir, 'state.json');
  const legacyState = {
    serviceEnabled: false,
    project: { title: '旧版工作区', projectId: 'legacy-ws', cwd: projDir },
    adoptedCards: [{ id: 'c1', title: '旧版口径卡', summary: '按 T+1 对账完成口径对齐' }],
    materials: [{ id: 'm1', title: '旧版说明' }]
  };
  const legacySnapshot = JSON.stringify({
    format: 1,
    state: legacyState,
    checksum: createHash('sha256').update(JSON.stringify(legacyState)).digest('hex')
  });
  await writeFile(legacyPath, legacySnapshot, 'utf8');

  const connection = createMockConnection();
  const ctx = new Context();
  ctx.baseUrl = `file://${join(dshHome, 'profiles', 'desktop')}/`;
  const tools = [];
  ctx.provide('tools', { register: tool => tools.push(tool) });
  ctx.provide('connection', connection);
  ctx.provide('workspaceRegistry', { list: () => [{ id: 'ws-1', name: '运营项目', rootPath: projDir }] });

  let hostRuntime = null;
  t.after(async () => {
    await hostRuntime?.dispose?.();
    await ctx.fiber.dispose();
    await rm(dshHome, { recursive: true, force: true });
  });

  hostRuntime = await mountTwinHost(ctx, { stateDirectory: join(dshHome, 'agent-twin'), guestPort: 0 }, {
    fetchImpl: async url => {
      if (String(url).includes('feishu.cn/open-apis/auth/v3/tenant_access_token')) {
        return new Response(JSON.stringify({ code: 0, tenant_access_token: 'tok-999' }), { status: 200 });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
  });
  registerTwinDeskTool(ctx, () => hostRuntime);

  // Verify non-destructive legacy import
  assert.equal(hostRuntime.store.getState().legacyImported, true);
  assert.equal(await readFile(legacyPath, 'utf8'), legacySnapshot, 'legacy state.json must remain untouched');

  // Security headers on /api/agent_twin/action
  const csrf = await callRoute(connection.routes, '/api/agent_twin/action', 'POST', {
    headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' },
    body: { action: 'set_duty_mode', dutyMode: 'live' }
  });
  assert.equal(csrf.status, 403);

  const badType = await callRoute(connection.routes, '/api/agent_twin/action', 'POST', {
    headers: { 'Content-Type': 'text/plain' },
    body: 'hello'
  });
  assert.equal(badType.status, 415);

  const oversized = await callRoute(connection.routes, '/api/agent_twin/action', 'POST', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'add_rule', text: 'x'.repeat(70000) })
  });
  assert.equal(oversized.status, 413);

  // Run full API workflow
  const exRes = await callRoute(connection.routes, '/api/agent_twin/action', 'POST', {
    headers: { 'Content-Type': 'application/json' },
    body: { action: 'start_extraction', candidateId: 'ws-1', autoComplete: true }
  });
  assert.equal(exRes.status, 200);
  const exJson = await exRes.json();
  assert.equal(exJson.ok, true);
  assert.ok(exJson.view.mountedProjects.length >= 1);

  await callRoute(connection.routes, '/api/agent_twin/action', 'POST', {
    headers: { 'Content-Type': 'application/json' },
    body: { action: 'configure_channel', channelId: 'ch-feishu', appId: 'cli_abc_xyz', appSecret: 'sec_very_private_987' }
  });

  // 0600 secrets & zero secret leak in /view
  const secStat = await stat(join(dshHome, 'agent-twin', 'secrets.json'));
  assert.equal(secStat.mode & 0o777, 0o600);
  const viewRes = await callRoute(connection.routes, '/api/agent_twin/view', 'GET');
  const viewText = await viewRes.text();
  assert.equal(viewText.includes('sec_very_private_987'), false, 'view API must NEVER return secret values');

  // Verify twin_desk tool schema & execution
  const deskTool = tools.find(tool => tool.name === 'twin_desk');
  assert.ok(deskTool);
  const statusOut = await deskTool.execute({ action: 'status' }, { signal: new AbortController().signal });
  assert.ok(statusOut.mountedProjects >= 1);
  const sandboxOut = await deskTool.execute({ action: 'sandbox_ask', question: '7天免装试用支持吗' }, { signal: new AbortController().signal });
  assert.equal(sandboxOut.action, 'replied');

  // Idempotent dispose removes routes & stops guest server cleanly
  await ctx.fiber.dispose();
  await hostRuntime.dispose();
  assert.equal(connection.routes.length, 0);
  assert.equal(hostRuntime.guestServer.getBaseUrl(), '');
});
