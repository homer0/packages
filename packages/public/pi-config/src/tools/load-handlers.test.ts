import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('loadHandlers', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doUnmock('./handlers/index.js');
  });

  it('shares one import between overlapping calls', async () => {
    const { loadHandlers } = await import('./load-handlers.js');

    const first = loadHandlers();
    const second = loadHandlers();

    expect(second).toBe(first);
    await expect(first).resolves.toHaveProperty('handleGetConfig');
  });

  it('returns the same module once it has loaded', async () => {
    const { loadHandlers } = await import('./load-handlers.js');

    const first = await loadHandlers();
    const second = await loadHandlers();

    expect(second).toBe(first);
  });

  it('does not cache a failed load, so the next call retries', async () => {
    let shouldFail = true;
    vi.doMock('./handlers/index.js', () => {
      if (shouldFail) throw new Error('boom');
      return { handleGetConfig: vi.fn(), handleSetConfig: vi.fn() };
    });
    const { loadHandlers } = await import('./load-handlers.js');

    await expect(Promise.all([loadHandlers(), loadHandlers()])).rejects.toBeInstanceOf(
      Error,
    );

    shouldFail = false;
    await expect(loadHandlers()).resolves.toHaveProperty('handleGetConfig');
  });
});
