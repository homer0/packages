import type { ExtensionCommandContext } from '@earendil-works/pi-coding-agent';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushCache, getDaemonStatus, restartDaemon, stopDaemon } from './client.js';
import {
  handleInMemoryCacheClean,
  handleInMemoryCacheRestart,
  handleInMemoryCacheStatus,
  handleInMemoryCacheStop,
} from './handlers.js';

vi.mock('./client.js', () => ({
  flushCache: vi.fn(),
  getDaemonStatus: vi.fn(),
  restartDaemon: vi.fn(),
  stopDaemon: vi.fn(),
}));

describe('in-memory-cache handlers', () => {
  const notify = vi.fn();
  const ctx = { hasUI: true, ui: { notify } } as unknown as ExtensionCommandContext;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('status', () => {
    it('reports when the daemon is not running', async () => {
      vi.mocked(getDaemonStatus).mockResolvedValue(null);

      await handleInMemoryCacheStatus({ ctx });

      expect(notify).toHaveBeenCalledWith(
        'in-memory-cache: daemon is not running',
        'info',
      );
    });

    it('reports the diagnostics of the daemon', async () => {
      vi.mocked(getDaemonStatus).mockResolvedValue({
        ok: true,
        uptimeMs: 3_725_000,
        entries: 3,
        pid: 1234,
        memoryRssBytes: 67_424_460,
        cpuUserMs: 120,
        cpuSystemMs: 45,
      });

      await handleInMemoryCacheStatus({ ctx });

      expect(notify).toHaveBeenCalledWith(
        [
          'in-memory-cache daemon status:',
          '  uptime:  1h 2m 5s',
          '  entries: 3',
          '  pid:     1234',
          '  memory:  64.3 MB',
          '  cpu:     user 120ms / sys 45ms',
        ].join('\n'),
        'info',
      );
    });
  });

  describe('stop', () => {
    it('reports that the daemon stopped', async () => {
      vi.mocked(stopDaemon).mockResolvedValue({ ok: true });

      await handleInMemoryCacheStop({ ctx });

      expect(notify).toHaveBeenCalledWith('in-memory-cache: daemon stopped', 'info');
    });

    it('reports when the daemon was not running', async () => {
      vi.mocked(stopDaemon).mockRejectedValue(new Error('ENOENT'));

      await handleInMemoryCacheStop({ ctx });

      expect(notify).toHaveBeenCalledWith(
        'in-memory-cache: daemon is not running',
        'info',
      );
    });
  });

  describe('clean', () => {
    it.each([
      [1, 'in-memory-cache: cleared 1 entry'],
      [0, 'in-memory-cache: cleared 0 entries'],
      [3, 'in-memory-cache: cleared 3 entries'],
    ])('reports how many entries it cleared (%i)', async (cleared, message) => {
      vi.mocked(flushCache).mockResolvedValue({ ok: true, cleared });

      await handleInMemoryCacheClean({ ctx });

      expect(notify).toHaveBeenCalledWith(message, 'info');
    });

    it('reports why it could not clean', async () => {
      vi.mocked(flushCache).mockRejectedValue(new Error('connect ENOENT'));

      await handleInMemoryCacheClean({ ctx });

      expect(notify).toHaveBeenCalledWith('in-memory-cache: connect ENOENT', 'info');
    });
  });

  describe('restart', () => {
    it('reports the pid of the new daemon', async () => {
      vi.mocked(restartDaemon).mockResolvedValue(4321);

      await handleInMemoryCacheRestart({ ctx });

      expect(notify).toHaveBeenCalledWith(
        'in-memory-cache: daemon started (pid 4321)',
        'info',
      );
    });

    it('reports why it could not restart', async () => {
      vi.mocked(restartDaemon).mockRejectedValue(new Error('did not start'));

      await handleInMemoryCacheRestart({ ctx });

      expect(notify).toHaveBeenCalledWith(
        'in-memory-cache: restart failed — did not start',
        'info',
      );
    });
  });
});
