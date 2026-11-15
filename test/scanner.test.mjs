import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { detectProjectDelta, scanProjectDirectory } from '../lib/scanner.js';

async function makeTempProject() {
  const dir = await mkdtemp(join(tmpdir(), 'twin-scan-'));
  await mkdir(join(dir, 'docs'), { recursive: true });
  await mkdir(join(dir, 'certs'), { recursive: true });
  await mkdir(join(dir, 'scripts'), { recursive: true });

  await writeFile(join(dir, 'README.md'), '# 华东经营复盘项目\n\n核心口径说明：所有 GMV 与毛利报表均按 T+1 对账完成口径统计，自动剔除测试单。\n', 'utf8');
  await writeFile(join(dir, 'docs', 'metrics.md'), '# 指标计算边界\n\n环比波动分析仅输出城市汇总占比，严禁输出逐笔订单明细或用户手机号。\n', 'utf8');
  await writeFile(join(dir, '.env'), 'DATABASE_URL=postgres://prod-secret:pw@10.0.0.1/app\nSLACK_BOT_TOKEN=xoxb-secret-123\n', 'utf8');
  await writeFile(join(dir, '.env.production'), 'API_KEY=sk-topsecret999\n', 'utf8');
  await writeFile(join(dir, 'certs', 'server.pem'), '-----BEGIN PRIVATE KEY-----\nTOPSECRET\n-----END PRIVATE KEY-----\n', 'utf8');
  await writeFile(join(dir, 'scripts', 'deploy-migrate.sh'), '#!/bin/sh\necho "DROP TABLE users;"\n', 'utf8');
  await writeFile(join(dir, 'scripts', 'readonly-check.mjs'), 'console.log("ok");\n', 'utf8');
  return dir;
}

test('scanProjectDirectory isolates secrets/write-scripts and synthesizes causal draftProfile without paths', async t => {
  const dir = await makeTempProject();
  t.after(() => rm(dir, { recursive: true, force: true }));

  const res = await scanProjectDirectory(dir, { projectName: '华东复盘', ownerName: '张敏' });
  assert.ok(res.docCount >= 2, 'should scan markdown docs');
  assert.ok(res.blockedSecretCount >= 3, 'should quarantine .env, .env.production, server.pem');
  assert.ok(res.blockedWriteScriptCount >= 1, 'should quarantine deploy-migrate.sh');
  assert.ok(res.capabilities.length >= 1, 'should extract capabilities');
  assert.ok(res.draftProfile?.name, 'should synthesize step 4 profile name');
  assert.ok(res.draftProfile?.intro, 'should synthesize step 4 profile intro');

  const combinedSnippets = JSON.stringify(res.snippets);
  assert.equal(combinedSnippets.includes('prod-secret'), false, 'must never index .env secrets');
  assert.equal(combinedSnippets.includes('TOPSECRET'), false, 'must never index .pem keys');
  assert.equal(res.shortSummary.includes('/tmp/'), false, 'shortSummary must uphold Zero-Path Surface Rule');
});

test('detectProjectDelta operates at 0-token cost using mtimeMs+size fingerprints', async t => {
  const dir = await makeTempProject();
  t.after(() => rm(dir, { recursive: true, force: true }));

  const first = await scanProjectDirectory(dir, { projectName: '华东复盘' });
  const noChange = await detectProjectDelta(dir, { fingerprints: first.fingerprints });
  assert.equal(noChange.hasDelta, false);
  assert.equal(noChange.tokenCost, 0);

  const metricsPath = join(dir, 'docs', 'metrics.md');
  await writeFile(metricsPath, '# 指标计算边界\n\n新增一条口径：售后退款订单应在 48 小时窗口内回溯重算汇总比例。\n', 'utf8');
  const future = new Date(Date.now() + 2000);
  await utimes(metricsPath, future, future);

  const afterEdit = await detectProjectDelta(dir, { fingerprints: first.fingerprints });
  assert.equal(afterEdit.hasDelta, true);
  assert.equal(afterEdit.tokenCost, 0);
  assert.equal(afterEdit.modifiedDocs.length, 1);

  await writeFile(join(dir, 'docs', 'faq.md'), '# 常见答疑\n\n新增答疑文档。\n', 'utf8');
  const afterAdd = await detectProjectDelta(dir, { fingerprints: first.fingerprints });
  assert.equal(afterAdd.addedDocs.length, 1);
  assert.ok(afterAdd.deltaSpec?.badge?.includes('文档'), 'deltaSpec should report added doc cleanly');
  assert.ok(afterAdd.deltaSpec?.items?.some(it => it.title.includes('新增')));
});
