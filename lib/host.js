/**
 * Host lifecycle coordinator (`mountTwinHost`).
 * Wires atomic `$DSH_HOME/agent-twin` store, Full-Blooded DSH runner & knowledge providers,
 * loopback guest portal, 5 local-first + 0.2.3 official channels, and `/api/agent_twin/*` routes.
 */
import { createTwinStore, resolveTwinPaths } from './store.js';
import { createTwinEngine } from './twin-engine.js';
import { createGuestServer } from './guest-server.js';
import { createChannelManager } from './channels.js';
import { registerTwinRoutes } from './routes.js';
import { createFullBloodTwinRunner } from './fullblood-runner.js';
import { createOfficialConnectorsBridge } from './official-connectors.js';
import { createKnowledgeGraphProvider } from './graph-provider.js';
import { createOwnerNotifier } from './owner-notifier.js';

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

  const knowledgeProviders = new Set(Array.isArray(overrides.knowledgeProviders) ? overrides.knowledgeProviders : []);
  function registerKnowledgeProvider(provider) {
    if (!provider || (typeof provider !== 'function' && typeof provider.query !== 'function')) {
      throw new TypeError('Knowledge provider must be a function or { query() } object');
    }
    const entry = typeof provider === 'function'
      ? { name: provider.name || 'custom-provider', query: provider }
      : provider;
    knowledgeProviders.add(entry);
    return () => {
      knowledgeProviders.delete(entry);
    };
  }

  const officialConnectors = overrides.officialConnectors === false
    ? null
    : (overrides.officialConnectors || createOfficialConnectorsBridge({ ctx, paths, logger }));
  const fullBloodRunner = overrides.fullBloodRunner === false
    ? null
    : (overrides.fullBloodRunner || createFullBloodTwinRunner({ ctx, paths, logger }));
  const graphProvider = overrides.graphProvider === false
    ? null
    : (overrides.graphProvider || createKnowledgeGraphProvider({ store, logger }));
  if (graphProvider) {
    registerKnowledgeProvider(graphProvider);
  }
  const ownerNotifier = overrides.ownerNotifier === false
    ? null
    : (overrides.ownerNotifier || createOwnerNotifier({
        store,
        officialConnectors,
        execFileImpl: overrides.execFileImpl,
        logger
      }));

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
    fullBloodRunner,
    ownerNotifier,
    knowledgeProviders: () => [...knowledgeProviders],
    onDispatchOutbound: async (person, text, replyContext) => {
      if (!channelManager) return { delivered: false };
      return channelManager.sendOutbound(person, text, replyContext);
    }
  });

  if (overrides.skipGuestServer !== true && !disposed) {
    guestServer = createGuestServer({
      host: overrides.guestHost || '127.0.0.1',
      port: overrides.guestPort ?? readConfigPort(config),
      publicBurstLimit: overrides.publicBurstLimit,
      getState: () => store.getState(),
      readCallerThread: callerId => store.readCallerThread(callerId),
      readVisitorThread: visitorId => store.readVisitorThread(visitorId),
      allSecretValues: () => store.allSecretValues(),
      onGuestAsk: async (person, question, opts = {}) => {
        return engine.handleInboundMessage({
          personId: person.id,
          question,
          channelId: 'ch-web',
          threadKey: person.id,
          onProgress: opts.onProgress
        });
      },
      onPublicAsk: async (visitorId, question, opts = {}) => {
        return engine.handlePublicVisitorMessage({
          visitorId,
          question,
          onProgress: opts.onProgress
        });
      },
      logger
    });
    await guestServer.start();
    if (disposed) {
      await guestServer.stop();
      return {
        paths,
        store,
        engine,
        guestServer,
        channelManager,
        officialConnectors,
        fullBloodRunner,
        graphProvider,
        ownerNotifier,
        registerKnowledgeProvider,
        dispose
      };
    }
  }

  channelManager = createChannelManager({
    store,
    engine,
    guestServer,
    officialConnectors,
    fetchImpl: overrides.fetchImpl,
    createWebSocket: overrides.createWebSocket,
    weixinBaseUrl: overrides.weixinBaseUrl,
    allowLoopbackForTest: overrides.allowLoopbackForTest,
    ackDelayMs: overrides.ackDelayMs,
    logger
  });
  await channelManager.start();
  if (disposed) {
    await channelManager.stopAll();
    await guestServer?.stop?.();
    return {
      paths,
      store,
      engine,
      guestServer,
      channelManager,
      officialConnectors,
      fullBloodRunner,
      graphProvider,
      ownerNotifier,
      registerKnowledgeProvider,
      dispose
    };
  }

  if (ctx?.connection?.fetch && typeof ctx.connection.fetch.register === 'function') {
    disposeRoutes = registerTwinRoutes({
      ctx,
      connection: ctx.connection,
      store,
      engine,
      channelManager,
      guestServer,
      graphProvider
    });
  }

  return {
    paths,
    store,
    engine,
    guestServer,
    channelManager,
    officialConnectors,
    fullBloodRunner,
    graphProvider,
    ownerNotifier,
    registerKnowledgeProvider,
    dispose
  };
}
