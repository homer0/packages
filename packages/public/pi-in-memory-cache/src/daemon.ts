/**
 * In-memory cache daemon.
 *
 * A long-running process that listens on a Unix domain socket and serves as a generic
 * key-value store. Clients communicate via a newline-delimited JSON (NDJSON) protocol —
 * one request line, one response line, one connection per request. The daemon is started
 * on demand by the client lib and is shared across all skill invocations for the lifetime
 * of the agent session.
 *
 * Supported operations: get, set, delete, ping, status, stop, flush. See `schemas.ts` for
 * the full request/response shapes.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { connect, createServer } from 'node:net';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { SOCKET_PATH } from './constants.js';
import type { SocketOperationResult, SocketMessage } from './schemas.js';
import type { CacheEntry } from './types.js';

/**
 * Resolves the Pi agent directory without importing from
 * `@earendil-works/pi-coding-agent`, which cannot be required by a standalone detached
 * process due to its package structure. Mirrors `getAgentDir()` from that package: checks
 * the `PI_CODING_AGENT_DIR` env var first, then falls back to `~/.pi/agent`.
 */
const resolveAgentDir = (): string => {
  // eslint-disable-next-line n/no-process-env -- daemon runs standalone outside the pi agent; must read the env var directly
  const envDir = process.env['PI_CODING_AGENT_DIR'];
  return envDir ?? join(homedir(), '.pi', 'agent');
};

/**
 * Directory and path for the shutdown artifact, under the agent's gitignored cache
 * folder. Written by `handleStop` so there is a persistent record of what the daemon held
 * when it last stopped.
 */
const ARTIFACT_DIR = join(resolveAgentDir(), 'cache', 'in-memory-cache');
const LAST_STOP_PATH = join(ARTIFACT_DIR, 'last-stop.json');

/** Timestamp recorded at process start, used to compute uptime. */
const START_TIME = Date.now();

/** Indentation level for the shutdown artifact JSON file. */
const JSON_INDENT = 2;

/** Live entries, keyed by the caller-provided string key. */
const store = new Map<string, CacheEntry>();

/** Active eviction timers, one per entry that has a finite TTL. */
const timers = new Map<string, ReturnType<typeof setTimeout>>();

/** Removes an entry and cancels its eviction timer, if any. */
const deleteEntry = (key: string): void => {
  store.delete(key);
  const timer = timers.get(key);
  if (typeof timer !== 'undefined') {
    clearTimeout(timer);
    timers.delete(key);
  }
};

/** Options for {@link setEntry}. */
type SetStoreEntryOptions = {
  /** The key to store the value under. */
  key: string;
  /** The value to store. */
  value: unknown;
  /** The time-to-live, in milliseconds. `0` means the entry never expires. */
  ttl: number;
};

/**
 * Stores a value under `key` and schedules its eviction after `ttl` milliseconds. A TTL
 * of `0` means the entry lives for the lifetime of the process.
 *
 * @param options The key, the value, and the time-to-live in milliseconds.
 */
const setEntry = ({ key, value, ttl }: SetStoreEntryOptions): void => {
  deleteEntry(key);
  const expiresAt = ttl > 0 ? Date.now() + ttl : null;
  store.set(key, { value, expiresAt });
  if (ttl > 0) {
    // unref so the timer does not prevent the process from exiting naturally.
    const timer = setTimeout(() => deleteEntry(key), ttl);
    timer.unref?.();
    timers.set(key, timer);
  }
};

/**
 * All handlers receive the validated request record (or nothing for ops with no
 * parameters) and return a `HandlerResult` — the NDJSON response to write back to the
 * client plus a `stop` flag that signals the server to shut down after replying.
 */

/** Looks up a key; returns the stored value or `found: false`. */
const handleGet = (raw: Record<string, unknown>): SocketOperationResult<'get'> => {
  if (typeof raw['key'] !== 'string') {
    return { response: { ok: false, error: 'get: key must be a string' }, stop: false };
  }
  const entry = store.get(raw['key']);
  if (typeof entry === 'undefined') {
    return { response: { ok: true, found: false }, stop: false };
  }
  return {
    response: { ok: true, found: true, value: entry.value },
    stop: false,
  };
};

/** Stores a value under the given key with the specified TTL in milliseconds. */
const handleSet = (raw: Record<string, unknown>): SocketOperationResult<'set'> => {
  if (typeof raw['key'] !== 'string') {
    return { response: { ok: false, error: 'set: key must be a string' }, stop: false };
  }
  if (typeof raw['ttl'] !== 'number') {
    return { response: { ok: false, error: 'set: ttl must be a number' }, stop: false };
  }
  setEntry({ key: raw['key'], value: raw['value'], ttl: raw['ttl'] });
  return { response: { ok: true }, stop: false };
};

/** Removes the entry under the given key, if any. Missing keys are not an error. */
const handleDelete = (raw: Record<string, unknown>): SocketOperationResult<'delete'> => {
  if (typeof raw['key'] !== 'string') {
    return {
      response: { ok: false, error: 'delete: key must be a string' },
      stop: false,
    };
  }
  deleteEntry(raw['key']);
  return { response: { ok: true }, stop: false };
};

/** Returns current uptime and entry count — a lightweight liveness check. */
const handlePing = (): SocketOperationResult<'ping'> => {
  const response = {
    ok: true,
    uptimeMs: Date.now() - START_TIME,
    entries: store.size,
  } as const;
  return { response, stop: false };
};

/** Returns full process diagnostics: uptime, entries, PID, memory, and CPU usage. */
const handleStatus = (): SocketOperationResult<'status'> => {
  const cpu = process.cpuUsage();
  const response = {
    ok: true,
    uptimeMs: Date.now() - START_TIME,
    entries: store.size,
    pid: process.pid,
    memoryRssBytes: process.memoryUsage().rss,
    // cpuUsage returns microseconds; convert to milliseconds for readability.
    cpuUserMs: Math.round(cpu.user / 1_000),
    cpuSystemMs: Math.round(cpu.system / 1_000),
  } as const;
  return { response, stop: false };
};

/**
 * Signals the server to shut down. Writes `last-stop.json` alongside the socket file
 * before exiting so there is a persistent record of what the daemon held at shutdown.
 * Uses a synchronous write so the file is guaranteed to land before `process.exit(0)` is
 * called. Only metadata is written — no cached values.
 */
const handleStop = (): SocketOperationResult<'stop'> => {
  try {
    mkdirSync(ARTIFACT_DIR, { recursive: true });
    writeFileSync(
      LAST_STOP_PATH,
      JSON.stringify(
        {
          stoppedAt: new Date().toISOString(),
          uptimeMs: Date.now() - START_TIME,
          entries: store.size,
          pid: process.pid,
          memoryRssBytes: process.memoryUsage().rss,
        },
        null,
        JSON_INDENT,
      ),
    );
  } catch {
    // Best-effort — don't block shutdown if the write fails.
  }
  return { response: { ok: true }, stop: true };
};

/** Clears all entries and their eviction timers. Returns the number cleared. */
const handleFlush = (): SocketOperationResult<'flush'> => {
  const cleared = store.size;
  for (const timer of timers.values()) clearTimeout(timer);
  store.clear();
  timers.clear();
  return { response: { ok: true, cleared }, stop: false };
};

/** Returns an error response for any unrecognised operation name. */
const handleUnknownOp = (op: string): SocketMessage => ({
  response: { ok: false, error: `Unknown op: ${op}` },
  stop: false,
});

/**
 * Validates the raw parsed JSON and dispatches to the appropriate handler. Returns both
 * the response to send and whether the server should stop.
 */
const handleRequest = (raw: unknown): SocketMessage => {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { response: { ok: false, error: 'Missing or invalid op' }, stop: false };
  }
  const request = raw as Record<string, unknown>;
  if (typeof request['op'] !== 'string') {
    return { response: { ok: false, error: 'Missing or invalid op' }, stop: false };
  }

  const { op } = request;

  switch (op) {
    case 'get':
      return handleGet(request);
    case 'set':
      return handleSet(request);
    case 'delete':
      return handleDelete(request);
    case 'ping':
      return handlePing();
    case 'status':
      return handleStatus();
    case 'stop':
      return handleStop();
    case 'flush':
      return handleFlush();
    default:
      return handleUnknownOp(op);
  }
};

/**
 * Unix domain socket server. Each connection handles exactly one request: read until
 * newline → parse JSON → dispatch → write response → close.
 */
const server = createServer((socket) => {
  // Buffer accumulates data until a complete newline-terminated JSON line arrives.
  let buffer = '';

  socket.on('data', (chunk) => {
    buffer += chunk.toString();
    const newlineIdx = buffer.indexOf('\n');
    if (newlineIdx === -1) return;

    const line = buffer.slice(0, newlineIdx);
    buffer = buffer.slice(newlineIdx + 1);

    let raw: unknown;
    try {
      raw = JSON.parse(line);
    } catch {
      socket.write(`${JSON.stringify({ ok: false, error: 'Invalid JSON' })}\n`);
      socket.end();
      return;
    }

    const { response, stop } = handleRequest(raw);
    socket.write(`${JSON.stringify(response)}\n`);
    socket.end();

    // After replying to `stop`, close the server and exit cleanly.
    if (stop) server.close(() => process.exit(0));
  });

  socket.on('error', () => socket.destroy());
});

/**
 * Attempts to connect to the socket path. Returns `true` if a live daemon is already
 * listening there, `false` if the connection is refused or the file does not exist.
 */
const checkLiveDaemon = (): Promise<boolean> =>
  new Promise((resolve) => {
    const socket = connect(SOCKET_PATH);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
  });

const start = async (): Promise<void> => {
  // Exit immediately when a live daemon is already running — only one instance
  // should own the socket at a time. The losing concurrent spawn silently exits.
  const alive = await checkLiveDaemon();
  if (alive) process.exit(0);

  // Remove a stale socket file left behind by a previously crashed daemon.
  // Without this, `server.listen` would throw EADDRINUSE even though no
  // process is actually bound to the path.
  try {
    await unlink(SOCKET_PATH);
  } catch {
    // No stale file — nothing to do.
  }

  server.listen(SOCKET_PATH);
};

start().catch((error: unknown) => {
  // eslint-disable-next-line no-console -- startup errors must be visible
  console.error(
    '[in-memory-cache daemon] startup failed:',
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});
