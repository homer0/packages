import { getConfigValue } from '@homer0/pi-config';
import { execFile, spawn } from 'node:child_process';
import { connect } from 'node:net';
import { setTimeout as sleep } from 'node:timers/promises';
import { promisify } from 'node:util';
import { type z, type ZodType } from 'zod';
import {
  DAEMON_ENTRY,
  DEFAULT_MAX_UPTIME,
  POLL_INTERVAL,
  POLL_TIMEOUT,
  SOCKET_PATH,
} from './constants.js';
import {
  inMemoryCacheConfigSchema,
  socketResponseSchema,
  socketOperations,
  type InMemoryCacheConfig,
  type SocketMessageOp,
  type SocketOperationRequest,
  type SocketOperationResponse,
} from './schemas.js';
import type {
  GetCachedOptions,
  GetEntryOptions,
  RemoveEntryOptions,
  SetEntryOptions,
} from './types.js';
import { ensureError, JITI_BIN, ms } from './utils.js';

const execFileAsync = promisify(execFile);

/**
 * Returns the resolved `extensions.inMemoryCache` config block. When the block is absent,
 * all field defaults from `inMemoryCacheConfigSchema` are applied.
 *
 * @returns The config.
 */
const getInMemoryCacheConfig = async (): Promise<InMemoryCacheConfig> => {
  const saved = await getConfigValue('extensions.inMemoryCache', {
    schema: inMemoryCacheConfigSchema,
  });
  if (saved) return saved;
  return inMemoryCacheConfigSchema.parse({
    maxUptime: DEFAULT_MAX_UPTIME,
  });
};

/**
 * Checks if a live daemon is bound to the socket path.
 *
 * @returns Whether there is one.
 */
const tryConnect = (): Promise<boolean> =>
  new Promise((resolve) => {
    const socket = connect(SOCKET_PATH);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => {
      resolve(false);
    });
  });

/**
 * Spawns the daemon via a shell double-fork so the daemon is reparented to `init`
 * immediately and is not a direct child of the calling process. This prevents the caller
 * (e.g. the pi agent) from killing the daemon when it exits, even if it sends SIGTERM to
 * its child processes on shutdown.
 */
const spawnDaemon = (): void => {
  spawn('sh', ['-c', `${JITI_BIN} ${DAEMON_ENTRY} &`], {
    detached: true,
    stdio: 'ignore',
  }).unref();
};

/**
 * Polls until the daemon socket accepts connections.
 *
 * @throws {Error} When the daemon doesn't start before the timeout.
 */
const waitForDaemon = async (): Promise<void> => {
  const deadline = Date.now() + POLL_TIMEOUT;
  while (Date.now() < deadline) {
    const alive = await tryConnect();
    if (alive) return;
    await sleep(POLL_INTERVAL);
  }
  throw new Error(`in-memory-cache daemon did not start within ${POLL_TIMEOUT}ms`);
};

/**
 * Polls until the daemon stops accepting connections. Falls back to a force-kill via
 * `lsof -t` if the daemon is unresponsive after the timeout.
 */
const waitForDaemonGone = async (): Promise<void> => {
  const deadline = Date.now() + POLL_TIMEOUT;
  while (Date.now() < deadline) {
    const alive = await tryConnect();
    if (!alive) return;
    await sleep(POLL_INTERVAL);
  }
  // Still alive after timeout — force-kill via lsof
  try {
    const { stdout } = await execFileAsync('lsof', ['-t', SOCKET_PATH]);
    const pid = parseInt(stdout.trim(), 10);
    if (!Number.isNaN(pid)) process.kill(pid);
  } catch {
    // Best-effort — don't block restart if force-kill fails.
  }
};

/**
 * Opens a connection to the daemon, sends one NDJSON request, reads one NDJSON response,
 * and returns the parsed response. The response type is inferred from the request op via
 * `socketOperations`.
 *
 * @template Op The name of the operation.
 * @param request The request to send.
 * @returns The response of the daemon.
 * @throws {Error} When the daemon replies with `ok: false`, the reply is not valid, or
 *   the connection fails.
 */
const sendRequest = <Op extends SocketMessageOp>(
  request: SocketOperationRequest<Op> & { op: Op },
): Promise<SocketOperationResponse<Op>> =>
  new Promise((resolve, reject) => {
    const socket = connect(SOCKET_PATH);
    let buffer = '';

    const safeRequest = socketOperations[request.op].request.parse(request);
    socket.on('connect', () => {
      socket.write(`${JSON.stringify(safeRequest)}\n`);
    });

    socket.on('data', (chunk) => {
      buffer += chunk.toString();
      const newlineIdx = buffer.indexOf('\n');
      if (newlineIdx === -1) return;
      socket.destroy();
      try {
        const rawObject = JSON.parse(buffer.slice(0, newlineIdx)) as unknown;
        const response = socketResponseSchema.parse(rawObject);
        if (!response.ok) {
          reject(new Error(response.error));
          return;
        }

        const message = socketOperations[request.op];
        const raw = message.response.parse(response);
        resolve(raw as SocketOperationResponse<Op>);
      } catch (error) {
        reject(ensureError(error));
      }
    });

    socket.on('error', reject);
  });

/**
 * Ensures the daemon is running and healthy. Spawns it when absent. Restarts it when
 * `uptimeMs` exceeds `maxUptime` from config (default 1 hour).
 */
const ensureDaemon = async (): Promise<void> => {
  const alive = await tryConnect();
  if (!alive) {
    spawnDaemon();
    await waitForDaemon();
    return;
  }

  const { maxUptime } = await getInMemoryCacheConfig();
  const ping = await sendRequest({ op: 'ping' });
  if (ping.uptimeMs <= maxUptime) return;

  // Uptime exceeded — restart gracefully, fall back to force-kill if needed.
  try {
    await sendRequest({ op: 'stop' });
  } catch {
    // daemon may have already exited
  }
  await waitForDaemonGone();
  spawnDaemon();
  await waitForDaemon();
};

/**
 * Returns a cached value for `key`, or calls `fetchFn` on a cache miss. Validates values
 * with `schema` on both hit and miss — the return type is inferred directly from the
 * schema. A schema mismatch on a cached hit is treated as a miss, triggering a re-fetch.
 *
 * @template TSchema The schema of the value.
 * @param options The key, the schema, the time-to-live, and the function to fetch the
 *   value.
 * @returns The cached or fetched value.
 */
export const getCached = async <TSchema extends ZodType>({
  key,
  schema,
  ttl,
  fetchFn,
}: GetCachedOptions<TSchema>): Promise<z.infer<TSchema>> => {
  await ensureDaemon();

  const getResp = await sendRequest({ op: 'get', key });
  if (getResp.found) {
    const parsed = schema.safeParse(getResp.value);
    if (parsed.success) return parsed.data as z.infer<TSchema>;
    // Cached value failed schema validation — treat as miss and re-fetch.
  }

  const fetched = await fetchFn();
  const validated = schema.parse(fetched) as z.infer<TSchema>;
  await sendRequest({ op: 'set', key, value: validated, ttl: ms(ttl) });
  return validated;
};

/**
 * Returns the value stored under `key`, validated with `schema`, or `undefined` when the
 * entry is missing or fails validation. Never fetches or writes.
 *
 * @template TSchema The schema of the value.
 * @param options The key and the schema.
 * @returns The value, or `undefined`.
 */
export const getEntry = async <TSchema extends ZodType>({
  key,
  schema,
}: GetEntryOptions<TSchema>): Promise<z.infer<TSchema> | undefined> => {
  await ensureDaemon();

  const getResp = await sendRequest({ op: 'get', key });
  if (!getResp.found) return undefined;

  const parsed = schema.safeParse(getResp.value);
  return parsed.success ? (parsed.data as z.infer<TSchema>) : undefined;
};

/**
 * Stores `value` under `key`, replacing any existing entry.
 *
 * @param options The key, the value, and the time-to-live.
 */
export const setEntry = async ({ key, value, ttl }: SetEntryOptions): Promise<void> => {
  await ensureDaemon();
  await sendRequest({ op: 'set', key, value, ttl: ms(ttl) });
};

/**
 * Removes the entry under `key`. Does nothing when it doesn't exist.
 *
 * @param options The key.
 */
export const removeEntry = async ({ key }: RemoveEntryOptions): Promise<void> => {
  await ensureDaemon();
  await sendRequest({ op: 'delete', key });
};

/**
 * Returns live daemon diagnostics (uptime, entries, PID, memory, CPU), or `null` when the
 * daemon is not running.
 *
 * @returns The status, or `null`.
 */
export const getDaemonStatus =
  async (): Promise<SocketOperationResponse<'status'> | null> => {
    try {
      return await sendRequest({ op: 'status' });
    } catch {
      return null;
    }
  };

/**
 * Sends a stop signal to the daemon.
 *
 * @returns The response of the daemon.
 * @throws {Error} When the daemon is not running.
 */
export const stopDaemon = (): Promise<SocketOperationResponse<'stop'>> =>
  sendRequest({ op: 'stop' });

/**
 * Flushes all cache entries.
 *
 * @returns The response of the daemon, with the number of entries cleared.
 * @throws {Error} When the daemon is not running.
 */
export const flushCache = (): Promise<SocketOperationResponse<'flush'>> =>
  sendRequest({ op: 'flush' });

/**
 * Stops the running daemon (or skips if already down), spawns a fresh instance, and
 * returns the new daemon PID.
 *
 * @returns The PID of the new daemon.
 */
export const restartDaemon = async (): Promise<number> => {
  try {
    await sendRequest({ op: 'stop' });
  } catch {
    // daemon may already be down
  }
  await waitForDaemonGone();
  spawnDaemon();
  await waitForDaemon();
  const status = await sendRequest({ op: 'status' });
  return status.pid;
};
