/**
 * Host lifecycle coordinator (`mountTwinHost`, Step 3).
 * Wires atomic `$DSH_HOME/agent-twin` store, scanner/engine, loopback guest portal,
 * 5 local-first channel adapters, and authenticated `/api/agent_twin/*` routes.
 */
import { createTwinStore, resolveTwinPaths } from './store.js';
import { createTwinEngine } from './twin-engine.js';
import { createGuestServer } from './guest-server.js';
import { createChannelManager } from './channels.js';
import { registerTwinRoutes } from './routes.js';

function readConfigPort(config) {
  const raw = config?.guestPort;
  const val = raw && typeof raw.get === 'function' ? raw.get() : raw;
  if (typeof val === 'number' && Number.isFinite(val) && val >= 0 && val !== 19480) return val;
  if (typeof process.env.DSH_TWIN_GUEST_PORT === 'string' && process.env.DSH_TWIN_GUEST_PORT.trim() !== '') {
    const p = Number(process.env.DSH_TWIN_GUEST_PORT);
    if (Number.isFinite(p) && p >= 0) return p;
  }
  if (typeof val === 'number' && Number.isFinite(val) && val >= 0) return val;
  return 19480;
}

/**
 * Mount the full AI 分身 Host runtime onto a Cordis context (`connection` available).
 */
export async function mountTwinHost(ctx, config = {}, overrides = {}) {
  const logger = overrides.logger || console;
  const paths = overrides.paths || resolveTwinPaths(ctx, config);
  const store = overrides.store || createTwinStore(paths);
  await store.init();

  let channelManager = null;
  let guestServer = null;
  let engine = null;
  let disposeRoutes = null;
  let disposed = false;

  async function dispose() {
    if (disposed) return;
    disposed = true;
    try {
      engine?.dispose?.();
    } catch {
      // ignore engine teardown errors
    }
    try {
      disposeRoutes?.();
    } catch {
      // ignore route teardown errors
    }
    try {
      await channelManager?.stopAll?.();
    } catch {
      // ignore socket teardown errors
    }
    try {
      await guestServer?.stop?.();
    } catch {
      // ignore guest server teardown errors
    }
  }

  if (typeof ctx?.effect === 'function') {
    ctx.effect(() => () => dispose(), 'agent-twin-host');
  } else if (typeof ctx?.on === 'function') {
    ctx.on('dispose', () => dispose());
  }

  engine = createTwinEngine({
    store,
    logger,
    llmResponder: overrides.llmResponder,
    onDispatchOutbound: async (person, text) => {
      if (!channelManager) return { delivered: false };
      return channelManager.sendOutbound(person, text);
    }
  });

  if (overrides.skipGuestServer !== true && !disposed) {
    guestServer = createGuestServer({
      host: overrides.guestHost || '127.0.0.1',
      port: overrides.guestPort ?? readConfigPort(config),
      getState: () => store.getState(),
      readCallerThread: callerId => store.readCallerThread(callerId),
      allSecretValues: () => store.allSecretValues(),
      onGuestAsk: async (person, question) => {
        return engine.handleInboundMessage({
          personId: person.id,
          question,
          channelId: 'ch-web',
          threadKey: person.id
        });
      },
      logger
    });
    await guestServer.start();
    if (disposed) {
      await guestServer.stop();
      return { paths, store, engine, guestServer, channelManager, dispose };
    }
  }

  channelManager = createChannelManager({
    store,
    engine,
    guestServer,
    fetchImpl: overrides.fetchImpl,
    createWebSocket: overrides.createWebSocket,
    weixinBaseUrl: overrides.weixinBaseUrl,
    allowLoopbackForTest: overrides.allowLoopbackForTest,
    logger
  });
  await channelManager.start();
  if (disposed) {
    await channelManager.stopAll();
    await guestServer?.stop?.();
    return { paths, store, engine, guestServer, channelManager, dispose };
  }

  if (ctx?.connection?.fetch && typeof ctx.connection.fetch.register === 'function') {
    disposeRoutes = registerTwinRoutes({
      ctx,
      connection: ctx.connection,
      store,
      engine,
      channelManager,
      guestServer
    });
  }

  return {
    paths,
    store,
    engine,
    guestServer,
    channelManager,
    dispose
  };
}
