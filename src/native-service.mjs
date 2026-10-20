import { lstat, realpath } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { createTwinStore } from "./native-store.mjs";
import { initWorkspace } from "./workspace.mjs";
import {
  inventoryMaterials,
  prepareMaterials,
  applyMaterials,
  prepareDistillationFromMaterials,
} from "./materials.mjs";
import {
  readProjectSource,
  readPreparedSources,
  validateSourceReferences,
  assertNoCredentials,
  applyDistillation,
} from "./distill.mjs";

const hash = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const clone = (value) => structuredClone(value);
const object = (value) =>
  value && typeof value === "object" && !Array.isArray(value);
const KINDS = ["knowledge", "judgment", "workflow", "tool"];
const MAX_TASKS = 1000;
const ACTIONS = new Set([
  "configure_project",
  "inventory",
  "select_sources",
  "organize",
  "distill",
  "test_candidate",
  "adopt_candidate",
  "configure_channel",
  "probe_channel",
  "test_delivery",
  "save_identity",
  "save_rules",
  "test_rules",
  "enable",
  "pause",
  "tick",
  "submit_request",
  "approve",
  "deny",
  "check_delivery",
  "retry_delivery",
  "regenerate",
  "task_step",
  "update_source_refresh",
]);
function issue(code, message) {
  return Object.assign(new Error(message), { code });
}
function text(value, label, max = 8000, { empty = false } = {}) {
  if (
    typeof value !== "string" ||
    (!empty && !value.trim()) ||
    value.length > max ||
    value.includes("\0")
  )
    throw issue("invalid_input", `Invalid ${label}`);
  assertNoCredentials(value, label);
  return value.trim();
}
function list(value, label, max = 32, { empty = false } = {}) {
  if (
    !Array.isArray(value) ||
    (!empty && !value.length) ||
    value.length > max ||
    new Set(value).size !== value.length
  )
    throw issue("invalid_input", `Invalid ${label}`);
  return value.map((v) => text(v, label, 256));
}
function onlyKeys(value, keys, label) {
  if (!object(value) || Object.keys(value).some((k) => !keys.includes(k)))
    throw issue("invalid_input", `Unsupported ${label} field`);
}
function initial() {
  return {
    schemaVersion: 1,
    revision: 0,
    project: null,
    materials: {
      entries: [],
      inventory: null,
      packet: null,
      sources: [],
      fingerprint: null,
      status: "empty",
      issues: [],
    },
    ability: { candidate: null, adopted: null, history: [], status: "empty" },
    channel: {
      config: null,
      probe: null,
      delivery: null,
      status: "unconfigured",
      cursor: null,
    },
    identities: [],
    rules: { config: null, test: null },
    service: { enabled: false, everEnabled: false, lastTickAt: null },
    tasks: [],
    outbox: [],
    events: [],
  };
}
const sourceMeta = (s) => ({
  sourceId: s.sourceId,
  path: s.path,
  sha256: s.sha256,
  lineCount: s.lineCount,
});
const rawRefs = (refs) =>
  refs.map(({ sourceId, startLine, endLine }) => ({
    sourceId,
    startLine,
    endLine,
  }));
const rawCard = (card) =>
  Object.fromEntries(
    Object.entries({ ...card, sourceRefs: rawRefs(card.sourceRefs) }).filter(
      ([key]) => key !== "privacy",
    ),
  );
const projectContext = (s) => ({
  title: s.project.title,
  goal: s.project.goal,
  mechanism: s.project.mechanism,
});
const projectBinding = (s) =>
  hash(
    s.project && {
      projectId: s.project.projectId,
      sessionId: s.project.sessionId,
      cwd: s.project.cwd,
      goal: s.project.goal,
      mechanism: s.project.mechanism,
    },
  );
const materialFingerprint = (s, sources) =>
  hash({ project: projectBinding(s), sources: sources.map(sourceMeta) });
const cardHash = (card) => hash(card);
const ruleHash = (s) => hash(s.rules.config);
const identityHash = (identity) => hash(identity);
const configHash = (s) => hash(s.channel.config);
const accountHash = (identity) =>
  hash({ tenantId: identity.tenantId, actorId: identity.actorId });
function log(s, at, type, message, extra = {}) {
  s.events.push({ id: randomUUID(), at, type, message, ...extra });
  if (s.events.length > 2000)
    throw issue("ledger_full", "Event ledger is full; history was preserved");
}
function taskById(s, id) {
  const task = s.tasks.find((t) => t.id === id);
  if (!task) throw issue("task_missing", "Task was not found");
  return task;
}
function configuredProject(s) {
  if (!s.project?.cwd || !s.project?.sessionId)
    throw issue(
      "project_unbound",
      "Explicitly bind a project and its service session first",
    );
}
function sourceProblem(error) {
  return {
    code: error?.code === "ENOENT" ? "source_missing" : "source_unavailable",
    message:
      "A selected source changed, is unavailable, or no longer passes the safe reader.",
  };
}

/** A durable local service, with model and channel effects supplied by the host. No shell execution. */
export function createTwinService({
  stateDir,
  executor,
  transport,
  now = () => new Date(),
} = {}) {
  const store = createTwinStore({ stateDir, initialState: initial });
  const at = () => {
    const date = now();
    return new Date(date).toISOString();
  };
  function executorReady() {
    try {
      return (
        typeof executor?.run === "function" &&
        (typeof executor.available !== "function" ||
          executor.available() === true)
      );
    } catch {
      return false;
    }
  }
  function transportReady() {
    try {
      return (
        typeof transport?.send === "function" &&
        (typeof transport.available !== "function" ||
          transport.available() === true)
      );
    } catch {
      return false;
    }
  }
  function modelRequired() {
    if (!executorReady())
      throw issue(
        "executor_missing",
        "No bound model executor is available; materials were not organized or distilled",
      );
  }
  function channelRequired(method) {
    if (typeof transport?.[method] !== "function" || !transportReady())
      throw issue(
        "transport_missing",
        "The configured channel transport is unavailable",
      );
  }
  async function run(kind, input) {
    modelRequired();
    const controller = new AbortController();
    let timeout;
    const deadline = new Promise((_, reject) => {
      timeout = setTimeout(() => {
        controller.abort();
        reject(
          issue(
            "executor_timeout",
            "The bound model exceeded the operation deadline",
          ),
        );
      }, 120000);
    });
    try {
      const result = await Promise.race([
        executor.run({
          kind,
          input: clone(input),
          signal: controller.signal,
        }),
        deadline,
      ]);
      if (!object(result) || Buffer.byteLength(JSON.stringify(result)) > 524288)
        throw issue(
          "executor_invalid",
          "The model returned an invalid or oversized result",
        );
      return result;
    } catch (error) {
      if (error.code) throw error;
      throw issue(
        "executor_failed",
        "The bound model could not complete this operation; no success was recorded",
      );
    } finally {
      clearTimeout(timeout);
    }
  }
  async function ensureWorkspace(cwd) {
    try {
      const stat = await lstat(resolve(cwd, ".agent-twin"));
      if (stat.isSymbolicLink() || !stat.isDirectory())
        throw issue(
          "unsafe_project",
          "Project twin state must be a regular directory",
        );
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      await initWorkspace(cwd);
    }
  }
  async function liveSources(s) {
    if (!s.project || !s.materials.entries.length)
      return { sources: [], issues: [] };
    const sources = [],
      issues = [];
    for (const path of s.materials.entries) {
      try {
        sources.push(await readProjectSource(s.project.cwd, path));
      } catch (error) {
        issues.push({ ...sourceProblem(error), path });
      }
    }
    return { sources, issues };
  }
  function validCards(s, live) {
    const adopted = s.ability.adopted;
    if (!adopted) return [];
    if (adopted.projectBinding !== projectBinding(s)) return [];
    const hashes = new Map(
      live.sources.map((src) => [src.sourceId, src.sha256]),
    );
    const selected = new Set(s.materials.entries);
    return adopted.cards.filter(
      (card) =>
        card.status === "documented" &&
        card.sourceRefs.every(
          (ref) =>
            hashes.get(ref.sourceId) === ref.sourceSha256 &&
            selected.has(ref.sourcePath),
        ),
    );
  }
  function cardsFor(s, live, scope) {
    return validCards(s, live).filter(
      (card) => card.kind === scope || card.id === scope,
    );
  }
  function ruleCurrentFor(s, identity, cards) {
    const test = s.rules.test;
    return (
      test?.passed === true &&
      test.rulesFingerprint === ruleHash(s) &&
      test.channelFingerprint === configHash(s) &&
      test.accountFingerprint ===
        accountHash(s.channel.probe?.identity ?? {}) &&
      test.identityFingerprints?.[identity.id] === identityHash(identity) &&
      cards.every((card) => test.cardFingerprints?.[card.id] === cardHash(card))
    );
  }
  function grantFor(s, request) {
    return s.identities.find(
      (identity) => identity.enabled && identity.senderId === request.senderId,
    );
  }
  function grantReason(s, request) {
    if (
      !s.channel.config?.allowedDestinationIds.includes(request.destinationId)
    )
      return "destination_not_allowlisted";
    const identity = grantFor(s, request);
    if (!identity) return "identity_not_granted";
    if (
      identity.tenantId &&
      identity.tenantId !== s.channel.probe?.identity?.tenantId
    )
      return "identity_tenant_changed";
    if (!identity.scopes.includes(request.scope)) return "scope_not_granted";
    if (!identity.destinationIds.includes(request.destinationId))
      return "destination_not_granted";
    const actions =
      request.action === "reply"
        ? ["read", "draft", "reply"]
        : ["read", "draft"];
    if (actions.some((action) => !identity.actions.includes(action)))
      return "action_not_granted";
    if (
      identity.expiresAt &&
      Date.parse(identity.expiresAt) <= Date.parse(at())
    )
      return "identity_expired";
    return null;
  }
  function channelCurrent(s) {
    return (
      transportReady() &&
      !!s.channel.config &&
      s.channel.probe?.status === "verified" &&
      s.channel.probe.configFingerprint === configHash(s) &&
      s.channel.delivery?.status === "sent" &&
      s.channel.delivery.configFingerprint === configHash(s) &&
      s.channel.delivery.accountFingerprint ===
        accountHash(s.channel.probe.identity)
    );
  }
  function channelConfig(s) {
    if (!s.channel.config || !s.channel.probe?.identity)
      throw issue(
        "probe_required",
        "Verify the configured channel before reading or sending",
      );
    return {
      ...s.channel.config,
      tenantId: s.channel.probe.identity.tenantId,
      actorId: s.channel.probe.identity.actorId,
      allowedBotSenderIds: s.identities
        .filter(
          (identity) =>
            identity.enabled && ["agent", "bot"].includes(identity.role),
        )
        .map((identity) => identity.senderId),
    };
  }
  async function verifyAccount(s) {
    channelRequired("identity");
    const expected = s.channel.probe?.identity;
    if (!expected || s.channel.probe.configFingerprint !== configHash(s))
      throw issue("probe_required", "A current channel probe is required");
    const actual = await transport.identity(channelConfig(s));
    if (
      !object(actual) ||
      !actual.actorId ||
      !actual.tenantId ||
      accountHash(actual) !== accountHash(expected)
    ) {
      s.channel.probe.status = "stale";
      s.channel.status = "stale";
      s.service.enabled = false;
      throw issue(
        "channel_identity_changed",
        "Channel account changed; probe again before reading or sending",
      );
    }
    return actual;
  }
  function runnable(s, live) {
    const cards = validCards(s, live);
    return [
      ...new Set(s.identities.flatMap((identity) => identity.scopes)),
    ].filter((scope) => {
      const selected = cards.filter(
        (card) => card.kind === scope || card.id === scope,
      );
      return (
        selected.length &&
        s.identities.some(
          (identity) =>
            identity.enabled &&
            identity.scopes.includes(scope) &&
            identity.actions.includes("read") &&
            identity.actions.includes("draft") &&
            identity.destinationIds.some((id) =>
              s.channel.config?.allowedDestinationIds.includes(id),
            ) &&
            ruleCurrentFor(s, identity, selected),
        )
      );
    });
  }
  function taskReason(
    s,
    task,
    live,
    { requireService = true, requireTest = true } = {},
  ) {
    if (requireService && !s.service.enabled) return "service_paused";
    if (!channelCurrent(s)) return "channel_not_ready";
    const grant = grantReason(s, task.request);
    if (grant) return grant;
    const cards = cardsFor(s, live, task.request.scope);
    if (!cards.length) return "knowledge_stale_or_missing";
    const identity = grantFor(s, task.request);
    if (requireTest && !ruleCurrentFor(s, identity, cards))
      return "rules_retest_required";
    if (
      task.context &&
      (task.context.projectBinding !== projectBinding(s) ||
        task.context.cardFingerprint !== hash(cards) ||
        task.context.grantFingerprint !== identityHash(identity) ||
        task.context.rulesFingerprint !== ruleHash(s) ||
        task.context.channelFingerprint !== configHash(s) ||
        task.context.accountFingerprint !==
          accountHash(s.channel.probe.identity))
    )
      return "task_context_changed";
    return null;
  }
  function bindContext(s, request, cards) {
    return {
      projectBinding: projectBinding(s),
      cardFingerprint: hash(cards),
      grantFingerprint: identityHash(grantFor(s, request)),
      rulesFingerprint: ruleHash(s),
      channelFingerprint: configHash(s),
      accountFingerprint: accountHash(s.channel.probe.identity),
    };
  }
  function approvalBinding(task) {
    return hash({
      taskId: task.id,
      request: task.request,
      context: task.context,
      outputHash: hash(task.output),
      destinationId: task.request.destinationId,
    });
  }
  function recoverDispatch(s) {
    for (const delivery of s.outbox) {
      if (delivery.status === "sending") {
        delivery.status = "unknown";
        delivery.recoveredAt = at();
      }
    }
    if (s.channel.delivery?.status === "sending") {
      s.channel.delivery.status = "unknown";
      s.channel.delivery.recoveredAt = at();
    }
    for (const task of s.tasks) {
      if (task.status === "sending") {
        task.status = "delivery_unknown";
        task.reason = "delivery_recovery_required";
        task.recoveredAt = at();
      }
    }
  }
  function enforce(s, live) {
    for (const task of s.tasks) {
      if (
        ["sent", "denied", "delivery_unknown", "failed"].includes(task.status)
      )
        continue;
      if (task.status === "sending") continue;
      const reason = taskReason(s, task, live);
      if (reason) {
        task.status = "blocked";
        task.reason = reason;
        task.approval = null;
      }
    }
  }
  function view(s, live) {
    const result = clone(s),
      valid = validCards(s, live);
    const materialsReady =
      !!s.project?.goal &&
      !!s.project?.mechanism &&
      !!s.materials.packet &&
      !live.issues.length &&
      s.materials.fingerprint === materialFingerprint(s, live.sources);
    result.materials.status = !s.materials.entries.length
      ? "empty"
      : !s.materials.packet
        ? "selected"
        : materialsReady
          ? "ready"
          : "stale";
    result.materials.issues = live.issues;
    if (result.ability.adopted) {
      result.ability.adopted.validCardIds = valid.map((card) => card.id);
      result.ability.adopted.staleCardIds = result.ability.adopted.cards
        .filter((card) => !valid.some((v) => v.id === card.id))
        .map((card) => card.id);
    }
    result.ability.status = !s.ability.adopted
      ? "empty"
      : valid.length
        ? "ready"
        : "stale";
    result.ability.scopes = [...new Set(valid.map((card) => card.kind))];
    result.channel.status = !s.channel.config
      ? "unconfigured"
      : channelCurrent(s)
        ? "ready"
        : s.channel.probe?.status === "verified"
          ? "delivery_required"
          : "probe_required";
    const scopes = runnable(s, live);
    const rulesReady = !!s.rules.config && scopes.length > 0;
    const gaps = [];
    const add = (module, code, message) => gaps.push({ module, code, message });
    if (!s.project?.sessionId)
      add(
        "project",
        "project_unbound",
        "Bind a project and its own service session.",
      );
    if (!materialsReady)
      add(
        "project",
        "materials_required",
        "Select, organize and verify current project materials.",
      );
    if (!valid.length)
      add(
        "ability",
        "ability_required",
        "Adopt a tested, source-backed ability snapshot.",
      );
    if (!channelCurrent(s))
      add(
        "channels",
        "channel_required",
        "Verify the channel and an explicit owner test receipt.",
      );
    if (!rulesReady)
      add(
        "rules",
        "rules_required",
        "Configure identities and pass current rules checks.",
      );
    if (!executorReady())
      add("ability", "executor_missing", "No real model executor is bound.");
    if (!transportReady())
      add("channels", "transport_missing", "No real channel sender is bound.");
    result.readiness = {
      project: materialsReady,
      ability: valid.length > 0,
      channels: channelCurrent(s),
      rules: rulesReady,
      runnableScopes: scopes,
      canEnable:
        executorReady() &&
        transportReady() &&
        valid.length > 0 &&
        channelCurrent(s) &&
        rulesReady &&
        (s.service.everEnabled || materialsReady),
      gaps,
    };
    result.runtime = {
      executorConfigured: executorReady(),
      transportConfigured: transportReady(),
      backgroundRunning: s.service.enabled,
    };
    for (const task of result.tasks) {
      if (
        !["sent", "denied", "delivery_unknown", "failed", "sending"].includes(
          task.status,
        )
      ) {
        const reason = taskReason(s, task, live);
        if (reason) {
          task.status = "blocked";
          task.reason = reason;
          task.approval = null;
        }
      }
    }
    return result;
  }
  async function snapshot() {
    let s = await store.read();
    if (
      s.schemaVersion !== 1 ||
      !Array.isArray(s.tasks) ||
      !Array.isArray(s.outbox)
    )
      throw issue(
        "state_corrupt",
        "Unsupported private service state; no reset was performed",
      );
    if (
      s.outbox.some((d) => d.status === "sending") ||
      s.tasks.some((t) => t.status === "sending")
    ) {
      try {
        s = await store.transaction(async (state) => {
          recoverDispatch(state);
        });
      } catch (error) {
        if (error.code !== "state_busy") throw error;
      }
    }
    return view(s, await liveSources(s));
  }
  function normalizeCards(cards, sources) {
    if (!Array.isArray(cards) || !cards.length || cards.length > 100)
      throw issue(
        "candidate_invalid",
        "A candidate needs one to one hundred source-backed cards",
      );
    const ids = new Set();
    return cards.map((card) => {
      onlyKeys(
        card,
        [
          "id",
          "kind",
          "title",
          "content",
          "when",
          "limits",
          "sourceRefs",
          "status",
        ],
        "card",
      );
      if (
        !/^[a-z][a-z0-9-]{0,63}$/.test(card.id) ||
        ids.has(card.id) ||
        !KINDS.includes(card.kind) ||
        !["documented", "candidate"].includes(card.status)
      )
        throw issue(
          "candidate_invalid",
          "Invalid candidate identity, kind or status",
        );
      ids.add(card.id);
      return {
        ...card,
        title: text(card.title, "card title", 240),
        content: text(card.content, "card content"),
        when: text(card.when, "card condition"),
        limits: text(card.limits, "card limits"),
        sourceRefs: validateSourceReferences(card.sourceRefs, sources),
        privacy: "private",
      };
    });
  }
  function normalizeRequest(payload, s) {
    onlyKeys(
      payload,
      [
        "senderId",
        "destinationId",
        "text",
        "scope",
        "action",
        "messageId",
        "threadId",
        "tenantId",
      ],
      "request",
    );
    const request = {
      senderId: text(payload.senderId, "sender", 256),
      destinationId: text(payload.destinationId, "destination", 256),
      text: text(payload.text, "request", 16000),
      scope: text(payload.scope, "scope", 64),
      action: payload.action ?? "reply",
    };
    if (!["reply", "draft"].includes(request.action))
      throw issue(
        "invalid_input",
        "Only bounded reply or draft requests are supported",
      );
    if (payload.messageId)
      request.messageId = text(payload.messageId, "message ID", 256);
    if (payload.threadId)
      request.threadId = text(payload.threadId, "thread ID", 256);
    if (payload.tenantId)
      request.tenantId = text(payload.tenantId, "tenant ID", 256);
    return request;
  }
  function addRequest(s, payload) {
    if (s.tasks.length >= MAX_TASKS)
      throw issue(
        "ledger_full",
        "Task ledger is full; existing deduplication history was preserved",
      );
    const request = normalizeRequest(payload, s);
    const key = request.messageId
      ? hash({
          tenantId: request.tenantId ?? s.channel.probe?.identity?.tenantId,
          destinationId: request.destinationId,
          messageId: request.messageId,
        })
      : null;
    const previous = key && s.tasks.find((task) => task.requestKey === key);
    if (previous) {
      if (
        hash({
          senderId: previous.request.senderId,
          destinationId: previous.request.destinationId,
          text: previous.request.text,
          threadId: previous.request.threadId,
          tenantId: previous.request.tenantId,
        }) !==
        hash({
          senderId: request.senderId,
          destinationId: request.destinationId,
          text: request.text,
          threadId: request.threadId,
          tenantId: request.tenantId,
        })
      )
        throw issue(
          "request_conflict",
          "An existing platform message ID changed content; it was not overwritten",
        );
      return previous;
    }
    const task = {
      id: `task-${randomUUID()}`,
      requestKey: key,
      request,
      status: "queued",
      reason: null,
      createdAt: at(),
      updatedAt: at(),
      context: null,
      output: null,
      approval: null,
      deliveryId: null,
      attempts: 0,
    };
    s.tasks.push(task);
    return task;
  }
  async function executeTask(s, task, live, { checkpoint }) {
    if (["sent", "denied", "delivery_unknown", "failed"].includes(task.status))
      return;
    let reason = taskReason(s, task, live);
    if (reason) {
      task.status = "blocked";
      task.reason = reason;
      task.approval = null;
      return;
    }
    if (!task.output) {
      const cards = cardsFor(s, live, task.request.scope);
      task.context = bindContext(s, task.request, cards);
      const result = await run("task", {
        request: {
          text: task.request.text,
          scope: task.request.scope,
          action: task.request.action,
        },
        cards: clone(cards),
        limits: { toolsAllowed: [], externalSend: false },
        project: { title: s.project.title },
      });
      const refreshed = await liveSources(s);
      reason = taskReason(s, task, refreshed);
      if (reason) {
        task.status = "blocked";
        task.reason = reason;
        task.approval = null;
        return;
      }
      if (
        result.toolCalls !== undefined &&
        (!Array.isArray(result.toolCalls) || result.toolCalls.length)
      ) {
        task.status = "blocked";
        task.reason = "tool_execution_not_granted";
        task.output = null;
        return;
      }
      task.output = text(result.output, "task output", 12000);
      task.updatedAt = at();
      task.reason = null;
      task.status =
        task.request.action === "draft"
          ? "ready"
          : s.rules.config.requireApproval
            ? "needs_approval"
            : "ready";
      log(
        s,
        at(),
        "task_generated",
        "A bounded response was generated from the current granted cards.",
        { taskId: task.id },
      );
      return;
    }
    if (task.request.action === "draft") return;
    if (task.status === "needs_approval") return;
    if (
      s.rules.config.requireApproval &&
      task.approval?.binding !== approvalBinding(task)
    ) {
      task.status = "needs_approval";
      task.reason = "owner_approval_required";
      task.approval = null;
      return;
    }
    channelRequired("send");
    try {
      await verifyAccount(s);
    } catch (error) {
      task.status = "blocked";
      task.reason = error.code ?? "channel_identity_failed";
      task.approval = null;
      return;
    }
    const beforeSend = await liveSources(s);
    reason = taskReason(s, task, beforeSend);
    if (reason) {
      task.status = "blocked";
      task.reason = reason;
      task.approval = null;
      return;
    }
    let delivery =
      task.deliveryId && s.outbox.find((entry) => entry.id === task.deliveryId);
    if (delivery && ["sending", "unknown", "sent"].includes(delivery.status)) {
      task.status = delivery.status === "sent" ? "sent" : "delivery_unknown";
      return;
    }
    if (!delivery) {
      delivery = {
        id: `delivery-${randomUUID()}`,
        kind: "task",
        taskId: task.id,
        destinationId: task.request.destinationId,
        idempotencyKey: randomUUID(),
        status: "pending",
        createdAt: at(),
        accountFingerprint: accountHash(s.channel.probe.identity),
        configFingerprint: configHash(s),
        outputHash: hash(task.output),
      };
      s.outbox.push(delivery);
      task.deliveryId = delivery.id;
    }
    delivery.status = "sending";
    delivery.startedAt = at();
    task.status = "sending";
    task.attempts++;
    await checkpoint();
    let response;
    try {
      response = await transport.send({
        destinationId: delivery.destinationId,
        text: task.output,
        idempotencyKey: delivery.idempotencyKey,
        threadId: task.request.threadId,
        config: channelConfig(s),
      });
    } catch {
      response = { status: "unknown" };
    }
    if (
      !object(response) ||
      !["sent", "unknown", "failed"].includes(response.status)
    )
      response = { status: "unknown" };
    delivery.status = response.status;
    delivery.remoteId =
      typeof response.remoteId === "string" ? response.remoteId : null;
    delivery.checkedAt = at();
    task.status =
      response.status === "sent"
        ? "sent"
        : response.status === "unknown"
          ? "delivery_unknown"
          : "failed";
    task.reason =
      response.status === "unknown"
        ? "receipt_unknown"
        : response.status === "failed"
          ? "delivery_failed"
          : null;
    task.updatedAt = at();
    log(s, at(), "delivery_result", `Task delivery is ${response.status}.`, {
      taskId: task.id,
      deliveryId: delivery.id,
    });
  }
  function queueOwnerNotification(s, task) {
    if (
      !s.rules.config ||
      !s.service.enabled ||
      ![
        "needs_approval",
        "blocked",
        "sent",
        "delivery_unknown",
        "failed",
      ].includes(task.status)
    )
      return;
    const notificationKey = hash({
      taskId: task.id,
      status: task.status,
      reason: task.reason,
      context: task.context,
      config: configHash(s),
    });
    if (
      s.outbox.some(
        (entry) =>
          entry.kind === "owner_review" &&
          entry.notificationKey === notificationKey,
      )
    )
      return;
    s.outbox.push({
      id: `delivery-${randomUUID()}`,
      kind: "owner_review",
      taskId: task.id,
      notificationKey,
      destinationId: s.rules.config.ownerDestinationId,
      idempotencyKey: randomUUID(),
      status: "pending",
      createdAt: at(),
      accountFingerprint: accountHash(s.channel.probe.identity),
      configFingerprint: configHash(s),
      text: `[AI Twin] ${task.id}\nStatus: ${task.status}${task.reason ? ` (${task.reason})` : ""}\nScope: ${task.request.scope}\nOriginal destination: ${task.request.destinationId}\nReview the task in the DSH AI Twin panel. This notice does not include project materials or generated output.`,
    });
  }
  async function flushOwnerNotifications(s, { checkpoint }) {
    if (!channelCurrent(s) || !s.service.enabled) return;
    let count = 0;
    for (const delivery of s.outbox.filter(
      (entry) => entry.kind === "owner_review" && entry.status === "pending",
    )) {
      if (count++ >= 2) break;
      if (
        delivery.configFingerprint !== configHash(s) ||
        delivery.accountFingerprint !== accountHash(s.channel.probe.identity)
      ) {
        delivery.status = "failed";
        delivery.reason = "notification_context_changed";
        continue;
      }
      try {
        await verifyAccount(s);
      } catch {
        delivery.status = "failed";
        delivery.reason = "channel_identity_failed";
        continue;
      }
      delivery.status = "sending";
      delivery.startedAt = at();
      await checkpoint();
      let result;
      try {
        result = await transport.send({
          destinationId: delivery.destinationId,
          text: delivery.text,
          idempotencyKey: delivery.idempotencyKey,
          config: channelConfig(s),
        });
      } catch {
        result = { status: "unknown" };
      }
      delivery.status = ["sent", "failed", "unknown"].includes(result?.status)
        ? result.status
        : "unknown";
      delivery.remoteId =
        typeof result?.remoteId === "string" ? result.remoteId : null;
      delivery.checkedAt = at();
    }
  }
  async function probe(s) {
    channelRequired("identity");
    channelRequired("read");
    if (!s.channel.config)
      throw issue(
        "channel_unconfigured",
        "Configure explicit channel destinations first",
      );
    const identity = await transport.identity(s.channel.config);
    if (!object(identity) || !identity.actorId || !identity.tenantId)
      throw issue(
        "channel_invalid",
        "Transport did not return a stable account identity",
      );
    if (
      s.channel.config.tenantId &&
      s.channel.config.tenantId !== identity.tenantId
    )
      throw issue(
        "channel_identity_changed",
        "Configured tenant differs from the authenticated account",
      );
    if (
      Array.isArray(identity.destinations) &&
      s.channel.config.allowedDestinationIds.some(
        (id) => !identity.destinations.includes(id),
      )
    )
      throw issue(
        "destination_unverified",
        "A configured outbound destination was not verified by the transport",
      );
    s.channel.probe = {
      status: "verified",
      identity: {
        actorId: text(identity.actorId, "actor ID", 256),
        tenantId: text(identity.tenantId, "tenant ID", 256),
      },
      configFingerprint: configHash(s),
      checkedAt: at(),
      readVerified: false,
    };
    const read = await transport.read(channelConfig(s), {
      cursor: null,
      limit: 1,
    });
    if (
      !object(read) ||
      !Array.isArray(read.messages) ||
      read.messages.length > 100
    )
      throw issue(
        "channel_invalid",
        "Transport did not return bounded normalized messages",
      );
    s.channel.probe.readVerified = true;
    s.channel.probe.observedMessageCount = read.messages.length;
    s.channel.status = "delivery_required";
  }
  async function testDelivery(s, { checkpoint }) {
    channelRequired("send");
    if (s.channel.probe?.readVerified !== true)
      throw issue(
        "probe_required",
        "A successful current read-only channel probe is required",
      );
    await verifyAccount(s);
    const existing = s.channel.delivery;
    if (
      existing?.configFingerprint === configHash(s) &&
      existing.accountFingerprint === accountHash(s.channel.probe.identity)
    ) {
      if (existing.status === "sent") return;
      if (["sending", "unknown"].includes(existing.status))
        throw issue(
          "delivery_unresolved",
          "The previous test delivery has an unknown receipt; check it before sending another",
        );
    }
    const delivery = {
      id: `delivery-${randomUUID()}`,
      kind: "channel_test",
      destinationId: s.channel.config.ownerDestinationId,
      idempotencyKey: randomUUID(),
      configFingerprint: configHash(s),
      accountFingerprint: accountHash(s.channel.probe.identity),
      status: "sending",
      createdAt: at(),
    };
    s.outbox.push(delivery);
    s.channel.delivery = clone(delivery);
    await checkpoint();
    let response;
    try {
      response = await transport.send({
        destinationId: delivery.destinationId,
        text: "[AI Twin] Owner-authorized channel delivery test. This receipt verifies this message only.",
        idempotencyKey: delivery.idempotencyKey,
        config: channelConfig(s),
      });
    } catch {
      response = { status: "unknown" };
    }
    delivery.status = ["sent", "failed", "unknown"].includes(response?.status)
      ? response.status
      : "unknown";
    delivery.remoteId =
      typeof response?.remoteId === "string" ? response.remoteId : null;
    delivery.checkedAt = at();
    s.channel.delivery = clone(delivery);
  }
  async function command(action, payload = {}, options = {}) {
    if (!ACTIONS.has(action))
      throw issue("action_unknown", "Unsupported service command");
    if (!object(payload) || Buffer.byteLength(JSON.stringify(payload)) > 131072)
      throw issue("invalid_input", "Command payload must be a bounded object");
    if (
      Object.keys(payload).some((key) =>
        /token|password|secret|credential|authorization/i.test(key),
      )
    )
      throw issue(
        "credential_refused",
        "Credentials must remain in host secret settings; they cannot enter service commands",
      );
    const state = await store.transaction(async (s, tx) => {
      recoverDispatch(s);
      let live = await liveSources(s);
      enforce(s, live);
      switch (action) {
        case "configure_project": {
          onlyKeys(
            payload,
            [
              "projectId",
              "workspaceId",
              "sessionId",
              "cwd",
              "title",
              "goal",
              "mechanism",
            ],
            "project",
          );
          const cwd = text(payload.cwd, "project directory", 4096);
          if (resolve(cwd) !== (await realpath(cwd)))
            throw issue(
              "unsafe_project",
              "Bind an explicit non-symlink project directory",
            );
          const project = {
            projectId: text(
              payload.projectId ?? payload.workspaceId,
              "project ID",
              256,
            ),
            sessionId: text(payload.sessionId, "service session ID", 256),
            cwd: resolve(cwd),
            title: text(payload.title, "project title", 240),
            goal: text(payload.goal ?? "", "project goal", 8000, {
              empty: true,
            }),
            mechanism: text(
              payload.mechanism ?? "",
              "project mechanism",
              8000,
              { empty: true },
            ),
          };
          if (
            s.project &&
            (s.project.projectId !== project.projectId ||
              s.project.cwd !== project.cwd ||
              s.project.sessionId !== project.sessionId) &&
            s.tasks.some(
              (task) => !["sent", "denied", "failed"].includes(task.status),
            )
          )
            throw issue(
              "binding_in_use",
              "Pause and resolve unfinished tasks before changing the bound project or service session",
            );
          if (
            s.project &&
            (s.project.projectId !== project.projectId ||
              s.project.cwd !== project.cwd)
          ) {
            s.materials = {
              entries: [],
              inventory: null,
              packet: null,
              sources: [],
              fingerprint: null,
              status: "empty",
              issues: [],
            };
            s.ability.candidate = null;
            s.service.enabled = false;
          }
          s.project = project;
          await ensureWorkspace(project.cwd);
          log(
            s,
            at(),
            "project_configured",
            "Project and its service session were explicitly bound.",
          );
          break;
        }
        case "inventory":
          configuredProject(s);
          s.materials.inventory = await inventoryMaterials(
            s.project.cwd,
            payload.roots,
          );
          break;
        case "select_sources":
          configuredProject(s);
          {
            const entries = list(payload.entries, "selected entries", 16);
            if (hash(entries) !== hash(s.materials.entries)) {
              s.materials.entries = entries;
              s.ability.candidate = null;
              s.materials.status = "selected";
              s.materials.issues = [];
            }
            break;
          }
        case "organize": {
          configuredProject(s);
          modelRequired();
          if (!s.project.goal || !s.project.mechanism)
            throw issue(
              "project_incomplete",
              "Record the project goal and operating mechanism before organization",
            );
          const batch = await prepareMaterials(
            s.project.cwd,
            s.materials.entries,
          );
          const result = await run("organize", {
            project: projectContext(s),
            batchId: batch.batchId,
            sources: batch.sources,
            extractionInstruction: batch.extractionInstruction,
          });
          if (!object(result.packet))
            throw issue(
              "materials_invalid",
              "The model did not return a source-backed material packet",
            );
          const materialReceipt = await applyMaterials(
            s.project.cwd,
            batch.batchId,
            result.packet,
          );
          s.materials.generationId = materialReceipt.generationId;
          const verified = await readPreparedSources(
            s.project.cwd,
            batch.batchId,
            "materials",
          );
          s.materials.packet = clone(result.packet);
          s.materials.sources = verified.sources.map(sourceMeta);
          s.materials.fingerprint = materialFingerprint(s, verified.sources);
          s.materials.status = "ready";
          s.materials.issues = [];
          s.materials.organizedAt = at();
          s.ability.candidate = null;
          log(
            s,
            at(),
            "materials_organized",
            "Selected project sources were organized and evidence-validated.",
          );
          break;
        }
        case "distill": {
          configuredProject(s);
          modelRequired();
          if (
            !s.materials.packet ||
            s.materials.fingerprint !== materialFingerprint(s, live.sources) ||
            live.issues.length
          )
            throw issue(
              "materials_stale",
              "Organize the current selected sources before distillation",
            );
          const batch = await prepareDistillationFromMaterials(s.project.cwd);
          if (
            batch.fromMaterialsGenerationId !== s.materials.generationId ||
            batch.sources.some(
              (source) =>
                !s.materials.entries.includes(source.path) ||
                s.materials.sources.find(
                  (saved) => saved.sourceId === source.sourceId,
                )?.sha256 !== source.sha256,
            )
          )
            throw issue(
              "materials_changed",
              "The material generation changed outside this service; organize the selected sources again",
            );
          const result = await run("distill", {
            project: projectContext(s),
            batchId: batch.batchId,
            sources: batch.sources,
            materials: s.materials.packet,
            extractionInstruction: batch.extractionInstruction,
          });
          const cards = normalizeCards(result.cards, batch.sources);
          await readPreparedSources(
            s.project.cwd,
            batch.batchId,
            "distillation",
          );
          s.ability.candidate = {
            id: randomUUID(),
            version: (s.ability.adopted?.version ?? 0) + 1,
            batchId: batch.batchId,
            projectBinding: projectBinding(s),
            fingerprint: materialFingerprint(s, batch.sources),
            sources: batch.sources.map(sourceMeta),
            cards,
            test: null,
            createdAt: at(),
            scopes: [
              ...new Set(
                cards
                  .filter((c) => c.status === "documented")
                  .map((c) => c.kind),
              ),
            ],
          };
          log(
            s,
            at(),
            "candidate_distilled",
            "A new candidate was generated; it has not been adopted.",
          );
          break;
        }
        case "test_candidate": {
          configuredProject(s);
          const candidate = s.ability.candidate;
          if (!candidate)
            throw issue("candidate_missing", "Generate a candidate first");
          const batch = await readPreparedSources(
            s.project.cwd,
            candidate.batchId,
            "distillation",
          );
          if (candidate.projectBinding !== projectBinding(s))
            throw issue(
              "candidate_stale",
              "Project structure changed; generate a new candidate",
            );
          normalizeCards(candidate.cards.map(rawCard), batch.sources);
          const result = await run("test_candidate", {
            project: projectContext(s),
            cards: candidate.cards,
            sources: batch.sources,
            checks: [
              "source-grounding",
              "unsupported-claims",
              "no-secret",
              "scope-boundary",
            ],
          });
          candidate.test = {
            passed: result.passed === true,
            fingerprint: hash(candidate.cards),
            checkedAt: at(),
            cases: Array.isArray(result.cases)
              ? result.cases.slice(0, 100)
              : [],
          };
          await readPreparedSources(
            s.project.cwd,
            candidate.batchId,
            "distillation",
          );
          if (!candidate.test.passed)
            log(
              s,
              at(),
              "candidate_test_failed",
              "Candidate test did not pass; adoption remains blocked.",
            );
          break;
        }
        case "adopt_candidate": {
          configuredProject(s);
          const candidate = s.ability.candidate;
          if (
            !candidate?.test?.passed ||
            candidate.test.fingerprint !== hash(candidate.cards)
          )
            throw issue(
              "candidate_untested",
              "A current tested candidate is required",
            );
          if (candidate.projectBinding !== projectBinding(s))
            throw issue(
              "candidate_stale",
              "Project structure changed; candidate cannot be adopted",
            );
          await readPreparedSources(
            s.project.cwd,
            candidate.batchId,
            "distillation",
          );
          await applyDistillation(
            s.project.cwd,
            candidate.batchId,
            candidate.cards.map(rawCard),
          );
          if (s.ability.adopted)
            s.ability.history.push(clone(s.ability.adopted));
          s.ability.adopted = { ...clone(candidate), adoptedAt: at() };
          s.ability.candidate = null;
          log(
            s,
            at(),
            "candidate_adopted",
            "A tested ability snapshot was explicitly adopted.",
          );
          break;
        }
        case "configure_channel": {
          onlyKeys(
            payload,
            [
              "platform",
              "channel",
              "tenantId",
              "ownerId",
              "ownerDestinationId",
              "allowedChannelIds",
              "allowedDestinationIds",
              "destinationIds",
            ],
            "channel configuration",
          );
          const platform = payload.platform ?? payload.channel;
          if (platform !== "slack")
            throw issue(
              "channel_unsupported",
              "This version implements the Slack channel only",
            );
          const config = {
            platform: "slack",
            ownerId: text(payload.ownerId, "owner ID", 256),
            ownerDestinationId: text(
              payload.ownerDestinationId,
              "owner destination",
              256,
            ),
            allowedChannelIds: list(
              payload.allowedChannelIds ?? payload.destinationIds,
              "inbound destinations",
              10,
            ),
            allowedDestinationIds: list(
              payload.allowedDestinationIds ?? payload.destinationIds,
              "outbound destinations",
              16,
            ),
          };
          if (payload.tenantId)
            config.tenantId = text(payload.tenantId, "tenant ID", 256);
          if (!config.allowedDestinationIds.includes(config.ownerDestinationId))
            throw issue(
              "invalid_input",
              "Explicitly allowlist the owner test destination",
            );
          if (hash(config) !== hash(s.channel.config)) {
            s.channel = {
              config,
              probe: null,
              delivery: null,
              status: "probe_required",
              cursor: null,
            };
            s.service.enabled = false;
          }
          break;
        }
        case "probe_channel":
          await probe(s);
          break;
        case "test_delivery":
          await testDelivery(s, tx);
          break;
        case "save_identity": {
          onlyKeys(
            payload,
            [
              "id",
              "senderId",
              "name",
              "role",
              "scopes",
              "actions",
              "destinationIds",
              "enabled",
              "expiresAt",
            ],
            "identity",
          );
          const previous =
            payload.id && s.identities.find((i) => i.id === payload.id);
          const identity = {
            id: previous?.id ?? payload.id ?? `identity-${randomUUID()}`,
            senderId: text(payload.senderId, "platform sender", 256),
            name: text(payload.name ?? payload.senderId, "display name", 240),
            role: text(payload.role ?? "colleague", "role", 100),
            scopes: list(payload.scopes ?? [], "identity scopes", 100, {
              empty: true,
            }),
            actions: list(payload.actions ?? [], "identity actions", 3, {
              empty: true,
            }),
            destinationIds: list(
              payload.destinationIds ?? [],
              "identity destinations",
              16,
              { empty: true },
            ),
            enabled: payload.enabled === true,
            tenantId:
              s.channel.probe?.identity?.tenantId ??
              s.channel.config?.tenantId ??
              null,
            revision: (previous?.revision ?? 0) + 1,
          };
          if (
            identity.actions.some(
              (v) => !["read", "draft", "reply"].includes(v),
            )
          )
            throw issue("invalid_input", "Unsupported identity action");
          if (
            s.identities.some(
              (i) => i.id !== identity.id && i.senderId === identity.senderId,
            )
          )
            throw issue(
              "identity_duplicate",
              "A platform sender must have exactly one explicit identity",
            );
          if (payload.expiresAt) {
            if (!Number.isFinite(Date.parse(payload.expiresAt)))
              throw issue(
                "invalid_input",
                "Identity expiration must be a valid date",
              );
            identity.expiresAt = payload.expiresAt;
          }
          if (s.identities.length >= 100 && !previous)
            throw issue("identity_limit", "Identity limit reached");
          s.identities = previous
            ? s.identities.map((i) => (i.id === identity.id ? identity : i))
            : [...s.identities, identity];
          break;
        }
        case "save_rules": {
          onlyKeys(
            payload,
            [
              "intervalMinutes",
              "maxTasksPerTick",
              "requireApproval",
              "ownerDestinationId",
              "quietHours",
            ],
            "service rules",
          );
          if (
            !Number.isInteger(payload.intervalMinutes) ||
            payload.intervalMinutes < 1 ||
            payload.intervalMinutes > 1440 ||
            !Number.isInteger(payload.maxTasksPerTick) ||
            payload.maxTasksPerTick < 1 ||
            payload.maxTasksPerTick > 30 ||
            typeof payload.requireApproval !== "boolean"
          )
            throw issue(
              "invalid_input",
              "Rules require a bounded cadence, task budget and explicit approval mode",
            );
          if (payload.quietHours?.trim())
            throw issue(
              "feature_unavailable",
              "Quiet-hour scheduling is not implemented in this version; leave this field empty",
            );
          const ownerDestinationId = text(
            payload.ownerDestinationId,
            "owner review destination",
            256,
          );
          if (
            !s.channel.config?.allowedDestinationIds.includes(
              ownerDestinationId,
            ) ||
            ownerDestinationId !== s.channel.config.ownerDestinationId
          )
            throw issue(
              "destination_mismatch",
              "Owner review must use the verified owner destination",
            );
          s.rules.config = {
            intervalMinutes: payload.intervalMinutes,
            maxTasksPerTick: payload.maxTasksPerTick,
            requireApproval: payload.requireApproval,
            ownerDestinationId,
            quietHours: text(payload.quietHours ?? "", "quiet hours", 240, {
              empty: true,
            }),
          };
          s.rules.test = null;
          break;
        }
        case "test_rules": {
          if (!s.rules.config || !channelCurrent(s))
            throw issue(
              "rules_incomplete",
              "Configure rules and verify the channel first",
            );
          const cards = validCards(s, live);
          if (!cards.length)
            throw issue(
              "ability_required",
              "Adopt current documented ability cards first",
            );
          const cases = [];
          for (const identity of s.identities.filter((i) => i.enabled)) {
            for (const scope of identity.scopes) {
              const destinationId = identity.destinationIds[0];
              if (destinationId)
                cases.push({
                  senderId: identity.senderId,
                  scope,
                  action: "draft",
                  destinationId,
                  expected: grantReason(s, {
                    senderId: identity.senderId,
                    scope,
                    action: "draft",
                    destinationId,
                  })
                    ? "deny"
                    : "allow",
                });
            }
            cases.push({
              senderId: identity.senderId,
              scope: "__ungranted_scope__",
              action: "reply",
              destinationId:
                identity.destinationIds[0] ?? "__ungranted_destination__",
              expected: "deny",
            });
          }
          cases.push({
            senderId: "__ungranted_sender__",
            scope: cards[0].kind,
            action: "reply",
            destinationId: s.channel.config.ownerDestinationId,
            expected: "deny",
          });
          const result = await run("test_rules", {
            identities: s.identities,
            rules: s.rules.config,
            scopes: [...new Set(cards.map((c) => c.kind))],
            cases,
          });
          s.rules.test = {
            passed: result.passed === true,
            rulesFingerprint: ruleHash(s),
            channelFingerprint: configHash(s),
            accountFingerprint: accountHash(s.channel.probe.identity),
            identityFingerprints: Object.fromEntries(
              s.identities.map((identity) => [
                identity.id,
                identityHash(identity),
              ]),
            ),
            cardFingerprints: Object.fromEntries(
              cards.map((card) => [card.id, cardHash(card)]),
            ),
            checkedAt: at(),
            cases: Array.isArray(result.cases)
              ? result.cases.slice(0, 100)
              : cases,
          };
          break;
        }
        case "enable": {
          if (!view(s, live).readiness.canEnable)
            throw issue(
              "not_ready",
              "Complete the current material, ability, channel and identity checks before enabling",
            );
          s.service.enabled = true;
          s.service.everEnabled = true;
          log(
            s,
            at(),
            "service_enabled",
            "Service was explicitly enabled for the current verified scopes.",
          );
          break;
        }
        case "pause":
          s.service.enabled = false;
          log(
            s,
            at(),
            "service_paused",
            "Service was explicitly paused; configuration and history were preserved.",
          );
          break;
        case "submit_request": {
          if (!s.service.enabled)
            throw issue(
              "service_paused",
              "Enable the service before accepting requests",
            );
          const task = addRequest(s, payload);
          const reason = taskReason(s, task, live);
          if (reason) {
            task.status = "blocked";
            task.reason = reason;
          }
          break;
        }
        case "task_step": {
          const task = taskById(s, payload.taskId);
          await executeTask(s, task, live, tx);
          break;
        }
        case "approve": {
          const task = taskById(s, payload.taskId);
          if (payload.destinationId !== task.request.destinationId)
            throw issue(
              "destination_mismatch",
              "Approval destination differs from the task destination",
            );
          const reason = taskReason(s, task, live);
          if (reason)
            throw issue(
              "approval_stale",
              "The task source, identity, channel or rules changed; regenerate and retest first",
            );
          if (
            !task.output ||
            task.request.action !== "reply" ||
            !["needs_approval", "ready"].includes(task.status)
          )
            throw issue(
              "approval_invalid",
              "Only a generated, current reply can receive one-task approval",
            );
          task.approval = {
            binding: approvalBinding(task),
            destinationId: task.request.destinationId,
            approvedAt: at(),
          };
          task.status = "ready";
          task.reason = null;
          break;
        }
        case "deny": {
          const task = taskById(s, payload.taskId);
          if (["sent", "delivery_unknown", "sending"].includes(task.status))
            throw issue(
              "delivery_already_attempted",
              "A sent or uncertain delivery cannot be erased by denying",
            );
          task.status = "denied";
          task.approval = null;
          task.updatedAt = at();
          break;
        }
        case "regenerate": {
          const task = taskById(s, payload.taskId);
          if (["sent", "delivery_unknown", "sending"].includes(task.status))
            throw issue(
              "delivery_unresolved",
              "Resolve the previous delivery before regenerating",
            );
          const detached = { ...task, context: null };
          const reason = taskReason(s, detached, live);
          if (reason)
            throw issue(
              "regeneration_blocked",
              `Task cannot resume: ${reason}`,
            );
          task.context = null;
          task.output = null;
          task.approval = null;
          task.status = "queued";
          task.reason = null;
          task.deliveryId = null;
          break;
        }
        case "check_delivery": {
          const delivery = payload.deliveryId
            ? s.outbox.find((d) => d.id === payload.deliveryId)
            : payload.taskId
              ? s.outbox.find(
                  (d) => d.id === taskById(s, payload.taskId).deliveryId,
                )
              : s.outbox.find((d) => d.id === s.channel.delivery?.id);
          if (!delivery)
            throw issue(
              "delivery_missing",
              "There is no attempted delivery to check",
            );
          channelRequired("check");
          await verifyAccount(s);
          if (
            delivery.configFingerprint !== configHash(s) ||
            delivery.accountFingerprint !==
              accountHash(s.channel.probe.identity)
          )
            throw issue(
              "delivery_context_changed",
              "Check the receipt in its original channel account before changing destinations",
            );
          let result;
          try {
            result = await transport.check({
              destinationId: delivery.destinationId,
              idempotencyKey: delivery.idempotencyKey,
              remoteId: delivery.remoteId,
              config: channelConfig(s),
            });
          } catch {
            result = { status: "unknown" };
          }
          delivery.status = ["sent", "failed", "unknown"].includes(
            result?.status,
          )
            ? result.status
            : "unknown";
          delivery.remoteId =
            typeof result?.remoteId === "string"
              ? result.remoteId
              : delivery.remoteId;
          delivery.checkedAt = at();
          delivery.checkedNegative = delivery.status === "failed";
          if (delivery.kind === "channel_test")
            s.channel.delivery = clone(delivery);
          if (delivery.taskId && delivery.kind === "task") {
            const task = taskById(s, delivery.taskId);
            task.status =
              delivery.status === "sent"
                ? "sent"
                : delivery.status === "failed"
                  ? "failed"
                  : "delivery_unknown";
            task.reason =
              delivery.status === "unknown" ? "receipt_unknown" : null;
          }
          break;
        }
        case "retry_delivery": {
          const task = taskById(s, payload.taskId);
          const delivery = s.outbox.find((d) => d.id === task.deliveryId);
          if (
            !delivery ||
            delivery.status !== "failed" ||
            delivery.checkedNegative !== true ||
            payload.confirmNotSent !== true
          )
            throw issue(
              "delivery_unresolved",
              "Retry requires an explicit negative receipt check and owner confirmation; unknown sends are not retried",
            );
          const reason = taskReason(s, task, live);
          if (reason)
            throw issue(
              "retry_blocked",
              "Current grants, evidence and channel checks are required before a retry",
            );
          delivery.status = "pending";
          task.status = "ready";
          task.reason = null;
          break;
        }
        case "tick": {
          if (!s.service.enabled) break;
          channelRequired("read");
          try {
            await verifyAccount(s);
          } catch (error) {
            s.service.enabled = false;
            log(
              s,
              at(),
              "channel_blocked",
              "Channel identity verification failed; service paused.",
            );
            break;
          }
          if (!channelCurrent(s)) {
            s.service.enabled = false;
            break;
          }
          const budget = s.rules.config?.maxTasksPerTick ?? 1;
          const read = await transport.read(channelConfig(s), {
            cursor: s.channel.cursor,
            limit: Math.min(30, budget),
          });
          if (
            !object(read) ||
            !Array.isArray(read.messages) ||
            read.messages.length > 100 ||
            Buffer.byteLength(JSON.stringify(read)) > 262144
          )
            throw issue(
              "channel_invalid",
              "Transport returned an invalid or oversized incoming batch",
            );
          for (const message of read.messages.slice(0, budget)) {
            if (message.senderId === s.channel.probe.identity.actorId) continue;
            if (
              !s.channel.config.allowedChannelIds.includes(
                message.destinationId,
              )
            )
              continue;
            const identity = s.identities.find(
              (i) => i.enabled && i.senderId === message.senderId,
            );
            let scope = message.scope;
            if (!scope && identity?.scopes.length === 1)
              scope = identity.scopes[0];
            let task;
            try {
              task = addRequest(s, {
                senderId: message.senderId,
                destinationId: message.destinationId,
                text: message.text,
                scope: scope ?? "__explicit_scope_required__",
                action: message.action ?? "reply",
                messageId: message.messageId,
                threadId: message.threadId,
                tenantId: s.channel.probe.identity.tenantId,
              });
            } catch (error) {
              if (error.code === "ledger_full") throw error;
              log(
                s,
                at(),
                "incoming_rejected",
                "An invalid or credential-bearing incoming request was rejected without retaining its content.",
                {
                  messageFingerprint: hash({
                    senderId: message.senderId,
                    messageId: message.messageId,
                    destinationId: message.destinationId,
                  }),
                },
              );
              continue;
            }
            const reason = taskReason(s, task, live);
            if (reason) {
              task.status = "blocked";
              task.reason = reason;
            }
          }
          if (read.cursor !== undefined) {
            if (Buffer.byteLength(JSON.stringify(read.cursor)) > 32768)
              throw issue(
                "channel_invalid",
                "Channel cursor exceeds its limit",
              );
            s.channel.cursor = clone(read.cursor);
          }
          s.service.lastTickAt = at();
          await tx.checkpoint();
          let processed = 0;
          for (const task of s.tasks.filter((t) =>
            ["queued", "ready"].includes(t.status),
          )) {
            if (processed++ >= budget) break;
            await executeTask(s, task, await liveSources(s), tx);
          }
          break;
        }
        case "update_source_refresh":
          break;
      }
      live = await liveSources(s);
      enforce(s, live);
      if (
        ["submit_request", "task_step", "tick", "approve", "deny"].includes(
          action,
        )
      ) {
        for (const task of s.tasks) queueOwnerNotification(s, task);
        await flushOwnerNotifications(s, tx);
      }
    }, options);
    return view(state, await liveSources(state));
  }
  return { snapshot, command };
}
