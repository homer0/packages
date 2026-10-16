import { getAgentDir } from '@earendil-works/pi-coding-agent';
import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent';
import { getConfigValue } from '@homer0/pi-config';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  createOutputMessage,
  ensureErrorMessage,
  evaluateEnabledIf,
  getAgentPath,
  JITI_BIN,
  resolveEnabledProfiles,
  resolveScriptPath,
  runScript,
  showAnnouncementWidget,
  warnProfilesIssue,
} from './utils.js';

vi.mock('@homer0/pi-config', () => ({ getConfigValue: vi.fn() }));
vi.mock('node:fs', () => ({ existsSync: vi.fn() }));
vi.mock('node:child_process', () => ({ execFile: vi.fn() }));

const { existsSync } = await import('node:fs');
const { execFile } = await import('node:child_process');

describe('getAgentPath', () => {
  it('resolves segments relative to the agent directory', () => {
    expect(getAgentPath('profiles', 'work')).toBe(
      join(getAgentDir(), 'profiles', 'work'),
    );
  });

  it('returns the agent directory without segments', () => {
    expect(getAgentPath()).toBe(getAgentDir());
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

describe('showAnnouncementWidget', () => {
  const setup = () => {
    const setWidget = vi.fn();
    const handlers = new Map<string, (event: unknown, ctx: ExtensionContext) => void>();
    const pi = {
      on: vi.fn(
        (name: string, handler: (event: unknown, ctx: ExtensionContext) => void) =>
          handlers.set(name, handler),
      ),
    } as unknown as ExtensionAPI;
    const ctx = { ui: { setWidget } } as unknown as ExtensionContext;
    return { setWidget, handlers, pi, ctx };
  };

  it('renders the label and the value with the theme colors', () => {
    const { setWidget, pi, ctx } = setup();

    showAnnouncementWidget({ pi, ctx, key: 'k', label: 'Profiles', value: 'a, b' });

    const [key, factory] = setWidget.mock.calls[0]!;
    const theme = { fg: (color: string, text: string) => `<${color}>${text}</${color}>` };
    const widget = factory(undefined, theme);
    expect(key).toBe('k');
    expect(widget.render()).toEqual([
      '<customMessageLabel>Profiles: </customMessageLabel><customMessageText>a, b</customMessageText>',
    ]);
    expect(() => {
      widget.invalidate();
      widget.dispose();
    }).not.toThrow();
  });

  it('removes the widget on the first user input', () => {
    const { setWidget, handlers, pi, ctx } = setup();
    showAnnouncementWidget({ pi, ctx, key: 'k', label: 'L', value: 'v' });

    handlers.get('input')!({}, ctx);

    expect(setWidget).toHaveBeenLastCalledWith('k', undefined);
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

/**
 * Mocks `execFile` so `promisify(execFile)` resolves with the given stdout. The real
 * `execFile` has a custom promisified version that resolves with `{ stdout, stderr }`; a
 * mock doesn't, so the callback has to receive that object.
 */
const mockScriptOutput = (stdout: string): void => {
  vi.mocked(execFile).mockImplementation((...args: unknown[]) => {
    const callback = args.at(-1) as (
      error: unknown,
      result: { stdout: string; stderr: string },
    ) => void;
    callback(null, { stdout, stderr: '' });
    return {} as never;
  });
};

describe('resolveEnabledProfiles', () => {
  beforeEach(() => {
    vi.mocked(getConfigValue).mockReset();
    vi.mocked(existsSync).mockReset();
    vi.mocked(execFile).mockReset();
  });

  it('returns an empty array when no pi.profiles config is present', async () => {
    vi.mocked(getConfigValue).mockResolvedValue(undefined);

    await expect(resolveEnabledProfiles({ cwd: '/cwd' })).resolves.toEqual([]);
  });

  it('returns the static `enabled` list when there is no `enabledIf`', async () => {
    vi.mocked(getConfigValue).mockResolvedValue({ enabled: ['a', 'b'], enabledIf: {} });

    await expect(resolveEnabledProfiles({ cwd: '/cwd' })).resolves.toEqual(['a', 'b']);
  });

  it('adds profiles whose `enabledIf` script prints "true", deduped against `enabled`', async () => {
    vi.mocked(getConfigValue).mockResolvedValue({
      enabled: ['a', 'b'],
      enabledIf: { b: '/scripts/b.sh', c: '/scripts/c.sh' },
    });
    vi.mocked(existsSync).mockImplementation((path) => path === '/scripts/b.sh');
    mockScriptOutput('true');

    const EXPECTED_LENGTH = 2;
    const result = await resolveEnabledProfiles({ cwd: '/cwd' });

    expect(new Set(result)).toEqual(new Set(['a', 'b']));
    expect(result).toHaveLength(EXPECTED_LENGTH);
  });

  it('uses the current directory and the console reporter when it gets no options', async () => {
    vi.mocked(getConfigValue).mockResolvedValue(undefined);

    await expect(resolveEnabledProfiles()).resolves.toEqual([]);

    expect(getConfigValue).toHaveBeenCalledWith(
      'pi.profiles',
      expect.objectContaining({ cwd: process.cwd() }),
    );
  });

  it('adds a profile that is only enabled by its `enabledIf` script', async () => {
    vi.mocked(getConfigValue).mockResolvedValue({
      enabled: ['a'],
      enabledIf: { b: '/scripts/b.sh' },
    });
    vi.mocked(existsSync).mockReturnValue(true);
    mockScriptOutput('true');

    await expect(resolveEnabledProfiles({ cwd: '/cwd' })).resolves.toEqual(['a', 'b']);
  });

  it('excludes profiles whose `enabledIf` script prints anything other than "true"', async () => {
    vi.mocked(getConfigValue).mockResolvedValue({
      enabled: [],
      enabledIf: { c: '/scripts/c.sh' },
    });
    vi.mocked(existsSync).mockReturnValue(true);
    mockScriptOutput('false');

    await expect(resolveEnabledProfiles({ cwd: '/cwd' })).resolves.toEqual([]);
  });

  it('excludes an `enabledIf` entry explicitly set to `false`', async () => {
    vi.mocked(getConfigValue).mockResolvedValue({
      enabled: [],
      enabledIf: { c: false },
    });

    await expect(resolveEnabledProfiles({ cwd: '/cwd' })).resolves.toEqual([]);
    expect(execFile).not.toHaveBeenCalled();
  });

  it('reports invalid config through the default console-based reporter', async () => {
    vi.mocked(getConfigValue).mockRejectedValue(new Error('bad schema'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(resolveEnabledProfiles({ cwd: '/cwd' })).resolves.toEqual([]);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid pi.profiles config; profiles skipped.'),
    );
    warnSpy.mockRestore();
  });

  it('reports invalid config through a caller-provided `onError` instead of the console default', async () => {
    vi.mocked(getConfigValue).mockRejectedValue(new Error('bad schema'));
    const onError = vi.fn();

    await resolveEnabledProfiles({ cwd: '/cwd', onError });

    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining('Invalid pi.profiles config; profiles skipped.'),
    );
  });
});

describe('evaluateEnabledIf', () => {
  beforeEach(() => {
    vi.mocked(existsSync).mockReset();
    vi.mocked(execFile).mockReset();
  });

  it('reports an unresolvable script path through console.error-style warning and skips it', async () => {
    vi.mocked(existsSync).mockReturnValue(false);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const result = await evaluateEnabledIf({ b: '/missing.sh' }, '/cwd');

    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Could not resolve enabledIf script for "b"'),
    );
    warnSpy.mockRestore();
  });
});

describe('resolveScriptPath', () => {
  beforeEach(() => {
    vi.mocked(existsSync).mockReset();
  });

  it('returns an absolute path unchanged when it exists', () => {
    vi.mocked(existsSync).mockReturnValue(true);

    expect(resolveScriptPath('/abs/script.sh', '/cwd')).toBe('/abs/script.sh');
  });

  it('returns undefined for an absolute path that does not exist', () => {
    vi.mocked(existsSync).mockReturnValue(false);

    expect(resolveScriptPath('/abs/script.sh', '/cwd')).toBeUndefined();
  });

  it('resolves a relative path against cwd first', () => {
    vi.mocked(existsSync).mockImplementation((path) => path === '/cwd/script.sh');

    expect(resolveScriptPath('script.sh', '/cwd')).toBe('/cwd/script.sh');
  });

  it('falls back to the agent and repo directories when cwd does not have it', () => {
    vi.mocked(existsSync).mockImplementation((path) => path !== '/cwd/script.sh');

    const result = resolveScriptPath('script.sh', '/cwd');

    expect(result).toMatch(/\/script\.sh$/);
    expect(result).not.toBe('/cwd/script.sh');
  });

  it('returns undefined when no directory has it', () => {
    vi.mocked(existsSync).mockReturnValue(false);

    expect(resolveScriptPath('script.sh', '/cwd')).toBeUndefined();
  });
});

describe('runScript', () => {
  beforeEach(() => {
    vi.mocked(execFile).mockReset();
  });

  const getExecArgs = (): unknown[] => vi.mocked(execFile).mock.calls[0]!.slice(0, 2);

  it('runs `.sh` scripts with bash', async () => {
    mockScriptOutput('true\n');

    await expect(runScript('/scripts/check.sh')).resolves.toBe(true);

    expect(getExecArgs()).toEqual(['bash', ['/scripts/check.sh']]);
  });

  it('runs `.ts` scripts with jiti', async () => {
    mockScriptOutput('true');

    await runScript('/scripts/check.ts');

    expect(getExecArgs()).toEqual(['bash', ['-c', `${JITI_BIN} "/scripts/check.ts"`]]);
  });

  it('runs any other script with node', async () => {
    mockScriptOutput('true');

    await runScript('/scripts/check.js');

    expect(getExecArgs()).toEqual(['bash', ['-c', 'node "/scripts/check.js"']]);
  });

  it('is false when the output is not exactly "true"', async () => {
    mockScriptOutput('yes');

    await expect(runScript('/scripts/check.sh')).resolves.toBe(false);
  });

  it('warns and is false when the script fails', async () => {
    const failure = new Error('exit 1');
    vi.mocked(execFile).mockImplementation((...args: unknown[]) => {
      (args.at(-1) as (error: unknown) => void)(failure);
      return {} as never;
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(runScript('/scripts/check.sh')).resolves.toBe(false);

    expect(warnSpy).toHaveBeenCalledWith(
      '[pi-profiles] Script failed: /scripts/check.sh',
      failure,
    );
    warnSpy.mockRestore();
  });
});

describe('warnProfilesIssue', () => {
  it('logs the message with the prefix', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    warnProfilesIssue('something happened');

    expect(warnSpy).toHaveBeenCalledWith('[pi-profiles] something happened');
    warnSpy.mockRestore();
  });
});
