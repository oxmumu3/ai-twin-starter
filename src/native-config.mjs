import z from '@deepseek-ai/schemastery';
import { isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const Config = z.object({
  stateDirectory: z.string().default('').description('分身私有状态目录；留空使用当前 Harness profile 的 data 目录。'),
  slackBotToken: z.string().default('').role('secret').description('Slack Bot Token；仅在原生设置维护，不写入项目资料或对话。').volatile(),
});

function value(config, key) {
  const ref = config?.[key];
  return ref && typeof ref.get === 'function' ? ref.get() : ref;
}

export function readNativeSecret(config) {
  const token = value(config, 'slackBotToken') ?? '';
  if (typeof token !== 'string' || token.length > 16384) throw new Error('Native channel credentials are invalid; update the native plugin settings.');
  return token;
}

export function resolveNativeStateDirectory(ctx, config = {}) {
  const explicit = value(config, 'stateDirectory');
  if (explicit) {
    if (typeof explicit !== 'string' || !isAbsolute(explicit)) throw new Error('Native state directory must be absolute.');
    return resolve(explicit);
  }
  let base;
  try {
    const url = new URL(ctx?.baseUrl);
    if (url.protocol !== 'file:') throw new Error();
    base = fileURLToPath(url);
  } catch { throw new Error('The host must provide a local profile directory or an explicit native state directory.'); }
  return join(base, 'data', 'agent-twin-native');
}
