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
  const recoveryPath = join(directory, ".recovery-lock");
  async function ownedFile(target) {
    const file = await open(
      target,
      constants.O_WRONLY |
        constants.O_CREAT |
        constants.O_EXCL |
        constants.O_NOFOLLOW,
      0o600,
    );
    const content = JSON.stringify({
      pid: process.pid,
      nonce: randomUUID(),
      startedAt: new Date().toISOString(),
    });
    try {
      await file.writeFile(content);
      await file.sync();
      return { target, file, content, stat: await file.stat() };
    } catch (error) {
      await file.close();
      throw error;
    }
  }
  async function inspectLock(target) {
    const stat = await lstat(target);
    if (stat.isSymbolicLink() || !stat.isFile() || stat.size > 2048)
      throw issue("state_busy", "Lock file is not a bounded regular file");
    const file = await open(target, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      const opened = await file.stat();
      if (
        opened.ino !== stat.ino ||
        opened.dev !== stat.dev ||
        opened.size !== stat.size
      )
        throw issue("state_busy", "Lock changed while checking ownership");
      const content = await file.readFile("utf8");
      return { stat, content };
    } finally {
      await file.close();
    }
  }
  async function releaseOwned(owned) {
    try {
      const current = await inspectLock(owned.target);
      if (
        current.stat.ino !== owned.stat.ino ||
        current.stat.dev !== owned.stat.dev ||
        current.content !== owned.content
      )
        throw issue(
          "state_lock_lost",
          "Lock ownership changed; the replacement lock was preserved",
        );
      await unlink(owned.target);
    } catch (error) {
      if (error.code === "state_lock_lost") throw error;
      throw issue(
        "state_lock_lost",
        "Lock ownership could not be confirmed; the lock was preserved",
      );
    } finally {
      await owned.file.close();
    }
  }
  async function lock() {
    await checkedDirectory(directory, true);
    await chmod(directory, 0o700);
    let owned;
    try {
      owned = await ownedFile(lockPath);
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      // Recovery has its own exclusive mutex. It is deliberately never stolen:
      // a crashed recovery requires owner inspection rather than risking two writers.
      let recovery;
      try {
        recovery = await ownedFile(recoveryPath);
      } catch {
        throw issue(
          "state_busy",
          "Another recovery owns the mutex, or a crashed recovery needs owner inspection",
        );
      }
      try {
        let original;
        try {
          original = await inspectLock(lockPath);
        } catch (check) {
          if (check.code !== "ENOENT") throw check;
        }
        if (original) {
          let owner;
          try {
            owner = JSON.parse(original.content);
          } catch {
            throw issue("state_busy", "Lock owner is unknown");
          }
          if (!Number.isSafeInteger(owner.pid) || owner.pid <= 0)
            throw issue("state_busy", "Lock owner is unknown");
          try {
            process.kill(owner.pid, 0);
            throw issue(
              "state_busy",
              "Another live process owns the state lock",
            );
          } catch (check) {
            if (check.code !== "ESRCH")
              throw issue("state_busy", "Lock owner cannot be proven dead");
          }
          // Re-read under the recovery mutex before deleting. No second recovery
          // can carry an old inode check across the new writer's acquisition.
          const checked = await inspectLock(lockPath);
          if (
            checked.stat.ino !== original.stat.ino ||
            checked.stat.dev !== original.stat.dev ||
            checked.content !== original.content
          )
            throw issue("state_busy", "Lock changed during recovery");
          await unlink(lockPath);
        }
        try {
          owned = await ownedFile(lockPath);
        } catch {
          throw issue(
            "state_busy",
            "Another writer acquired the recovered lock",
          );
        }
      } catch (error) {
        if (error.code === "state_busy") throw error;
        throw issue(
          "state_busy",
          "Existing lock could not be recovered safely",
        );
      } finally {
        await releaseOwned(recovery);
      }
    }
    return async () => releaseOwned(owned);
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
