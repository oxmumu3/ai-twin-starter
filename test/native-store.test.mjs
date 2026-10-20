import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  readFile,
  writeFile,
  stat,
  symlink,
  rm,
  realpath,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTwinStore } from "../src/native-store.mjs";

async function fixture(t) {
  const dir = await realpath(
    await mkdtemp(join(tmpdir(), "native-twin-store-")),
  );
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}
test("private atomic store survives restart and rejects stale revisions", async (t) => {
  const dir = await fixture(t);
  const store = createTwinStore({
    stateDir: join(dir, "private"),
    initialState: () => ({ revision: 0, value: 0 }),
  });
  assert.equal((await store.read()).revision, 0);
  await store.transaction(
    async (s) => {
      s.value = 42;
    },
    { expectedRevision: 0 },
  );
  assert.equal(
    (
      await createTwinStore({
        stateDir: join(dir, "private"),
        initialState: () => ({ revision: 0 }),
      }).read()
    ).value,
    42,
  );
  await assert.rejects(
    store.transaction(
      async (s) => {
        s.value = 99;
      },
      { expectedRevision: 0 },
    ),
    (e) => e.code === "revision_conflict",
  );
  assert.equal(
    (await stat(join(dir, "private", "state.json"))).mode & 0o777,
    0o600,
  );
  assert.equal((await stat(join(dir, "private"))).mode & 0o777, 0o700);
});
test("corruption, symlinks and another writer fail closed without resetting", async (t) => {
  const dir = await fixture(t);
  const base = join(dir, "private");
  const store = createTwinStore({
    stateDir: base,
    initialState: () => ({ revision: 0, value: 7 }),
  });
  await store.read();
  const original = await readFile(join(base, "state.json"), "utf8");
  await writeFile(
    join(base, "state.json"),
    original.replace('"value": 7', '"value": 8'),
  );
  await assert.rejects(store.read(), (e) => e.code === "state_corrupt");
  assert.notEqual(await readFile(join(base, "state.json"), "utf8"), original);
  await writeFile(join(base, "state.json"), original);
  await writeFile(join(base, ".lock"), "other writer");
  await assert.rejects(
    store.transaction(async () => {}),
    (e) => e.code === "state_busy",
  );
  const link = join(dir, "link");
  await symlink(base, link);
  await assert.rejects(
    createTwinStore({
      stateDir: link,
      initialState: () => ({ revision: 0 }),
    }).read(),
    /symlink/i,
  );
});
test("checkpoints are durable before external effects and one command has one revision", async (t) => {
  const dir = await fixture(t);
  const store = createTwinStore({
    stateDir: join(dir, "private"),
    initialState: () => ({ revision: 0, phase: "idle" }),
  });
  await store.transaction(async (s, { checkpoint }) => {
    s.phase = "sending";
    await checkpoint();
    assert.equal((await store.read()).phase, "sending");
    s.phase = "sent";
  });
  assert.deepEqual(await store.read(), { revision: 1, phase: "sent" });
});
test("an OS-confirmed dead child lock is recovered; a live PID lock is retained", async (t) => {
  const { spawn } = await import("node:child_process");
  const dir = await fixture(t),
    base = join(dir, "private");
  const store = createTwinStore({
    stateDir: base,
    initialState: () => ({ revision: 0, value: 1 }),
  });
  await store.read();
  const child = spawn(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `import {writeFileSync} from 'node:fs';writeFileSync(${JSON.stringify(join(base, ".lock"))},JSON.stringify({pid:process.pid,startedAt:new Date().toISOString()}));`,
    ],
    { stdio: "ignore" },
  );
  await new Promise((res, rej) => {
    child.once("error", rej);
    child.once("exit", res);
  });
  await store.transaction(async (s) => {
    s.value = 2;
  });
  assert.equal((await store.read()).value, 2);
  await writeFile(
    join(base, ".lock"),
    JSON.stringify({ pid: process.pid, startedAt: "1900-01-01" }),
  );
  await assert.rejects(
    store.transaction(async () => {}),
    (e) => e.code === "state_busy",
  );
  assert.ok(await readFile(join(base, ".lock"), "utf8"));
});
