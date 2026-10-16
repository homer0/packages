import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

/**
 * Test fixture: a minimal pi extension factory that registers a handler for an event that
 * is not `session_start`, used by resources.test.ts to verify it is not replayed.
 */
export default function factory(pi: ExtensionAPI): void {
  pi.on('input', () => {});
}
