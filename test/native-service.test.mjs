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
      if (kind === "test_candidate")
        return {
          passed: true,
          cases: input.cards.map((card) => ({ cardId: card.id, passed: true })),
        };
      if (kind === "test_rules")
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
  // Service lifecycle fixtures model an empty, already bounded read transport.
  // Real native cursor initialization is tested below with NativeSlack itself.
  const read = channel.read;
  channel.read = async (config, options = {}) => {
    const result = await read(config, options);
    return {
      ...result,
      cursor: result.cursor ?? options.cursor ?? { syntheticBaseline: true },
    };
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
  assert.equal(
    f.calls.filter((c) => c.kind === "task" && c.input.request.scope).length,
    0,
  );
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
  const call = f.calls.find((c) => c.kind === "task" && c.input.request.scope);
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
test("multi-scope inbound routing receives only request and granted scope IDs and reaches a real reply", async (t) => {
  const f = await fixture(t),
    c = await prepare(f);
  await c("save_identity", {
    id: "alice",
    senderId: "U1",
    name: "Alice",
    role: "colleague",
    scopes: ["knowledge", "workflow"],
    actions: ["read", "draft", "reply"],
    destinationIds: ["C1"],
    enabled: true,
  });
  await c("save_rules", {
    intervalMinutes: 10,
    maxTasksPerTick: 5,
    requireApproval: false,
    ownerDestinationId: "D1",
  });
  await c("test_rules");
  await c("enable");
  const base = f.executor.run;
  f.executor.run = async (payload) => {
    if (payload.kind === "route") {
      f.calls.push(payload);
      return { scope: "knowledge" };
    }
    return base(payload);
  };
  f.transport.read = async () => ({
    messages: [
      {
        senderId: "U1",
        destinationId: "C1",
        text: "What is the project background?",
        scope: null,
        action: "reply",
        messageId: "inbound-multi",
      },
    ],
    cursor: { page: 1 },
  });
  await c("tick");
  let s = await f.service.snapshot();
  assert.equal(s.tasks.at(-1).status, "ready");
  const route = f.calls.find((call) => call.kind === "route");
  assert.deepEqual(Object.keys(route.input).sort(), [
    "allowedScopes",
    "request",
  ]);
  assert.deepEqual(route.input.allowedScopes, ["knowledge", "workflow"]);
  assert.equal(route.input.cards, undefined);
  assert.equal(
    f.calls.find((call) => call.kind === "task" && call.input.request.scope)
      .input.cards.length,
    1,
  );
  await c("tick");
  s = await f.service.snapshot();
  assert.equal(s.tasks.at(-1).status, "sent");
  assert.equal(f.calls.filter((call) => call.kind === "route").length, 1);
  assert.equal(s.tasks.length, 1);
});
test("routing rejects unknown, expired, unreadable identities and malformed or ungranted model choices", async (t) => {
  const f = await fixture(t),
    c = await prepare(f);
  await c("save_identity", {
    id: "alice",
    senderId: "U1",
    name: "Alice",
    role: "colleague",
    scopes: ["knowledge", "workflow"],
    actions: ["read", "draft", "reply"],
    destinationIds: ["C1"],
    enabled: true,
  });
  await c("test_rules");
  await c("enable");
  let choice = { scope: "outside-grant" };
  let routeCalls = 0;
  const base = f.executor.run;
  f.executor.run = async (payload) =>
    payload.kind === "route" ? (routeCalls++, choice) : base(payload);
  let sender = "U1",
    messageId = "bad-route-1";
  f.transport.read = async () => ({
    messages: [
      {
        senderId: sender,
        destinationId: "C1",
        text: "Route this request",
        scope: null,
        messageId,
      },
    ],
    cursor: { messageId },
  });
  await c("tick");
  let s = await f.service.snapshot();
  assert.equal(s.tasks.at(-1).status, "blocked");
  assert.equal(
    f.calls.filter((call) => call.kind === "task" && call.input.request.scope)
      .length,
    0,
  );
  choice = { scope: "knowledge", extra: "malformed" };
  messageId = "bad-route-2";
  await c("tick");
  assert.equal(routeCalls, 2);
  sender = "UNKNOWN";
  messageId = "unknown-route";
  await c("tick");
  assert.equal(routeCalls, 2);
  await c("save_identity", {
    id: "alice",
    senderId: "U1",
    name: "Alice",
    role: "colleague",
    scopes: ["knowledge", "workflow"],
    actions: ["draft", "reply"],
    destinationIds: ["C1"],
    enabled: true,
  });
  sender = "U1";
  messageId = "unreadable-route";
  await c("tick");
  assert.equal(routeCalls, 2);
  await c("save_identity", {
    id: "alice",
    senderId: "U1",
    name: "Alice",
    role: "colleague",
    scopes: ["knowledge", "workflow"],
    actions: ["read", "draft", "reply"],
    destinationIds: ["C1"],
    enabled: true,
    expiresAt: "2000-01-01T00:00:00.000Z",
  });
  messageId = "expired-route";
  await c("tick");
  assert.equal(routeCalls, 2);
});
test("single-scope inbound skips routing and channel coverage gaps pause without losing its cursor", async (t) => {
  const f = await fixture(t),
    c = await prepare(f);
  await c("enable");
  f.transport.read = async () => ({
    messages: [
      {
        senderId: "U1",
        destinationId: "C1",
        text: "Summarize",
        scope: null,
        messageId: "single",
      },
    ],
    cursor: { page: 1 },
  });
  await c("tick");
  let s = await f.service.snapshot();
  assert.equal(s.tasks.at(-1).status, "needs_approval");
  assert.equal(f.calls.filter((call) => call.kind === "route").length, 0);
  f.transport.read = async () => ({
    messages: [],
    cursor: { page: 999 },
    gaps: [
      {
        code: "thread_permission_required",
        message: "raw unsafe details must not be retained",
      },
    ],
    threadCoverage: { tracked: 1, limit: 20, status: "gap" },
  });
  await c("tick");
  s = await f.service.snapshot();
  assert.equal(s.service.enabled, false);
  assert.equal(s.service.everEnabled, true);
  assert.deepEqual(s.channel.cursor, { page: 1 });
  assert.equal(s.readiness.channels, false);
  assert.equal(s.channel.gaps[0].code, "thread_permission_required");
  assert.ok(!s.channel.gaps[0].message.includes("unsafe"));
});
test("replayed sent messages preserve terminal evidence after source changes and cannot regenerate or resend", async (t) => {
  const f = await fixture(t),
    c = await prepare(f);
  await c("enable");
  const request = {
    senderId: "U1",
    destinationId: "C1",
    text: "Summary",
    scope: "knowledge",
    action: "reply",
    messageId: "terminal-replay",
  };
  await c("submit_request", request);
  let s = await f.service.snapshot();
  const id = s.tasks.at(-1).id;
  await c("task_step", { taskId: id });
  await c("approve", { taskId: id, destinationId: "C1" });
  await c("task_step", { taskId: id });
  assert.equal((await f.service.snapshot()).tasks.at(-1).status, "sent");
  await writeFile(
    join(f.cwd, "notes.md"),
    "Changed source after a sent reply.\n",
  );
  await c("submit_request", request);
  s = await f.service.snapshot();
  assert.equal(s.tasks.at(-1).status, "sent");
  f.transport.read = async () => ({
    messages: [{ ...request, tenantId: "T1" }],
  });
  await c("tick");
  s = await f.service.snapshot();
  assert.equal(s.tasks.at(-1).status, "sent");
  await assert.rejects(
    c("regenerate", { taskId: id }),
    (e) => e.code === "delivery_unresolved",
  );
  await assert.rejects(
    c("deny", { taskId: id }),
    (e) => e.code === "delivery_already_attempted",
  );
  const before = f.delivery.filter((d) => !d.text.startsWith("[AI")).length;
  await c("task_step", { taskId: id });
  assert.equal(
    f.delivery.filter((d) => !d.text.startsWith("[AI")).length,
    before,
  );
});
test("project structure is visible to inventory and enters selected organization sources", async (t) => {
  const f = await fixture(t),
    c = (a, p) => f.service.command(a, p);
  await c("configure_project", {
    projectId: "p1",
    sessionId: "s1",
    cwd: f.cwd,
    title: "Structured project",
    goal: "A stated owner goal",
    mechanism: "A stated owner mechanism",
  });
  let s = await f.service.snapshot();
  assert.equal(s.project.structure.root, "twin-project");
  assert.ok(s.project.structure.created.includes("PROJECT.md"));
  await c("inventory", { roots: ["twin-project"] });
  s = await f.service.snapshot();
  assert.ok(
    s.materials.inventory.entries.some(
      (entry) =>
        entry.path === "twin-project/PROJECT.md" && entry.kind === "candidate",
    ),
  );
  await c("select_sources", { entries: ["twin-project/PROJECT.md"] });
  await c("organize");
  s = await f.service.snapshot();
  assert.equal(s.materials.status, "ready");
  assert.equal(
    f.calls.find((call) => call.kind === "organize").input.sources[0].path,
    "twin-project/PROJECT.md",
  );
});
test("candidate trial generates an inspectable draft without sending or enabling, and rejects tool calls", async (t) => {
  const f = await fixture(t),
    c = (a, p) => f.service.command(a, p);
  await c("configure_project", {
    projectId: "p1",
    sessionId: "s1",
    cwd: f.cwd,
    title: "Trial project",
    goal: "Produce summaries",
    mechanism: "Use sources",
  });
  await c("select_sources", { entries: ["notes.md", "flow.md"] });
  await c("organize");
  await c("distill");
  await c("test_candidate", { prompt: "Give a bounded project example" });
  let s = await f.service.snapshot();
  assert.equal(s.ability.candidate.test.passed, true);
  assert.equal(
    s.ability.candidate.test.prompt,
    "Give a bounded project example",
  );
  assert.ok(s.ability.candidate.test.output.length);
  assert.equal(s.service.enabled, false);
  assert.equal(s.service.everEnabled, false);
  assert.equal(s.tasks.length, 0);
  assert.equal(s.outbox.length, 0);
  assert.equal(f.delivery.length, 0);
  const trial = f.calls.find((call) => call.kind === "task");
  assert.equal(trial.input.request.action, "draft");
  assert.equal(trial.input.sources, undefined);
  assert.equal(trial.input.materials, undefined);
  assert.deepEqual(trial.input.limits, {
    toolsAllowed: [],
    externalSend: false,
  });
  const base = f.executor.run;
  f.executor.run = async (p) =>
    p.kind === "task"
      ? {
          output: "Should not be accepted",
          toolCalls: [{ name: "shell", command: "unsafe" }],
        }
      : base(p);
  await c("test_candidate");
  s = await f.service.snapshot();
  assert.equal(s.ability.candidate.test.passed, false);
  assert.equal(s.ability.candidate.test.output, null);
  assert.equal(s.ability.candidate.test.reason, "tool_execution_not_granted");
  await assert.rejects(
    c("adopt_candidate"),
    (e) => e.code === "candidate_untested",
  );
  f.executor.run = async (p) => (p.kind === "task" ? {} : base(p));
  await c("test_candidate");
  s = await f.service.snapshot();
  assert.equal(s.ability.candidate.test.passed, false);
  assert.equal(s.ability.candidate.test.output, null);
});
test("uncertain task receipt checks preserve the original thread destination", async (t) => {
  const f = await fixture(t),
    c = await prepare(f);
  const original = f.transport.send;
  f.transport.send = async (p) =>
    p.text.startsWith("[AI") ? original(p) : { status: "unknown" };
  let checked;
  f.transport.check = async (p) => ((checked = p), { status: "unknown" });
  await c("enable");
  await c("submit_request", {
    senderId: "U1",
    destinationId: "C1",
    text: "A threaded question",
    scope: "knowledge",
    action: "reply",
    threadId: "1710000000.000001",
  });
  let s = await f.service.snapshot();
  const id = s.tasks.at(-1).id;
  await c("task_step", { taskId: id });
  await c("approve", { taskId: id, destinationId: "C1" });
  await c("task_step", { taskId: id });
  await c("check_delivery", { taskId: id });
  assert.equal(checked.threadId, "1710000000.000001");
  s = await f.service.snapshot();
  assert.equal(
    s.outbox.find((entry) => entry.id === s.tasks.at(-1).deliveryId).threadId,
    "1710000000.000001",
  );
});
async function nativeInbox(t, ids = ["C1"]) {
  const { createNativeSlack } = await import("../src/native-slack.mjs");
  const calls = [];
  const inbox = new Map(
    ids.map((id, index) => [
      id,
      [
        {
          type: "message",
          user: "U1",
          text: `Old before enable ${id}`,
          ts: `${1000 + index * 100}.000001`,
        },
      ],
    ]),
  );
  let sent = 9000;
  const connection = {
    tenantId: "T1",
    actorId: "UBOT",
    credential: "synthetic-test-credential",
    onHistory: null,
  };
  const transport = createNativeSlack({
    readConfig: () => ({ slackBotToken: connection.credential }),
    fetchImpl: async (url, init) => {
      const method = url.split("/").at(-1),
        params = Object.fromEntries(new URLSearchParams(init.body));
      calls.push({ method, params });
      if (method === "auth.test")
        return Response.json({
          ok: true,
          team_id: connection.tenantId,
          user_id: connection.actorId,
          bot_id: "BBOT",
        });
      if (method === "conversations.info")
        return Response.json({
          ok: true,
          channel: {
            id: params.channel,
            is_member: true,
            ...(params.channel === "D1" ? { is_im: true, user: "UOWNER" } : {}),
          },
        });
      if (method === "conversations.history") {
        const items = (inbox.get(params.channel) ?? [])
          .filter((m) => !params.oldest || Number(m.ts) > Number(params.oldest))
          .sort((a, b) => Number(b.ts) - Number(a.ts));
        const limit = Number(params.limit);
        connection.onHistory?.({ channelId: params.channel, params });
        return Response.json({
          ok: true,
          messages: items.slice(0, limit),
          has_more: items.length > limit,
          ...(items.length > limit
            ? { response_metadata: { next_cursor: "another-page" } }
            : {}),
        });
      }
      if (method === "conversations.replies")
        return Response.json({ ok: true, messages: [], has_more: false });
      if (method === "chat.postMessage")
        return Response.json({
          ok: true,
          channel: params.channel,
          ts: `${sent++}.000001`,
        });
      throw Error(`Unexpected Slack method ${method}`);
    },
  });
  t.after(() => transport.close());
  const f = await fixture(t, { transport });
  const c = await prepare(f);
  if (ids.length > 1) {
    await c("configure_channel", {
      platform: "slack",
      ownerId: "UOWNER",
      ownerDestinationId: "D1",
      allowedChannelIds: ids,
      allowedDestinationIds: [...ids, "D1"],
    });
    await c("probe_channel");
    await c("test_delivery");
    await c("save_identity", {
      id: "alice",
      senderId: "U1",
      name: "Alice",
      role: "colleague",
      scopes: ["knowledge"],
      actions: ["read", "draft", "reply"],
      destinationIds: ids,
      enabled: true,
    });
    await c("test_rules");
  }
  return { f, c, calls, inbox, connection };
}
test("real Slack transport seeds every inbound channel at explicit enable so the first new request is never baselined away", async (t) => {
  const ids = ["C1", "C2", "C3"],
    { f, c, calls, inbox } = await nativeInbox(t, ids);
  const before = calls.length;
  await c("enable");
  let s = await f.service.snapshot();
  assert.deepEqual(Object.keys(s.channel.cursor?.channels ?? {}).sort(), ids);
  assert.deepEqual(
    calls
      .slice(before)
      .filter((call) => call.method === "conversations.history")
      .map((call) => call.params.channel),
    ids,
  );
  assert.ok(
    calls
      .slice(before)
      .filter((call) => call.method === "conversations.history")
      .every((call) => call.params.oldest === undefined),
  );
  for (let i = 0; i < ids.length; i++)
    inbox.get(ids[i]).push({
      type: "message",
      user: "U1",
      text: `First request after enable ${ids[i]}`,
      ts: `${1001 + i * 100}.000001`,
    });
  await c("tick");
  s = await f.service.snapshot();
  assert.equal(s.tasks.length, 1);
  assert.equal(s.tasks[0].request.text, "First request after enable C1");
  for (let i = 0; i < ids.length * 2; i++) await c("tick");
  s = await f.service.snapshot();
  assert.equal(s.tasks.length, ids.length);
  assert.ok(
    s.tasks.every((task) =>
      task.request.text.startsWith("First request after enable"),
    ),
  );
});
test("real Slack re-probe and resume preserve the last committed cursor and do not consume pending requests", async (t) => {
  const { f, c, calls, inbox } = await nativeInbox(t);
  await c("enable");
  const start = (await f.service.snapshot()).channel.cursor;
  await c("pause");
  inbox.get("C1").push({
    type: "message",
    user: "U1",
    text: "Pending while paused",
    ts: "1001.000001",
  });
  await c("probe_channel");
  assert.deepEqual((await f.service.snapshot()).channel.cursor, start);
  await c("test_rules");
  const before = calls.filter(
    (call) => call.method === "conversations.history",
  ).length;
  await c("enable");
  assert.equal(
    calls.filter((call) => call.method === "conversations.history").length,
    before,
  );
  inbox.get("C1").push({
    type: "message",
    user: "U1",
    text: "First after resume",
    ts: "1002.000001",
  });
  await c("tick");
  const s = await f.service.snapshot();
  assert.deepEqual(
    s.tasks.map((task) => task.request.text),
    ["Pending while paused", "First after resume"],
  );
});
test("an enable-time coverage gap is persisted and never turns the service on", async (t) => {
  const f = await fixture(t),
    c = await prepare(f);
  f.transport.read = async () => ({
    messages: [],
    cursor: { seed: true },
    gaps: [
      { code: "thread_permission_required", message: "raw adapter details" },
    ],
    threadCoverage: { tracked: 0, status: "gap" },
  });
  const s = await c("enable");
  assert.equal(s.service.enabled, false);
  assert.equal(s.service.everEnabled, false);
  assert.equal(s.channel.cursor, null);
  assert.equal(s.channel.baseline, undefined);
  assert.equal(s.channel.gaps[0].code, "thread_permission_required");
  assert.equal(s.readiness.channels, false);
});
test("ten-channel enable performs only two complete identity and destination checks around baseline initialization", async (t) => {
  const ids = Array.from({ length: 10 }, (_, i) => `C${i + 1}`),
    { c, calls } = await nativeInbox(t, ids);
  const before = calls.length;
  await c("enable");
  const enable = calls.slice(before);
  assert.equal(
    enable.filter((call) => call.method === "conversations.history").length,
    10,
  );
  assert.equal(enable.filter((call) => call.method === "auth.test").length, 2);
  assert.equal(
    enable.filter((call) => call.method === "conversations.info").length,
    22,
  );
  const history = enable
      .map((call, i) => (call.method === "conversations.history" ? i : -1))
      .filter((i) => i >= 0),
    auth = enable
      .map((call, i) => (call.method === "auth.test" ? i : -1))
      .filter((i) => i >= 0);
  assert.ok(auth[0] < history[0]);
  assert.ok(auth[1] > history.at(-1));
});
test("identity drift on the final baseline read is detected before any enable or cursor commit", async (t) => {
  const { f, c, calls, connection } = await nativeInbox(t, ["C1", "C2", "C3"]);
  connection.onHistory = ({ channelId }) => {
    if (channelId === "C3") connection.tenantId = "T2";
  };
  const before = calls.length;
  await assert.rejects(c("enable"), (e) =>
    ["identity_changed", "channel_identity_changed"].includes(e.code),
  );
  const s = await f.service.snapshot();
  assert.equal(s.service.enabled, false);
  assert.equal(s.service.everEnabled, false);
  assert.equal(s.channel.cursor, null);
  assert.equal(s.channel.baseline, undefined);
  assert.equal(
    calls
      .slice(before)
      .filter((call) => call.method === "conversations.history").length,
    3,
  );
});
test("editing an identity preserves omitted expiration, keeps expired requests denied, and clears only with explicit empty text", async (t) => {
  const f = await fixture(t),
    c = await prepare(f);
  await c("enable");
  const identity = {
    id: "alice",
    senderId: "U1",
    name: "Alice",
    role: "colleague",
    scopes: ["knowledge"],
    actions: ["read", "draft", "reply"],
    destinationIds: ["C1"],
    enabled: true,
  };
  const expiry = "2000-01-01T00:00:00.000Z";
  await c("save_identity", { ...identity, expiresAt: expiry });
  await c("save_identity", { ...identity, name: "Alice edited" });
  let s = await f.service.snapshot();
  assert.equal(s.identities.find((i) => i.id === "alice").expiresAt, expiry);
  await c("submit_request", {
    senderId: "U1",
    destinationId: "C1",
    text: "Request after expiration",
    scope: "knowledge",
    action: "reply",
  });
  s = await f.service.snapshot();
  assert.equal(s.tasks.at(-1).status, "blocked");
  assert.equal(s.tasks.at(-1).reason, "identity_expired");
  const before = f.calls.filter(
    (call) => call.kind === "task" && call.input.request.scope,
  ).length;
  await c("task_step", { taskId: s.tasks.at(-1).id });
  assert.equal(
    f.calls.filter((call) => call.kind === "task" && call.input.request.scope)
      .length,
    before,
  );
  await c("save_identity", { ...identity, expiresAt: "" });
  s = await f.service.snapshot();
  assert.equal(s.identities.find((i) => i.id === "alice").expiresAt, undefined);
  await assert.rejects(
    c("save_identity", { ...identity, expiresAt: null }),
    (e) => e.code === "invalid_input",
  );
  await c("test_rules");
  await c("submit_request", {
    senderId: "U1",
    destinationId: "C1",
    text: "An owner explicitly removed the expiration",
    scope: "knowledge",
    action: "reply",
  });
  s = await f.service.snapshot();
  assert.equal(s.tasks.at(-1).status, "queued");
});
