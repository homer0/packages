import type {
  ExtensionAPI,
  ExtensionContext,
  SessionStartEvent,
} from '@earendil-works/pi-coding-agent';
import { getAgentDir } from '@earendil-works/pi-coding-agent';
import {
  FACTORY_FIXTURE,
  FACTORY_OTHER_EVENT_FIXTURE,
  FACTORY_SESSION_START_FIXTURE,
  MISSING_FIXTURE,
  NO_FACTORY_FIXTURE,
} from '@tests/fixtures/index.js';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  discoverProfileResources,
  loadProfileExtensions,
  resolveProfilePackageResources,
} from './resources.js';
import {
  getAgentPath,
  resolveEnabledProfiles,
  resolveScriptPath,
  runScript,
  warnProfilesIssue,
} from './utils.js';

vi.mock('node:fs', () => ({ existsSync: vi.fn(), statSync: vi.fn() }));
vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }));
vi.mock('./utils.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./utils.js')>()),
  resolveEnabledProfiles: vi.fn(),
  resolveScriptPath: vi.fn(),
  runScript: vi.fn(),
  warnProfilesIssue: vi.fn(),
}));

const resolveExtensionSources = vi.fn();

vi.mock('@earendil-works/pi-coding-agent', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@earendil-works/pi-coding-agent')>();
  return {
    ...actual,
    getAgentDir: vi.fn(() => '/agent'),
    SettingsManager: { create: vi.fn(() => ({})) },
    DefaultPackageManager: class DefaultPackageManagerMock {
      resolveExtensionSources = resolveExtensionSources;
    },
  };
});

const { existsSync, statSync } = await import('node:fs');
const { readFile } = await import('node:fs/promises');

const PROFILES_DIR = getAgentPath('profiles');

/** Dummy session_start event/ctx shared by `loadProfileExtensions` tests. */
const SESSION_START_EVENT: SessionStartEvent = {
  type: 'session_start',
  reason: 'startup',
};
const EXTENSION_CONTEXT = {} as ExtensionContext;

describe('discoverProfileResources', () => {
  beforeEach(() => {
    vi.mocked(getAgentDir).mockReturnValue('/agent');
    vi.mocked(resolveEnabledProfiles).mockReset();
    vi.mocked(existsSync).mockReset();
    vi.mocked(statSync).mockReset();
    vi.mocked(readFile).mockReset();
  });

  it('returns empty resources without touching the filesystem when no profiles are enabled', async () => {
    vi.mocked(resolveEnabledProfiles).mockResolvedValue([]);

    const resources = await discoverProfileResources({ cwd: '/cwd' });

    expect(resources).toEqual({
      names: [],
      skillPaths: [],
      promptPaths: [],
      agentsFiles: [],
      packages: [],
    });
    expect(existsSync).not.toHaveBeenCalled();
  });

  it('collects the skills and prompts dirs and AGENTS.md content for each enabled profile', async () => {
    vi.mocked(resolveEnabledProfiles).mockResolvedValue(['demo']);
    const profileDir = join(PROFILES_DIR, 'demo');
    const skillsPath = join(profileDir, 'skills');
    const promptsPath = join(profileDir, 'prompts');
    const agentsPath = join(profileDir, 'AGENTS.md');

    vi.mocked(existsSync).mockImplementation((path) => path === agentsPath);
    vi.mocked(statSync).mockImplementation((path) => {
      if (path === skillsPath || path === promptsPath)
        return { isDirectory: () => true } as ReturnType<typeof statSync>;
      throw new Error('ENOENT');
    });
    vi.mocked(readFile).mockResolvedValue('# Demo profile context');

    const resources = await discoverProfileResources({ cwd: '/cwd' });

    expect(resources.names).toEqual(['demo']);
    expect(resources.skillPaths).toEqual([skillsPath]);
    expect(resources.promptPaths).toEqual([promptsPath]);
    expect(resources.agentsFiles).toEqual([
      { path: agentsPath, content: '# Demo profile context' },
    ]);
    expect(resources.packages).toEqual([]);
  });

  it('resolves declared packages, honoring string entries and enabledIf conditions', async () => {
    vi.mocked(resolveEnabledProfiles).mockResolvedValue(['demo']);
    const profileDir = join(PROFILES_DIR, 'demo');
    const packagesPath = join(profileDir, 'packages.json');

    vi.mocked(existsSync).mockImplementation((path) => path === packagesPath);
    vi.mocked(statSync).mockImplementation(() => {
      throw new Error('ENOENT');
    });
    vi.mocked(readFile).mockImplementation((path) => {
      if (path === packagesPath) {
        return Promise.resolve(
          JSON.stringify({
            packages: [
              'pkg-a',
              { path: 'pkg-b', enabledIf: 'false' },
              { path: 'pkg-c', enabledIf: '/scripts/c.sh' },
              { path: '/abs/pkg-d', enabledIf: '/scripts/d.sh' },
              { path: 'pkg-e', enabledIf: '/scripts/e.sh' },
            ],
          }),
        );
      }
      return Promise.reject(new Error('unexpected read'));
    });
    vi.mocked(resolveScriptPath).mockImplementation((path) => path);
    vi.mocked(runScript).mockImplementation((path) =>
      Promise.resolve(path !== '/scripts/e.sh'),
    );

    const resources = await discoverProfileResources({ cwd: '/cwd' });

    expect(resources.packages).toEqual([
      join(profileDir, 'pkg-a'),
      join(profileDir, 'pkg-c'),
      '/abs/pkg-d',
    ]);
  });

  it('warns and skips a package whose enabledIf script can not be resolved', async () => {
    vi.mocked(resolveEnabledProfiles).mockResolvedValue(['demo']);
    const profileDir = join(PROFILES_DIR, 'demo');
    const packagesPath = join(profileDir, 'packages.json');
    vi.mocked(existsSync).mockImplementation((path) => path === packagesPath);
    vi.mocked(statSync).mockImplementation(() => {
      throw new Error('ENOENT');
    });
    vi.mocked(readFile).mockResolvedValue(
      JSON.stringify({ packages: [{ path: 'pkg-a', enabledIf: 'missing.sh' }] }),
    );
    vi.mocked(resolveScriptPath).mockReturnValue(undefined);

    const resources = await discoverProfileResources({ cwd: '/cwd' });

    expect(resources.packages).toEqual([]);
    expect(warnProfilesIssue).toHaveBeenCalledWith(
      'Could not resolve package enabledIf script for "pkg-a": missing.sh',
    );
  });

  it('uses the console reporter and the current directory when it gets no options', async () => {
    vi.mocked(resolveEnabledProfiles).mockResolvedValue(['demo']);
    const agentsPath = join(PROFILES_DIR, 'demo', 'AGENTS.md');
    vi.mocked(existsSync).mockImplementation((path) => path === agentsPath);
    vi.mocked(statSync).mockImplementation(() => {
      throw new Error('ENOENT');
    });
    vi.mocked(readFile).mockRejectedValue(new Error('EACCES'));

    await discoverProfileResources();

    expect(warnProfilesIssue).toHaveBeenCalledWith(
      `Could not read profile context ${agentsPath}; skipped. EACCES`,
    );
  });

  it('reports an AGENTS.md that can not be read through onError and skips it', async () => {
    vi.mocked(resolveEnabledProfiles).mockResolvedValue(['demo']);
    const agentsPath = join(PROFILES_DIR, 'demo', 'AGENTS.md');
    vi.mocked(existsSync).mockImplementation((path) => path === agentsPath);
    vi.mocked(statSync).mockImplementation(() => {
      throw new Error('ENOENT');
    });
    vi.mocked(readFile).mockRejectedValue(new Error('EACCES'));
    const onError = vi.fn();

    const resources = await discoverProfileResources({ cwd: '/cwd', onError });

    expect(resources.agentsFiles).toEqual([]);
    expect(onError).toHaveBeenCalledWith(
      `Could not read profile context ${agentsPath}; skipped. EACCES`,
    );
  });

  it('reports invalid packages.json content through onError and skips it', async () => {
    vi.mocked(resolveEnabledProfiles).mockResolvedValue(['demo']);
    const profileDir = join(PROFILES_DIR, 'demo');
    const packagesPath = join(profileDir, 'packages.json');

    vi.mocked(existsSync).mockImplementation((path) => path === packagesPath);
    vi.mocked(statSync).mockImplementation(() => {
      throw new Error('ENOENT');
    });
    vi.mocked(readFile).mockResolvedValue('not json');
    const onError = vi.fn();

    const resources = await discoverProfileResources({ cwd: '/cwd', onError });

    expect(resources.packages).toEqual([]);
    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining(`Invalid profile packages file ${packagesPath}`),
    );
  });
});

describe('loadProfileExtensions', () => {
  beforeEach(() => {
    resolveExtensionSources.mockReset();
  });

  it('imports and calls the default-exported factory for each enabled .js/.ts extension', async () => {
    resolveExtensionSources.mockResolvedValue({
      extensions: [{ path: FACTORY_FIXTURE, enabled: true, metadata: {} }],
      skills: [],
      prompts: [],
      themes: [],
    });
    const pi = { markCalled: vi.fn() } as unknown as ExtensionAPI & {
      markCalled: () => void;
    };

    await loadProfileExtensions(pi, {
      packages: ['some-package'],
      cwd: '/cwd',
      sessionStartEvent: SESSION_START_EVENT,
      ctx: EXTENSION_CONTEXT,
    });

    expect(pi.markCalled).toHaveBeenCalledTimes(1);
  });

  it("replays a factory's session_start registration with the in-flight event/ctx", async () => {
    resolveExtensionSources.mockResolvedValue({
      extensions: [{ path: FACTORY_SESSION_START_FIXTURE, enabled: true, metadata: {} }],
      skills: [],
      prompts: [],
      themes: [],
    });
    const onSessionStart = vi.fn();
    const pi = {
      on: vi.fn(() => () => {}),
      onSessionStart,
    } as unknown as ExtensionAPI & { onSessionStart: typeof onSessionStart };

    await loadProfileExtensions(pi, {
      packages: ['some-package'],
      cwd: '/cwd',
      sessionStartEvent: SESSION_START_EVENT,
      ctx: EXTENSION_CONTEXT,
    });

    expect(onSessionStart).toHaveBeenCalledWith(SESSION_START_EVENT, EXTENSION_CONTEXT);
  });

  it('reports a session_start handler that fails, and keeps going', async () => {
    resolveExtensionSources.mockResolvedValue({
      extensions: [{ path: FACTORY_SESSION_START_FIXTURE, enabled: true, metadata: {} }],
      skills: [],
      prompts: [],
      themes: [],
    });
    const pi = {
      on: vi.fn(() => () => {}),
      onSessionStart: vi.fn().mockRejectedValue(new Error('handler failed')),
    } as unknown as ExtensionAPI;
    const onError = vi.fn();

    await loadProfileExtensions(pi, {
      packages: ['some-package'],
      cwd: '/cwd',
      onError,
      sessionStartEvent: SESSION_START_EVENT,
      ctx: EXTENSION_CONTEXT,
    });

    expect(onError).toHaveBeenCalledWith(
      `Profile extension ${FACTORY_SESSION_START_FIXTURE} session_start handler failed. handler failed`,
    );
  });

  it('does not replay the handlers of other events', async () => {
    resolveExtensionSources.mockResolvedValue({
      extensions: [{ path: FACTORY_OTHER_EVENT_FIXTURE, enabled: true, metadata: {} }],
      skills: [],
      prompts: [],
      themes: [],
    });
    const on = vi.fn(() => () => {});

    await loadProfileExtensions({ on } as unknown as ExtensionAPI, {
      packages: ['some-package'],
      cwd: '/cwd',
      sessionStartEvent: SESSION_START_EVENT,
      ctx: EXTENSION_CONTEXT,
    });

    expect(on).toHaveBeenCalledExactlyOnceWith('input', expect.any(Function));
  });

  it('ignores an extension module that has no factory', async () => {
    resolveExtensionSources.mockResolvedValue({
      extensions: [{ path: NO_FACTORY_FIXTURE, enabled: true, metadata: {} }],
      skills: [],
      prompts: [],
      themes: [],
    });
    const onError = vi.fn();
    const pi = { on: vi.fn() } as unknown as ExtensionAPI;

    await loadProfileExtensions(pi, {
      packages: ['some-package'],
      onError,
      sessionStartEvent: SESSION_START_EVENT,
      ctx: EXTENSION_CONTEXT,
    });

    expect(pi.on).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('uses the console reporter when it gets no onError', async () => {
    resolveExtensionSources.mockRejectedValue(new Error('boom'));

    await loadProfileExtensions({} as ExtensionAPI, {
      packages: ['some-package'],
      sessionStartEvent: SESSION_START_EVENT,
      ctx: EXTENSION_CONTEXT,
    });

    expect(warnProfilesIssue).toHaveBeenCalledWith(
      'Could not load profile extensions; skipped. boom',
    );
  });

  it('reports an extension that can not be imported, and skips it', async () => {
    const missing = MISSING_FIXTURE;
    resolveExtensionSources.mockResolvedValue({
      extensions: [{ path: missing, enabled: true, metadata: {} }],
      skills: [],
      prompts: [],
      themes: [],
    });
    const onError = vi.fn();

    await loadProfileExtensions({} as ExtensionAPI, {
      packages: ['some-package'],
      cwd: '/cwd',
      onError,
      sessionStartEvent: SESSION_START_EVENT,
      ctx: EXTENSION_CONTEXT,
    });

    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining(`Could not load profile extension ${missing}; skipped.`),
    );
  });

  it('skips disabled extensions and ones without a recognized .ts/.js path', async () => {
    resolveExtensionSources.mockResolvedValue({
      extensions: [
        { path: FACTORY_FIXTURE, enabled: false, metadata: {} },
        { path: '/some/dir', enabled: true, metadata: {} },
      ],
      skills: [],
      prompts: [],
      themes: [],
    });
    const pi = { markCalled: vi.fn() } as unknown as ExtensionAPI & {
      markCalled: () => void;
    };

    await loadProfileExtensions(pi, {
      packages: ['some-package'],
      cwd: '/cwd',
      sessionStartEvent: SESSION_START_EVENT,
      ctx: EXTENSION_CONTEXT,
    });

    expect(pi.markCalled).not.toHaveBeenCalled();
  });

  it('reports resolution failures through onError instead of throwing', async () => {
    resolveExtensionSources.mockRejectedValue(new Error('boom'));
    const onError = vi.fn();
    const pi = { markCalled: vi.fn() } as unknown as ExtensionAPI;

    await loadProfileExtensions(pi, {
      packages: ['some-package'],
      cwd: '/cwd',
      onError,
      sessionStartEvent: SESSION_START_EVENT,
      ctx: EXTENSION_CONTEXT,
    });

    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining('Could not load profile extensions'),
    );
  });

  it('does nothing when there are no packages', async () => {
    const pi = { markCalled: vi.fn() } as unknown as ExtensionAPI;

    await loadProfileExtensions(pi, {
      packages: [],
      cwd: '/cwd',
      sessionStartEvent: SESSION_START_EVENT,
      ctx: EXTENSION_CONTEXT,
    });

    expect(resolveExtensionSources).not.toHaveBeenCalled();
  });
});

describe('resolveProfilePackageResources', () => {
  beforeEach(() => {
    resolveExtensionSources.mockReset();
  });

  it('returns empty paths when there are no packages', async () => {
    await expect(
      resolveProfilePackageResources({ packages: [], cwd: '/cwd' }),
    ).resolves.toEqual({
      skillPaths: [],
      promptPaths: [],
      themePaths: [],
    });
    expect(resolveExtensionSources).not.toHaveBeenCalled();
  });

  it('filters each resource kind to only the enabled entries', async () => {
    resolveExtensionSources.mockResolvedValue({
      extensions: [],
      skills: [
        { path: '/skills/a', enabled: true },
        { path: '/skills/b', enabled: false },
      ],
      prompts: [{ path: '/prompts/a', enabled: true }],
      themes: [{ path: '/themes/a', enabled: false }],
    });

    await expect(
      resolveProfilePackageResources({ packages: ['pkg'], cwd: '/cwd' }),
    ).resolves.toEqual({
      skillPaths: ['/skills/a'],
      promptPaths: ['/prompts/a'],
      themePaths: [],
    });
  });

  it('uses the console reporter and the current directory when it gets no options', async () => {
    resolveExtensionSources.mockRejectedValue(new Error('boom'));

    await resolveProfilePackageResources({ packages: ['some-package'] });

    expect(warnProfilesIssue).toHaveBeenCalledWith(
      'Could not load profile packages; skipped. boom',
    );
  });

  it('reports resolution failures through onError and returns empty paths', async () => {
    resolveExtensionSources.mockRejectedValue(new Error('boom'));
    const onError = vi.fn();

    await expect(
      resolveProfilePackageResources({ packages: ['pkg'], cwd: '/cwd', onError }),
    ).resolves.toEqual({ skillPaths: [], promptPaths: [], themePaths: [] });
    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining('Could not load profile packages'),
    );
  });
});
