import { mountTwinHost } from './lib/host.js';
import { createTwinService } from './lib/service.js';
import { registerTwinTools } from './lib/tools.js';
import { resolveTwinPaths } from './lib/store.js';

export { Config } from './src/native-config.mjs';
export { mountNativeTwin } from './src/native-plugin.mjs';
export { mountTwinHost } from './lib/host.js';
export { createTwinService } from './lib/service.js';

export const name = 'agent-twin-starter';
export const inject = ['tools'];

/** Register the 4 atomic AI 分身 tools, `agentTwin` service, and workbench host. */
export function apply(ctx, config = {}) {
  let activeRuntime = null;
  if (typeof ctx.provide === 'function') {
    ctx.provide('agentTwin');
  }

  if (typeof ctx.inject === 'function') {
    ctx.inject(['connection'], async scope => {
      // Cordis accepts void or a disposer, never a runtime object.
      const paths = resolveTwinPaths(typeof scope?.baseUrl === 'string' && scope.baseUrl ? scope : ctx, config);
      const runtime = await mountTwinHost(scope, config, { paths });
      const service = createTwinService(runtime);
      runtime.service = service;
      activeRuntime = runtime;
      if (typeof ctx.set === 'function') {
        ctx.set('agentTwin', service);
      }
      return async () => {
        if (activeRuntime === runtime) {
          activeRuntime = null;
          if (typeof ctx.set === 'function') {
            ctx.set('agentTwin', undefined);
          }
        }
        await runtime.dispose();
      };
    });
  }

  registerTwinTools(ctx, () => activeRuntime);
}
