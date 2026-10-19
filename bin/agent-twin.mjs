#!/usr/bin/env node
import { constants } from 'node:fs';
import { open } from 'node:fs/promises';
import { initWorkspace, inspectWorkspace, readRunbook } from '../src/workspace.mjs';

const usage = 'Usage: agent-twin init|status|runbook|distill-prepare|distill-apply|distill-status|distill-refresh|distill-read|channel-probe|channel-status|channel-tick [--cwd <directory>] [--entry <relative-file>] [--batch <id> --cards <json-file>]';
const commands = new Set(['init', 'status', 'runbook', 'distill-prepare', 'distill-apply', 'distill-status', 'distill-refresh', 'distill-read', 'channel-probe', 'channel-status', 'channel-tick']);

function parseArguments(args) {
  const [command, ...options] = args;
  if (!commands.has(command)) throw new Error(usage);
  const result = { command, cwd: process.cwd(), entries: [] };
  const seen = new Set();
  for (let i = 0; i < options.length; i += 2) {
    const key = options[i], value = options[i + 1];
    if (!['--cwd', '--entry', '--batch', '--cards'].includes(key) || !value || value.startsWith('--')) throw new Error(usage);
    if (key !== '--entry' && seen.has(key)) throw new Error(usage);
    if (key === '--entry' && command !== 'distill-prepare') throw new Error(usage);
    if (['--batch', '--cards'].includes(key) && command !== 'distill-apply') throw new Error(usage);
    seen.add(key);
    if (key === '--entry') result.entries.push(value);
    else result[key.slice(2)] = value;
  }
  if (command === 'distill-prepare' && !result.entries.length) throw new Error('distill-prepare requires explicit --entry files');
  if (command === 'distill-apply' && (!result.batch || !result.cards)) throw new Error('distill-apply requires --batch and --cards');
  return result;
}

async function readCards(path) {
  const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await file.stat();
    if (!stat.isFile() || stat.size > 262144) throw new Error('Proposal must be a regular JSON file of at most 256 KiB');
    const proposal = JSON.parse(await file.readFile('utf8'));
    return Array.isArray(proposal) ? proposal : proposal.cards;
  } finally { await file.close(); }
}

async function execute(options) {
  const { command, cwd } = options;
  if (command === 'init') return initWorkspace(cwd);
  if (command === 'status') return inspectWorkspace(cwd);
  if (command.startsWith('distill-')) {
    const api = await import('../src/distill.mjs');
    if (command === 'distill-prepare') return api.prepareDistillation(cwd, options.entries);
    if (command === 'distill-apply') return api.applyDistillation(cwd, options.batch, await readCards(options.cards));
    if (command === 'distill-refresh') return api.refreshDistillation(cwd);
    if (command === 'distill-read') return api.readKnowledge(cwd);
    return api.inspectDistillation(cwd);
  }
  const api = await import('../src/channel.mjs');
  if (command === 'channel-status') return api.inspectChannel(cwd);
  const adapter = api.createSlackAdapter();
  if (command === 'channel-probe') return api.probeChannel(cwd, adapter);
  return api.tickChannel(cwd, adapter, { dryRun: true });
}

try {
  const options = parseArguments(process.argv.slice(2));
  if (options.command === 'runbook') {
    process.stdout.write(await readRunbook(options.cwd));
  } else {
    const result = await execute(options);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }
} catch (error) {
  process.stderr.write(`agent-twin: ${error.message}\n`);
  process.exitCode = 1;
}
