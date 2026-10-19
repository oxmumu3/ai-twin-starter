#!/usr/bin/env node
import { initWorkspace, inspectWorkspace, readRunbook } from '../src/workspace.mjs';

const usage = 'Usage: agent-twin init|status|runbook [--cwd <existing-directory>]';

function parseArguments(args) {
  const [command, ...options] = args;
  if (!['init', 'status', 'runbook'].includes(command)) throw new Error(usage);
  if (options.length === 0) return { command, cwd: process.cwd() };
  if (options.length !== 2 || options[0] !== '--cwd' || !options[1] || options[1].startsWith('--')) {
    throw new Error(usage);
  }
  return { command, cwd: options[1] };
}

try {
  const { command, cwd } = parseArguments(process.argv.slice(2));
  if (command === 'runbook') {
    process.stdout.write(await readRunbook(cwd));
  } else {
    const result = command === 'init' ? await initWorkspace(cwd) : await inspectWorkspace(cwd);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }
} catch (error) {
  process.stderr.write(`agent-twin: ${error.message}\n`);
  process.exitCode = 1;
}
