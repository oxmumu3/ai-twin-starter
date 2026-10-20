import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('native package declares the official client entry without replacing the old tool entry', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.exports['.'], './index.js');
  assert.equal(pkg.exports['./client'], './src/client.js');
  assert.equal(pkg.dsh.client.platform, 'web');
  for (const dependency of ['@deepseek-ai/dsh-client-ui-layout', '@deepseek-ai/dsh-client-ui-sidebar', '@deepseek-ai/dsh-client-ui-settings', '@deepseek-ai/dsh-client-ui-primitives']) assert.ok(pkg.dsh.client.inject.includes(dependency));
  assert.ok(pkg.files.includes('src/'));
  assert.ok(!pkg.files.includes('test/'));
});

test('Web panel mounting does not wait for a current conversation sandbox', async () => {
  const plugin = await import('../index.js');
  assert.deepEqual(plugin.inject, ['tools']);
});
