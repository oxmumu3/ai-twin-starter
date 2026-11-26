import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Context } from '@deepseek-ai/cordis';
import { mountTwinHost } from '../lib/host.js';
import { registerTwinTools } from '../lib/tools.js';

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

test('Store 0600 secrets, non-destructive legacy import, HTTP security guards, 4 atomic tools & clean dispose', async t => {
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
  registerTwinTools(ctx, () => hostRuntime);

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

  // Verify the 4 atomic tools (twin_status, twin_publish_workspace, twin_grant_access, twin_inbox)
  const statusTool = tools.find(tool => tool.name === 'twin_status');
  const publishTool = tools.find(tool => tool.name === 'twin_publish_workspace');
  const grantTool = tools.find(tool => tool.name === 'twin_grant_access');
  const inboxTool = tools.find(tool => tool.name === 'twin_inbox');
  assert.ok(statusTool && publishTool && grantTool && inboxTool);

  const statusOut = await statusTool.execute({ askSelfTest: '7天免装试用支持吗' }, { signal: new AbortController().signal });
  assert.equal(statusOut.kind, 'twin_status');
  assert.ok(statusOut.mountedProjects.length >= 1);
  assert.equal(statusOut.selfTestResult.action, 'replied');

  const grantOut = await grantTool.execute({ name: '陈工', role: '数据同事', channel: 'ch-web', mode: 'confirm', days: 7 }, { signal: new AbortController().signal });
  assert.equal(grantOut.kind, 'twin_grant_access');
  assert.ok(grantOut.guestUrl.includes('/g/'));

  await callRoute(connection.routes, '/api/agent_twin/action', 'POST', {
    headers: { 'Content-Type': 'application/json' },
    body: { action: 'simulate_inbound', personId: grantOut.person.id, question: '请说明 7 天免装试用规则' }
  });
  const inboxList = await inboxTool.execute({ action: 'list' }, { signal: new AbortController().signal });
  assert.equal(inboxList.approvals.length, 1);
  const resolved = await inboxTool.execute({
    action: 'approve',
    approvalId: inboxList.approvals[0].id,
    saveAsRule: true,
    ruleText: '7天免装试用支持直接回答'
  }, { signal: new AbortController().signal });
  assert.equal(resolved.resolved.action, 'approved');
  assert.equal(resolved.approvals.length, 0);

  // Idempotent dispose removes routes & stops guest server cleanly
  await ctx.fiber.dispose();
  await hostRuntime.dispose();
  assert.equal(connection.routes.length, 0);
  assert.equal(hostRuntime.guestServer.getBaseUrl(), '');
});

test('Workspace candidate prioritization, update_person, update_person_note, simulate_inbound, and empty legacy pruning', async t => {
  const dshHome = await mkdtemp(join(tmpdir(), 'twin-ws-sort-'));
  const realProj = join(dshHome, 'Agent');
  const tempProj = join(dshHome, 'dsh-s2-test-workspace.AbCd1234');
  await mkdir(join(realProj, 'docs'), { recursive: true });
  await mkdir(tempProj, { recursive: true });
  await writeFile(join(realProj, 'docs', 'readme.md'), '# 真实业务项目\n\n标准净值按完成时间统计。\n', 'utf8');

  // Seed empty 0-doc legacy project entry in state.json to verify init() pruning
  const stateDir = join(dshHome, 'agent-twin');
  await mkdir(stateDir, { recursive: true });
  await writeFile(join(stateDir, 'state.json'), JSON.stringify({
    format: 2,
    revision: 1,
    lifecycleStage: 'cold',
    scene: 'onboard',
    mountedProjects: [{ id: 'legacy-empty', projectName: 'project', docCount: 0, fileCount: 0, fromLegacy: true }],
    capabilities: [],
    people: [],
    approvals: [],
    deliveries: []
  }), 'utf8');

  const connection = createMockConnection();
  const ctx = new Context();
  ctx.baseUrl = `file://${join(dshHome, 'profiles', 'desktop')}/`;
  ctx.provide('tools', { register: () => {} });
  ctx.provide('connection', connection);
  ctx.provide('workspaceRegistry', {
    list: () => [
      { id: 'ws-temp', name: 'dsh-s2-test-workspace.AbCd1234', rootPath: tempProj },
      { id: 'ws-real', name: 'Agent', rootPath: realProj }
    ]
  });

  let hostRuntime = null;
  t.after(async () => {
    await hostRuntime?.dispose?.();
    await ctx.fiber.dispose();
    await rm(dshHome, { recursive: true, force: true });
  });

  hostRuntime = await mountTwinHost(ctx, { stateDirectory: stateDir, guestPort: 0 });

  // Empty 0-doc legacy fixture must have been pruned on init()
  assert.equal(hostRuntime.store.getState().mountedProjects.length, 0);

  // /view prioritizes real workspace ahead of test workspace and provides scanSummary + scope
  const viewRes = await callRoute(connection.routes, '/api/agent_twin/view', 'GET');
  const viewJson = await viewRes.json();
  assert.equal(viewJson.projects[0].name, 'Agent');
  assert.equal(viewJson.projects[0].docCount, 1);
  assert.ok(Array.isArray(viewJson.projects[0].scope) && viewJson.projects[0].scope.length === 3);
  assert.equal(viewJson.projects[1].isTempWorkspace, true);

  // Interactive 4-step extraction -> fast_forward_extraction -> complete_extraction
  const stRes = await callRoute(connection.routes, '/api/agent_twin/action', 'POST', {
    headers: { 'Content-Type': 'application/json' },
    body: { action: 'start_extraction', candidateId: 'ws-real', autoComplete: false }
  });
  const stJson = await stRes.json();
  assert.equal(stJson.view.extractionJob.step, 1);

  const ffRes = await callRoute(connection.routes, '/api/agent_twin/action', 'POST', {
    headers: { 'Content-Type': 'application/json' },
    body: { action: 'fast_forward_extraction' }
  });
  assert.equal((await ffRes.json()).view.extractionJob.status, 'ready');

  await callRoute(connection.routes, '/api/agent_twin/action', 'POST', {
    headers: { 'Content-Type': 'application/json' },
    body: { action: 'complete_extraction', scene: 'desk' }
  });

  // Add person -> update_person -> update_person_note -> simulate_inbound
  const addRes = await callRoute(connection.routes, '/api/agent_twin/action', 'POST', {
    headers: { 'Content-Type': 'application/json' },
    body: { action: 'add_person', name: '林总', role: '客户代表', channel: '免装试用网页', mode: 'confirm', digest: false }
  });
  const personId = (await addRes.json()).result.person.id;

  const updRes = await callRoute(connection.routes, '/api/agent_twin/action', 'POST', {
    headers: { 'Content-Type': 'application/json' },
    body: { action: 'update_person', personId, name: '林总监', mode: 'summary', digest: true }
  });
  assert.equal((await updRes.json()).result.person.name, '林总监');

  const noteRes = await callRoute(connection.routes, '/api/agent_twin/action', 'POST', {
    headers: { 'Content-Type': 'application/json' },
    body: { action: 'update_person_note', personId, note: '仅发汇总口径' }
  });
  assert.equal((await noteRes.json()).view.people[0].note, '仅发汇总口径');

  const simRes = await callRoute(connection.routes, '/api/agent_twin/action', 'POST', {
    headers: { 'Content-Type': 'application/json' },
    body: { action: 'simulate_inbound', personId, question: '请说明标准净值统计口径' }
  });
  const simJson = await simRes.json();
  assert.equal(simJson.result.action, 'pending_approval');
  assert.equal(simJson.view.approvals.length, 1);
});
