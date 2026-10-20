import { constants } from "node:fs";
import { chmod, lstat, mkdir, open, rename, unlink } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { dirname, join, parse, resolve, sep } from "node:path";

const MAX_BYTES = 8 * 1024 * 1024;
const digest = (data) => createHash("sha256").update(data).digest("hex");
const clone = (value) => structuredClone(value);
function issue(code, message) {
  return Object.assign(new Error(message), { code });
}
async function checkedDirectory(path, create = false) {
  const absolute = resolve(path),
    root = parse(absolute).root;
  let current = root;
  for (const piece of absolute.slice(root.length).split(sep).filter(Boolean)) {
    current = join(current, piece);
    let stat;
    try {
      stat = await lstat(current);
    } catch (error) {
      if (error.code !== "ENOENT" || !create) throw error;
      await mkdir(current, { mode: 0o700 });
      stat = await lstat(current);
    }
    if (stat.isSymbolicLink())
      throw issue(
        "unsafe_state_path",
        "State directory must not contain a symlink",
      );
    if (!stat.isDirectory())
      throw issue("unsafe_state_path", "State path must be a directory");
  }
  return absolute;
}
async function readEnvelope(path) {
  let handle;
  try {
    const stat = await lstat(path);
    if (stat.isSymbolicLink() || !stat.isFile() || stat.size > MAX_BYTES)
      throw issue(
        "state_corrupt",
        "Private state is not a bounded regular file",
      );
    handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    const opened = await handle.stat();
    if (!opened.isFile() || opened.size > MAX_BYTES)
      throw issue("state_corrupt", "Private state type or size changed");
    const bytes = await handle.readFile();
    if (bytes.length > MAX_BYTES)
      throw issue("state_corrupt", "Private state exceeded its read limit");
    const envelope = JSON.parse(bytes.toString("utf8"));
    if (
      envelope.format !== 1 ||
      typeof envelope.checksum !== "string" ||
      !envelope.state ||
      typeof envelope.state !== "object" ||
      Array.isArray(envelope.state) ||
      envelope.checksum !== digest(JSON.stringify(envelope.state)) ||
      !Number.isSafeInteger(envelope.state.revision) ||
      envelope.state.revision < 0
    )
      throw issue(
        "state_corrupt",
        "Private state integrity check failed; existing data was preserved",
      );
    return envelope.state;
  } catch (error) {
    if (error instanceof SyntaxError)
      throw issue(
        "state_corrupt",
        "Private state JSON is damaged; existing data was preserved",
      );
    throw error;
  } finally {
    await handle?.close();
  }
}
async function writeEnvelope(path, state) {
  const data =
    JSON.stringify(
      { format: 1, checksum: digest(JSON.stringify(state)), state },
      null,
      2,
    ) + "\n";
  if (Buffer.byteLength(data) > MAX_BYTES)
    throw issue(
      "state_limit",
      "Private state limit reached; no ledger entries were discarded",
    );
  try {
    const stat = await lstat(path);
    if (stat.isSymbolicLink() || !stat.isFile())
      throw issue("state_corrupt", "State target must be a regular file");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const temporary = join(dirname(path), `.state-${randomUUID()}.tmp`);
  let file;
  try {
    file = await open(
      temporary,
      constants.O_WRONLY |
        constants.O_CREAT |
        constants.O_EXCL |
        constants.O_NOFOLLOW,
      0o600,
    );
    await file.writeFile(data);
    await file.sync();
    await file.close();
    file = null;
    await rename(temporary, path);
    const directory = await open(dirname(path), constants.O_RDONLY);
    try {
      await directory.sync();
    } finally {
      await directory.close();
    }
  } finally {
    await file?.close();
    await unlink(temporary).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
}
/** Private, checksum-protected file store. Locks are never stolen; damaged data is never reset. */
export function createTwinStore({ stateDir, initialState }) {
  if (
    typeof stateDir !== "string" ||
    !stateDir.trim() ||
    stateDir.includes("\0")
  )
    throw new TypeError("stateDir must be an explicit directory");
  const directory = resolve(stateDir),
    path = join(directory, "state.json"),
    lockPath = join(directory, ".lock");
  async function lock() {
    await checkedDirectory(directory, true);
    await chmod(directory, 0o700);
    let file;
    try {
      file = await open(
        lockPath,
        constants.O_WRONLY |
          constants.O_CREAT |
          constants.O_EXCL |
          constants.O_NOFOLLOW,
        0o600,
      );
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      // Only an owner proven dead by the OS may be reclaimed. Age alone is never evidence.
      let before, original, owner;
      try {
        before = await lstat(lockPath);
        if (before.isSymbolicLink() || !before.isFile() || before.size > 2048)
          throw Error("unsafe");
        const handle = await open(
          lockPath,
          constants.O_RDONLY | constants.O_NOFOLLOW,
        );
        try {
          original = await handle.readFile("utf8");
        } finally {
          await handle.close();
        }
        owner = JSON.parse(original);
        if (!Number.isSafeInteger(owner.pid) || owner.pid <= 0)
          throw Error("unknown owner");
        try {
          process.kill(owner.pid, 0);
          throw Error("alive");
        } catch (check) {
          if (check.code !== "ESRCH") throw check;
        }
        const checked = await lstat(lockPath);
        const handle2 = await open(
          lockPath,
          constants.O_RDONLY | constants.O_NOFOLLOW,
        );
        let current;
        try {
          current = await handle2.readFile("utf8");
        } finally {
          await handle2.close();
        }
        if (
          checked.ino !== before.ino ||
          checked.dev !== before.dev ||
          checked.size !== before.size ||
          current !== original
        )
          throw Error("changed");
        await unlink(lockPath);
      } catch {
        throw issue(
          "state_busy",
          "Another command owns the state lock or its owner cannot be proven dead",
        );
      }
      try {
        file = await open(
          lockPath,
          constants.O_WRONLY |
            constants.O_CREAT |
            constants.O_EXCL |
            constants.O_NOFOLLOW,
          0o600,
        );
      } catch {
        throw issue("state_busy", "Another writer acquired the recovered lock");
      }
    }
    await file.writeFile(
      JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }),
    );
    await file.sync();
    return async () => {
      await file.close();
      await unlink(lockPath);
    };
  }
  async function read() {
    await checkedDirectory(directory, true);
    await chmod(directory, 0o700);
    try {
      return clone(await readEnvelope(path));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    const unlock = await lock();
    try {
      try {
        return clone(await readEnvelope(path));
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      const initial =
        typeof initialState === "function"
          ? initialState()
          : clone(initialState);
      if (!initial || initial.revision !== 0)
        throw new TypeError("Initial state must have revision zero");
      await writeEnvelope(path, initial);
      return clone(initial);
    } finally {
      await unlock();
    }
  }
  async function transaction(fn, { expectedRevision } = {}) {
    // Initial creation has a separate exclusive lock; never recursively acquire it.
    await read();
    const unlock = await lock();
    try {
      const state = await readEnvelope(path);
      if (expectedRevision !== undefined && expectedRevision !== state.revision)
        throw issue(
          "revision_conflict",
          "State changed since this page loaded; refresh before repeating the action",
        );
      state.revision += 1;
      const checkpoint = async () => writeEnvelope(path, state);
      await fn(state, { checkpoint });
      await checkpoint();
      return clone(state);
    } finally {
      await unlock();
    }
  }
  return { read, transaction, path };
}
