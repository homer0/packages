import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

/** Module shape of the lazily loaded handlers. */
type HandlersModule = typeof import('../handlers.js');

/** The promise of the handlers module, shared by every call once it's been requested. */
let handlersModule: Promise<HandlersModule> | undefined;

/**
 * Lazy-loads the handlers through a single shared `import()`. Both commands share
 * dependencies, and jiti hands partial exports to any `import()` of a module that is
 * still evaluating, so loading everything through one memoized promise makes overlapping
 * calls wait for the same evaluation. A failed load is not cached, so the next call
 * retries.
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
 * Registers the slash commands for managing pnpm-backed pi packages. The callbacks only
 * lazy-load their implementation.
 *
 * @param pi The Pi extension API.
 */
const piInstallPnpmPackage = (pi: ExtensionAPI): void => {
  pi.registerCommand('install-pi-pnpm-package', {
    description: 'Install a pi package into the pnpm extension catalog',
    handler: async (args, ctx) => {
      const { handleInstallPiPnpmPackage } = await loadHandlers();
      await handleInstallPiPnpmPackage({ args, ctx });
    },
  });

  pi.registerCommand('uninstall-pi-pnpm-package', {
    description: 'Uninstall a pi package from the pnpm extension catalog',
    handler: async (args, ctx) => {
      const { handleUninstallPiPnpmPackage } = await loadHandlers();
      await handleUninstallPiPnpmPackage({ args, ctx });
    },
  });
};

export default piInstallPnpmPackage;
