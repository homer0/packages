import { getConfigValue } from '@homer0/pi-config';
import { execFile, spawn } from 'node:child_process';
import { unlink } from 'node:fs/promises';
import { createServer, type Server } from 'node:net';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  flushCache,
  getCached,
  getDaemonStatus,
  getEntry,
  removeEntry,
  restartDaemon,
  setEntry,
  stopDaemon,
} from './client.js';
import { DAEMON_ENTRY, POLL_TIMEOUT, SOCKET_PATH } from './constants.js';
import { JITI_BIN } from './utils.js';

vi.mock('./constants.js', async (importOriginal) => {
  const { join } = await import('node:path');
  const { tmpdir } = await import('node:os');
  const { randomUUID } = await import('node:crypto');
  return {
    ...(await importOriginal<typeof import('./constants.js')>()),
    SOCKET_PATH: join(tmpdir(), `pi-imc-client-${randomUUID().slice(0, 8)}.sock`),
    POLL_TIMEOUT: 300,
    POLL_INTERVAL: 10,
  };
});
vi.mock('node:child_process', () => ({ execFile: vi.fn(), spawn: vi.fn() }));
vi.mock('@homer0/pi-config', () => ({ getConfigValue: vi.fn() }));

describe('client', () => {
  type Request = Record<string, unknown>;

  const requests: Request[] = [];
  let server: Server | undefined;
  let reply: (request: Request) => unknown;
  let stopClosesServer: boolean;

  /** The replies of a healthy daemon, by operation. */
  const healthyReply = (request: Request): unknown => {
    switch (request['op']) {
      case 'ping':
        return { ok: true, uptimeMs: 1_000, entries: 2 };
      case 'get':
        return { ok: true, found: false };
      case 'status':
        return {
          ok: true,
          uptimeMs: 1_000,
          entries: 2,
          pid: 99,
          memoryRssBytes: 1_048_576,
          cpuUserMs: 1,
          cpuSystemMs: 2,
        };
      case 'flush':
        return { ok: true, cleared: 2 };
      default:
        return { ok: true };
    }
  };

  /** The operations the daemon received, in order. */
  const getOps = (): unknown[] => requests.map((request) => request['op']);

  /**
   * Starts a fake daemon on the socket path. It answers with `reply`, writing the answer
   * in two chunks, like a slow connection would.
   */
  const startFakeDaemon = async (): Promise<void> => {
    if (server) return;
    const created = createServer((socket) => {
      let buffer = '';
      socket.on('data', (chunk) => {
        buffer += chunk.toString();
        const newlineIdx = buffer.indexOf('\n');
        if (newlineIdx === -1) return;
        const request = JSON.parse(buffer.slice(0, newlineIdx)) as Request;
        requests.push(request);
        const answer = reply(request);
        const line = typeof answer === 'string' ? answer : JSON.stringify(answer);
        const half = Math.floor(line.length / 2);
        socket.write(line.slice(0, half));
        setTimeout(() => {
          socket.end(`${line.slice(half)}\n`);
          if (request['op'] === 'stop' && stopClosesServer) {
            server = undefined;
            created.close();
          }
        }, 5);
      });
    });
    server = created;
    await new Promise<void>((resolve) => {
      created.listen(SOCKET_PATH, resolve);
    });
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    requests.length = 0;
    reply = healthyReply;
    stopClosesServer = true;
    await unlink(SOCKET_PATH).catch(() => {});
    vi.mocked(getConfigValue).mockResolvedValue(undefined);
    vi.mocked(spawn).mockImplementation(() => {
      startFakeDaemon().catch(() => {});
      return { unref: vi.fn() } as never;
    });
  });

  afterEach(async () => {
    const running = server;
    server = undefined;
    if (running?.listening) {
      await new Promise<void>((resolve) => {
        running.close(() => {
          resolve();
        });
      });
    }
    await unlink(SOCKET_PATH).catch(() => {});
    vi.restoreAllMocks();
  });

  describe('getCached', () => {
    const schema = z.object({ n: z.number() });

    it('fetches on a miss and stores the value with the ttl in milliseconds', async () => {
      await startFakeDaemon();
      const fetchFn = vi.fn().mockResolvedValue({ n: 1 });

      const value = await getCached({ key: 'k', schema, ttl: '5m', fetchFn });

      expect(value).toEqual({ n: 1 });
      expect(getOps()).toEqual(['ping', 'get', 'set']);
      expect(requests[2]).toEqual({ op: 'set', key: 'k', value: { n: 1 }, ttl: 300_000 });
    });

    it('returns the cached value on a hit, without fetching', async () => {
      await startFakeDaemon();
      reply = (request) =>
        request['op'] === 'get'
          ? { ok: true, found: true, value: { n: 2 } }
          : healthyReply(request);
      const fetchFn = vi.fn();

      const value = await getCached({ key: 'k', schema, ttl: 1_000, fetchFn });

      expect(value).toEqual({ n: 2 });
      expect(fetchFn).not.toHaveBeenCalled();
      expect(getOps()).toEqual(['ping', 'get']);
    });

    it('treats a cached value that does not match the schema as a miss', async () => {
      await startFakeDaemon();
      reply = (request) =>
        request['op'] === 'get'
          ? { ok: true, found: true, value: 'not an object' }
          : healthyReply(request);
      const fetchFn = vi.fn().mockResolvedValue({ n: 3 });

      const value = await getCached({ key: 'k', schema, ttl: 1_000, fetchFn });

      expect(value).toEqual({ n: 3 });
      expect(getOps()).toEqual(['ping', 'get', 'set']);
    });

    it('rejects, and stores nothing, when the fetched value does not match the schema', async () => {
      await startFakeDaemon();
      const fetchFn = vi.fn().mockResolvedValue({ n: 'nope' });

      await expect(
        getCached({ key: 'k', schema, ttl: 1_000, fetchFn }),
      ).rejects.toBeInstanceOf(Error);

      expect(getOps()).toEqual(['ping', 'get']);
    });
  });

  describe('getEntry', () => {
    const schema = z.string();

    it('returns undefined when there is no entry', async () => {
      await startFakeDaemon();

      await expect(getEntry({ key: 'k', schema })).resolves.toBeUndefined();
    });

    it('returns the entry when it matches the schema', async () => {
      await startFakeDaemon();
      reply = (request) =>
        request['op'] === 'get'
          ? { ok: true, found: true, value: 'stored' }
          : healthyReply(request);

      await expect(getEntry({ key: 'k', schema })).resolves.toBe('stored');
    });

    it('returns undefined when the entry does not match the schema', async () => {
      await startFakeDaemon();
      reply = (request) =>
        request['op'] === 'get'
          ? { ok: true, found: true, value: 5 }
          : healthyReply(request);

      await expect(getEntry({ key: 'k', schema })).resolves.toBeUndefined();
    });
  });

  describe('setEntry and removeEntry', () => {
    it.each([
      ['a string', '1h', 3_600_000],
      ['a number', 2_500, 2_500],
    ] as const)('sets an entry with the ttl as %s', async (_label, ttl, expected) => {
      await startFakeDaemon();

      await setEntry({ key: 'k', value: { a: 1 }, ttl });

      expect(requests.at(-1)).toEqual({
        op: 'set',
        key: 'k',
        value: { a: 1 },
        ttl: expected,
      });
    });

    it('removes an entry', async () => {
      await startFakeDaemon();

      await removeEntry({ key: 'k' });

      expect(requests.at(-1)).toEqual({ op: 'delete', key: 'k' });
    });
  });

  describe('daemon lifecycle', () => {
    it('spawns the daemon, detached, when it is not running', async () => {
      await getEntry({ key: 'k', schema: z.string() });

      expect(spawn).toHaveBeenCalledExactlyOnceWith(
        'sh',
        ['-c', `${JITI_BIN} ${DAEMON_ENTRY} &`],
        { detached: true, stdio: 'ignore' },
      );
      expect(getOps()).toEqual(['get']);
    });

    it('fails when the daemon does not start in time', async () => {
      vi.mocked(spawn).mockReturnValue({ unref: vi.fn() } as never);

      await expect(getEntry({ key: 'k', schema: z.string() })).rejects.toThrow(
        `in-memory-cache daemon did not start within ${POLL_TIMEOUT}ms`,
      );
    });

    it('restarts the daemon when its uptime goes over the configured maximum', async () => {
      vi.mocked(getConfigValue).mockResolvedValue({ maxUptime: 1_000 });
      const uptimes = [5_000, 10];
      await startFakeDaemon();
      reply = (request) =>
        request['op'] === 'ping'
          ? { ok: true, uptimeMs: uptimes.shift(), entries: 0 }
          : healthyReply(request);
      // The old daemon is gone after it stops; the spawned one is a new server.
      const restarted = vi.mocked(spawn);

      await getEntry({ key: 'k', schema: z.string() });

      expect(restarted).toHaveBeenCalledOnce();
      expect(getOps()).toEqual(['ping', 'stop', 'get']);
    });

    it('keeps the daemon when its uptime is under the configured maximum', async () => {
      vi.mocked(getConfigValue).mockResolvedValue({ maxUptime: 60_000 });
      await startFakeDaemon();

      await getEntry({ key: 'k', schema: z.string() });

      expect(spawn).not.toHaveBeenCalled();
      expect(getOps()).toEqual(['ping', 'get']);
    });

    it('goes on when the old daemon refuses to stop, and kills it by its pid', async () => {
      vi.mocked(getConfigValue).mockResolvedValue({ maxUptime: 1_000 });
      stopClosesServer = false;
      await startFakeDaemon();
      reply = (request) => {
        if (request['op'] === 'ping') return { ok: true, uptimeMs: 5_000, entries: 0 };
        if (request['op'] === 'stop') return { ok: false, error: 'busy' };
        return healthyReply(request);
      };
      vi.mocked(execFile).mockImplementation(((...args: unknown[]) => {
        (args.at(-1) as (error: unknown, result: unknown) => void)(null, {
          stdout: '4242\n',
          stderr: '',
        });
      }) as never);
      const kill = vi.spyOn(process, 'kill').mockImplementation(() => true);

      await getEntry({ key: 'k', schema: z.string() });

      expect(execFile).toHaveBeenCalledWith(
        'lsof',
        ['-t', SOCKET_PATH],
        expect.any(Function),
      );
      expect(kill).toHaveBeenCalledExactlyOnceWith(4242);
      expect(getOps()).toEqual(['ping', 'stop', 'get']);
    });
  });

  describe('restartDaemon', () => {
    it('stops the running daemon, starts a new one, and returns its pid', async () => {
      await startFakeDaemon();

      await expect(restartDaemon()).resolves.toBe(99);

      expect(spawn).toHaveBeenCalledOnce();
      expect(getOps()).toEqual(['stop', 'status']);
    });

    it('starts the daemon when there was none', async () => {
      await expect(restartDaemon()).resolves.toBe(99);

      expect(spawn).toHaveBeenCalledOnce();
    });

    it('does not kill anything when the daemon pid can not be read', async () => {
      stopClosesServer = false;
      await startFakeDaemon();
      vi.mocked(execFile).mockImplementation(((...args: unknown[]) => {
        (args.at(-1) as (error: unknown, result: unknown) => void)(null, {
          stdout: 'not a pid',
          stderr: '',
        });
      }) as never);
      const kill = vi.spyOn(process, 'kill').mockImplementation(() => true);

      await expect(restartDaemon()).resolves.toBe(99);

      expect(kill).not.toHaveBeenCalled();
    });

    it('goes on when it can not find the pid of a daemon that refuses to stop', async () => {
      stopClosesServer = false;
      await startFakeDaemon();
      vi.mocked(execFile).mockImplementation(((...args: unknown[]) => {
        (args.at(-1) as (error: unknown) => void)(new Error('lsof not found'));
      }) as never);
      const kill = vi.spyOn(process, 'kill').mockImplementation(() => true);

      await expect(restartDaemon()).resolves.toBe(99);

      expect(kill).not.toHaveBeenCalled();
    });
  });

  describe('daemon operations', () => {
    it('reports the status of the daemon', async () => {
      await startFakeDaemon();

      await expect(getDaemonStatus()).resolves.toEqual({
        ok: true,
        uptimeMs: 1_000,
        entries: 2,
        pid: 99,
        memoryRssBytes: 1_048_576,
        cpuUserMs: 1,
        cpuSystemMs: 2,
      });
    });

    it('reports no status when the daemon is not running, and does not start it', async () => {
      await expect(getDaemonStatus()).resolves.toBeNull();

      expect(spawn).not.toHaveBeenCalled();
    });

    it('stops the daemon', async () => {
      await startFakeDaemon();

      await expect(stopDaemon()).resolves.toEqual({ ok: true });
    });

    it('fails to stop a daemon that is not running', async () => {
      await expect(stopDaemon()).rejects.toBeInstanceOf(Error);
    });

    it('flushes the cache and says how many entries it cleared', async () => {
      await startFakeDaemon();

      await expect(flushCache()).resolves.toEqual({ ok: true, cleared: 2 });
    });

    it('fails to flush when the daemon is not running', async () => {
      await expect(flushCache()).rejects.toBeInstanceOf(Error);
    });
  });

  describe('bad replies', () => {
    it('rejects with the error the daemon reports', async () => {
      await startFakeDaemon();
      reply = (request) =>
        request['op'] === 'get'
          ? { ok: false, error: 'get: key must be a string' }
          : healthyReply(request);

      await expect(getEntry({ key: 'k', schema: z.string() })).rejects.toThrow(
        'get: key must be a string',
      );
    });

    it('rejects when the reply is not JSON', async () => {
      await startFakeDaemon();
      reply = (request) =>
        request['op'] === 'get' ? 'this is not json' : healthyReply(request);

      await expect(getEntry({ key: 'k', schema: z.string() })).rejects.toBeInstanceOf(
        Error,
      );
    });

    it('rejects when the reply does not have the shape of the operation', async () => {
      await startFakeDaemon();
      reply = (request) =>
        request['op'] === 'get' ? { ok: true } : healthyReply(request);

      await expect(getEntry({ key: 'k', schema: z.string() })).rejects.toBeInstanceOf(
        Error,
      );
    });
  });
});
