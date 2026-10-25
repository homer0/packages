import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  DAEMON_ENTRY,
  DEFAULT_MAX_UPTIME,
  resolveDaemonEntry,
  resolveSocketPath,
  SOCKET_PATH,
} from './constants.js';

describe('constants', () => {
  const dir = dirname(fileURLToPath(import.meta.url));

  describe('resolveSocketPath', () => {
    it('puts the socket next to the module that is running', () => {
      expect(resolveSocketPath('file:///some/dir/constants.ts')).toBe(
        '/some/dir/in-memory-cache.sock',
      );
    });
  });

  describe('resolveDaemonEntry', () => {
    it('resolves the TypeScript daemon when running from the sources', () => {
      expect(resolveDaemonEntry('file:///some/dir/constants.ts')).toBe(
        '/some/dir/daemon.ts',
      );
    });

    it('resolves the JavaScript daemon when running from the build output', () => {
      expect(resolveDaemonEntry('file:///some/dist/client-abc123.js')).toBe(
        '/some/dist/daemon.js',
      );
    });
  });

  it('uses this module to resolve the socket and the daemon', () => {
    expect(SOCKET_PATH).toBe(join(dir, 'in-memory-cache.sock'));
    expect(DAEMON_ENTRY).toBe(join(dir, 'daemon.ts'));
  });

  it('restarts the daemon after an hour by default', () => {
    expect(DEFAULT_MAX_UPTIME).toBe(3_600_000);
  });
});
