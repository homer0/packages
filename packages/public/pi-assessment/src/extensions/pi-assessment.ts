import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

/** Module shape of the lazily loaded handlers. */
type HandlersModule = typeof import('../handlers.js');

/** The promise of the handlers module, shared by every call once it's been requested. */
let handlersModule: Promise<HandlersModule> | undefined;

/**
 * Lazy-loads the handlers through a single shared `import()`. jiti hands partial exports
 * to any `import()` of a module that is still evaluating, so loading everything through
 * one memoized promise makes overlapping calls wait for the same evaluation. A failed
 * load is not cached, so the next call retries.
 *
 * @returns The module with the handlers.
 */
const loadHandlers = (): Promise<HandlersModule> => {
  handlersModule ??= import('../handlers.js').catch((error: unknown) => {
    handlersModule = undefined;
    throw error;
  });
  return handlersModule;
};

/**
 * Registers the slash commands of the assessment extension. The callbacks only lazy-load
 * their implementation.
 *
 * @param pi The Pi extension API.
 */
const piAssessment = (pi: ExtensionAPI): void => {
  pi.registerCommand('session-assessment', {
    description: 'Assess a past Pi session for persistent improvements',
    handler: async (_args, ctx) => {
      const { handleSessionAssessment } = await loadHandlers();
      await handleSessionAssessment({ ctx, pi });
    },
  });
};

export default piAssessment;
