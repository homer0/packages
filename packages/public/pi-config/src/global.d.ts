import type { PiCoreConfig } from './types.js';

declare global {
  /**
   * The session config override. It's kept on `globalThis` so every extension in the
   * process sees it, even if each one loads its own copy of the package.
   */
  // eslint-disable-next-line vars-on-top -- Invalid scenario
  var __piConfigSessionOverride: PiCoreConfig | undefined;
}
