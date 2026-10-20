import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

/** Test fixture: a minimal pi extension factory used by resources.test.ts. */
export default function factory(pi: ExtensionAPI & { markCalled: () => void }): void {
  pi.markCalled();
}
