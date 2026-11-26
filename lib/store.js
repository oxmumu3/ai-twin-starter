/**
 * Atomic file-system state store (`$DSH_HOME/agent-twin/`), 0600 secrets vault,
 * per-caller isolated conversation directories, and non-destructive legacy import.
 */
import { createHash, randomUUID } from 'node:crypto';
import { chmod, lstat, mkdir, readdir, readFile, rename, rm, stat, unlink, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import {
  DEFAULT_DAILY_TURN_CAP,
  channelIdFromSelection,
  createDefaultChannels,
  createDefaultPublicLobby,
  createDefaultRules,
  maskSecretHint,
  normalizePublicLobbyConfig,
  redactSecrets,
  sanitizeSurfaceText,
  slugifyCallerId
} from '../shared/schema.js';

const FILE_FORMAT = 2;

function clone(value) {
  return structuredClone(value);
}

function nowIso() {
  return new Date().toISOString();
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Resolve `$DSH_HOME/agent-twin` root directory and non-destructive legacy state paths.
 * Precedence: explicit `config.stateDirectory` -> `process.env.DSH_HOME` -> `ctx.baseUrl`.
 */
export function resolveTwinPaths(ctx, config = {}) {
  const explicit = readConfigString(config, 'stateDirectory') || readConfigString(config, 'stateDir');
  const explicitLegacy = readConfigString(config, 'legacyStatePath');
  let profileDir = null;
  if (typeof ctx?.baseUrl === 'string' && ctx.baseUrl.startsWith('file:')) {
    try {
      profileDir = resolve(fileURLToPath(ctx.baseUrl));
    } catch {
      profileDir = null;
    }
  }

  if (explicit) {
    const rootDir = resolve(explicit);
    const legacyCandidates = [
      explicitLegacy ? resolve(explicitLegacy) : null,
      profileDir ? join(profileDir, 'data', 'agent-twin-native', 'state.json') : null
    ].filter(Boolean);
    return { rootDir, dshHome: dirname(rootDir), profileDir, legacyCandidates };
  }

  const envHome = typeof process.env.DSH_HOME === 'string' && process.env.DSH_HOME.trim()
    ? resolve(process.env.DSH_HOME.trim())
    : null;
  let derivedHome = envHome;
  if (!derivedHome && profileDir) {
    derivedHome = basename(dirname(profileDir)) === 'profiles'
      ? dirname(dirname(profileDir))
      : profileDir;
  }
  if (!derivedHome) {
    throw new Error('Host must provide $DSH_HOME, ctx.baseUrl, or an explicit stateDirectory');
  }

  const rootDir = join(derivedHome, 'agent-twin');
  const legacyCandidates = [
    explicitLegacy ? resolve(explicitLegacy) : null,
    profileDir ? join(profileDir, 'data', 'agent-twin-native', 'state.json') : null,
    join(derivedHome, 'profiles', 'desktop', 'data', 'agent-twin-native', 'state.json')
  ].filter(Boolean);
  return { rootDir, dshHome: derivedHome, profileDir, legacyCandidates };
}

function readConfigString(config, key) {
  const raw = config?.[key];
  const val = raw && typeof raw.get === 'function' ? raw.get() : raw;
  return typeof val === 'string' && val.trim() ? val.trim() : '';
}

async function ensureDir(dirPath, mode = 0o700) {
  await mkdir(dirPath, { recursive: true, mode });
}

async function safeReadJson(filePath) {
  try {
    const st = await lstat(filePath);
    if (st.isSymbolicLink() || !st.isFile()) return null;
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err?.code === 'ENOENT') return null;
    throw err;
  }
}

async function atomicWriteJson(filePath, data, mode = 0o600) {
  await ensureDir(dirname(filePath), 0o700);
  const tmpPath = `${filePath}.tmp.${process.pid}.${randomUUID().slice(0, 8)}`;
  const payload = `${JSON.stringify(data, null, 2)}\n`;
  try {
    await writeFile(tmpPath, payload, { encoding: 'utf8', mode });
    await chmod(tmpPath, mode);
    await rename(tmpPath, filePath);
  } catch (err) {
    await unlink(tmpPath).catch(() => {});
    throw err;
  }
}

export function createInitialState() {
  return {
    format: FILE_FORMAT,
    revision: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    legacyImported: false,
    legacyImportedInfo: null,
    lifecycleStage: 'cold',
    scene: 'onboard',
    onboardMode: 'initial',
    dutyMode: 'shadow',
    presenceAutoYield: true,
    ackSlowTurns: true,
    ownerNotify: {
      feishu: true,
      wechat: false
    },
    dailyTurnCap: DEFAULT_DAILY_TURN_CAP,
    twinProfile: {
      personaId: 'advisor',
      name: '',
      intro: '',
      draftReady: false,
      userEdited: false
    },
    mountedProjects: [],
    pendingDeltaByProject: {},
    capabilities: [],
    rules: createDefaultRules(),
    channels: createDefaultChannels(),
    people: [],
    approvals: [],
    deliveries: [],
    processedEventIds: [],
    publicLobby: createDefaultPublicLobby(),
    publicLobbyUsage: { date: todayKey(), count: 0 },
    selfTestTurn: null,
    extractionJob: null
  };
}

/**
 * Create the isolated plugin state store with serialized writes, 0600 secrets vault,
 * and per-caller physical thread isolation.
 */
export function createTwinStore(paths) {
  const statePath = join(paths.rootDir, 'state.json');
  const secretsPath = join(paths.rootDir, 'secrets.json');
  const callersRoot = join(paths.rootDir, 'twins', 'main', 'callers');
  const visitorsRoot = join(paths.rootDir, 'twins', 'main', 'visitors');
  const projectsRoot = join(paths.rootDir, 'projects');

  let state = null;
  let secrets = {};
  let undoStack = [];
  let capsUndoStack = [];
  let writeChain = Promise.resolve();
  let pairSeq = 10;
  let lastVisitorPruneMs = 0;
  let cachedTryQrKey = '';
  let cachedTryQrSvg = '';

  function enqueue(fn) {
    const next = writeChain.then(fn, fn);
    writeChain = next.catch(() => {});
    return next;
  }

  function safeCallerDir(callerId) {
    const clean = slugifyCallerId(callerId);
    const resolved = resolve(callersRoot, clean);
    if (!resolved.startsWith(`${resolve(callersRoot)}/`) && resolved !== resolve(callersRoot)) {
      throw new Error('Invalid caller identifier');
    }
    return resolved;
  }

  function safeVisitorDir(visitorId) {
    const clean = String(visitorId || '').trim().toLowerCase();
    if (!/^[a-f0-9]{16,32}$/.test(clean)) {
      throw new Error('Invalid visitor identifier');
    }
    const resolved = resolve(visitorsRoot, clean);
    if (!resolved.startsWith(`${resolve(visitorsRoot)}/`)) {
      throw new Error('Invalid visitor directory');
    }
    return { clean, dir: resolved };
  }

  async function readScopedThread(dir, idField, idVal) {
    const file = join(dir, 'thread.json');
    const data = await safeReadJson(file);
    if (data && typeof data === 'object') {
      return {
        [idField]: idVal,
        dshSessionId: typeof data.dshSessionId === 'string' ? data.dshSessionId : '',
        lastPolicyDigest: typeof data.lastPolicyDigest === 'string' ? data.lastPolicyDigest : '',
        turns: Array.isArray(data.turns) ? data.turns : [],
        dailyTurns: data.dailyTurns || { date: todayKey(), count: 0 },
        lastOwnerReplyByThread: data.lastOwnerReplyByThread || {}
      };
    }
    return {
      [idField]: idVal,
      dshSessionId: '',
      lastPolicyDigest: '',
      turns: [],
      dailyTurns: { date: todayKey(), count: 0 },
      lastOwnerReplyByThread: {}
    };
  }

  async function appendScopedTurn(dir, idField, idVal, turn, opts = {}) {
    return enqueue(async () => {
      const thread = await readScopedThread(dir, idField, idVal);
      const today = todayKey();
      const currentCount = thread.dailyTurns?.date === today ? (thread.dailyTurns.count || 0) : 0;
      thread.turns.push(turn);
      if (opts.maxTurns && thread.turns.length > opts.maxTurns) {
        thread.turns = thread.turns.slice(-opts.maxTurns);
      }
      if (typeof opts.dshSessionId === 'string' && opts.dshSessionId) {
        thread.dshSessionId = opts.dshSessionId;
      }
      if (typeof opts.lastPolicyDigest === 'string' && opts.lastPolicyDigest) {
        thread.lastPolicyDigest = opts.lastPolicyDigest;
      }
      if (opts.countTurn !== false) {
        thread.dailyTurns = { date: today, count: currentCount + 1 };
      }
      await atomicWriteJson(join(dir, 'thread.json'), thread, 0o600);
      return thread;
    });
  }

  async function updateScopedMeta(dir, idField, idVal, patch = {}) {
    return enqueue(async () => {
      const thread = await readScopedThread(dir, idField, idVal);
      if (typeof patch.dshSessionId === 'string') thread.dshSessionId = patch.dshSessionId;
      if (typeof patch.lastPolicyDigest === 'string') thread.lastPolicyDigest = patch.lastPolicyDigest;
      await atomicWriteJson(join(dir, 'thread.json'), thread, 0o600);
      return thread;
    });
  }

  async function readCallerThread(callerId) {
    return readScopedThread(safeCallerDir(callerId), 'callerId', callerId);
  }

  async function writeCallerThread(callerId, threadData) {
    const file = join(safeCallerDir(callerId), 'thread.json');
    return atomicWriteJson(file, threadData, 0o600);
  }

  async function appendCallerTurn(callerId, turn, opts = {}) {
    return appendScopedTurn(safeCallerDir(callerId), 'callerId', callerId, turn, opts);
  }

  async function updateCallerMeta(callerId, patch = {}) {
    return updateScopedMeta(safeCallerDir(callerId), 'callerId', callerId, patch);
  }

  async function pruneStaleVisitors() {
    const now = Date.now();
    if (now - lastVisitorPruneMs < 10 * 60 * 1000) return;
    lastVisitorPruneMs = now;
    try {
      const entries = await readdir(visitorsRoot, { withFileTypes: true });
      if (entries.length === 0) return;
      const metaList = [];
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      for (const ent of entries) {
        if (!ent.isDirectory()) continue;
        const p = join(visitorsRoot, ent.name);
        try {
          const st = await stat(p);
          if (now - st.mtimeMs > sevenDaysMs) {
            await rm(p, { recursive: true, force: true });
          } else {
            metaList.push({ p, mtimeMs: st.mtimeMs });
          }
        } catch {
          // ignore
        }
      }
      if (metaList.length > 300) {
        metaList.sort((a, b) => a.mtimeMs - b.mtimeMs);
        for (const item of metaList.slice(0, metaList.length - 300)) {
          await rm(item.p, { recursive: true, force: true }).catch(() => {});
        }
      }
    } catch {
      // ignore pruning failures
    }
  }

  async function readVisitorThread(visitorId) {
    const { clean, dir } = safeVisitorDir(visitorId);
    return readScopedThread(dir, 'visitorId', clean);
  }

  async function appendVisitorTurn(visitorId, turn, opts = {}) {
    const { clean, dir } = safeVisitorDir(visitorId);
    const res = await appendScopedTurn(dir, 'visitorId', clean, turn, { ...opts, maxTurns: 40 });
    void pruneStaleVisitors();
    return res;
  }

  async function updateVisitorMeta(visitorId, patch = {}) {
    const { clean, dir } = safeVisitorDir(visitorId);
    return updateScopedMeta(dir, 'visitorId', clean, patch);
  }

  async function incrementPublicLobbyUsage() {
    return updateState(st => {
      const today = todayKey();
      const prevCount = st.publicLobbyUsage?.date === today ? (st.publicLobbyUsage.count || 0) : 0;
      st.publicLobbyUsage = { date: today, count: prevCount + 1 };
    });
  }

  async function readProjectIndex(projectId) {
    const clean = slugifyCallerId(projectId);
    const file = join(projectsRoot, clean, 'index.json');
    return safeReadJson(file);
  }

  async function writeProjectIndex(projectId, indexData) {
    const clean = slugifyCallerId(projectId);
    const file = join(projectsRoot, clean, 'index.json');
    return atomicWriteJson(file, indexData, 0o600);
  }

  async function tryLegacyImport(targetState) {
    for (const cand of paths.legacyCandidates || []) {
      const envelope = await safeReadJson(cand);
      if (!envelope || envelope.format !== 1 || !envelope.state || typeof envelope.state !== 'object') continue;
      if (typeof envelope.checksum === 'string') {
        const expected = createHash('sha256').update(JSON.stringify(envelope.state)).digest('hex');
        if (expected !== envelope.checksum) continue;
      }
      const leg = envelope.state;
      const importedMeta = {
        importedAt: nowIso(),
        projectTitle: leg.project?.title || '',
        cardsCount: Array.isArray(leg.adoptedCards) ? leg.adoptedCards.length : 0,
        materialsCount: Array.isArray(leg.materials) ? leg.materials.length : 0
      };
      if (leg.project?.title && leg.project?.cwd && (importedMeta.cardsCount > 0 || importedMeta.materialsCount > 0)) {
        const pid = `legacy-${slugifyCallerId(leg.project.projectId || leg.project.title)}`;
        targetState.mountedProjects.push({
          id: pid,
          projectName: sanitizeSurfaceText(String(leg.project.title)),
          rootPath: String(leg.project.cwd),
          fileCount: importedMeta.materialsCount,
          docCount: importedMeta.materialsCount,
          readOnlyToolCount: Math.min(3, importedMeta.cardsCount),
          blockedSecretCount: 0,
          blockedWriteScriptCount: 0,
          shortSummary: `从旧版工作区接回：${importedMeta.materialsCount} 份资料、${importedMeta.cardsCount} 张经验卡`,
          fingerprintCount: 0,
          lastCheckedAt: nowIso(),
          fromLegacy: true
        });
        if (Array.isArray(leg.adoptedCards) && leg.adoptedCards.length > 0) {
          for (const card of leg.adoptedCards.slice(0, 6)) {
            targetState.capabilities.push({
              id: `cap-leg-${slugifyCallerId(card.id || card.title)}`,
              projectId: pid,
              projectName: sanitizeSurfaceText(String(leg.project.title)),
              name: sanitizeSurfaceText(String(card.title || '已有项目口径能力')),
              enabled: true,
              desc: sanitizeSurfaceText(String(card.summary || card.content || '沿用旧版已采纳能力卡的只读解释范围。')).slice(0, 120),
              basis: '沿用旧版已采纳口径卡（仅只读摘要）',
              output: '依据已采纳口径提供只读答复'
            });
          }
          targetState.lifecycleStage = 'mature';
          targetState.scene = 'desk';
          targetState.twinProfile = {
            personaId: 'advisor',
            name: `${sanitizeSurfaceText(leg.project.title)} · 工作分身`,
            intro: '已安全接回旧版已采纳能力卡，对外严格只读隔离，不改动原始资料。',
            draftReady: true,
            userEdited: false
          };
        }
      }
      targetState.dutyMode = leg.serviceEnabled ? 'live' : 'shadow';
      targetState.legacyImported = true;
      targetState.legacyImportedInfo = importedMeta;
      return true;
    }
    return false;
  }

  async function init() {
    await ensureDir(paths.rootDir, 0o700);
    await ensureDir(callersRoot, 0o700);
    await ensureDir(visitorsRoot, 0o700);
    await ensureDir(projectsRoot, 0o700);

    const existingSecrets = await safeReadJson(secretsPath);
    secrets = existingSecrets && typeof existingSecrets === 'object' ? existingSecrets : {};
    await atomicWriteJson(secretsPath, secrets, 0o600);

    const existingState = await safeReadJson(statePath);
    if (existingState && typeof existingState === 'object') {
      state = existingState;
      // Ensure structural defaults if upgrading patch state
      state.dailyTurnCap ||= DEFAULT_DAILY_TURN_CAP;
      state.ackSlowTurns = state.ackSlowTurns !== false;
      state.ownerNotify = {
        feishu: state.ownerNotify?.feishu !== false,
        wechat: Boolean(state.ownerNotify?.wechat)
      };
      state.channels ||= createDefaultChannels();
      state.rules ||= createDefaultRules();
      state.mountedProjects ||= [];
      state.capabilities ||= [];
      state.people ||= [];
      state.approvals ||= [];
      state.deliveries ||= [];
      state.processedEventIds ||= [];
      state.pendingDeltaByProject ||= {};
      state.publicLobby = normalizePublicLobbyConfig(state.publicLobby);
      if (!state.publicLobbyUsage || typeof state.publicLobbyUsage !== 'object' || !state.publicLobbyUsage.date) {
        state.publicLobbyUsage = { date: todayKey(), count: 0 };
      }

      const beforeLen = state.mountedProjects.length;
      state.mountedProjects = state.mountedProjects.filter(mp =>
        !(mp?.fromLegacy === true && !mp.docCount && !mp.fileCount && !state.capabilities.some(c => c.projectId === mp.id))
      );
      if (state.mountedProjects.length !== beforeLen) {
        state.revision = (state.revision || 0) + 1;
        state.updatedAt = nowIso();
        await atomicWriteJson(statePath, state, 0o600);
      }
    } else {
      state = createInitialState();
      await tryLegacyImport(state);
      await atomicWriteJson(statePath, state, 0o600);
    }
    return state;
  }

  function getState() {
    if (!state) throw new Error('TwinStore not initialized');
    return state;
  }

  function getSecrets() {
    return secrets;
  }

  function allSecretValues() {
    const vals = [];
    for (const entry of Object.values(secrets || {})) {
      if (!entry || typeof entry !== 'object') continue;
      for (const k of ['appSecret', 'botToken', 'token', 'appToken', 'accessToken', 'tenantAccessToken']) {
        if (typeof entry[k] === 'string' && entry[k].trim()) vals.push(entry[k].trim());
      }
    }
    return vals;
  }

  async function recordProcessedEvent(eventId) {
    const id = String(eventId || '').trim();
    if (!id) return false;
    let added = false;
    await updateState(st => {
      st.processedEventIds ||= [];
      if (st.processedEventIds.includes(id)) return;
      st.processedEventIds.push(id);
      if (st.processedEventIds.length > 500) {
        st.processedEventIds = st.processedEventIds.slice(-500);
      }
      added = true;
    });
    return added;
  }

  function hasProcessedEvent(eventId) {
    const id = String(eventId || '').trim();
    if (!id) return false;
    return Array.isArray(state?.processedEventIds) && state.processedEventIds.includes(id);
  }

  async function updateState(mutator, opts = {}) {
    return enqueue(async () => {
      if (opts.saveUndo === 'desk') {
        undoStack.push(clone({
          people: state.people,
          rules: state.rules,
          approvals: state.approvals,
          deliveries: state.deliveries
        }));
        if (undoStack.length > 10) undoStack.shift();
      } else if (opts.saveUndo === 'caps') {
        capsUndoStack.push(clone({
          mountedProjects: state.mountedProjects,
          capabilities: state.capabilities,
          rules: state.rules,
          pendingDeltaByProject: state.pendingDeltaByProject
        }));
        if (capsUndoStack.length > 10) capsUndoStack.shift();
      }
      await mutator(state);
      state.revision = (state.revision || 0) + 1;
      state.updatedAt = nowIso();
      await atomicWriteJson(statePath, state, 0o600);
      return state;
    });
  }

  async function updateChannelSecret(channelId, secretPatch) {
    return enqueue(async () => {
      const prev = secrets[channelId] && typeof secrets[channelId] === 'object' ? secrets[channelId] : {};
      if (secretPatch === null) {
        delete secrets[channelId];
      } else {
        secrets[channelId] = { ...prev, ...secretPatch, updatedAt: nowIso() };
      }
      await atomicWriteJson(secretsPath, secrets, 0o600);
      return secrets[channelId] || null;
    });
  }

  function undoDesk() {
    if (undoStack.length === 0) return null;
    const snap = undoStack.pop();
    return updateState(s => {
      s.people = snap.people;
      s.rules = snap.rules;
      s.approvals = snap.approvals;
      s.deliveries = snap.deliveries;
    });
  }

  function undoCaps() {
    if (capsUndoStack.length === 0) return null;
    const snap = capsUndoStack.pop();
    return updateState(s => {
      s.mountedProjects = snap.mountedProjects;
      s.capabilities = snap.capabilities;
      s.rules = snap.rules;
      s.pendingDeltaByProject = snap.pendingDeltaByProject;
    });
  }

  function hasDeskUndo() {
    return undoStack.length > 0;
  }

  function hasCapsUndo() {
    return capsUndoStack.length > 0;
  }

  function nextPairCode(prefix) {
    pairSeq = (pairSeq + 731) % 8999;
    return `${prefix}-${String(1000 + pairSeq)}`;
  }

  /**
   * Build the renderer-safe view snapshot (Zero-Path Surface Rule + zero secrets).
   */
  async function buildViewSnapshot(guestBaseUrl = '') {
    const s = getState();
    const secretVals = allSecretValues();
    const threadsByPerson = {};
    for (const p of s.people) {
      const t = await readCallerThread(p.id);
      threadsByPerson[p.id] = {
        turns: t.turns,
        todayTurns: t.dailyTurns?.date === todayKey() ? (t.dailyTurns.count || 0) : 0
      };
    }

    const sanitizedChannels = s.channels.map(ch => {
      const sec = secrets[ch.id] || {};
      return {
        ...ch,
        appIdHint: ch.appIdHint || maskSecretHint(sec.appId || ''),
        hasSecret: Boolean(sec.appSecret || sec.botToken || ch.connectionMode === 'official_cli' || ch.id === 'ch-web'),
        qrUrl: ch.id === 'ch-wechat' ? (sec.qrUrl || '') : undefined,
        qrSvg: ch.id === 'ch-wechat' ? (sec.qrSvg || '') : undefined
      };
    });

    const sanitizedPeople = s.people.map(p => {
      const pt = threadsByPerson[p.id] || { turns: [], todayTurns: 0 };
      const urlToken = p.urlToken || p.id;
      const wcSec = secrets['ch-wechat'] || {};
      return {
        ...p,
        guestUrl: guestBaseUrl ? `${guestBaseUrl}/g/${encodeURIComponent(urlToken)}` : '',
        qrSvg: p.qrSvg || (channelIdFromSelection(p.channel) === 'ch-wechat' && p.qrToken && p.qrToken === wcSec.qrToken ? (wcSec.qrSvg || '') : ''),
        todayCount: pt.todayTurns,
        threads: pt.turns.map(turn => ({
          ...turn,
          question: redactSecrets(sanitizeSurfaceText(turn.question), secretVals),
          reply: redactSecrets(sanitizeSurfaceText(turn.reply), secretVals)
        }))
      };
    });

    const sanitizedProjects = s.mountedProjects.map(mp => ({
      id: mp.id,
      projectName: mp.projectName,
      fileCount: mp.fileCount,
      docCount: mp.docCount,
      readOnlyToolCount: mp.readOnlyToolCount,
      blockedSecretCount: mp.blockedSecretCount,
      blockedWriteScriptCount: mp.blockedWriteScriptCount,
      shortSummary: sanitizeSurfaceText(mp.shortSummary),
      hasDelta: Boolean(s.pendingDeltaByProject?.[mp.id]),
      deltaSpec: mp.deltaSpec || null
    }));

    const publicCfg = normalizePublicLobbyConfig(s.publicLobby);
    const rawPublicBase = (publicCfg.publicBaseUrl || guestBaseUrl || '').replace(/\/+$/, '');
    const tryUrl = rawPublicBase ? `${rawPublicBase}/try` : '';
    let publicQrSvg = '';
    if (tryUrl) {
      if (cachedTryQrKey === tryUrl && cachedTryQrSvg) {
        publicQrSvg = cachedTryQrSvg;
      } else {
        try {
          publicQrSvg = await QRCode.toString(tryUrl, {
            type: 'svg',
            margin: 1,
            width: 180,
            color: { dark: '#1b2228', light: '#fffefb' }
          });
          cachedTryQrKey = tryUrl;
          cachedTryQrSvg = publicQrSvg;
        } catch {
          publicQrSvg = '';
        }
      }
    }
    const todayGlobalUsed = s.publicLobbyUsage?.date === todayKey() ? (s.publicLobbyUsage.count || 0) : 0;

    return {
      revision: s.revision,
      lifecycleStage: s.lifecycleStage,
      scene: s.scene,
      onboardMode: s.onboardMode,
      dutyMode: s.dutyMode,
      presenceAutoYield: s.presenceAutoYield,
      ackSlowTurns: s.ackSlowTurns !== false,
      ownerNotify: s.ownerNotify || { feishu: true, wechat: false },
      dailyTurnCap: s.dailyTurnCap,
      twinProfile: s.twinProfile,
      publicLobby: {
        ...publicCfg,
        tryUrl,
        qrSvg: publicQrSvg,
        todayGlobalUsed
      },
      mountedProjects: sanitizedProjects,
      capabilities: s.capabilities,
      rules: s.rules,
      channels: sanitizedChannels,
      people: sanitizedPeople,
      approvals: s.approvals.map(a => ({
        ...a,
        headline: redactSecrets(sanitizeSurfaceText(a.headline), secretVals),
        gist: redactSecrets(sanitizeSurfaceText(a.gist), secretVals),
        question: redactSecrets(sanitizeSurfaceText(a.question), secretVals),
        draft: redactSecrets(sanitizeSurfaceText(a.draft), secretVals)
      })),
      deliveries: s.deliveries,
      selfTestTurn: s.selfTestTurn,
      extractionJob: s.extractionJob,
      hasDeskUndo: hasDeskUndo(),
      hasCapsUndo: hasCapsUndo(),
      legacyImportedInfo: s.legacyImportedInfo
    };
  }

  return {
    paths,
    init,
    getState,
    getSecrets,
    allSecretValues,
    updateState,
    updateChannelSecret,
    readCallerThread,
    writeCallerThread,
    appendCallerTurn,
    updateCallerMeta,
    readVisitorThread,
    appendVisitorTurn,
    updateVisitorMeta,
    incrementPublicLobbyUsage,
    hasProcessedEvent,
    recordProcessedEvent,
    readProjectIndex,
    writeProjectIndex,
    undoDesk,
    undoCaps,
    hasDeskUndo,
    hasCapsUndo,
    nextPairCode,
    buildViewSnapshot
  };
}
