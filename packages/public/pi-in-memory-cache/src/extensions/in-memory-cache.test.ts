import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from '@earendil-works/pi-coding-agent';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  handleInMemoryCacheClean,
  handleInMemoryCacheRestart,
  handleInMemoryCacheStatus,
  handleInMemoryCacheStop,
} from '../handlers.js';
import inMemoryCache from './in-memory-cache.js';

vi.mock('../handlers.js', () => ({
  handleInMemoryCacheClean: vi.fn(),
  handleInMemoryCacheRestart: vi.fn(),
  handleInMemoryCacheStatus: vi.fn(),
  handleInMemoryCacheStop: vi.fn(),
}));

type Command = { handler: (args: string, ctx: unknown) => Promise<void> };

/** Creates a fake Pi API that records the commands that get registered. */
const createPi = (): { pi: ExtensionAPI; commands: Map<string, Command> } => {
  const commands = new Map<string, Command>();
  const pi = {
    registerCommand: vi.fn((name: string, command: Command) =>
      commands.set(name, command),
    ),
  } as unknown as ExtensionAPI;
  return { pi, commands };
};

describe('in-memory-cache extension', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers the four management commands', () => {
    const { pi, commands } = createPi();

    inMemoryCache(pi);

    expect([...commands.keys()].toSorted()).toEqual([
      'in-memory-cache-clean',
      'in-memory-cache-restart',
      'in-memory-cache-status',
      'in-memory-cache-stop',
    ]);
  });

  it.each([
    ['in-memory-cache-status', handleInMemoryCacheStatus],
    ['in-memory-cache-stop', handleInMemoryCacheStop],
    ['in-memory-cache-clean', handleInMemoryCacheClean],
    ['in-memory-cache-restart', handleInMemoryCacheRestart],
  ] as const)('delegates /%s to its handler', async (name, handler) => {
    const { pi, commands } = createPi();
    inMemoryCache(pi);
    const ctx = {} as ExtensionCommandContext;

    await commands.get(name)!.handler('', ctx);

    expect(handler).toHaveBeenCalledWith({ ctx });
  });
});

describe('handlers loading', () => {
  /** Creates the handlers module, with a spy to know what each command ran. */
  const createHandlers = () => ({
    handleInMemoryCacheClean: vi.fn(),
    handleInMemoryCacheRestart: vi.fn(),
    handleInMemoryCacheStatus: vi.fn(),
    handleInMemoryCacheStop: vi.fn(),
  });

  /** Loads a fresh copy of the entry, so its shared import starts empty. */
  const loadFreshEntry = async (factory: () => Record<string, unknown>) => {
    vi.resetModules();
    vi.doMock('../handlers.js', factory);
    const { default: freshEntry } = await import('./in-memory-cache.js');
    const { pi, commands } = createPi();
    freshEntry(pi);
    return commands;
  };

  it('shares one import between overlapping calls', async () => {
    const factory = vi.fn(createHandlers);
    const commands = await loadFreshEntry(factory);

    await Promise.all([
      commands.get('in-memory-cache-status')!.handler('', {}),
      commands.get('in-memory-cache-stop')!.handler('', {}),
    ]);

    expect(factory).toHaveBeenCalledOnce();
  });

  it('reuses the module once it has loaded', async () => {
    const factory = vi.fn(createHandlers);
    const commands = await loadFreshEntry(factory);

    await commands.get('in-memory-cache-status')!.handler('', {});
    await commands.get('in-memory-cache-clean')!.handler('', {});

    expect(factory).toHaveBeenCalledOnce();
  });

  it('does not cache a failed load, so the next call retries', async () => {
    let shouldFail = true;
    const commands = await loadFreshEntry(() => {
      if (shouldFail) throw new Error('boom');
      return createHandlers();
    });

    await expect(
      Promise.all([
        commands.get('in-memory-cache-status')!.handler('', {}),
        commands.get('in-memory-cache-stop')!.handler('', {}),
      ]),
    ).rejects.toBeInstanceOf(Error);

    shouldFail = false;
    await expect(
      commands.get('in-memory-cache-status')!.handler('', {}),
    ).resolves.toBeUndefined();
  });
});
