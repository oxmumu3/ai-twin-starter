import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, readdir, symlink, lstat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const moduleURL = new URL('../src/workspace.mjs', import.meta.url);

async function api() {
  const file = await lstat(fileURLToPath(moduleURL)).catch(() => null);
  assert.ok(file?.isFile(), 'workspace API has not been implemented');
  return import(moduleURL.href);
}

async function fixture(t) {
  // macOS /var is a symlink; use its canonical location so tests do not
  // accidentally request an unsafe workspace path.
  const { realpath } = await import('node:fs/promises');
  const root = await mkdtemp(join(await realpath(tmpdir()), 'agent-twin-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const cwd = join(root, 'workspace');
  await mkdir(cwd);
  return { root, cwd, directory: join(cwd, '.agent-twin') };
}

test('initialization creates only a new private directory and preserves existing work', async (t) => {
  const { initWorkspace } = await api();
  const { cwd, directory } = await fixture(t);
  await writeFile(join(cwd, 'AGENTS.md'), 'Existing author instructions\n');
  await writeFile(join(cwd, 'private-context.md'), 'Do not import this material\n');
  const result = await initWorkspace(cwd);
  assert.equal(result.initialized, true);
  assert.equal(result.directory, directory);
  assert.equal(result.enabled, false);
  assert.deepEqual((await readdir(cwd)).sort(), ['.agent-twin', 'AGENTS.md', 'private-context.md']);
  assert.equal(await readFile(join(cwd, 'AGENTS.md'), 'utf8'), 'Existing author instructions\n');
  assert.equal(await readFile(join(cwd, 'private-context.md'), 'utf8'), 'Do not import this material\n');
  assert.equal((await lstat(directory)).mode & 0o077, 0);
});

test('initialization refuses an existing destination without changing it', async (t) => {
  const { initWorkspace } = await api();
  const { cwd, directory } = await fixture(t);
  await mkdir(directory);
  await writeFile(join(directory, 'config.json'), 'sentinel');
  await assert.rejects(initWorkspace(cwd), /exist/i);
  assert.equal(await readFile(join(directory, 'config.json'), 'utf8'), 'sentinel');
  assert.deepEqual(await readdir(directory), ['config.json']);
});

test('initialization requires an existing directory', async (t) => {
  const { initWorkspace } = await api();
  const { root } = await fixture(t);
  const missing = join(root, 'not-created');
  await assert.rejects(initWorkspace(missing), /exist|ENOENT/i);
  await assert.rejects(lstat(missing), { code: 'ENOENT' });
  const file = join(root, 'file');
  await writeFile(file, 'sentinel');
  await assert.rejects(initWorkspace(file), /directory/i);
  assert.equal(await readFile(file, 'utf8'), 'sentinel');
});

test('workspace API rejects empty and non-path inputs', async () => {
  const { initWorkspace, inspectWorkspace, readRunbook } = await api();
  for (const operation of [initWorkspace, inspectWorkspace, readRunbook]) {
    for (const input of ['', '   ', null, 22, 'x\u0000y']) {
      await assert.rejects(operation(input), /path|directory|cwd/i);
    }
  }
});

test('initialization rejects a symlink workspace or ancestor', async (t) => {
  const { initWorkspace } = await api();
  const { root, cwd } = await fixture(t);
  const alias = join(root, 'alias');
  await symlink(cwd, alias, 'dir');
  await assert.rejects(initWorkspace(alias), /symlink/i);
  const child = join(cwd, 'child');
  await mkdir(child);
  await assert.rejects(initWorkspace(join(alias, 'child')), /symlink/i);
  assert.deepEqual(await readdir(child), []);
});

test('initialization rejects a symlink destination without touching its target', async (t) => {
  const { initWorkspace } = await api();
  const { root, cwd, directory } = await fixture(t);
  const external = join(root, 'external');
  await mkdir(external);
  await writeFile(join(external, 'sentinel'), 'unchanged');
  await symlink(external, directory, 'dir');
  await assert.rejects(initWorkspace(cwd), /symlink|exist/i);
  assert.deepEqual(await readdir(external), ['sentinel']);
  assert.equal(await readFile(join(external, 'sentinel'), 'utf8'), 'unchanged');
});

test('concurrent initializers cannot overwrite each other', async (t) => {
  const { initWorkspace } = await api();
  const { cwd, directory } = await fixture(t);
  const results = await Promise.allSettled([initWorkspace(cwd), initWorkspace(cwd)]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter((result) => result.status === 'rejected').length, 1);
  assert.equal(JSON.parse(await readFile(join(directory, 'config.json'), 'utf8')).enabled, false);
});

test('status on an uninitialized directory is read-only and explains the gap', async (t) => {
  const { inspectWorkspace } = await api();
  const { cwd } = await fixture(t);
  const result = await inspectWorkspace(cwd);
  assert.equal(result.initialized, false);
  assert.equal(result.ready, false);
  assert.ok(result.gaps.some((gap) => gap.code === 'not_initialized'));
  assert.deepEqual(await readdir(cwd), []);
});

test('defaults remain disabled with no grants, requests, or delivery claims', async (t) => {
  const { initWorkspace, inspectWorkspace } = await api();
  const { cwd, directory } = await fixture(t);
  await initWorkspace(cwd);
  const config = JSON.parse(await readFile(join(directory, 'config.json'), 'utf8'));
  const policy = JSON.parse(await readFile(join(directory, 'policy.json'), 'utf8'));
  const state = JSON.parse(await readFile(join(directory, 'state.json'), 'utf8'));
  assert.equal(config.enabled, false);
  assert.equal(config.ownerId, '');
  assert.deepEqual(config.allowedChannelIds, []);
  assert.deepEqual(config.contextEntrypoints, []);
  assert.deepEqual(policy.grants, []);
  assert.deepEqual(state.requests, []);
  const status = await inspectWorkspace(cwd);
  assert.equal(status.ready, false);
  const gaps = new Set(status.gaps.map((gap) => gap.code));
  for (const code of ['disabled', 'owner_id', 'allowed_channels', 'context_entrypoints', 'grants', 'connector', 'scheduler']) {
    assert.ok(gaps.has(code), `missing configuration gap ${code}`);
  }
  assert.equal(status.runtime.backgroundRunning, false);
});

test('status does not claim a configured template is a working service', async (t) => {
  const { initWorkspace, inspectWorkspace } = await api();
  const { cwd, directory } = await fixture(t);
  await initWorkspace(cwd);
  const configPath = join(directory, 'config.json');
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  Object.assign(config, { enabled: true, ownerId: 'UOWNER', allowedChannelIds: ['CDEMO'], contextEntrypoints: ['project-context.md'] });
  await writeFile(configPath, JSON.stringify(config));
  const policyPath = join(directory, 'policy.json');
  const policy = JSON.parse(await readFile(policyPath, 'utf8'));
  policy.grants = [{ senderId: 'UTEAM', role: 'reader', scope: 'project', actions: ['read'], destinationIds: ['CDEMO'] }];
  await writeFile(policyPath, JSON.stringify(policy));
  const status = await inspectWorkspace(cwd);
  assert.equal(status.enabled, true);
  assert.equal(status.ready, false);
  assert.ok(status.gaps.some((gap) => gap.code === 'connector'));
  assert.ok(status.gaps.some((gap) => gap.code === 'scheduler'));
  assert.equal(status.runtime.backgroundRunning, false);
});

test('status rejects destination and configuration symlinks', async (t) => {
  const { initWorkspace, inspectWorkspace } = await api();
  const { root, cwd, directory } = await fixture(t);
  await initWorkspace(cwd);
  const external = join(root, 'external.json');
  await writeFile(external, '{"enabled":true,"ownerId":"secret"}');
  await rm(join(directory, 'config.json'));
  await symlink(external, join(directory, 'config.json'));
  await assert.rejects(inspectWorkspace(cwd), /symlink/i);
  assert.equal(await readFile(external, 'utf8'), '{"enabled":true,"ownerId":"secret"}');
  const { cwd: other, directory: otherDirectory } = await fixture(t);
  await symlink(directory, otherDirectory, 'dir');
  await assert.rejects(inspectWorkspace(other), /symlink/i);
});

test('status reports invalid or missing configuration without repairing it', async (t) => {
  const { initWorkspace, inspectWorkspace } = await api();
  const { cwd, directory } = await fixture(t);
  await initWorkspace(cwd);
  await writeFile(join(directory, 'config.json'), '{broken');
  await rm(join(directory, 'policy.json'));
  const before = (await readdir(directory)).sort();
  const status = await inspectWorkspace(cwd);
  assert.equal(status.ready, false);
  assert.ok(status.gaps.some((gap) => gap.code === 'config_invalid'));
  assert.ok(status.gaps.some((gap) => gap.code === 'policy_missing'));
  assert.equal(await readFile(join(directory, 'config.json'), 'utf8'), '{broken');
  assert.deepEqual((await readdir(directory)).sort(), before);
});

test('runbook comes from the package without importing workspace content', async (t) => {
  const { readRunbook } = await api();
  const { cwd } = await fixture(t);
  await writeFile(join(cwd, 'RUNBOOK.md'), 'PRIVATE WORKSPACE SENTINEL');
  const runbook = await readRunbook(cwd);
  assert.equal(typeof runbook, 'string');
  assert.ok(runbook.length > 100);
  assert.ok(!runbook.includes('PRIVATE WORKSPACE SENTINEL'));
  assert.deepEqual(await readdir(cwd), ['RUNBOOK.md']);
});

async function cli(args, cwd) {
  const path = fileURLToPath(new URL('../bin/agent-twin.mjs', import.meta.url));
  assert.ok((await lstat(path).catch(() => null))?.isFile(), 'CLI has not been implemented');
  return spawnSync(process.execPath, [path, ...args], { cwd, encoding: 'utf8' });
}

test('CLI initializes the explicit workspace and prints honest status', async (t) => {
  const { root, cwd } = await fixture(t);
  const init = await cli(['init', '--cwd', cwd], root);
  assert.equal(init.status, 0, init.stderr);
  assert.equal(JSON.parse(init.stdout).initialized, true);
  const status = await cli(['status', '--cwd', cwd], root);
  assert.equal(status.status, 0, status.stderr);
  assert.equal(JSON.parse(status.stdout).enabled, false);
  assert.equal(JSON.parse(status.stdout).runtime.backgroundRunning, false);
  const duplicate = await cli(['init', '--cwd', cwd], root);
  assert.notEqual(duplicate.status, 0);
  assert.match(duplicate.stderr, /exist/i);
});

test('CLI defaults to its working directory and runbook remains read-only', async (t) => {
  const { cwd } = await fixture(t);
  const status = await cli(['status'], cwd);
  assert.equal(status.status, 0, status.stderr);
  assert.equal(JSON.parse(status.stdout).initialized, false);
  const runbook = await cli(['runbook'], cwd);
  assert.equal(runbook.status, 0, runbook.stderr);
  assert.ok(runbook.stdout.length > 100);
  assert.deepEqual(await readdir(cwd), []);
});

test('CLI rejects ambiguous arguments before performing any writes', async (t) => {
  const { cwd } = await fixture(t);
  for (const args of [[], ['unknown'], ['init', '--cwd'], ['init', '--cwd', cwd, '--cwd', cwd], ['init', '--cwd', cwd, 'extra']]) {
    const result = await cli(args, cwd);
    assert.notEqual(result.status, 0, JSON.stringify(args));
    assert.ok(result.stderr.length > 0);
    assert.deepEqual(await readdir(cwd), []);
  }
});
