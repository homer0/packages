import { EventEmitter } from 'node:events';
import { mkdir, mkdtemp, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import { connect, createServer } from 'node:net';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';

vi.mock('./constants.js', async () => {
  const { join: joinPath } = await import('node:path');
  const { tmpdir: getTmpdir } = await import('node:os');
  const { randomUUID } = await import('node:crypto');
  return {
    SOCKET_PATH: joinPath(getTmpdir(), `pi-imc-daemon-${randomUUID().slice(0, 8)}.sock`),
  };
});

describe('daemon', () => {
  let agentDir: string;
  let socketPath: string;
  let exit: MockInstance<typeof process.exit>;

  /**
   * Sends a line to the daemon and returns its answer, parsed. If it's not given a raw
   * line, it sends the request as JSON.
   */
  const send = (request: unknown, raw?: string): Promise<unknown> =>
    new Promise((resolve, reject) => {
      const socket = connect(socketPath);
      let buffer = '';
      socket.on('connect', () => {
        socket.write(raw ?? `${JSON.stringify(request)}\n`);
      });
      socket.on('data', (chunk) => {
        buffer += chunk.toString();
        const newlineIdx = buffer.indexOf('\n');
        if (newlineIdx === -1) return;
        socket.destroy();
        resolve(JSON.parse(buffer.slice(0, newlineIdx)) as unknown);
      });
      socket.on('error', reject);
    });

  /** Waits until something accepts connections on the socket path. */
  const waitForSocket = (): Promise<void> =>
    vi.waitFor(async () => {
      await send({ op: 'ping' });
    });

  /** Loads the daemon, which starts on its own, and waits until it's ready. */
  const startDaemon = async (): Promise<void> => {
    await import('./daemon.js');
    await waitForSocket();
  };

  beforeEach(async () => {
    vi.resetModules();
    agentDir = await mkdtemp(join(tmpdir(), 'pi-imc-agent-'));
    vi.stubEnv('PI_CODING_AGENT_DIR', agentDir);
    exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    ({ SOCKET_PATH: socketPath } = await import('./constants.js'));
    await unlink(socketPath).catch(() => {});
  });

  afterEach(async () => {
    vi.useRealTimers();
    try {
      await send({ op: 'stop' });
      await vi.waitFor(() => {
        if (exit.mock.calls.length === 0)
          throw new Error('The daemon has not exited yet');
      });
    } catch {
      // There was no daemon to stop.
    }
    await unlink(socketPath).catch(() => {});
    await rm(agentDir, { recursive: true, force: true });
    vi.doUnmock('node:net');
    vi.doUnmock('node:fs');
    vi.restoreAllMocks();
  });

  describe('operations', () => {
    it('answers a ping with its uptime and how many entries it has', async () => {
      await startDaemon();

      const response = await send({ op: 'ping' });

      expect(response).toEqual({ ok: true, uptimeMs: expect.any(Number), entries: 0 });
    });

    it('stores, returns and deletes an entry', async () => {
      await startDaemon();

      await expect(send({ op: 'get', key: 'k' })).resolves.toEqual({
        ok: true,
        found: false,
      });
      await expect(
        send({ op: 'set', key: 'k', value: { a: 1 }, ttl: 0 }),
      ).resolves.toEqual({ ok: true });
      await expect(send({ op: 'get', key: 'k' })).resolves.toEqual({
        ok: true,
        found: true,
        value: { a: 1 },
      });
      await expect(send({ op: 'ping' })).resolves.toMatchObject({ entries: 1 });
      await expect(send({ op: 'delete', key: 'k' })).resolves.toEqual({ ok: true });
      await expect(send({ op: 'get', key: 'k' })).resolves.toEqual({
        ok: true,
        found: false,
      });
    });

    it('does not fail when it deletes an entry that does not exist', async () => {
      await startDaemon();

      await expect(send({ op: 'delete', key: 'missing' })).resolves.toEqual({ ok: true });
    });

    it('reports its process diagnostics', async () => {
      await startDaemon();

      const response = await send({ op: 'status' });

      expect(response).toEqual({
        ok: true,
        uptimeMs: expect.any(Number),
        entries: 0,
        pid: process.pid,
        memoryRssBytes: expect.any(Number),
        cpuUserMs: expect.any(Number),
        cpuSystemMs: expect.any(Number),
      });
    });

    it('flushes the entries, and says how many it cleared', async () => {
      await startDaemon();
      await send({ op: 'set', key: 'a', value: 1, ttl: 0 });
      await send({ op: 'set', key: 'b', value: 2, ttl: 60_000 });

      await expect(send({ op: 'flush' })).resolves.toEqual({ ok: true, cleared: 2 });

      await expect(send({ op: 'get', key: 'b' })).resolves.toEqual({
        ok: true,
        found: false,
      });
      await expect(send({ op: 'ping' })).resolves.toMatchObject({ entries: 0 });
    });
  });

  describe('time-to-live', () => {
    it('evicts an entry after its ttl, in milliseconds', async () => {
      await startDaemon();
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
      await send({ op: 'set', key: 'k', value: 1, ttl: 1_000 });

      vi.advanceTimersByTime(999);
      await expect(send({ op: 'get', key: 'k' })).resolves.toMatchObject({ found: true });

      vi.advanceTimersByTime(1);
      await expect(send({ op: 'get', key: 'k' })).resolves.toMatchObject({
        found: false,
      });
    });

    it('keeps an entry without ttl for as long as the daemon lives', async () => {
      await startDaemon();
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
      await send({ op: 'set', key: 'k', value: 1, ttl: 0 });

      vi.advanceTimersByTime(1_000_000_000);

      await expect(send({ op: 'get', key: 'k' })).resolves.toMatchObject({ found: true });
    });

    it('restarts the countdown when an entry is replaced', async () => {
      await startDaemon();
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
      await send({ op: 'set', key: 'k', value: 1, ttl: 1_000 });
      vi.advanceTimersByTime(600);
      await send({ op: 'set', key: 'k', value: 2, ttl: 1_000 });

      vi.advanceTimersByTime(600);
      await expect(send({ op: 'get', key: 'k' })).resolves.toMatchObject({
        found: true,
        value: 2,
      });

      vi.advanceTimersByTime(400);
      await expect(send({ op: 'get', key: 'k' })).resolves.toMatchObject({
        found: false,
      });
    });

    it('does not evict what was deleted or flushed when its time comes', async () => {
      await startDaemon();
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
      await send({ op: 'set', key: 'deleted', value: 1, ttl: 1_000 });
      await send({ op: 'set', key: 'flushed', value: 1, ttl: 1_000 });
      await send({ op: 'delete', key: 'deleted' });
      await send({ op: 'flush' });
      await send({ op: 'set', key: 'deleted', value: 'new', ttl: 0 });

      vi.advanceTimersByTime(2_000);

      await expect(send({ op: 'get', key: 'deleted' })).resolves.toMatchObject({
        found: true,
        value: 'new',
      });
    });
  });

  describe('bad requests', () => {
    it.each([
      ['get without a key', { op: 'get' }, 'get: key must be a string'],
      ['set without a key', { op: 'set', ttl: 0 }, 'set: key must be a string'],
      ['set without a ttl', { op: 'set', key: 'k' }, 'set: ttl must be a number'],
      ['delete without a key', { op: 'delete' }, 'delete: key must be a string'],
      ['an unknown operation', { op: 'nope' }, 'Unknown op: nope'],
      ['no operation', {}, 'Missing or invalid op'],
      ['an operation that is not a string', { op: 1 }, 'Missing or invalid op'],
    ])('rejects %s', async (_label, request, error) => {
      await startDaemon();

      await expect(send(request)).resolves.toEqual({ ok: false, error });
    });

    it.each([
      ['an array', '[]'],
      ['null', 'null'],
      ['a number', '5'],
    ])('rejects a request that is %s', async (_label, raw) => {
      await startDaemon();

      await expect(send(undefined, `${raw}\n`)).resolves.toEqual({
        ok: false,
        error: 'Missing or invalid op',
      });
    });

    it('rejects a line that is not JSON', async () => {
      await startDaemon();

      await expect(send(undefined, 'not json\n')).resolves.toEqual({
        ok: false,
        error: 'Invalid JSON',
      });
    });

    it('waits for the end of the line when the request arrives in pieces', async () => {
      await startDaemon();

      const response = await new Promise<unknown>((resolve) => {
        const socket = connect(socketPath);
        socket.on('connect', () => {
          socket.write('{"op":');
          setTimeout(() => socket.write('"ping"}\n'), 20);
        });
        socket.on('data', (chunk) => {
          socket.destroy();
          resolve(JSON.parse(chunk.toString()) as unknown);
        });
      });

      expect(response).toMatchObject({ ok: true });
    });

    it('destroys a connection that fails', async () => {
      let listener: ((socket: unknown) => void) | undefined;
      vi.doMock('node:net', () => ({
        connect: () => {
          const probe = new EventEmitter();
          queueMicrotask(() => probe.emit('error', new Error('refused')));
          return probe;
        },
        createServer: (connectionListener: (socket: unknown) => void) => {
          listener = connectionListener;
          return { listen: vi.fn(), close: vi.fn() };
        },
      }));
      await import('./daemon.js');
      await vi.waitFor(() => {
        expect(listener).toBeDefined();
      });
      const socket = Object.assign(new EventEmitter(), { destroy: vi.fn() });

      listener!(socket);
      socket.emit('error', new Error('connection reset'));

      expect(socket.destroy).toHaveBeenCalledOnce();
    });
  });

  describe('stop', () => {
    it('replies, closes, exits, and leaves a record of what it held', async () => {
      await startDaemon();
      await send({ op: 'set', key: 'secret', value: 'do not write me', ttl: 0 });

      await expect(send({ op: 'stop' })).resolves.toEqual({ ok: true });

      await vi.waitFor(() => {
        expect(exit).toHaveBeenCalledWith(0);
      });
      const artifact = await readFile(
        join(agentDir, 'cache', 'in-memory-cache', 'last-stop.json'),
        'utf8',
      );
      expect(JSON.parse(artifact)).toEqual({
        stoppedAt: expect.any(String),
        uptimeMs: expect.any(Number),
        entries: 1,
        pid: process.pid,
        memoryRssBytes: expect.any(Number),
      });
      expect(artifact).not.toContain('do not write me');
    });

    it('still stops when it can not write the record', async () => {
      await writeFile(join(agentDir, 'cache'), 'a file, not a folder');
      await startDaemon();

      await expect(send({ op: 'stop' })).resolves.toEqual({ ok: true });

      await vi.waitFor(() => {
        expect(exit).toHaveBeenCalledWith(0);
      });
    });

    it('writes the record in the default agent directory without the env var', async () => {
      vi.stubEnv('PI_CODING_AGENT_DIR', undefined as unknown as string);
      const mkdirSync = vi.fn();
      const writeFileSync = vi.fn();
      vi.doMock('node:fs', () => ({ mkdirSync, writeFileSync }));
      await startDaemon();

      await send({ op: 'stop' });

      await vi.waitFor(() => {
        expect(exit).toHaveBeenCalledWith(0);
      });
      const folder = join(homedir(), '.pi', 'agent', 'cache', 'in-memory-cache');
      expect(mkdirSync).toHaveBeenCalledWith(folder, { recursive: true });
      expect(writeFileSync).toHaveBeenCalledWith(
        join(folder, 'last-stop.json'),
        expect.any(String),
      );
    });
  });

  describe('startup', () => {
    it('exits when another daemon is already listening', async () => {
      const other = createServer((socket) => socket.end());
      await new Promise<void>((resolve) => {
        other.listen(socketPath, resolve);
      });

      await import('./daemon.js');

      await vi.waitFor(() => {
        expect(exit).toHaveBeenCalledWith(0);
      });
      other.close();
    });

    it('replaces a stale socket file left by a crashed daemon', async () => {
      await mkdir(agentDir, { recursive: true });
      await writeFile(socketPath, 'stale');

      await startDaemon();

      await expect(send({ op: 'ping' })).resolves.toMatchObject({ ok: true });
    });

    it.each([
      ['an error', new Error('boom'), 'boom'],
      ['something that is not an error', 'plain failure', 'plain failure'],
    ])(
      'reports a startup failure caused by %s, and exits',
      async (_label, thrown, text) => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.doMock('node:net', async (importOriginal) => ({
          ...(await importOriginal<typeof import('node:net')>()),
          connect: () => {
            throw thrown;
          },
        }));

        await import('./daemon.js');

        await vi.waitFor(() => {
          expect(exit).toHaveBeenCalledWith(1);
        });
        expect(error).toHaveBeenCalledWith(
          '[in-memory-cache daemon] startup failed:',
          text,
        );
      },
    );
  });
});
