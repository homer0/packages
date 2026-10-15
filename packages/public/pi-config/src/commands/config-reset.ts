import type { ExtensionCommandContext } from '@earendil-works/pi-coding-agent';
import { clearSessionConfigOverride } from '../fns.js';

/** Options for {@link handleConfigReset}. */
type HandleConfigResetOptions = {
  /** The context of the command. */
  ctx: ExtensionCommandContext;
};

/**
 * Handles `/config-reset`: clears the session config override, and tells the user if
 * there was one.
 *
 * @param options The context of the command.
 */
export const handleConfigReset = ({ ctx }: HandleConfigResetOptions): void => {
  const hadOverride = clearSessionConfigOverride();
  ctx.ui.notify(
    hadOverride ? 'Session config override cleared.' : 'No session override was set.',
    'info',
  );
};
