import { createTwinService } from './native-service.mjs';
import { createNativeHost, createNativeExecutor } from './native-host.mjs';
import { createNativeSlack } from './native-slack.mjs';
import { readNativeSecret, resolveNativeStateDirectory } from './native-config.mjs';

/** Mount the optional Web half. The legacy agent tool remains available without Web services. */
export async function mountNativeTwin(ctx, config = {}, adapters = {}) {
  const executor = adapters.executor ?? createNativeExecutor(ctx);
  // An installed, trusted Host plugin may supply a transport implementation.
  // HTTP/Agent inputs cannot select this seam. Production keeps real Slack
  // unless an operator has explicitly installed a providing Host plugin.
  const hostTransport = ctx.get('agentTwinTransport', false);
  const transport = adapters.transport ?? hostTransport ?? createNativeSlack({ readConfig: () => ({ slackBotToken: readNativeSecret(config) }) });
  const service = createTwinService({ stateDir: adapters.stateDir ?? resolveNativeStateDirectory(ctx, config), executor, transport });
  const host = createNativeHost(ctx, { service, executor, transport, ...(adapters.timers ? { timers: adapters.timers } : {}) });
  let disposed = false;
  const close = async () => {
    if (disposed) return;
    disposed = true;
    const stopping = host.close();
    executor.close?.();
    transport.close?.();
    await stopping;
    await service.close?.();
  };
  ctx.on('dispose', close);
  return { service, host, close };
}
