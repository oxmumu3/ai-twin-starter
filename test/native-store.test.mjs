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
test(
  "thirty synchronized multi-process dead-lock recoveries never overlap or remove a live writer lock",
  { timeout: 120000 },
  async (t) => {
    const { spawn } = await import("node:child_process");
    const dir = await fixture(t);
    const moduleURL = new URL("../src/native-store.mjs", import.meta.url).href;
    const active = new Set();
    t.after(() => {
      for (const child of active) child.kill();
    });
    const source = `import {open,unlink} from 'node:fs/promises';import {join} from 'node:path';import {setTimeout as delay} from 'node:timers/promises';import {createTwinStore} from ${JSON.stringify(moduleURL)};process.send('ready');process.on('message',async dir=>{const store=createTwinStore({stateDir:dir,initialState:()=>({revision:0,count:0})});try{await store.transaction(async state=>{let marker;try{marker=await open(join(dir,'active'),'wx');}catch(error){process.send({overlap:true,code:error.code});await delay(100);return;}await delay(100);state.count++;await marker.close();await unlink(join(dir,'active'));});process.send({ok:true});}catch(error){process.send({error:error.code??error.message});}process.exit();});`;
    for (let round = 0; round < 30; round++) {
      const base = join(dir, String(round)),
        store = createTwinStore({
          stateDir: base,
          initialState: () => ({ revision: 0, count: 0 }),
        });
      await store.read();
      await writeFile(
        join(base, ".lock"),
        JSON.stringify({
          pid: 2147483647,
          startedAt: new Date().toISOString(),
        }),
      );
      const output = [];
      const workers = Array.from({ length: 10 }, () => {
        const child = spawn(
          process.execPath,
          ["--input-type=module", "-e", source],
          { stdio: ["ignore", "ignore", "pipe", "ipc"] },
        );
        active.add(child);
        child.once("exit", () => active.delete(child));
        return child;
      });
      await Promise.all(
        workers.map(
          (child) =>
            new Promise((resolve, reject) => {
              let ready = false;
              child.on("message", (message) => {
                if (message === "ready") {
                  ready = true;
                  resolve();
                } else output.push(message);
              });
              child.once("error", reject);
              child.once("exit", (code) => {
                if (!ready)
                  reject(Error(`Worker exited before ready: ${code}`));
              });
            }),
        ),
      );
      const exited = workers.map(
        (child) => new Promise((resolve) => child.once("exit", resolve)),
      );
      workers.forEach((child) => child.send(base));
      await Promise.all(exited);
      assert.equal(
        output.filter((entry) => entry.overlap).length,
        0,
        `critical section overlap in round ${round}: ${JSON.stringify(output)}`,
      );
      assert.ok(
        output.every(
          (entry) => entry.ok === true || entry.error === "state_busy",
        ),
        `unexpected lock release failure in round ${round}: ${JSON.stringify(output)}`,
      );
      const state = await store.read();
      assert.equal(
        state.count,
        output.filter((entry) => entry.ok === true).length,
      );
      assert.equal(state.revision, state.count);
      assert.ok(state.count >= 1);
    }
  },
);
test("a crashed recovery mutex is retained for owner inspection rather than recursively stolen", async (t) => {
  const dir = await fixture(t),
    store = createTwinStore({
      stateDir: dir,
      initialState: () => ({ revision: 0 }),
    });
  await store.read();
  const dead = JSON.stringify({ pid: 2147483647, nonce: "abandoned" });
  await writeFile(join(dir, ".lock"), dead);
  await writeFile(join(dir, ".recovery-lock"), dead);
  await assert.rejects(
    store.transaction(async () => {}),
    (e) => e.code === "state_busy",
  );
  assert.equal(await readFile(join(dir, ".lock"), "utf8"), dead);
  assert.equal(await readFile(join(dir, ".recovery-lock"), "utf8"), dead);
});
test("normal unlock preserves a replacement inode and reports lost ownership", async (t) => {
  const { rename } = await import("node:fs/promises");
  const dir = await fixture(t),
    store = createTwinStore({
      stateDir: dir,
      initialState: () => ({ revision: 0 }),
    });
  await store.read();
  const replacement = JSON.stringify({
    pid: process.pid,
    nonce: "replacement-live-writer",
  });
  await assert.rejects(
    store.transaction(async () => {
      await rename(join(dir, ".lock"), join(dir, ".original-lock"));
      await writeFile(join(dir, ".lock"), replacement);
    }),
    (e) => e.code === "state_lock_lost",
  );
  assert.equal(await readFile(join(dir, ".lock"), "utf8"), replacement);
});
