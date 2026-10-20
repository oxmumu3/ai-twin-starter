import assert from 'node:assert/strict';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const load = () => import('../src/native-config.mjs');
test('native state uses the host profile directory, never the working project', async () => {
  const { resolveNativeStateDirectory } = await load();
  const profile = join(process.cwd(), 'test-profile');
  assert.equal(resolveNativeStateDirectory({ baseUrl: pathToFileURL(profile + '/').href }), join(profile, 'data', 'agent-twin-native'));
  assert.throws(() => resolveNativeStateDirectory({ baseUrl: 'https://example.invalid/' }), /profile|directory/i);
  assert.throws(() => resolveNativeStateDirectory({}), /profile|directory/i);
});
test('native secrets are read only through the current config reference', async () => {
  const { readNativeSecret, resolveNativeStateDirectory } = await load();
  let value = 'synthetic-only-not-a-token';
  assert.equal(readNativeSecret({ slackBotToken: { get: () => value } }), value);
  value = '';
  assert.equal(readNativeSecret({ slackBotToken: { get: () => value } }), '');
  assert.equal(resolveNativeStateDirectory({}, { stateDirectory: { get: () => '/tmp/twin-private-test' } }), '/tmp/twin-private-test');
  assert.throws(() => resolveNativeStateDirectory({}, { stateDirectory: 'relative-state' }), /absolute|directory/i);
});
