import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { getConfigTool, setConfigTool } from '../tools/index.js';

/**
 * Registers config extension tools and the `/config`/`/config-reset` commands with Pi.
 * The tools' definitions are light; their `execute` and the commands lazy-load their
 * implementation.
 *
 * @param pi The Pi extension API.
 */
const config = (pi: ExtensionAPI): void => {
  pi.registerTool(getConfigTool);
  pi.registerTool(setConfigTool);

  pi.registerCommand('config', {
    description: 'View the effective Pi Core config and edit the session override',
    handler: async (_args, ctx) => {
      const { handleConfig } = await import('../commands/config.js');
      await handleConfig({ ctx });
    },
  });

  pi.registerCommand('config-reset', {
    description: 'Clear the session config override',
    handler: async (_args, ctx) => {
      const { handleConfigReset } = await import('../commands/config-reset.js');
      handleConfigReset({ ctx });
    },
  });
};

export default config;
