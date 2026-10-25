import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

/** Module shape of the lazily loaded handlers. */
type HandlersModule = typeof import('../handlers.js');

/** The promise of the handlers module, shared by every call once it's been requested. */
let handlersModule: Promise<HandlersModule> | undefined;

/**
 * Lazy-loads all the handlers through a single shared `import()`. Commands can be run in
 * quick succession, and jiti evaluates lazily loaded modules asynchronously, handing
 * partial exports to any `import()` of a module that is still evaluating. Loading
 * everything through one memoized promise makes overlapping calls wait for the same
 * evaluation. A failed load is not cached, so the next call retries.
 *
 * @returns The module with all the handlers.
 */
const loadHandlers = (): Promise<HandlersModule> => {
  handlersModule ??= import('../handlers.js').catch((error: unknown) => {
    handlersModule = undefined;
    throw error;
  });
  return handlersModule;
};

/**
 * Registers the in-memory cache management commands with Pi. The callbacks only lazy-load
 * their implementation, through the shared handlers loader.
 *
 * @param pi The Pi extension API.
 */
const inMemoryCache = (pi: ExtensionAPI): void => {
  pi.registerCommand('in-memory-cache-status', {
    description: 'Show in-memory cache daemon status (uptime, entries, PID, memory, CPU)',
    handler: async (_args, ctx) => {
      const { handleInMemoryCacheStatus } = await loadHandlers();
      await handleInMemoryCacheStatus({ ctx });
    },
  });

  pi.registerCommand('in-memory-cache-stop', {
    description: 'Stop the in-memory cache daemon',
    handler: async (_args, ctx) => {
      const { handleInMemoryCacheStop } = await loadHandlers();
      await handleInMemoryCacheStop({ ctx });
    },
  });

  pi.registerCommand('in-memory-cache-clean', {
    description: 'Flush all in-memory cache entries',
    handler: async (_args, ctx) => {
      const { handleInMemoryCacheClean } = await loadHandlers();
      await handleInMemoryCacheClean({ ctx });
    },
  });

  pi.registerCommand('in-memory-cache-restart', {
    description: 'Restart the in-memory cache daemon (or start it if stopped)',
    handler: async (_args, ctx) => {
      const { handleInMemoryCacheRestart } = await loadHandlers();
      await handleInMemoryCacheRestart({ ctx });
    },
  });
};

export default inMemoryCache;
