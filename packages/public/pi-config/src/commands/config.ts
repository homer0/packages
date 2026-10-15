import type { ExtensionCommandContext } from '@earendil-works/pi-coding-agent';
import { showConfigWindow } from '../window.js';

/** Options for {@link handleConfig}. */
type HandleConfigOptions = {
  /** The context of the command. */
  ctx: ExtensionCommandContext;
};

/**
 * Handles `/config`: opens the config window.
 *
 * @param options The context of the command.
 */
export const handleConfig = async ({ ctx }: HandleConfigOptions): Promise<void> => {
  await showConfigWindow(ctx);
};
