import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Resolves the path of the Unix domain socket used for IPC between the client and the
 * daemon. It lives next to the module that is running, so the sources and the build
 * output use different sockets.
 *
 * @param moduleUrl The `import.meta.url` of the module that is running.
 * @returns The absolute path of the socket.
 */
export const resolveSocketPath = (moduleUrl: string): string =>
  join(dirname(fileURLToPath(moduleUrl)), 'in-memory-cache.sock');

/**
 * Resolves the path of the daemon entry point, which the client spawns. It's the `daemon`
 * file next to the module that is running, with the same extension: `daemon.ts` when
 * running from the sources, and `daemon.js` when running from the build output.
 *
 * @param moduleUrl The `import.meta.url` of the module that is running.
 * @returns The absolute path of the daemon entry point.
 */
export const resolveDaemonEntry = (moduleUrl: string): string => {
  const file = fileURLToPath(moduleUrl);
  return join(dirname(file), `daemon${extname(file)}`);
};

/** Path to the Unix domain socket used for IPC between the client and daemon. */
export const SOCKET_PATH = resolveSocketPath(import.meta.url);

/** Absolute path to the daemon entry point, used by the client to spawn it. */
export const DAEMON_ENTRY = resolveDaemonEntry(import.meta.url);

/** How long to poll for the daemon socket to appear or disappear. */
export const POLL_TIMEOUT = 3_000;

/** Poll interval when waiting for the daemon to start or stop. */
export const POLL_INTERVAL = 50;

/** Default maximum daemon uptime in milliseconds before a restart is triggered (1 hour). */
export const DEFAULT_MAX_UPTIME = 60 * 60 * 1_000;
