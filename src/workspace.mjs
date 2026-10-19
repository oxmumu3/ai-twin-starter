import { constants } from 'node:fs';
import { lstat, mkdir, open, readFile } from 'node:fs/promises';
import { join, parse, resolve, sep } from 'node:path';

const TEMPLATE_NAMES = [
  'config.json', 'policy.json', 'state.json', 'RUNBOOK.md',
  'inbox-tick.md', 'owner-review.md', 'recap.md',
];
const MAX_CONFIG_BYTES = 1024 * 1024;

async function checkedDirectory(cwd) {
  if (typeof cwd !== 'string' || !cwd.trim() || cwd.includes('\0')) {
    throw new TypeError('cwd must be a non-empty directory path without NUL bytes');
  }
  const workspace = resolve(cwd);
  const root = parse(workspace).root;
  let current = root;
  for (const component of workspace.slice(root.length).split(sep).filter(Boolean)) {
    current = join(current, component);
    const stat = await lstat(current);
    if (stat.isSymbolicLink()) throw new Error(`Symlink directory paths are not supported: ${current}`);
    if (!stat.isDirectory()) throw new Error(`Workspace path must be a directory: ${current}`);
  }
  const stat = await lstat(workspace);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('cwd must be an existing non-symlink directory');
  return workspace;
}

async function workspaceDirectory(workspace, missingAllowed = false) {
  const directory = join(workspace, '.agent-twin');
  let stat;
  try {
    stat = await lstat(directory);
  } catch (error) {
    if (missingAllowed && error.code === 'ENOENT') return { directory, exists: false };
    throw error;
  }
  if (stat.isSymbolicLink()) throw new Error('.agent-twin must not be a symlink');
  if (!stat.isDirectory()) throw new Error('.agent-twin must be a directory');
  return { directory, exists: true };
}

function baseStatus(workspace, directory, initialized) {
  return {
    workspace,
    directory,
    initialized,
    enabled: false,
    ready: false,
    gaps: [],
    runtime: { connectorRegistered: false, schedulerRegistered: false, backgroundRunning: false },
  };
}

async function readJSON(directory, name, prefix, gaps) {
  const path = join(directory, name);
  let handle;
  try {
    const stat = await lstat(path);
    if (stat.isSymbolicLink()) throw new Error(`${name} must not be a symlink`);
    if (!stat.isFile()) throw new Error(`${name} must be a regular file`);
    if (stat.size > MAX_CONFIG_BYTES) {
      gaps.push({ code: `${prefix}_invalid`, message: `${name} exceeds the 1 MiB configuration limit.` });
      return null;
    }
    handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    const opened = await handle.stat();
    if (!opened.isFile() || opened.size > MAX_CONFIG_BYTES) throw new Error(`${name} is not a supported configuration file`);
    const value = JSON.parse(await handle.readFile('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new SyntaxError('Expected a JSON object');
    return value;
  } catch (error) {
    if (error.code === 'ENOENT') {
      gaps.push({ code: `${prefix}_missing`, message: `${name} is missing; no file has been created.` });
      return null;
    }
    if (error instanceof SyntaxError) {
      gaps.push({ code: `${prefix}_invalid`, message: `${name} must contain a valid JSON object.` });
      return null;
    }
    // Unsupported file types and symlinks fail closed rather than being followed.
    throw error;
  } finally {
    await handle?.close();
  }
}

const nonEmpty = (value) => typeof value === 'string' && Boolean(value.trim());
const nonEmptyList = (value) => Array.isArray(value) && value.length > 0 && value.every(nonEmpty);

/**
 * Creates only a new .agent-twin directory inside an existing workspace.
 * No existing workspace content, instructions, connectors, or schedules are read.
 * Path checks and exclusive writes are safeguards, not a security sandbox.
 */
export async function initWorkspace(cwd) {
  const workspace = await checkedDirectory(cwd);
  const target = await workspaceDirectory(workspace, true);
  if (target.exists) throw new Error('.agent-twin already exists; initialization never overwrites it');
  // Read package-owned templates before creating anything in the workspace.
  const templates = await Promise.all(TEMPLATE_NAMES.map(async (name) => ({
    name, content: await readFile(new URL(`../templates/${name}`, import.meta.url)),
  })));
  try {
    await mkdir(target.directory, { mode: 0o700 });
  } catch (error) {
    if (error.code === 'EEXIST') throw new Error('.agent-twin already exists; initialization never overwrites it');
    throw error;
  }
  await checkedDirectory(workspace);
  await workspaceDirectory(workspace);
  for (const { name, content } of templates) {
    const path = join(target.directory, name);
    const handle = await open(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
    try {
      await handle.writeFile(content);
    } finally {
      await handle.close();
    }
  }
  const status = await inspectWorkspace(workspace);
  return { ...status, created: TEMPLATE_NAMES.map((name) => join('.agent-twin', name)) };
}

/** Reads only known .agent-twin configuration files; never invokes a connector. */
export async function inspectWorkspace(cwd) {
  const workspace = await checkedDirectory(cwd);
  const { directory, exists } = await workspaceDirectory(workspace, true);
  const status = baseStatus(workspace, directory, exists);
  if (!exists) {
    status.gaps.push({ code: 'not_initialized', message: 'Run init once to prepare disabled templates.' });
    return status;
  }
  const config = await readJSON(directory, 'config.json', 'config', status.gaps);
  const policy = await readJSON(directory, 'policy.json', 'policy', status.gaps);
  const state = await readJSON(directory, 'state.json', 'state', status.gaps);
  const gap = (code, message) => status.gaps.push({ code, message });
  if (config) {
    status.enabled = config.enabled === true;
    if (!status.enabled) gap('disabled', 'The workspace is disabled. Initialization does not enable a service.');
    if (typeof config.enabled !== 'boolean') gap('config_invalid', 'enabled must be a boolean.');
    if (!nonEmpty(config.ownerId)) gap('owner_id', 'Set the real owner sender ID supplied by the authorized platform connector.');
    if (!nonEmpty(config.channel)) gap('channel', 'Choose a channel supported by the existing agent connector.');
    if (!nonEmptyList(config.allowedChannelIds)) gap('allowed_channels', 'Explicitly allow inbound channel IDs.');
    if (!nonEmptyList(config.allowedDestinationIds)) gap('allowed_destinations', 'Explicitly allow outbound destination IDs, including the owner review destination.');
    if (!nonEmptyList(config.contextEntrypoints)) gap('context_entrypoints', 'Select existing context entrypoints with the owner; their contents have not been read.');
    if (!Number.isInteger(config.intervalMinutes) || config.intervalMinutes < 1) gap('interval', 'intervalMinutes must be a positive integer.');
    if (config.dryRun !== false) gap('dry_run', 'Dry run is active; connector writes and message sends must remain off.');
  }
  if (policy) {
    if (policy.defaultAction !== 'deny') gap('policy_default', 'Default-deny policy is required.');
    if (!Array.isArray(policy.grants) || policy.grants.length === 0) {
      gap('grants', 'No sender has a role, scope, action, and destination grant.');
    } else if (policy.grants.some((grant) => !grant || !nonEmpty(grant.senderId) || !nonEmpty(grant.role) || !nonEmpty(grant.scope) || !nonEmptyList(grant.actions) || !nonEmptyList(grant.destinationIds))) {
      gap('grants_invalid', 'Each grant needs a platform sender ID, role, scope, actions, and destination IDs.');
    }
  }
  if (state && (!Array.isArray(state.requests) || !Array.isArray(state.receipts))) {
    gap('state_invalid', 'state.json needs explicit request and receipt ledgers.');
  }
  gap('connector', 'This package does not register or verify a connector. Connect and test one in the existing agent.');
  gap('scheduler', 'This package does not register a scheduler or worker. Verify a single serial executor or a host atomic lock before scheduling.');
  return status;
}

/** Returns the bundled instructions without reading workspace documents. */
export async function readRunbook(cwd) {
  await checkedDirectory(cwd);
  return readFile(new URL('../templates/RUNBOOK.md', import.meta.url), 'utf8');
}
