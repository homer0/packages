import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import type { ProfilesRuntime } from '../types.js';

/** Module shape of the lazily loaded handlers. */
type HandlersModule = typeof import('../handlers.js');

/** The promise of the handlers module, shared by every event once it's been requested. */
let handlersModule: Promise<HandlersModule> | undefined;

/**
 * Lazy-loads all the handlers through a single shared `import()`. Pi fires several events
 * at the start of a session, and jiti evaluates lazily loaded modules asynchronously,
 * handing partial exports to any `import()` of a module (or of a dependency shared by
 * several handlers) that is still evaluating. Loading everything through one memoized
 * promise makes overlapping events wait for the same evaluation. A failed load is not
 * cached, so the next event retries.
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
 * Registers the profile resource and context handling with Pi. The callbacks only
 * lazy-load their implementation, through the shared handlers loader.
 *
 * @param pi The Pi extension API.
 */
const profiles = (pi: ExtensionAPI): void => {
  const runtime: ProfilesRuntime = { pi, state: { sessionProfiles: [] } };

  pi.on('session_start', async (event, ctx) => {
    runtime.state.sessionProfiles = [];
    const { handleSessionStart } = await loadHandlers();
    await handleSessionStart({ runtime, event, ctx });
  });

  pi.on('resources_discover', async (_event, ctx) => {
    const { handleResourcesDiscover } = await loadHandlers();
    return handleResourcesDiscover({ ctx });
  });

  pi.on('before_agent_start', async (event, ctx) => {
    const { handleBeforeAgentStart } = await loadHandlers();
    return handleBeforeAgentStart({ event, ctx });
  });

  pi.registerCommand('profiles-status', {
    description: 'Show currently loaded profiles',
    handler: async (_args, ctx) => {
      const { handleProfilesStatus } = await loadHandlers();
      handleProfilesStatus({ runtime, ctx });
    },
  });
};

export default profiles;
