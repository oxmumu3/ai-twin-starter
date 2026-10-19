import { constants } from 'node:fs';
import { lstat, open, rename, unlink } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { join, parse, resolve, sep } from 'node:path';
import { readKnowledge } from './distill.mjs';

const API_BASE = 'https://slack.com/api/';
const METHODS = new Set(['auth.test', 'users.info', 'conversations.info', 'conversations.members', 'conversations.history']);
const HISTORY_LIMIT = 10;
const MAX_JSON_BYTES = 2 * 1024 * 1024;
const MAX_CHANNELS = 10;
const MAX_LEDGER_REQUESTS = 10000;
const PROBE_FILE = 'channel-probe.json';
const LEDGER_FILE = 'channel-dry-run.json';

class ChannelIssue extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;
const id = (value) => typeof value === 'string' && /^[A-Z][A-Z0-9]+$/.test(value);
const object = (value) => value && typeof value === 'object' && !Array.isArray(value);
const abort = () => new DOMException('Channel operation aborted', 'AbortError');
function checkAbort(adapter) { if (adapter?.signal?.aborted) throw abort(); }

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (object(value)) return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
}
const fingerprint = (value) => createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
const identityFingerprint = (identity) => fingerprint({ platform: 'slack', tenantId: identity.tenantId, actorId: identity.actorId, botId: identity.botId ?? null });

/** A token stays only in this closure. This adapter has no message-send method. */
export function createSlackAdapter({ token = process.env.AGENT_TWIN_SLACK_BOT_TOKEN, fetchImpl = globalThis.fetch, signal } = {}) {
  const configured = typeof token === 'string' && token.trim().length > 0;
  let authenticatedIdentity;
  async function request(method, parameters = {}) {
    if (!METHODS.has(method)) throw new ChannelIssue('method_not_allowed', 'Only the documented read-only Slack methods are supported.');
    if (!configured) throw new ChannelIssue('token_missing', 'Set AGENT_TWIN_SLACK_BOT_TOKEN in the local host environment; do not paste it into chat or config files.');
    if (signal?.aborted) throw abort();
    let response;
    try {
      response = await fetchImpl(`${API_BASE}${method}`, {
        method: 'POST', redirect: 'error', signal,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
        body: new URLSearchParams(Object.entries(parameters).map(([key, value]) => [key, String(value)])),
      });
    } catch (error) {
      if (signal?.aborted || error?.name === 'AbortError') throw abort();
      throw new ChannelIssue('network_failed', 'The Slack read-only request failed; raw request errors are not returned.');
    }
    if (signal?.aborted) throw abort();
    if (response.status === 401 || response.status === 403) throw new ChannelIssue('auth_failed', 'Slack rejected authentication or permission for this read-only request.');
    if (response.status === 429) throw new ChannelIssue('rate_limited', 'Slack rate limited this read. No automatic retry was attempted.');
    if (!response.ok) throw new ChannelIssue('http_failed', 'Slack returned an unsuccessful HTTP response.');
    let data;
    try {
      const text = await response.text();
      if (Buffer.byteLength(text) > MAX_JSON_BYTES) throw new Error('oversized');
      data = JSON.parse(text);
    } catch (error) {
      if (signal?.aborted || error?.name === 'AbortError') throw abort();
      throw new ChannelIssue('invalid_response', 'Slack did not return a supported bounded JSON response.');
    }
    if (!object(data) || data.ok !== true) {
      const code = ['invalid_auth', 'not_authed', 'token_revoked', 'token_expired', 'account_inactive'].includes(data?.error)
        ? 'auth_failed' : data?.error === 'missing_scope' ? 'missing_scope' : 'slack_read_failed';
      throw new ChannelIssue(code, 'Slack did not confirm the requested read. Check the local authorization and read scopes; raw errors are not returned.');
    }
    return data;
  }
  return {
    kind: 'slack', configured, signal,
    async identity() {
      const data = await request('auth.test');
      if (!id(data.team_id) || !id(data.user_id)) throw new ChannelIssue('invalid_response', 'auth.test did not return stable team and actor IDs.');
      authenticatedIdentity = { tenantId: data.team_id, actorId: data.user_id, ...(id(data.bot_id) ? { botId: data.bot_id } : {}) };
      return { ...authenticatedIdentity };
    },
    async owner(ownerId) {
      const { user } = await request('users.info', { user: ownerId });
      if (!object(user) || !id(user.id) || !id(user.team_id) || typeof user.is_bot !== 'boolean' || typeof user.deleted !== 'boolean') throw new ChannelIssue('invalid_response', 'users.info did not return a stable owner identity and explicit account flags.');
      return { id: user.id, tenantId: user.team_id, isBot: user.is_bot === true, deleted: user.deleted === true };
    },
    async conversation(channelId) {
      const { channel } = await request('conversations.info', { channel: channelId });
      if (!object(channel) || channel.id !== channelId) throw new ChannelIssue('invalid_response', 'conversations.info did not identify the requested conversation.');
      const members = new Set();
      let cursor = '';
      for (let page = 0; page < 3; page += 1) {
        const result = await request('conversations.members', { channel: channelId, limit: 200, ...(cursor ? { cursor } : {}) });
        if (!Array.isArray(result.members) || !result.members.every(id)) throw new ChannelIssue('invalid_response', 'conversations.members returned an invalid membership list.');
        result.members.forEach((member) => members.add(member));
        const next = result.response_metadata?.next_cursor ?? '';
        if (typeof next !== 'string') throw new ChannelIssue('invalid_response', 'Conversation membership pagination was invalid.');
        cursor = next;
        if (!cursor) break;
      }
      return {
        id: channelId,
        kind: channel.is_im ? 'im' : channel.is_mpim ? 'mpim' : channel.is_private ? 'private' : 'channel',
        peerId: channel.user ?? null,
        members: [...members], membersComplete: !cursor,
        isMember: channel.is_member === true, archived: channel.is_archived === true,
        externallyShared: channel.is_ext_shared === true,
      };
    },
    async history(channelId, { limit = HISTORY_LIMIT } = {}) {
      if (!Number.isInteger(limit) || limit < 1 || limit > HISTORY_LIMIT) throw new ChannelIssue('invalid_limit', 'Read-only history is limited to ten messages per channel.');
      const data = await request('conversations.history', { channel: channelId, limit });
      if (!Array.isArray(data.messages) || data.messages.length > limit || typeof data.has_more !== 'boolean') throw new ChannelIssue('invalid_response', 'History did not return a bounded message list with coverage information.');
      const messages = [];
      for (const message of data.messages) {
        if (!object(message)) throw new ChannelIssue('invalid_response', 'A history item was not a message object.');
        if (message.type !== 'message' || message.subtype || message.bot_id) continue;
        if (!id(message.user) || typeof message.ts !== 'string' || !/^\d+\.\d+$/.test(message.ts) || typeof message.text !== 'string') throw new ChannelIssue('invalid_response', 'A human message lacked its stable sender, timestamp, or text.');
        if (Buffer.byteLength(message.text) > 65536) throw new ChannelIssue('invalid_response', 'A message exceeded the supported read size.');
        messages.push({ messageId: message.ts, senderId: message.user, text: message.text,
          tenantId: message.team ?? message.user_team ?? authenticatedIdentity?.tenantId,
          ...(typeof message.thread_ts === 'string' ? { threadId: message.thread_ts } : {}),
        });
      }
      return { messages, hasMore: data.has_more || Boolean(data.response_metadata?.next_cursor) };
    },
  };
}

async function localDirectory(cwd) {
  if (typeof cwd !== 'string' || !cwd.trim() || cwd.includes('\0')) throw new TypeError('cwd must be an existing directory path');
  const workspace = resolve(cwd);
  let current = parse(workspace).root;
  for (const component of workspace.slice(current.length).split(sep).filter(Boolean)) {
    current = join(current, component);
    const stat = await lstat(current);
    if (stat.isSymbolicLink()) throw new Error('Workspace directory paths must not contain a symlink');
    if (!stat.isDirectory()) throw new Error('Workspace path must be a directory');
  }
  const directory = join(workspace, '.agent-twin');
  const stat = await lstat(directory);
  if (stat.isSymbolicLink()) throw new Error('.agent-twin must not be a symlink');
  if (!stat.isDirectory()) throw new Error('.agent-twin must be a directory');
  return directory;
}

async function safeJSON(path, { optional = false } = {}) {
  let handle;
  try {
    const stat = await lstat(path);
    if (stat.isSymbolicLink()) throw new Error('Local channel files must not be symlinks');
    if (!stat.isFile() || stat.size > MAX_JSON_BYTES) throw new Error('Local channel files must be bounded regular JSON files');
    handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    const opened = await handle.stat();
    if (!opened.isFile() || opened.size > MAX_JSON_BYTES) throw new Error('Local channel file type or size changed');
    const value = JSON.parse(await handle.readFile('utf8'));
    if (!object(value)) throw new Error('Local channel JSON must contain an object');
    return value;
  } catch (error) {
    if (optional && error.code === 'ENOENT') return null;
    if (error instanceof SyntaxError) throw new Error('Local channel configuration or receipt is not valid JSON');
    throw error;
  } finally { await handle?.close(); }
}

async function atomicJSON(path, value) {
  try {
    const existing = await lstat(path);
    if (existing.isSymbolicLink()) throw new Error('Local channel output must not be a symlink');
    if (!existing.isFile()) throw new Error('Local channel output must be a regular file');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const temporary = `${path}.${randomUUID()}.tmp`;
  let handle;
  try {
    handle = await open(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
    await handle.writeFile(`${JSON.stringify(value, null, 2)}\n`);
    await handle.close(); handle = null;
    await rename(temporary, path);
  } finally {
    await handle?.close();
    await unlink(temporary).catch((error) => { if (error.code !== 'ENOENT') throw error; });
  }
}

async function load(cwd) {
  const directory = await localDirectory(cwd);
  const config = await safeJSON(join(directory, 'config.json'));
  const policy = await safeJSON(join(directory, 'policy.json'));
  return { directory, config, policy, configFingerprint: fingerprint({ config, policy }) };
}

function reportBase() {
  return { platform: 'slack', status: 'blocked', ready: false,
    checks: { auth: false, owner: false, inbound: false, ownerDestination: false, history: false },
    issues: [], inboundMessageObserved: false, historyTruncated: false, coverage: 'latest_page_only',
  };
}

function configurationIssues(config, policy) {
  const issues = [];
  const add = (code, message) => issues.push({ code, message });
  if (config.channel !== 'slack') add('unsupported_channel', 'This executable adapter supports Slack only.');
  if (!id(config.ownerId) || !/^[UW]/.test(config.ownerId)) add('owner_missing', 'Configure the real Slack owner user ID.');
  if (!id(config.ownerDestinationId)) add('owner_destination_missing', 'Configure an existing owner DM conversation ID.');
  if (!Array.isArray(config.allowedChannelIds) || !config.allowedChannelIds.length || config.allowedChannelIds.length > MAX_CHANNELS || !config.allowedChannelIds.every(id)) add('inbound_channels_invalid', 'Explicitly select one to ten valid inbound conversation IDs.');
  if (!Array.isArray(config.allowedDestinationIds) || !config.allowedDestinationIds.length || !config.allowedDestinationIds.every(id)) add('destinations_invalid', 'Explicitly select allowed outbound destination IDs.');
  if (!Array.isArray(config.allowedDestinationIds) || !config.allowedDestinationIds.includes(config.ownerDestinationId)) add('owner_destination_not_allowed', 'The owner destination must be explicitly allowlisted.');
  if (policy.defaultAction !== 'deny' || !Array.isArray(policy.grants)) add('policy_invalid', 'A default-deny policy with an explicit grants array is required.');
  return issues;
}

function adapterIssues(adapter) {
  if (adapter?.configured === false) return [{ code: 'token_missing', message: 'Set AGENT_TWIN_SLACK_BOT_TOKEN in the local host environment; do not paste it into chat or config.' }];
  if (adapter?.kind !== 'slack' || !['identity', 'owner', 'conversation', 'history'].every((method) => typeof adapter[method] === 'function')) return [{ code: 'adapter_missing', message: 'A supported Slack read-only adapter is required.' }];
  return [];
}

function safeIssue(error) {
  return error instanceof ChannelIssue ? { code: error.code, message: error.message }
    : { code: 'adapter_failed', message: 'The channel adapter could not complete the requested read-only verification. Raw errors were omitted.' };
}

function verifyIdentity(identity, config) {
  if (!object(identity) || !id(identity.tenantId) || !id(identity.actorId)) throw new ChannelIssue('invalid_identity', 'The adapter did not return a stable authenticated account identity.');
  if (config.tenantId && identity.tenantId !== config.tenantId) throw new ChannelIssue('tenant_mismatch', 'The authenticated Slack team does not match the configured team.');
}

async function readHistories(config, adapter, identity) {
  const collected = [];
  let historyTruncated = false;
  for (const channelId of [...new Set(config.allowedChannelIds)]) {
    checkAbort(adapter);
    const result = await adapter.history(channelId, { limit: HISTORY_LIMIT });
    if (!object(result) || !Array.isArray(result.messages) || result.messages.length > HISTORY_LIMIT || typeof result.hasMore !== 'boolean') throw new ChannelIssue('invalid_response', 'The adapter did not return bounded normalized history.');
    historyTruncated ||= result.hasMore;
    for (const message of result.messages) {
      if (!object(message) || !nonEmpty(message.messageId) || !id(message.senderId) || typeof message.text !== 'string') throw new ChannelIssue('invalid_response', 'A normalized message lacked stable source fields.');
      if (message.tenantId && message.tenantId !== identity.tenantId) throw new ChannelIssue('message_tenant_mismatch', 'A message belonged to a different Slack team.');
      if (message.channelId && message.channelId !== channelId) throw new ChannelIssue('message_channel_mismatch', 'A message did not belong to the requested channel.');
      if (message.senderId === identity.actorId) continue;
      collected.push({ ...message, tenantId: identity.tenantId, channelId });
    }
  }
  return { messages: collected, historyTruncated };
}

/** Performs actual read-only checks and writes only a private, text-free probe receipt. */
export async function probeChannel(cwd, adapter) {
  const state = await load(cwd);
  const report = reportBase();
  report.issues = [...adapterIssues(adapter), ...configurationIssues(state.config, state.policy)];
  let accountFingerprint = null;
  if (!report.issues.length) {
    try {
      checkAbort(adapter);
      const identity = await adapter.identity();
      verifyIdentity(identity, state.config);
      accountFingerprint = identityFingerprint(identity);
      report.checks.auth = true;
      const owner = await adapter.owner(state.config.ownerId);
      if (owner?.id !== state.config.ownerId || owner.tenantId !== identity.tenantId || owner.isBot !== false || owner.deleted !== false) throw new ChannelIssue('owner_mismatch', 'The configured owner was not confirmed as an active human in the authenticated Slack team.');
      report.checks.owner = true;
      const conversations = new Map();
      for (const channelId of new Set([...state.config.allowedChannelIds, state.config.ownerDestinationId])) {
        const conversation = await adapter.conversation(channelId);
        if (!object(conversation) || conversation.id !== channelId || !Array.isArray(conversation.members) || !conversation.members.every(id) || conversation.archived || conversation.externallyShared) throw new ChannelIssue('conversation_invalid', 'The selected conversation was unavailable, shared externally, archived, or invalid.');
        conversations.set(channelId, conversation);
      }
      const destination = conversations.get(state.config.ownerDestinationId);
      const destinationMembers = new Set(destination.members);
      if (destination.kind !== 'im' || destination.peerId !== state.config.ownerId || destination.membersComplete !== true || destinationMembers.size !== 2 || !destinationMembers.has(identity.actorId) || !destinationMembers.has(state.config.ownerId)) throw new ChannelIssue('owner_destination_mismatch', 'The destination was not confirmed as a private DM containing only the owner and this authenticated bot.');
      report.checks.ownerDestination = true;
      for (const channelId of state.config.allowedChannelIds) {
        const conversation = conversations.get(channelId);
        if (!conversation.isMember && !conversation.members.includes(identity.actorId)) throw new ChannelIssue('inbound_not_member', 'The authenticated bot was not confirmed as a member of an inbound conversation.');
      }
      report.checks.inbound = true;
      const history = await readHistories(state.config, adapter, identity);
      report.checks.history = true;
      report.inboundMessageObserved = history.messages.length > 0;
      report.historyTruncated = history.historyTruncated;
      report.observedMessageCount = history.messages.length;
      report.status = 'verified';
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      report.issues.push(safeIssue(error));
    }
  }
  checkAbort(adapter);
  const latest = await load(cwd);
  if (latest.configFingerprint !== state.configFingerprint) {
    report.status = 'blocked';
    report.issues.push({ code: 'configuration_changed', message: 'Configuration changed during the probe; run a new probe against the current configuration.' });
  }
  const receipt = { schemaVersion: 1, adapterKind: 'slack', configFingerprint: state.configFingerprint,
    identityFingerprint: accountFingerprint, checkedAt: new Date().toISOString(), ...report };
  await atomicJSON(join(state.directory, PROBE_FILE), receipt);
  return receipt;
}

function receiptStatus(receipt, state) {
  if (!receipt) return 'missing';
  if (receipt.schemaVersion !== 1 || receipt.adapterKind !== state.config.channel || receipt.configFingerprint !== state.configFingerprint) return 'stale';
  if (receipt.status !== 'verified' || !nonEmpty(receipt.identityFingerprint)) return 'blocked';
  if (!Object.values(receipt.checks ?? {}).every((value) => value === true) || Object.keys(receipt.checks ?? {}).length !== 5) return 'blocked';
  return 'current';
}

/** Local receipt inspection only: it cannot know whether an environment token changed accounts. */
export async function inspectChannel(cwd) {
  const state = await load(cwd);
  const receipt = await safeJSON(join(state.directory, PROBE_FILE), { optional: true });
  const current = receiptStatus(receipt, state);
  return { ...reportBase(), status: current === 'current' ? 'cached' : 'blocked', receiptStatus: current,
    identityStatus: 'cached_not_rechecked',
    checks: current === 'current' ? receipt.checks : reportBase().checks,
    checkedAt: receipt?.checkedAt ?? null,
    ...(current === 'current' ? { identityFingerprint: receipt.identityFingerprint, configFingerprint: receipt.configFingerprint,
      inboundMessageObserved: receipt.inboundMessageObserved, historyTruncated: receipt.historyTruncated } : {}),
    issues: current === 'current' ? [] : [{ code: 'probe_required', message: 'Run a fresh read-only probe; no current successful receipt matches this configuration.' }],
  };
}

function decide(message, policy, config) {
  const grants = policy.grants.filter((grant) => object(grant) && grant.senderId === message.senderId && nonEmpty(grant.role));
  if (!grants.length) return { decision: 'rejected', reasons: ['sender_not_granted'] };
  let intent;
  try { intent = JSON.parse(message.text.trim()); } catch { /* Natural language requires the owner in this first edition. */ }
  if (!object(intent) || !['scope', 'action', 'destinationId'].every((key) => nonEmpty(intent[key]) && intent[key].length <= 256)) return { decision: 'needs_owner', reasons: ['explicit_intent_required'] };
  if (!config.allowedDestinationIds.includes(intent.destinationId) || ![...config.allowedChannelIds, config.ownerDestinationId].includes(intent.destinationId)) return { decision: 'needs_owner', reasons: ['destination_not_verified'] };
  const allowed = grants.some((grant) => grant.scope === intent.scope && Array.isArray(grant.actions) && grant.actions.includes(intent.action)
    && Array.isArray(grant.destinationIds) && grant.destinationIds.includes(intent.destinationId)
    && (!grant.expiresAt || (Number.isFinite(Date.parse(grant.expiresAt)) && Date.parse(grant.expiresAt) > Date.now())));
  return allowed ? { decision: 'allowed_dry_run', reasons: ['exact_grant_matched'] } : { decision: 'needs_owner', reasons: ['outside_grant'] };
}

/** Explicit bounded read-only dry-run; never invokes a business executor or message sender. */
export async function tickChannel(cwd, adapter, { dryRun = true } = {}) {
  if (dryRun !== true) throw new TypeError('Only an explicit dry-run channel tick is implemented');
  const state = await load(cwd);
  const report = { ...reportBase(), dryRun: true, executionEnabled: false, processed: 0, duplicates: 0,
    counts: { allowed_dry_run: 0, needs_owner: 0, rejected: 0 }, ledgerEntries: [] };
  report.issues = [...adapterIssues(adapter), ...configurationIssues(state.config, state.policy)];
  if (report.issues.length) return report;
  const receipt = await safeJSON(join(state.directory, PROBE_FILE), { optional: true });
  if (receiptStatus(receipt, state) !== 'current') {
    report.issues.push({ code: 'probe_required', message: 'A current successful channel probe is required before a dry-run tick.' });
    return report;
  }
  const lockPath = join(state.directory, 'channel-dry-run.lock');
  let lock;
  try {
    try { lock = await open(lockPath, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600); }
    catch (error) {
      if (error.code === 'EEXIST') {
        report.issues.push({ code: 'dry_run_busy', message: 'Another dry-run owns the local lock, or a stale lock needs manual inspection. It was not stolen.' });
        return report;
      }
      throw error;
    }
    await lock.writeFile(JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
    try {
      checkAbort(adapter);
      const identity = await adapter.identity();
      verifyIdentity(identity, state.config);
      const accountFingerprint = identityFingerprint(identity);
      report.checks.auth = true;
      if (accountFingerprint !== receipt.identityFingerprint) {
        report.issues.push({ code: 'identity_changed', message: 'The adapter is authenticated as a different account. Run a new channel probe.' });
        await atomicJSON(join(state.directory, PROBE_FILE), { ...receipt, status: 'blocked', checks: reportBase().checks,
          issues: report.issues, invalidatedAt: new Date().toISOString() });
        return report;
      }
      const history = await readHistories(state.config, adapter, identity);
      report.historyTruncated = history.historyTruncated;
      report.inboundMessageObserved = history.messages.length > 0;
      const ledgerPath = join(state.directory, LEDGER_FILE);
      const ledger = await safeJSON(ledgerPath, { optional: true }) ?? { schemaVersion: 1, requests: [] };
      if (ledger.schemaVersion !== 1 || !Array.isArray(ledger.requests) || ledger.requests.length > MAX_LEDGER_REQUESTS
        || !ledger.requests.every((entry) => object(entry) && nonEmpty(entry.requestId)
          && ['allowed_dry_run', 'needs_owner', 'rejected'].includes(entry.decision)
          && Array.isArray(entry.reasons) && entry.reasons.every(nonEmpty))) throw new ChannelIssue('ledger_invalid', 'The private dry-run ledger is invalid; inspect it manually before continuing.');
      const byId = new Map(ledger.requests.map((entry) => [entry.requestId, entry]));
      if (byId.size !== ledger.requests.length) throw new ChannelIssue('ledger_invalid', 'Duplicate request IDs already exist in the ledger; inspect it manually.');
      const observed = new Set();
      let knowledge;
      let knowledgeLoaded = false;
      for (const message of history.messages) {
        const requestId = `slack:${fingerprint([identity.tenantId, message.channelId, message.messageId])}`;
        const contentFingerprint = fingerprint({ senderId: message.senderId, text: message.text });
        let decision = decide(message, state.policy, state.config);
        if (decision.decision === 'allowed_dry_run') {
          // Do not even read private derived knowledge for unauthorized requests.
          if (!knowledgeLoaded) {
            try { knowledge = await readKnowledge(cwd); }
            catch { knowledge = null; }
            knowledgeLoaded = true;
          }
          const validIds = knowledge?.cards?.filter((card) => card.status === 'documented').map((card) => card.id) ?? [];
          if (!knowledge?.materialized || !nonEmpty(knowledge.generationId) || !validIds.length) {
            decision = { decision: 'needs_owner', reasons: ['knowledge_not_ready'], nextAction: 'readKnowledge' };
          } else {
            decision = { ...decision, knowledgeRefs: { generationId: knowledge.generationId, cardIds: [...new Set(validIds)].sort() } };
          }
        }
        // Re-evaluate every observed request against current evidence, including
        // old dry-run entries: a source change cannot reuse an old allowed plan.
        const routingFingerprint = fingerprint(decision);
        let entry = byId.get(requestId);
        if (entry && entry.configFingerprint === state.configFingerprint && entry.identityFingerprint === accountFingerprint
          && entry.contentFingerprint === contentFingerprint && entry.routingFingerprint === routingFingerprint) {
          report.duplicates += 1;
        } else {
          entry = { requestId, source: { tenantId: identity.tenantId, channelId: message.channelId, messageId: message.messageId, senderId: message.senderId },
            contentFingerprint, routingFingerprint, configFingerprint: state.configFingerprint, identityFingerprint: accountFingerprint,
            firstObservedAt: entry?.firstObservedAt ?? new Date().toISOString(), checkedAt: new Date().toISOString(),
            ...decision, dryRun: true, businessExecuted: false, messageSent: false };
          byId.set(requestId, entry);
          report.processed += 1;
        }
        if (!observed.has(requestId)) {
          observed.add(requestId);
          report.counts[entry.decision] += 1;
          report.ledgerEntries.push({ requestId, decision: entry.decision, reasons: entry.reasons,
            ...(entry.knowledgeRefs ? { knowledgeRefs: entry.knowledgeRefs } : {}),
            ...(entry.nextAction ? { nextAction: entry.nextAction } : {}),
          });
        }
      }
      if (byId.size > MAX_LEDGER_REQUESTS) throw new ChannelIssue('ledger_full', 'The dry-run ledger limit was reached. No existing deduplication entries were dropped.');
      // Re-read configuration immediately before commit; do not commit an obsolete plan.
      const latest = await load(cwd);
      if (latest.configFingerprint !== state.configFingerprint) throw new ChannelIssue('configuration_changed', 'Configuration changed during the dry-run; no plan was committed. Probe again.');
      checkAbort(adapter);
      await atomicJSON(ledgerPath, { schemaVersion: 1, requests: [...byId.values()], lastRunAt: new Date().toISOString(),
        coverage: 'latest_page_only', historyTruncated: history.historyTruncated });
      report.checks = { ...receipt.checks, auth: true, history: true };
      report.status = 'verified';
      return report;
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      if (!(error instanceof ChannelIssue)) throw error;
      report.issues.push(safeIssue(error));
      return report;
    }
  } finally {
    if (lock) { await lock.close(); await unlink(lockPath); }
  }
}
