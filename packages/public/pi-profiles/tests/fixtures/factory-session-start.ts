import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

/**
 * Test fixture: a minimal pi extension factory that registers a `session_start` handler,
 * used by resources.test.ts to verify `loadProfileExtensions` replays it.
 */
export default function factory(
  pi: ExtensionAPI & { onSessionStart: (...args: unknown[]) => Promise<void> },
): void {
  pi.on('session_start', async (event, ctx) => {
    await pi.onSessionStart(event, ctx);
  });
}
