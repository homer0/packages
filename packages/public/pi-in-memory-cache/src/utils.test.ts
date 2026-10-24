import type { ExtensionContext } from '@earendil-works/pi-coding-agent';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  createOutputMessage,
  ensureError,
  ensureErrorMessage,
  formatMemory,
  formatUptime,
  ms,
} from './utils.js';

describe('ms', () => {
  it('returns a number as it is', () => {
    expect(ms(1_500)).toBe(1_500);
  });

  it.each([
    ['5m', 300_000],
    ['2h', 7_200_000],
    ['1s', 1_000],
  ] as const)('converts %s to milliseconds', (value, expected) => {
    expect(ms(value)).toBe(expected);
  });
});

describe('ensureErrorMessage', () => {
  it('returns the message of an error', () => {
    expect(ensureErrorMessage(new Error('something failed'))).toBe('something failed');
  });

  it('joins the issues of a zod error instead of surfacing its raw message', () => {
    const result = z.object({ a: z.string(), b: z.number() }).safeParse({ a: 1, b: 'x' });
    const error = result.error!;

    const message = ensureErrorMessage(error);

    expect(message).toBe(error.issues.map((issue) => issue.message).join('; '));
    expect(message).not.toContain('"code"');
  });

  it.each([
    ['a string', 'plain failure', 'plain failure'],
    ['a number', 404, '404'],
    ['an object', { not: 'an error' }, '[object Object]'],
  ])('converts %s to a string', (_label, value, expected) => {
    expect(ensureErrorMessage(value)).toBe(expected);
  });
});

describe('ensureError', () => {
  it('returns an error as it is', () => {
    const error = new Error('boom');

    expect(ensureError(error)).toBe(error);
  });

  it('wraps what is not an error', () => {
    const error = ensureError('plain failure');

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('plain failure');
  });
});

describe('resolveJitiBin', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.doUnmock('node:module');
  });

  const loadWithResolvedPath = async (resolve: () => string) => {
    vi.doMock('node:module', () => ({ createRequire: () => ({ resolve }) }));
    return import('./utils.js');
  };

  it('points to the binary at the root of the node_modules that has jiti', async () => {
    const { resolveJitiBin } = await loadWithResolvedPath(
      () => '/work/space/node_modules/.pnpm/jiti@2/node_modules/jiti/package.json',
    );

    expect(resolveJitiBin()).toBe('/work/space/node_modules/.bin/jiti');
  });

  it('falls back to `pnpm exec` when the root can not be derived from a pnpm path', async () => {
    const { resolveJitiBin } = await loadWithResolvedPath(
      () => '/node_modules/.pnpm/jiti@2/node_modules/jiti/package.json',
    );

    expect(resolveJitiBin()).toBe('pnpm exec jiti');
  });

  it('falls back to `npx` when the root can not be derived from another path', async () => {
    const { resolveJitiBin } = await loadWithResolvedPath(
      () => '/node_modules/jiti/package.json',
    );

    expect(resolveJitiBin()).toBe('npx jiti');
  });

  it('falls back to `npx` when jiti can not be resolved', async () => {
    const { resolveJitiBin } = await loadWithResolvedPath(() => {
      throw new Error('not found');
    });

    expect(resolveJitiBin()).toBe('npx jiti');
  });

  it('computes JITI_BIN once, when the module loads', async () => {
    const { JITI_BIN: loaded, resolveJitiBin } = await import('./utils.js');

    expect(loaded).toBe(resolveJitiBin());
  });
});

describe('formatUptime', () => {
  it.each([
    [0, '0s'],
    [59_999, '59s'],
    [60_000, '1m 0s'],
    [125_000, '2m 5s'],
    [3_600_000, '1h 0m 0s'],
    [3_725_000, '1h 2m 5s'],
  ])('formats %i ms as %s', (duration, expected) => {
    expect(formatUptime(duration)).toBe(expected);
  });
});

describe('formatMemory', () => {
  it.each([
    [0, '0.0 MB'],
    [1_048_576, '1.0 MB'],
    [67_424_460, '64.3 MB'],
  ])('formats %i bytes as %s', (bytes, expected) => {
    expect(formatMemory(bytes)).toBe(expected);
  });
});

describe('createOutputMessage', () => {
  it('notifies through the UI when there is one', () => {
    const notify = vi.fn();
    const ctx = { hasUI: true, ui: { notify } } as unknown as ExtensionContext;

    createOutputMessage('scope')(ctx, 'hello');

    expect(notify).toHaveBeenCalledWith('hello', 'info');
  });

  it('logs with the scope as the prefix when there is no UI', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const ctx = { hasUI: false } as unknown as ExtensionContext;

    createOutputMessage('scope')(ctx, 'hello');

    expect(info).toHaveBeenCalledWith('[scope] hello');
    info.mockRestore();
  });
});
