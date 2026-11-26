/**
 * Verify compiled `client.js` satisfies DSH Electron loader, typography (`rem` only),
 * emoji-free editorial copy, and zero-primitives requirements.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const clientPath = path.resolve(__dirname, '..', 'client.js');
assert.ok(fs.existsSync(clientPath), 'client.js must exist (run npm run build first)');

const code = fs.readFileSync(clientPath, 'utf8');
assert.equal(/^\s*export\s+/m.test(code), false, 'client.js must contain zero top-level ESM export statements');
assert.equal(code.includes('@deepseek-ai/dsh-client-ui-primitives'), false, 'client.js must not import @deepseek-ai/dsh-client-ui-primitives');
assert.equal(/font-size:\s*\d+(?:\.\d+)?px/i.test(code), false, 'client.js CSS must use rem/clamp typography instead of px');
assert.equal(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(code), false, 'client.js must contain zero emoji characters');

let registeredModule = null;
const sandbox = {
  window: {
    __ModuleLoader__: {
      load(entry) {
        registeredModule = entry;
      }
    }
  },
  console,
  setTimeout,
  clearTimeout
};

vm.runInNewContext(code, sandbox, { filename: 'client.js' });
assert.ok(registeredModule && typeof registeredModule.factory === 'function', 'client.js must call window.__ModuleLoader__.load');

const exported = registeredModule.factory(name => {
  if (name === 'react') return require('react');
  throw new Error(`Unexpected runtime require: ${name}`);
});

assert.deepEqual(Array.from(exported.inject || []), ['slots'], 'client module must export inject: ["slots"]');
assert.equal(typeof exported.apply, 'function', 'client module must export apply(ctx)');

console.log('check:client PASSED');
