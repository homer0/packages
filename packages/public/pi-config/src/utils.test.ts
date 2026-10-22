import { CONFIG_DIR_NAME, getAgentDir } from '@earendil-works/pi-coding-agent';
import { homedir } from 'node:os';
import { join } from 'node:path';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';
import { z } from 'zod';
import { ConfigValidationError } from './errors.js';
import {
  clearSessionConfigOverride,
  EMPTY_PI_CORE_CONFIG,
  ensureErrorMessage,
  getAgentPath,
  getConfig,
  getConfigValue,
  getSessionConfigOverride,
  queryConfig,
  readConfigFiles,
  resolvePiPath,
  setSessionConfigOverride,
} from './utils.js';

vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }));
vi.mock('@earendil-works/pi-coding-agent', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@earendil-works/pi-coding-agent')>();
  return { ...actual, getAgentDir: vi.fn(() => '/agent') };
});

const { readFile } = await import('node:fs/promises');

describe('config fns', () => {
  const cwd = '/cwd';
  const projectDir = join(cwd, CONFIG_DIR_NAME);
  const projectConfigPath = join(projectDir, 'config.json');
  const projectLocalConfigPath = join(projectDir, 'config.local.json');
  const emptyOverride = { pi: {}, skills: {}, tools: {}, extensions: {} };
  let warn: MockInstance<typeof console.warn>;

  /** Mocks `readFile` so only the given paths resolve, everything else is ENOENT. */
  const mockRawFiles = (files: Record<string, string>): void => {
    vi.mocked(readFile).mockImplementation((path) => {
      const value = files[path as string];
      if (typeof value === 'undefined') {
        const error = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
        return Promise.reject(error);
      }
      return Promise.resolve(value);
    });
  };

  /** Same as {@link mockRawFiles}, but serializing the values as JSON. */
  const mockConfigFiles = (files: Record<string, unknown>): void => {
    mockRawFiles(
      Object.fromEntries(
        Object.entries(files).map(([path, value]) => [path, JSON.stringify(value)]),
      ),
    );
  };

  beforeEach(() => {
    vi.mocked(getAgentDir).mockReturnValue('/agent');
    vi.mocked(readFile).mockReset();
    mockConfigFiles({});
    // eslint-disable-next-line no-console -- The tests need to see the warnings that the config reading logs.
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    setSessionConfigOverride(undefined);
    vi.restoreAllMocks();
  });

  describe('getConfig', () => {
    it('always has the four namespaces, even without files', async () => {
      const config = await getConfig({ cwd });

      expect(config).toEqual(EMPTY_PI_CORE_CONFIG);
      expect(warn).not.toHaveBeenCalled();
    });

    it('leaves the config unchanged when no override is set', async () => {
      mockConfigFiles({
        [projectLocalConfigPath]: { pi: { models: { selected: 'file-model' } } },
      });

      const config = await getConfig({ cwd });

      expect(config.pi).toEqual({ models: { selected: 'file-model' } });
    });

    it('reads YAML files', async () => {
      mockRawFiles({
        [join(projectDir, 'config.yaml')]: 'pi:\n  setting: yaml\n',
        [join(projectDir, 'config.local.yml')]: 'pi:\n  other: yml\n',
      });

      const config = await getConfig({ cwd });

      expect(config.pi).toEqual({ setting: 'yaml', other: 'yml' });
    });

    it('merges the files in order, with the later ones winning', async () => {
      mockConfigFiles({
        '/agent/config.json': { pi: { a: 'global', b: 'global' } },
        '/agent/config.local.json': { pi: { b: 'global-local' } },
        [projectConfigPath]: { pi: { c: 'project' } },
        [projectLocalConfigPath]: { pi: { c: 'project-local' } },
      });

      const config = await getConfig({ cwd });

      expect(config.pi).toEqual({
        a: 'global',
        b: 'global-local',
        c: 'project-local',
      });
    });

    it('merges arrays by index instead of replacing them', async () => {
      mockConfigFiles({
        '/agent/config.json': { pi: { list: [1, 2], nested: [{ a: 1 }, { b: 2 }] } },
        [projectConfigPath]: { pi: { list: [3], nested: [{ c: 3 }] } },
      });

      const config = await getConfig({ cwd });

      expect(config.pi).toEqual({
        list: [3, 2],
        nested: [{ a: 1, c: 3 }, { b: 2 }],
      });
    });

    it('uses the current directory as the project by default', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/somewhere');
      mockConfigFiles({
        [join('/somewhere', CONFIG_DIR_NAME, 'config.json')]: { pi: { found: true } },
      });

      const config = await getConfig();

      expect(config.pi).toEqual({ found: true });
    });

    it.each([
      ['JSON', '{ nope', 'Invalid JSON in config file'],
      ['YAML', 'pi: [', 'Invalid YAML in config file'],
    ])('warns and skips a file with invalid %s', async (format, content, expected) => {
      mockRawFiles({
        [projectConfigPath]: format === 'JSON' ? content : '',
        [join(projectDir, 'config.yaml')]: format === 'YAML' ? content : '',
      });
      mockConfigFiles({ [projectLocalConfigPath]: { pi: { ok: true } } });
      mockRawFiles({
        [format === 'JSON' ? projectConfigPath : join(projectDir, 'config.yaml')]:
          content,
        [projectLocalConfigPath]: JSON.stringify({ pi: { ok: true } }),
      });

      const config = await getConfig({ cwd });

      expect(config.pi).toEqual({ ok: true });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining(expected));
    });

    it('warns and skips a file that cannot be read', async () => {
      vi.mocked(readFile).mockImplementation((path) => {
        if (path === projectConfigPath) {
          return Promise.reject(Object.assign(new Error('denied'), { code: 'EACCES' }));
        }
        if (path === projectLocalConfigPath) {
          return Promise.resolve('{"pi":{"ok":true}}');
        }
        return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
      });

      const config = await getConfig({ cwd });

      expect(config.pi).toEqual({ ok: true });
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(`Failed to read config file ${projectConfigPath}`),
      );
    });

    it('treats a rejection that is not an error object as a read failure', async () => {
      vi.mocked(readFile).mockImplementation((path) =>
        path === projectConfigPath
          ? // eslint-disable-next-line prefer-promise-reject-errors -- Simulates a failure that is not an Error object.
            Promise.reject('plain failure')
          : Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' })),
      );

      await getConfig({ cwd });

      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to read config file'),
      );
    });

    it('validates the config with a schema', async () => {
      mockConfigFiles({ [projectConfigPath]: { pi: { count: 2 } } });
      const schema = z.object({ pi: z.object({ count: z.number() }) });

      const config = await getConfig({ cwd, schema });

      expect(config).toEqual({ pi: { count: 2 } });
    });

    it('throws a validation error when the config does not match the schema', async () => {
      mockConfigFiles({ [projectConfigPath]: { pi: { count: 'two' } } });
      const schema = z.object({ pi: z.object({ count: z.number() }) });

      const error = await getConfig({ cwd, schema }).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ConfigValidationError);
      expect((error as ConfigValidationError).issues.length).toBeGreaterThan(0);
    });
  });

  describe('extends', () => {
    it('merges a base file under the file that extends it, and strips `extends`', async () => {
      mockConfigFiles({
        [projectConfigPath]: { extends: './base.json', pi: { b: 'current' } },
        [join(projectDir, 'base.json')]: { pi: { a: 'base', b: 'base' } },
      });

      const config = await getConfig({ cwd });

      expect(config.pi).toEqual({ a: 'base', b: 'current' });
      expect(config).not.toHaveProperty('extends');
    });

    it('resolves chains of bases', async () => {
      mockConfigFiles({
        [projectConfigPath]: { extends: './one.json', pi: { top: true } },
        [join(projectDir, 'one.json')]: { extends: './two.json', pi: { one: true } },
        [join(projectDir, 'two.json')]: { pi: { two: true } },
      });

      const config = await getConfig({ cwd });

      expect(config.pi).toEqual({ top: true, one: true, two: true });
    });

    it('resolves the `agent:` prefix', async () => {
      mockConfigFiles({
        [projectConfigPath]: { extends: 'agent:shared/base.json', pi: { b: 2 } },
        '/agent/shared/base.json': { pi: { a: 1 } },
      });

      const config = await getConfig({ cwd });

      expect(config.pi).toEqual({ a: 1, b: 2 });
    });

    it('resolves the `pi:` prefix', async () => {
      mockConfigFiles({
        [projectConfigPath]: { extends: 'pi:shared/base.json', pi: { b: 2 } },
        [join(homedir(), CONFIG_DIR_NAME, 'shared/base.json')]: { pi: { a: 1 } },
      });

      const config = await getConfig({ cwd });

      expect(config.pi).toEqual({ a: 1, b: 2 });
    });

    it('resolves the `profile:` prefix', async () => {
      mockConfigFiles({
        [projectConfigPath]: { extends: 'profile:work:base.json', pi: { b: 2 } },
        '/agent/profiles/work/base.json': { pi: { a: 1 } },
      });

      const config = await getConfig({ cwd });

      expect(config.pi).toEqual({ a: 1, b: 2 });
    });

    it('resolves absolute paths', async () => {
      mockConfigFiles({
        [projectConfigPath]: { extends: '/shared/base.json', pi: { b: 2 } },
        '/shared/base.json': { pi: { a: 1 } },
      });

      const config = await getConfig({ cwd });

      expect(config.pi).toEqual({ a: 1, b: 2 });
    });

    it('uses the file on its own when the base does not exist, without warning', async () => {
      mockConfigFiles({
        [projectConfigPath]: { extends: './missing.json', pi: { b: 2 } },
      });

      const config = await getConfig({ cwd });

      expect(config.pi).toEqual({ b: 2 });
      expect(config).not.toHaveProperty('extends');
      expect(warn).not.toHaveBeenCalled();
    });

    it('warns and uses the file on its own when the base is invalid', async () => {
      mockRawFiles({
        [projectConfigPath]: JSON.stringify({ extends: './bad.json', pi: { b: 2 } }),
        [join(projectDir, 'bad.json')]: '{ nope',
      });

      const config = await getConfig({ cwd });

      expect(config.pi).toEqual({ b: 2 });
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid JSON in config file'),
      );
    });

    it('warns about circular references without breaking the config', async () => {
      mockConfigFiles({
        [projectConfigPath]: { extends: './other.json', pi: { a: 1 } },
        [join(projectDir, 'other.json')]: { extends: './config.json', pi: { b: 2 } },
      });

      const config = await getConfig({ cwd });

      expect(config.pi).toEqual({ a: 1, b: 2 });
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('Circular extends detected'),
      );
    });

    it.each([
      ['a number', 5],
      ['an empty string', '   '],
    ])('ignores `extends` when it is %s', async (_label, value) => {
      mockConfigFiles({ [projectConfigPath]: { extends: value, pi: { a: 1 } } });

      const config = await getConfig({ cwd });

      expect(config.pi).toEqual({ a: 1 });
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('session override', () => {
    it('deep-merges the override on top of file-based config, with the override winning', async () => {
      mockConfigFiles({
        [projectLocalConfigPath]: {
          pi: { models: { selected: 'file-model' }, sessionAutoName: { enabled: true } },
        },
      });
      setSessionConfigOverride({
        ...emptyOverride,
        pi: { models: { selected: 'override-model' } },
      });

      const config = await getConfig({ cwd });

      expect(config.pi).toEqual({
        models: { selected: 'override-model' },
        sessionAutoName: { enabled: true },
      });
    });

    it('falls back to file-only behavior once the override is cleared', async () => {
      mockConfigFiles({
        [projectLocalConfigPath]: { pi: { models: { selected: 'file-model' } } },
      });
      setSessionConfigOverride({
        ...emptyOverride,
        pi: { models: { selected: 'override-model' } },
      });
      setSessionConfigOverride(undefined);

      const config = await getConfig({ cwd });

      expect(config.pi).toEqual({ models: { selected: 'file-model' } });
      expect(getSessionConfigOverride()).toBeUndefined();
    });

    it('wins over the project `.local` config file on conflicting keys', async () => {
      mockConfigFiles({
        [projectLocalConfigPath]: { pi: { setting: 'local-file' } },
      });
      setSessionConfigOverride({ ...emptyOverride, pi: { setting: 'override' } });

      const config = await getConfig({ cwd });

      expect(config.pi).toEqual({ setting: 'override' });
    });

    it('clearSessionConfigOverride clears the override and reports whether one was set', () => {
      expect(clearSessionConfigOverride()).toBe(false);

      setSessionConfigOverride({ ...emptyOverride, pi: { setting: 'override' } });

      expect(clearSessionConfigOverride()).toBe(true);
      expect(getSessionConfigOverride()).toBeUndefined();
    });

    describe('change callback', () => {
      const onChange = vi.fn();
      const override = { ...emptyOverride, pi: { setting: 'a' } };

      beforeEach(() => {
        onChange.mockClear();
      });

      it('is called once with `set` when an override is set', () => {
        setSessionConfigOverride(override, onChange);

        expect(onChange).toHaveBeenCalledOnce();
        expect(onChange).toHaveBeenCalledWith({ type: 'set' });
      });

      it('is called once with `cleared` when an override is cleared', () => {
        setSessionConfigOverride(override);

        clearSessionConfigOverride(onChange);

        expect(onChange).toHaveBeenCalledOnce();
        expect(onChange).toHaveBeenCalledWith({ type: 'cleared' });
      });

      it('is called with `cleared` when the override is set to `undefined`', () => {
        setSessionConfigOverride(override);

        setSessionConfigOverride(undefined, onChange);

        expect(onChange).toHaveBeenCalledOnce();
        expect(onChange).toHaveBeenCalledWith({ type: 'cleared' });
      });

      it('is not called when there was no override to clear', () => {
        clearSessionConfigOverride(onChange);
        setSessionConfigOverride(undefined, onChange);

        expect(onChange).not.toHaveBeenCalled();
      });
    });

    it('is shared through globalThis, so other copies of the package see it', () => {
      setSessionConfigOverride({ ...emptyOverride, pi: { setting: 'override' } });

      const store = globalThis as { __piConfigSessionOverride?: unknown };

      expect(store.__piConfigSessionOverride).toEqual({
        ...emptyOverride,
        pi: { setting: 'override' },
      });
    });

    it('is reflected by queryConfig as well', async () => {
      mockConfigFiles({
        [projectLocalConfigPath]: { pi: { setting: 'file' } },
      });
      setSessionConfigOverride({ ...emptyOverride, pi: { setting: 'override' } });

      const result = await queryConfig({ scope: 'pi' }, { cwd });

      expect(result).toMatchObject({ status: 'found', value: { setting: 'override' } });
    });

    it('is not part of what readConfigFiles returns', async () => {
      setSessionConfigOverride({ ...emptyOverride, pi: { setting: 'override' } });

      const { config } = await readConfigFiles({ cwd }.cwd);

      expect(config.pi).toEqual({});
    });
  });

  describe('readConfigFiles', () => {
    it('returns the candidates in merge order, flagging the ones that were used', async () => {
      mockConfigFiles({ [projectConfigPath]: { pi: { a: 1 } } });

      const { sources } = await readConfigFiles(cwd);

      expect(sources.map(({ path }) => path)).toEqual([
        '/agent/config.json',
        '/agent/config.yml',
        '/agent/config.yaml',
        '/agent/config.local.json',
        '/agent/config.local.yml',
        '/agent/config.local.yaml',
        projectConfigPath,
        join(projectDir, 'config.yml'),
        join(projectDir, 'config.yaml'),
        projectLocalConfigPath,
        join(projectDir, 'config.local.yml'),
        join(projectDir, 'config.local.yaml'),
      ]);
      expect(sources.filter((source) => source.used).map(({ path }) => path)).toEqual([
        projectConfigPath,
      ]);
      expect(sources[0]).toMatchObject({
        scope: 'global',
        local: false,
        exists: false,
        used: false,
      });
      expect(sources[3]).toMatchObject({ scope: 'global', local: true });
      expect(sources[6]).toMatchObject({
        scope: 'project',
        local: false,
        exists: true,
        used: true,
      });
      expect(sources[9]).toMatchObject({ scope: 'project', local: true });
    });

    it('looks for the project config in the current directory by default', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/somewhere');

      const { sources } = await readConfigFiles();

      expect(sources[6]!.path).toBe(join('/somewhere', CONFIG_DIR_NAME, 'config.json'));
    });
  });

  describe('getConfigValue', () => {
    it('returns the value at a path', async () => {
      mockConfigFiles({
        [projectConfigPath]: { skills: { commit: { runChecks: true } } },
      });

      const value = await getConfigValue('skills.commit.runChecks', { cwd });

      expect(value).toBe(true);
    });

    it('returns undefined when the path does not exist', async () => {
      const value = await getConfigValue('skills.commit.runChecks', { cwd });

      expect(value).toBeUndefined();
    });

    it('validates the value with a schema', async () => {
      mockConfigFiles({
        [projectConfigPath]: { skills: { commit: { runChecks: true } } },
      });
      const schema = z
        .object({ runChecks: z.boolean() })
        .transform((v) => ({ ...v, ok: 1 }));

      const value = await getConfigValue('skills.commit', { cwd, schema });

      expect(value).toEqual({ runChecks: true, ok: 1 });
    });

    it('throws a validation error when the value does not match the schema', async () => {
      mockConfigFiles({
        [projectConfigPath]: { skills: { commit: { runChecks: 'yes' } } },
      });
      const schema = z.object({ runChecks: z.boolean() });

      await expect(
        getConfigValue('skills.commit', { cwd, schema }),
      ).rejects.toBeInstanceOf(ConfigValidationError);
    });

    it('does not run the schema when there is no value', async () => {
      const schema = z.object({ runChecks: z.boolean() });

      const value = await getConfigValue('skills.commit', { cwd, schema });

      expect(value).toBeUndefined();
    });

    it('reads from the current directory by default', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/somewhere');
      mockConfigFiles({
        [join('/somewhere', CONFIG_DIR_NAME, 'config.json')]: { pi: { found: true } },
      });

      const value = await getConfigValue('pi.found');

      expect(value).toBe(true);
    });
  });

  describe('queryConfig', () => {
    beforeEach(() => {
      mockConfigFiles({
        [projectConfigPath]: {
          pi: { setting: 'p' },
          skills: { commit: { runChecks: true } },
          tools: { bash: { timeout: 10 } },
          extensions: { mine: { enabled: true } },
        },
      });
    });

    it.each([
      [{ path: 'pi.setting' }, 'p'],
      [{ scope: 'pi' as const }, { setting: 'p' }],
      [{ scope: 'skills' as const }, { commit: { runChecks: true } }],
      [{ scope: 'tools' as const }, { bash: { timeout: 10 } }],
      [{ scope: 'extensions' as const }, { mine: { enabled: true } }],
      [{ scope: 'skill' as const, name: 'commit' }, { runChecks: true }],
      [{ scope: 'tool' as const, name: 'bash' }, { timeout: 10 }],
      [{ scope: 'extension' as const, name: 'mine' }, { enabled: true }],
    ])('finds the value for %j', async (query, value) => {
      const result = await queryConfig(query, { cwd });

      expect(result).toMatchObject({ status: 'found', query, value, redacted: false });
      expect(result.sources.some((source) => source.used)).toBe(true);
    });

    it.each([[{}], [{ scope: 'all' as const }]])(
      'returns the whole config for %j',
      async (query) => {
        const result = await queryConfig(query, { cwd });

        expect(result.status).toBe('found');
        expect(result.value).toMatchObject({
          pi: { setting: 'p' },
          skills: { commit: { runChecks: true } },
        });
      },
    );

    it('reports a path that does not exist', async () => {
      const result = await queryConfig({ path: 'pi.nope' }, { cwd });

      expect(result).toMatchObject({
        status: 'not_found',
        message: 'Config path not found: pi.nope',
        redacted: false,
      });
      expect(result.sources.length).toBeGreaterThan(0);
    });

    it.each([
      [{ path: 'pi', scope: 'pi' as const }, 'Use either path or scope/name, not both.'],
      [{ path: 'pi', name: 'x' }, 'Use either path or scope/name, not both.'],
      [{ scope: 'skill' as const }, "scope 'skill' requires name."],
      [{ scope: 'tool' as const }, "scope 'tool' requires name."],
      [{ scope: 'extension' as const }, "scope 'extension' requires name."],
      [
        { scope: 'pi' as const, name: 'x' },
        'name is only valid with skill, tool, or extension scope.',
      ],
      [{ name: 'x' }, 'name is only valid with skill, tool, or extension scope.'],
    ])('reports an invalid query: %j', async (query, message) => {
      const result = await queryConfig(query, { cwd });

      expect(result).toEqual({
        status: 'error',
        query,
        redacted: false,
        sources: [],
        message,
      });
      expect(readFile).not.toHaveBeenCalled();
    });

    it('reads from the current directory by default', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/somewhere');
      mockConfigFiles({
        [join('/somewhere', CONFIG_DIR_NAME, 'config.json')]: { pi: { found: true } },
      });

      const result = await queryConfig({ path: 'pi.found' });

      expect(result).toMatchObject({ status: 'found', value: true });
    });
  });
});

describe('path utils', () => {
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

  describe('resolvePiPath', () => {
    const baseDir = '/base/dir';

    it('resolves `pi:` paths relative to the Pi directory', () => {
      expect(resolvePiPath('pi:shared/base.yaml', baseDir)).toBe(
        join(homedir(), CONFIG_DIR_NAME, 'shared/base.yaml'),
      );
    });

    it('resolves `agent:` paths relative to the agent directory', () => {
      expect(resolvePiPath('agent:shared/base.yaml', baseDir)).toBe(
        join(getAgentDir(), 'shared/base.yaml'),
      );
    });

    it('resolves `profile:<name>:<path>` paths relative to the profile directory', () => {
      expect(resolvePiPath('profile:work:base.yaml', baseDir)).toBe(
        join(getAgentDir(), 'profiles', 'work', 'base.yaml'),
      );
    });

    it('uses absolute paths as they are', () => {
      expect(resolvePiPath('/shared/base.yaml', baseDir)).toBe('/shared/base.yaml');
    });

    it.each([
      ['a relative path', '../base.yaml', '/base/base.yaml'],
      ['a dot-relative path', './base.yaml', '/base/dir/base.yaml'],
      ['a bare file name', 'base.yaml', '/base/dir/base.yaml'],
      ['a profile reference without a path', 'profile:work', '/base/dir/profile:work'],
    ])('resolves %s from the base directory', (_label, value, expected) => {
      expect(resolvePiPath(value, baseDir)).toBe(expected);
    });
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
    expect(message).toContain('; ');
    expect(message).not.toContain('"code"');
  });

  it.each([
    ['a string', 'plain failure', 'plain failure'],
    ['a number', 404, '404'],
    ['undefined', undefined, 'undefined'],
    ['an object', { not: 'an error' }, '[object Object]'],
  ])('converts %s to a string', (_label, value, expected) => {
    expect(ensureErrorMessage(value)).toBe(expected);
  });
});
