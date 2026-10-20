import type {
  BeforeAgentStartEvent,
  ExtensionAPI,
  ExtensionCommandContext,
  ExtensionContext,
  SessionStartEvent,
} from '@earendil-works/pi-coding-agent';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProfilesRuntime } from '../types.js';
import profiles from './profiles.js';

const handlers = vi.hoisted(() => ({
  handleProfilesStatus: vi.fn(),
  handleBeforeAgentStart: vi.fn(),
  handleResourcesDiscover: vi.fn(),
  handleSessionStart: vi.fn(),
}));
const {
  handleProfilesStatus,
  handleBeforeAgentStart,
  handleResourcesDiscover,
  handleSessionStart,
} = handlers;

vi.mock('../handlers.js', () => handlers);

type Listener = (event: unknown, ctx: unknown) => Promise<unknown>;
type Command = { handler: (args: string, ctx: unknown) => Promise<void> };

const createPi = (): {
  pi: ExtensionAPI;
  listeners: Map<string, Listener>;
  commands: Map<string, Command>;
} => {
  const listeners = new Map<string, Listener>();
  const commands = new Map<string, Command>();
  const pi = {
    on: vi.fn((name: string, listener: Listener) => listeners.set(name, listener)),
    registerCommand: vi.fn((name: string, command: Command) =>
      commands.set(name, command),
    ),
  } as unknown as ExtensionAPI;
  return { pi, listeners, commands };
};

describe('profiles extension', () => {
  const ctx = {} as ExtensionContext;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers its three listeners and /profiles-status', () => {
    const { pi, listeners, commands } = createPi();

    profiles(pi);

    expect([...listeners.keys()].toSorted()).toEqual([
      'before_agent_start',
      'resources_discover',
      'session_start',
    ]);
    expect([...commands.keys()]).toEqual(['profiles-status']);
  });

  it('resets the session profiles, then delegates session_start', async () => {
    const { pi, listeners } = createPi();
    profiles(pi);
    const event = {} as SessionStartEvent;
    let runtime: ProfilesRuntime | undefined;
    let seenAtSecondStart: string[] | undefined;
    handleSessionStart
      .mockImplementationOnce((options: { runtime: ProfilesRuntime }) => {
        runtime = options.runtime;
      })
      .mockImplementationOnce((options: { runtime: ProfilesRuntime }) => {
        seenAtSecondStart = [...options.runtime.state.sessionProfiles];
      });

    await listeners.get('session_start')!(event, ctx);
    runtime!.state.sessionProfiles = ['old'];
    await listeners.get('session_start')!(event, ctx);

    expect(handleSessionStart).toHaveBeenCalledWith({
      runtime: expect.objectContaining({ pi }),
      event,
      ctx,
    });
    expect(seenAtSecondStart).toEqual([]);
  });

  it('delegates resources_discover and returns its result', async () => {
    const result = { skillPaths: ['a'] };
    handleResourcesDiscover.mockResolvedValue(result);
    const { pi, listeners } = createPi();
    profiles(pi);

    await expect(listeners.get('resources_discover')!({}, ctx)).resolves.toBe(result);

    expect(handleResourcesDiscover).toHaveBeenCalledWith({ ctx });
  });

  it('delegates before_agent_start and returns its result', async () => {
    const result = { systemPrompt: 'edited' };
    handleBeforeAgentStart.mockResolvedValue(result);
    const { pi, listeners } = createPi();
    profiles(pi);
    const event = {} as BeforeAgentStartEvent;

    await expect(listeners.get('before_agent_start')!(event, ctx)).resolves.toBe(result);

    expect(handleBeforeAgentStart).toHaveBeenCalledWith({ event, ctx });
  });

  it('delegates /profiles-status with the runtime the session_start uses', async () => {
    const { pi, listeners, commands } = createPi();
    profiles(pi);
    const commandCtx = {} as ExtensionCommandContext;

    await listeners.get('session_start')!({}, ctx);
    await commands.get('profiles-status')!.handler('', commandCtx);

    const [{ runtime }] = handleSessionStart.mock.calls[0] as [{ runtime: unknown }];
    expect(handleProfilesStatus).toHaveBeenCalledWith({ runtime, ctx: commandCtx });
  });
});

describe('handlers loading', () => {
  const createHandlers = () => ({
    handleProfilesStatus: vi.fn(),
    handleBeforeAgentStart: vi.fn(),
    handleResourcesDiscover: vi.fn(() => 'discovered'),
    handleSessionStart: vi.fn(),
  });

  /** Loads a fresh copy of the entry, so its shared import starts empty. */
  const loadFreshEntry = async (factory: () => Record<string, unknown>) => {
    vi.resetModules();
    vi.doMock('../handlers.js', factory);
    const { default: freshProfiles } = await import('./profiles.js');
    const { pi, listeners } = createPi();
    freshProfiles(pi);
    return listeners;
  };

  it('shares one import between overlapping events', async () => {
    const factory = vi.fn(createHandlers);
    const listeners = await loadFreshEntry(factory);

    await Promise.all([
      listeners.get('resources_discover')!({}, {}),
      listeners.get('before_agent_start')!({}, {}),
      listeners.get('session_start')!({}, {}),
    ]);

    expect(factory).toHaveBeenCalledOnce();
  });

  it('reuses the module once it has loaded', async () => {
    const factory = vi.fn(createHandlers);
    const listeners = await loadFreshEntry(factory);

    await listeners.get('resources_discover')!({}, {});
    await expect(listeners.get('resources_discover')!({}, {})).resolves.toBe(
      'discovered',
    );

    expect(factory).toHaveBeenCalledOnce();
  });

  it('does not cache a failed load, so the next event retries', async () => {
    let shouldFail = true;
    const listeners = await loadFreshEntry(() => {
      if (shouldFail) throw new Error('boom');
      return createHandlers();
    });

    await expect(
      Promise.all([
        listeners.get('resources_discover')!({}, {}),
        listeners.get('before_agent_start')!({}, {}),
      ]),
    ).rejects.toBeInstanceOf(Error);

    shouldFail = false;
    await expect(listeners.get('resources_discover')!({}, {})).resolves.toBe(
      'discovered',
    );
  });
});
