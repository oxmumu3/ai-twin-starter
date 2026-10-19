import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function countStock(path) {
  if (typeof path !== 'string' || !path) throw new Error('Pass one explicit CSV path');
  const rows = (await readFile(path, 'utf8')).trim().split(/\r?\n/);
  if (rows.shift() !== 'item,counted,reserved' || !rows.length) throw new Error('Expected item,counted,reserved CSV');
  const seen = new Set();
  const result = { items: 0, counted: 0, reserved: 0, usable: 0 };
  for (const row of rows) {
    const [item, counted, reserved, extra] = row.split(',');
    if (!/^[a-z0-9-]+$/.test(item) || seen.has(item) || extra !== undefined || !/^\d+$/.test(counted ?? '') || !/^\d+$/.test(reserved ?? '')) throw new Error('Invalid or duplicate stock row');
    const n = Number(counted), r = Number(reserved);
    if (!Number.isSafeInteger(n) || !Number.isSafeInteger(r) || r > n || !Number.isSafeInteger(result.counted + n)) throw new Error('Invalid stock totals');
    seen.add(item);
    result.items++; result.counted += n; result.reserved += r; result.usable += n - r;
  }
  return result;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    if (process.argv.length !== 3) throw new Error('Pass one explicit CSV path');
    process.stdout.write(`${JSON.stringify(await countStock(process.argv[2]))}\n`);
  } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
