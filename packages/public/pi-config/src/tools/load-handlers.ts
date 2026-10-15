/** Module shape of the lazily loaded tool handlers. */
type HandlersModule = typeof import('./handlers/index.js');

/** The promise of the handlers module, shared by every call once it's been requested. */
let handlersModule: Promise<HandlersModule> | undefined;

/**
 * Lazy-loads all the tool handlers through a single shared `import()`. Tools can be
 * called in parallel by the model, and jiti evaluates lazily loaded modules
 * asynchronously, handing partial exports to any `import()` of a module (or of a
 * dependency shared by several handlers) that is still evaluating. Loading everything
 * through one memoized promise makes overlapping calls wait for the same evaluation. A
 * failed load is not cached, so the next call retries.
 *
 * @returns The module with all the handlers.
 */
export const loadHandlers = (): Promise<HandlersModule> => {
  handlersModule ??= import('./handlers/index.js').catch((error: unknown) => {
    handlersModule = undefined;
    throw error;
  });
  return handlersModule;
};
