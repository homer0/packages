import type {
  BeforeAgentStartEvent,
  ExtensionAPI,
  ExtensionCommandContext,
  ExtensionContext,
  SessionStartEvent,
} from '@earendil-works/pi-coding-agent';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  forSession,
  handleBeforeAgentStart,
  handleProfilesStatus,
  handleResourcesDiscover,
  handleSessionStart,
  outputMessage,
} from './handlers.js';
import type { ProfilesRuntime } from './types.js';

const {
  discoverProfileResources,
  loadProfileExtensions,
  resolveEnabledProfiles,
  resolveProfilePackageResources,
  showAnnouncementWidget,
} = vi.hoisted(() => ({
  discoverProfileResources: vi.fn(),
  loadProfileExtensions: vi.fn(),
  resolveEnabledProfiles: vi.fn(),
  resolveProfilePackageResources: vi.fn(),
  showAnnouncementWidget: vi.fn(),
}));

vi.mock('./resources.js', () => ({
  discoverProfileResources,
  loadProfileExtensions,
  resolveProfilePackageResources,
}));
vi.mock('./utils.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./utils.js')>()),
  resolveEnabledProfiles,
  showAnnouncementWidget,
}));

/** Creates the runtime the extension entry would create. */
const createRuntime = (pi: ExtensionAPI): ProfilesRuntime => ({
  pi,
  state: { sessionProfiles: [] },
});

describe('outputMessage', () => {
  it('notifies through the UI when there is one', () => {
    const notify = vi.fn();

    outputMessage(
      { hasUI: true, ui: { notify } } as unknown as ExtensionContext,
      'hello',
    );

    expect(notify).toHaveBeenCalledWith('hello', 'info');
  });
});

describe('forSession', () => {
  it('uses the cwd of the session', () => {
    const ctx = { cwd: '/project' } as unknown as ExtensionContext;

    expect(forSession(ctx).cwd).toBe('/project');
  });

  it('routes the non-fatal errors through the session output', () => {
    const notify = vi.fn();
    const ctx = {
      cwd: '/project',
      hasUI: true,
      ui: { notify },
    } as unknown as ExtensionContext;

    forSession(ctx).onError!('something failed');

    expect(notify).toHaveBeenCalledWith('something failed', 'info');
  });
});

describe('listeners', () => {
  const ctx = { cwd: '/cwd' } as unknown as ExtensionContext;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleSessionStart', () => {
    const event = {} as SessionStartEvent;

    it('announces the enabled profiles, records the discovered ones and loads packages', async () => {
      resolveEnabledProfiles.mockResolvedValue(['p1']);
      discoverProfileResources.mockResolvedValue({ names: ['p1'], packages: ['pkg'] });
      const pi = {} as unknown as ExtensionAPI;
      const runtime = createRuntime(pi);

      await handleSessionStart({ runtime, event, ctx });

      expect(showAnnouncementWidget).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'Profiles', value: 'p1' }),
      );
      expect(runtime.state.sessionProfiles).toEqual(['p1']);
      expect(loadProfileExtensions).toHaveBeenCalledWith(
        pi,
        expect.objectContaining({ packages: ['pkg'], sessionStartEvent: event, ctx }),
      );
    });

    it('skips the announcement and the package load when there is nothing to do', async () => {
      resolveEnabledProfiles.mockResolvedValue([]);
      discoverProfileResources.mockResolvedValue({ names: [], packages: [] });

      await handleSessionStart({
        runtime: createRuntime({} as unknown as ExtensionAPI),
        event,
        ctx,
      });

      expect(showAnnouncementWidget).not.toHaveBeenCalled();
      expect(loadProfileExtensions).not.toHaveBeenCalled();
    });
  });

  describe('handleResourcesDiscover', () => {
    it('returns nothing when no profile is active', async () => {
      discoverProfileResources.mockResolvedValue({ names: [] });

      await expect(handleResourcesDiscover({ ctx })).resolves.toBeUndefined();
    });

    it('merges the profile and package resource paths', async () => {
      discoverProfileResources.mockResolvedValue({
        names: ['p1'],
        packages: ['pkg'],
        skillPaths: ['s1'],
        promptPaths: ['p1'],
      });
      resolveProfilePackageResources.mockResolvedValue({
        skillPaths: ['s2'],
        promptPaths: ['pr'],
        themePaths: ['t'],
      });

      await expect(handleResourcesDiscover({ ctx })).resolves.toEqual({
        skillPaths: ['s1', 's2'],
        promptPaths: ['p1', 'pr'],
        themePaths: ['t'],
      });
    });
  });

  describe('handleBeforeAgentStart', () => {
    const event = { systemPrompt: 'base' } as unknown as BeforeAgentStartEvent;

    it('leaves the prompt alone without AGENTS.md files', async () => {
      discoverProfileResources.mockResolvedValue({ agentsFiles: [] });

      await expect(handleBeforeAgentStart({ event, ctx })).resolves.toBeUndefined();
    });

    it('appends the profile context to the system prompt', async () => {
      discoverProfileResources.mockResolvedValue({
        agentsFiles: [
          { path: '/a/AGENTS.md', content: ' one \n' },
          { path: '/b/AGENTS.md', content: 'two' },
        ],
      });

      await expect(handleBeforeAgentStart({ event, ctx })).resolves.toEqual({
        systemPrompt:
          'base\n\n# Profile Context\n\n## /a/AGENTS.md\n\none\n\n## /b/AGENTS.md\n\ntwo',
      });
    });
  });
});

describe('handleProfilesStatus', () => {
  const notify = vi.fn();
  const ctx = { hasUI: true, ui: { notify } } as unknown as ExtensionCommandContext;

  beforeEach(() => {
    notify.mockClear();
  });

  it('reports when no profile is loaded', () => {
    handleProfilesStatus({ runtime: createRuntime({} as unknown as ExtensionAPI), ctx });

    expect(notify).toHaveBeenCalledWith('No profiles loaded', 'info');
  });

  it('lists the loaded profiles', () => {
    const runtime = createRuntime({} as unknown as ExtensionAPI);
    runtime.state.sessionProfiles = ['a', 'b'];

    handleProfilesStatus({ runtime, ctx });

    expect(notify).toHaveBeenCalledWith('Profiles loaded: a, b', 'info');
  });
});
