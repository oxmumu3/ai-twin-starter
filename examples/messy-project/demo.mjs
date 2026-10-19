import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { initWorkspace } from '../../src/workspace.mjs';
import { inventoryMaterials, prepareMaterials, applyMaterials, inspectMaterials, prepareDistillationFromMaterials } from '../../src/materials.mjs';
import { applyDistillation, readKnowledge } from '../../src/distill.mjs';

// Replays explicitly authored semantic proposals over wholly synthetic sources.
// It does not perform model extraction or invent an owner's answers.
export async function runDemo(target) {
  const cwd = resolve(target);
  await mkdir(cwd, { mode: 0o700 }); // Exclusive: preserve any existing project.
  await cp(new URL('./raw/', import.meta.url), cwd, { recursive: true, force: false, errorOnExist: true });
  await writeFile(join(cwd, '.env'), 'DEMO_ONLY_NOT_A_CREDENTIAL=true\n', { mode: 0o600, flag: 'wx' });
  await initWorkspace(cwd);
  const inventory = await inventoryMaterials(cwd, ['.']);
  assert.ok(inventory.entries.some(item => item.path === 'legacy-notes.pdf' && item.kind === 'needs_conversion'));
  assert.equal(inventory.contentRead, false);
  const entries = ['loose-notes.txt', 'old/last-week.md', 'tools/stock-reader.txt', 'handoff.txt'];
  const first = await prepareMaterials(cwd, entries);
  const ref = (batch, path, startLine, endLine = startLine) => ({ sourceId: batch.sources.find(source => source.path === path).sourceId, startLine, endLine });
  const packet = batch => ({
    project: { title: 'Fictional workshop stock summary', summary: 'Prepare read-only weekly stock summaries to identify items needing a count check.', sourceRefs: [ref(batch, 'loose-notes.txt', 1, 2)] },
    materials: [
      { id: 'project-scope', kind: 'background', title: 'Purpose and service scope', summary: 'Weekly stock summaries; stock edits and purchasing require the owner.', sourceRefs: [ref(batch, 'loose-notes.txt', 2, 5)], selectedForDistillation: true },
      { id: 'usable-stock', kind: 'knowledge', title: 'Usable stock definition', summary: 'Counted units minus units reserved for an open repair.', sourceRefs: [ref(batch, 'loose-notes.txt', 3)], selectedForDistillation: true },
      { id: 'old-correction', kind: 'case', title: 'A double-subtraction mistake', summary: 'One old report was corrected after reservations were subtracted twice; it is not a current count or a standing procedure.', sourceRefs: [ref(batch, 'old/last-week.md', 3, 5)], selectedForDistillation: true },
      { id: 'local-reader', kind: 'tool', title: 'Local stock reader', summary: 'An existing local read-only CSV command with explicit input validation; no live workshop connection.', sourceRefs: [ref(batch, 'tools/stock-reader.txt', 1, 6)], selectedForDistillation: true, toolStatus: 'available' },
      { id: 'live-connector', kind: 'tool', title: 'Live stock connector', summary: 'A live stock-system connection still needs to be connected.', sourceRefs: [ref(batch, 'tools/stock-reader.txt', 7)], selectedForDistillation: false, toolStatus: 'needs_connection' },
      { id: 'purchasing', kind: 'tool', title: 'Purchasing automation', summary: 'Would require development and separate authorization.', sourceRefs: [ref(batch, 'tools/stock-reader.txt', 7)], selectedForDistillation: false, toolStatus: 'needs_development' },
      { id: 'existing-bundle', kind: 'bundle', title: 'Incomplete handoff bundle', summary: 'The existing bundle indexes notes, a case and the tool contract but lacks a repeatable review sequence.', sourceRefs: [ref(batch, 'handoff.txt', 1, 5)], selectedForDistillation: false },
    ],
    gaps: [{ id: 'review-rule', description: 'Ask for the repeatable review sequence and stopping rule; the old case does not establish one.' }, { id: 'legacy-format', description: 'The old PDF needs conversion and confirmation before use; it is not selected for this trial.' }],
  });
  const firstPacket = packet(first);
  const firstReceipt = await applyMaterials(cwd, first.batchId, firstPacket);
  assert.equal(firstReceipt.distilled, false);
  // This answer is a labelled, prewritten fictional scenario, not real user testimony.
  await cp(new URL('./follow-up/owner-answer.txt', import.meta.url), join(cwd, 'owner-answer.txt'));
  const second = await prepareMaterials(cwd, [...entries, 'owner-answer.txt']);
  const secondPacket = packet(second);
  secondPacket.materials.push({ id: 'review-sequence', kind: 'decision', title: 'Review and escalation rules', summary: 'Check the time window, definition and reconciliation before explanation; stop on discrepancies and escalate missing evidence or write requests.', sourceRefs: [ref(second, 'owner-answer.txt', 2, 5)], selectedForDistillation: true });
  secondPacket.materials.push({ id: 'weekly-sequence', kind: 'workflow', title: 'Weekly request sequence', summary: 'Identify scope, run a read-only count, reconcile totals and deliver the source plus unresolved gaps.', sourceRefs: [ref(second, 'owner-answer.txt', 4, 5)], selectedForDistillation: true });
  secondPacket.gaps = [{ id: 'legacy-format', description: 'The fictional owner marked the old PDF obsolete and outside this trial; no conversion or verification is claimed.' }];
  const secondReceipt = await applyMaterials(cwd, second.batchId, secondPacket);
  const materialsStatus = await inspectMaterials(cwd);
  assert.equal(materialsStatus.canDistill, true);
  const batch = await prepareDistillationFromMaterials(cwd);
  const cards = [
    { id: 'usable-stock', kind: 'knowledge', title: 'Use the usable-stock definition', content: 'Usable stock subtracts open-repair reservations from counted stock. A change may also reflect receipts or corrections.', when: 'Reading or comparing weekly stock.', limits: 'Does not establish demand or authorize stock edits.', sourceRefs: [ref(batch, 'loose-notes.txt', 3, 5)], status: 'documented' },
    { id: 'reconcile-first', kind: 'judgment', title: 'Reconcile before interpreting', content: 'Check the reporting week and definition, then reconcile totals. Stop a conclusion when totals disagree and inspect duplicates, omissions and repeated subtraction.', when: 'Before explaining a weekly change.', limits: 'Escalate unresolved evidence rather than guessing a cause.', sourceRefs: [ref(batch, 'owner-answer.txt', 2, 3)], status: 'documented' },
    { id: 'weekly-request', kind: 'workflow', title: 'Deliver a checked weekly summary', content: 'Establish scope, use the approved read-only count, verify totals, and deliver a short summary with sources and open gaps.', when: 'A weekly stock-summary request arrives.', limits: 'Purchasing, stock edits and missing evidence go to the owner.', sourceRefs: [ref(batch, 'owner-answer.txt', 4, 5)], status: 'documented' },
    { id: 'stock-reader', kind: 'tool', title: 'Local read-only CSV count', content: 'Use the local stock reader only with an explicit CSV matching its contract; it returns counted, reserved and usable totals.', when: 'Checking a synthetic stock CSV.', limits: 'Local demo only; no live connector, stock edit or purchasing permission.', sourceRefs: [ref(batch, 'tools/stock-reader.txt', 1, 7)], status: 'documented' },
  ];
  const distilled = await applyDistillation(cwd, batch.batchId, cards);
  const knowledge = await readKnowledge(cwd);
  assert.equal(knowledge.cards.length, 4);
  const tool = JSON.parse((await promisify(execFile)(process.execPath, [join(cwd, 'tools/stock-count.mjs'), join(cwd, 'stock.csv')])).stdout);
  assert.deepEqual(tool, { items: 2, counted: 20, reserved: 3, usable: 17 });
  const original = await readFile(join(cwd, 'loose-notes.txt'), 'utf8');
  await writeFile(join(cwd, 'loose-notes.txt'), `${original}A synthetic source revision for the stale check.\n`);
  const staleMaterials = await inspectMaterials(cwd);
  const staleKnowledge = await readKnowledge(cwd);
  assert.equal(staleMaterials.canDistill, false);
  assert.ok(staleKnowledge.cards.length < 4);
  await assert.rejects(prepareDistillationFromMaterials(cwd));
  await writeFile(join(cwd, 'loose-notes.txt'), original);
  assert.equal((await inspectMaterials(cwd)).canDistill, true);
  assert.equal((await readKnowledge(cwd)).cards.length, 4);
  const evidence = { syntheticOnly: true, inventory, initialMaterials: firstReceipt, initialPacket: firstPacket, finalMaterials: secondReceipt, finalPacket: secondPacket, materialsStatus, distilled, cardKinds: knowledge.cards.map(card => card.kind), tool, sourceChangeCheck: { materialsBlocked: !staleMaterials.canDistill, usableCardsAfterChange: staleKnowledge.cards.length, originalContentRestored: true }, realChannelVerified: false, sendingVerified: false, backgroundRunning: false };
  await writeFile(join(cwd, '.agent-twin/demo-receipt.json'), `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
  return evidence;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    if (process.argv.length !== 3) throw new Error('Usage: node examples/messy-project/demo.mjs /absolute/path/to/a-new-directory');
    process.stdout.write(`${JSON.stringify(await runDemo(process.argv[2]), null, 2)}\n`);
  } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
