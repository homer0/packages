import type { ExtensionCommandContext } from '@earendil-works/pi-coding-agent';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { showConfigWindow, clearSessionConfigOverride } = vi.hoisted(() => ({
  showConfigWindow: vi.fn(),
  clearSessionConfigOverride: vi.fn(),
}));

vi.mock('../window.js', () => ({ showConfigWindow }));
vi.mock('../fns.js', () => ({ clearSessionConfigOverride }));

const { handleConfig } = await import('./config.js');
const { handleConfigReset } = await import('./config-reset.js');

describe('config commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('/config opens the config window', async () => {
    const ctx = {} as unknown as ExtensionCommandContext;

    await handleConfig({ ctx });

    expect(showConfigWindow).toHaveBeenCalledWith(ctx);
  });

  it.each([
    [true, 'Session config override cleared.'],
    [false, 'No session override was set.'],
  ])('/config-reset notifies the outcome (had override: %s)', (had, message) => {
    clearSessionConfigOverride.mockReturnValue(had);
    const notify = vi.fn();

    handleConfigReset({ ctx: { ui: { notify } } as unknown as ExtensionCommandContext });

    expect(notify).toHaveBeenCalledWith(message, 'info');
  });
});
