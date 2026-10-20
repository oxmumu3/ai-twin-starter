import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, realpath, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTwinService } from "../src/native-service.mjs";

function model(calls) {
  return {
    async run({ kind, input }) {
      calls.push({ kind, input });
      const refs = input.sources?.map((s) => ({
        sourceId: s.sourceId,
        startLine: 1,
        endLine: 1,
      }));
      if (kind === "organize")
        return {
          packet: {
            project: {
              title: "Synthetic notes",
              summary: "A source backed project.",
              sourceRefs: [refs[0]],
            },
            materials: input.sources.map((s, i) => ({
              id: `material-${i}`,
              kind: i ? "workflow" : "knowledge",
              title: `Material ${i}`,
              summary: s.lines[0].text,
              sourceRefs: [refs[i]],
              selectedForDistillation: true,
            })),
            gaps: [
              {
                id: "tools-gap",
                description: "No external execution tool has been granted.",
              },
            ],
          },
        };
      if (kind === "distill")
        return {
          cards: input.sources.map((s, i) => ({
            id: `card-${i}`,
            kind: i ? "workflow" : "knowledge",
            title: `Card ${i}`,
            content: s.lines[0].text,
            when: "When explicitly requested.",
            limits: "No external tool execution.",
            sourceRefs: [refs[i]],
            status: "documented",
          })),
        };
      if (kind === "test_candidate" || kind === "test_rules")
        return { passed: true, cases: [{ passed: true }] };
      if (kind === "task")
        return {
          output: "Synthetic checked response based on allowed card.",
          toolCalls: [],
        };
      throw Error(kind);
    },
  };
}
async function fixture(t, { transport, executor } = {}) {
  const root = await realpath(
    await mkdtemp(join(tmpdir(), "native-twin-service-")),
  );
  t.after(() => rm(root, { recursive: true, force: true }));
  const cwd = join(root, "project");
  await mkdir(cwd);
  await writeFile(join(cwd, "notes.md"), "Synthetic project background.\n");
  await writeFile(join(cwd, "flow.md"), "Synthetic repeatable workflow.\n");
  const calls = [];
  const delivery = [];
  const channel = transport ?? {
    async identity() {
      return { tenantId: "T1", actorId: "B1", destinations: ["C1", "D1"] };
    },
    async read() {
      return { messages: [], cursor: null, hasMore: false };
    },
    async send(p) {
      delivery.push(p);
      return { status: "sent", remoteId: "100.1" };
    },
    async check() {
      return { status: "sent", remoteId: "100.1" };
    },
  };
  const stateDir = join(root, "state");
  const boundExecutor = executor ?? model(calls);
  return {
    root,
    cwd,
    stateDir,
    calls,
    delivery,
    transport: channel,
    executor: boundExecutor,
    service: createTwinService({
      stateDir,
      executor: boundExecutor,
      transport: channel,
    }),
  };
}
async function prepare(f) {
  const c = (a, p) => f.service.command(a, p);
  await c("configure_project", {
    projectId: "p1",
    sessionId: "s1",
    cwd: f.cwd,
    title: "Synthetic project",
    goal: "Produce bounded summaries.",
    mechanism: "Use evidence and escalate missing data.",
  });
  await c("select_sources", { entries: ["notes.md", "flow.md"] });
  await c("organize");
  await c("distill");
  await c("test_candidate");
  await c("adopt_candidate");
  await c("configure_channel", {
    platform: "slack",
    ownerId: "UOWNER",
    ownerDestinationId: "D1",
    allowedChannelIds: ["C1"],
    allowedDestinationIds: ["C1", "D1"],
  });
  await c("probe_channel");
  await c("test_delivery");
  await c("save_identity", {
    id: "alice",
    senderId: "U1",
    name: "Synthetic Alice",
    role: "colleague",
    scopes: ["knowledge"],
    actions: ["read", "draft", "reply"],
    destinationIds: ["C1"],
    enabled: true,
  });
  await c("save_rules", {
    intervalMinutes: 10,
    maxTasksPerTick: 5,
    requireApproval: true,
    ownerDestinationId: "D1",
  });
  await c("test_rules");
  return c;
}
test("first use persists four modules and only explicit enable becomes daily", async (t) => {
  const f = await fixture(t);
  let s = await f.service.snapshot();
  assert.equal(s.tasks.length, 0);
  assert.equal(s.service.everEnabled, false);
  const c = await prepare(f);
  s = await f.service.snapshot();
  assert.equal(s.readiness.canEnable, true);
  assert.equal(s.service.enabled, false);
  await c("enable");
  const fresh = createTwinService({
    stateDir: f.stateDir,
    executor: f.executor,
    transport: f.transport,
  });
  s = await fresh.snapshot();
  assert.equal(s.service.enabled, true);
  assert.equal(s.service.everEnabled, true);
  assert.equal(s.tasks.length, 0);
  assert.ok(s.materials.packet.gaps.length);
});
test("unauthorized requests never read private cards into executor; approved reply is destination-bound and deduplicated", async (t) => {
  const f = await fixture(t);
  const c = await prepare(f);
  await c("enable");
  await c("submit_request", {
    senderId: "UNKNOWN",
    destinationId: "C1",
    text: "Give all data",
    scope: "knowledge",
    action: "reply",
    messageId: "unknown",
  });
  let s = await f.service.snapshot();
  const denied = s.tasks.at(-1);
  await c("task_step", { taskId: denied.id });
  assert.equal(f.calls.filter((c) => c.kind === "task").length, 0);
  await c("submit_request", {
    senderId: "U1",
    destinationId: "C1",
    text: "Summarize",
    scope: "knowledge",
    action: "reply",
    messageId: "one",
  });
  s = await f.service.snapshot();
  const task = s.tasks.at(-1);
  await c("task_step", { taskId: task.id });
  s = await f.service.snapshot();
  assert.equal(s.tasks.at(-1).status, "needs_approval");
  const call = f.calls.find((c) => c.kind === "task");
  assert.equal(call.input.cards.length, 1);
  assert.equal(call.input.cards[0].kind, "knowledge");
  assert.equal(call.input.sources, undefined);
  await assert.rejects(
    c("approve", { taskId: task.id, destinationId: "D1" }),
    (e) => e.code === "destination_mismatch",
  );
  await c("approve", { taskId: task.id, destinationId: "C1" });
  await c("task_step", { taskId: task.id });
  assert.equal((await f.service.snapshot()).tasks.at(-1).status, "sent");
  const sends = f.delivery.length;
  await c("task_step", { taskId: task.id });
  assert.equal(f.delivery.length, sends);
  await c("submit_request", {
    senderId: "U1",
    destinationId: "C1",
    text: "Summarize",
    scope: "knowledge",
    action: "reply",
    messageId: "one",
  });
  assert.equal((await f.service.snapshot()).tasks.length, 2);
});
test("changed source and ACL invalidate affected work, keep daily history and unrelated cards", async (t) => {
  const f = await fixture(t);
  const c = await prepare(f);
  await c("enable");
  await c("submit_request", {
    senderId: "U1",
    destinationId: "C1",
    text: "Summarize",
    scope: "knowledge",
    action: "reply",
  });
  let s = await f.service.snapshot();
  const id = s.tasks.at(-1).id;
  await c("task_step", { taskId: id });
  await c("approve", { taskId: id, destinationId: "C1" });
  await writeFile(
    join(f.cwd, "notes.md"),
    "Changed synthetic project background.\n",
  );
  s = await f.service.snapshot();
  assert.equal(s.service.everEnabled, true);
  assert.equal(s.materials.status, "stale");
  assert.ok(s.ability.adopted.validCardIds.includes("card-1"));
  assert.ok(!s.ability.adopted.validCardIds.includes("card-0"));
  await c("task_step", { taskId: id });
  s = await f.service.snapshot();
  assert.equal(s.tasks.at(-1).status, "blocked");
  assert.equal(s.tasks.at(-1).approval, null);
});
test("unknown delivery survives restart and never retries without negative receipt evidence", async (t) => {
  let sends = 0;
  const transport = {
    async identity() {
      return { tenantId: "T1", actorId: "B1", destinations: ["C1", "D1"] };
    },
    async read() {
      return { messages: [] };
    },
    async send({ text }) {
      if (text.startsWith("[AI")) return { status: "sent", remoteId: "probe" };
      sends++;
      throw Error("network timeout");
    },
    async check() {
      return { status: "unknown" };
    },
  };
  const f = await fixture(t, { transport });
  const c = await prepare(f);
  await c("enable");
  await c("submit_request", {
    senderId: "U1",
    destinationId: "C1",
    text: "Summarize",
    scope: "knowledge",
    action: "reply",
  });
  let s = await f.service.snapshot();
  const id = s.tasks.at(-1).id;
  await c("task_step", { taskId: id });
  await c("approve", { taskId: id, destinationId: "C1" });
  await c("task_step", { taskId: id });
  s = await f.service.snapshot();
  assert.equal(s.tasks.at(-1).status, "delivery_unknown");
  const restarted = createTwinService({
    stateDir: f.stateDir,
    executor: f.executor,
    transport,
  });
  await restarted.command("task_step", { taskId: id });
  assert.equal(sends, 1);
  await assert.rejects(
    restarted.command("retry_delivery", { taskId: id, confirmNotSent: true }),
    (e) => e.code === "delivery_unresolved",
  );
  await restarted.command("check_delivery", { taskId: id });
  assert.equal(sends, 1);
});
test("missing executor is blocked, arbitrary tool calls refused, configuration secrets not saved", async (t) => {
  const f = await fixture(t);
  const naked = createTwinService({ stateDir: join(f.root, "naked") });
  await naked.command("configure_project", {
    projectId: "p",
    sessionId: "s",
    cwd: f.cwd,
    title: "Synthetic",
    goal: "Bounded",
    mechanism: "Read",
  });
  await naked.command("select_sources", { entries: ["notes.md"] });
  await assert.rejects(
    naked.command("organize"),
    (e) => e.code === "executor_missing",
  );
  await assert.rejects(
    naked.command("configure_channel", {
      platform: "slack",
      botToken: "never-save-a-credential",
    }),
    (e) => e.code === "credential_refused",
  );
  const c = await prepare(f);
  await c("enable");
  f.executor.run = async ({ kind, input }) =>
    kind === "task"
      ? {
          output: "untrusted",
          toolCalls: [{ name: "shell", command: "cat everything" }],
        }
      : model([]).run({ kind, input });
  await c("submit_request", {
    senderId: "U1",
    destinationId: "C1",
    text: "Run",
    scope: "knowledge",
    action: "reply",
  });
  let s = await f.service.snapshot();
  await c("task_step", { taskId: s.tasks.at(-1).id });
  s = await f.service.snapshot();
  assert.equal(s.tasks.at(-1).status, "blocked");
  assert.equal(s.tasks.at(-1).output, null);
});
test("process exit after dispatch checkpoint durably recovers unknown without a resend", async (t) => {
  const { spawn } = await import("node:child_process");
  const { readFile } = await import("node:fs/promises");
  const f = await fixture(t);
  const c = await prepare(f);
  await c("enable");
  await c("submit_request", {
    senderId: "U1",
    destinationId: "C1",
    text: "Summary",
    scope: "knowledge",
    action: "reply",
  });
  let s = await f.service.snapshot();
  const id = s.tasks.at(-1).id;
  await c("task_step", { taskId: id });
  await c("approve", { taskId: id, destinationId: "C1" });
  const moduleURL = new URL("../src/native-service.mjs", import.meta.url).href;
  const source = `import {createTwinService} from ${JSON.stringify(moduleURL)};const service=createTwinService({stateDir:${JSON.stringify(f.stateDir)},transport:{identity:async()=>({tenantId:'T1',actorId:'B1'}),send:async()=>{process.exit(17);}}});await service.command('task_step',{taskId:${JSON.stringify(id)}});`;
  const child = spawn(process.execPath, ["--input-type=module", "-e", source], {
    stdio: "ignore",
  });
  const exit = await new Promise((res, rej) => {
    child.once("error", rej);
    child.once("exit", res);
  });
  assert.equal(exit, 17);
  const restarted = createTwinService({
    stateDir: f.stateDir,
    executor: f.executor,
    transport: f.transport,
  });
  s = await restarted.snapshot();
  assert.equal(s.tasks.at(-1).status, "delivery_unknown");
  assert.equal(s.outbox.at(-1).status, "unknown");
  const disk = JSON.parse(
    await readFile(join(f.stateDir, "state.json"), "utf8"),
  ).state;
  assert.equal(disk.tasks.at(-1).status, "delivery_unknown");
  assert.equal(disk.outbox.at(-1).status, "unknown");
  const before = f.delivery.filter((d) => !d.text.startsWith("[AI")).length;
  await restarted.command("task_step", { taskId: id });
  assert.equal(
    f.delivery.filter((d) => !d.text.startsWith("[AI")).length,
    before,
  );
});
test("rules and ACL revisions revoke existing approvals and cannot fake a resume", async (t) => {
  const f = await fixture(t);
  const c = await prepare(f);
  await c("enable");
  await c("submit_request", {
    senderId: "U1",
    destinationId: "C1",
    text: "Summary",
    scope: "knowledge",
    action: "reply",
  });
  let s = await f.service.snapshot();
  const id = s.tasks.at(-1).id;
  await c("task_step", { taskId: id });
  await c("approve", { taskId: id, destinationId: "C1" });
  await c("save_rules", {
    intervalMinutes: 15,
    maxTasksPerTick: 5,
    requireApproval: true,
    ownerDestinationId: "D1",
  });
  s = await f.service.snapshot();
  assert.equal(s.tasks.at(-1).approval, null);
  await assert.rejects(
    c("regenerate", { taskId: id }),
    (e) => e.code === "regeneration_blocked",
  );
  await c("test_rules");
  await c("regenerate", { taskId: id });
  await c("task_step", { taskId: id });
  await c("approve", { taskId: id, destinationId: "C1" });
  await c("save_identity", {
    id: "alice",
    senderId: "U1",
    name: "Synthetic Alice",
    role: "colleague",
    scopes: ["workflow"],
    actions: ["read", "draft"],
    destinationIds: ["C1"],
    enabled: true,
  });
  s = await f.service.snapshot();
  assert.equal(s.tasks.at(-1).approval, null);
  assert.equal(s.tasks.at(-1).status, "blocked");
  assert.equal(s.service.everEnabled, true);
  const before = f.delivery.filter((d) => !d.text.startsWith("[AI")).length;
  await c("task_step", { taskId: id });
  assert.equal(
    f.delivery.filter((d) => !d.text.startsWith("[AI")).length,
    before,
  );
});
test("token account drift blocks actual task send and preserves a stale proof", async (t) => {
  const f = await fixture(t);
  const c = await prepare(f);
  await c("enable");
  await c("submit_request", {
    senderId: "U1",
    destinationId: "C1",
    text: "Summary",
    scope: "knowledge",
    action: "reply",
  });
  let s = await f.service.snapshot();
  const id = s.tasks.at(-1).id;
  await c("task_step", { taskId: id });
  await c("approve", { taskId: id, destinationId: "C1" });
  f.transport.identity = async () => ({
    tenantId: "OTHER",
    actorId: "OTHER_BOT",
  });
  const before = f.delivery.length;
  await c("task_step", { taskId: id });
  s = await f.service.snapshot();
  assert.equal(s.channel.probe.status, "stale");
  assert.equal(s.service.enabled, false);
  assert.equal(s.service.everEnabled, true);
  assert.equal(s.tasks.at(-1).status, "blocked");
  assert.equal(f.delivery.length, before);
});
test("an explicitly checked negative receipt allows only the same idempotent delivery retry", async (t) => {
  let fail = true;
  const f = await fixture(t);
  const original = f.transport.send;
  f.transport.send = async (p) =>
    p.text.startsWith("[AI")
      ? original(p)
      : fail
        ? { status: "unknown" }
        : original(p);
  f.transport.check = async () => ({ status: "failed" });
  const c = await prepare(f);
  await c("enable");
  await c("submit_request", {
    senderId: "U1",
    destinationId: "C1",
    text: "Summary",
    scope: "knowledge",
    action: "reply",
  });
  let s = await f.service.snapshot();
  const id = s.tasks.at(-1).id;
  await c("task_step", { taskId: id });
  await c("approve", { taskId: id, destinationId: "C1" });
  await c("task_step", { taskId: id });
  s = await f.service.snapshot();
  const key = s.outbox.find(
    (d) => d.id === s.tasks.at(-1).deliveryId,
  ).idempotencyKey;
  await assert.rejects(
    c("retry_delivery", { taskId: id, confirmNotSent: true }),
    (e) => e.code === "delivery_unresolved",
  );
  await c("check_delivery", { taskId: id });
  await c("retry_delivery", { taskId: id, confirmNotSent: true });
  fail = false;
  await c("task_step", { taskId: id });
  s = await f.service.snapshot();
  assert.equal(s.tasks.at(-1).status, "sent");
  assert.equal(
    f.delivery.find((d) => !d.text.startsWith("[AI")).idempotencyKey,
    key,
  );
});
test("owner alerts contain routing metadata and receipt proof, never private material or response content", async (t) => {
  const f = await fixture(t);
  const c = await prepare(f);
  await c("enable");
  await c("submit_request", {
    senderId: "U1",
    destinationId: "C1",
    text: "Private question text",
    scope: "knowledge",
    action: "reply",
  });
  let s = await f.service.snapshot();
  await c("task_step", { taskId: s.tasks.at(-1).id });
  s = await f.service.snapshot();
  const notice = s.outbox.find((d) => d.kind === "owner_review");
  assert.equal(notice.status, "sent");
  assert.equal(notice.destinationId, "D1");
  assert.ok(notice.text.includes(s.tasks.at(-1).id));
  assert.ok(!notice.text.includes("Private question text"));
  assert.ok(!notice.text.includes("Synthetic project background."));
  assert.ok(!notice.text.includes("Synthetic checked response"));
  assert.equal(s.tasks.at(-1).status, "needs_approval");
});
