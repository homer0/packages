import { execFile } from 'node:child_process';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GLOBAL_LOCATION,
  REPO_ROOT,
  WORKSPACE_PATH,
  addCatalogDependency,
  addPackageEntry,
  addToWorkspaceCatalog,
  findPackageLocations,
  listProfiles,
  profilePaths,
  readMinimumReleaseAge,
  removeCatalogDependency,
  removeFromWorkspaceCatalog,
  removePackageEntry,
  resolveInstallPaths,
  resolveVersion,
  run,
  versionSpec,
} from './utils.js';

vi.mock('node:os', () => ({ homedir: vi.fn(() => '/home/test') }));
vi.mock('node:child_process', () => ({ execFile: vi.fn() }));
vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(),
  readFile: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
  writeFile: vi.fn(),
}));

describe('utils', () => {
  const workspace = [
    'packages:',
    '  - x',
    '',
    'catalog:',
    '  # Extensions',
    "  '@scope/foo.bar': '^1.0.0'",
    '',
    '  # Dev',
    "  'bar': '2.0.0'",
    '',
  ].join('\n');

  /** Makes `readFile` answer by path, with a missing file for the unknown ones. */
  const mockFiles = (files: Record<string, string>): void => {
    vi.mocked(readFile).mockImplementation((async (path: string) => {
      if (path in files) return files[path];
      throw new Error(`ENOENT: ${path}`);
    }) as never);
  };

  /** The last JSON written to a path. */
  const writtenJson = (path: string): unknown => {
    const call = vi
      .mocked(writeFile)
      .mock.calls.toReversed()
      .find(([target]) => target === path);
    return JSON.parse(call![1] as string);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(readFile).mockReset();
    vi.mocked(readdir).mockReset();
    vi.mocked(stat).mockReset();
    vi.mocked(execFile).mockReset();
  });

  describe('paths', () => {
    it('builds the repo paths from the home directory and the Pi config dir', () => {
      expect(REPO_ROOT).toBe('/home/test/.pi');
      expect(WORKSPACE_PATH).toBe('/home/test/.pi/pnpm-workspace.yaml');
      expect(GLOBAL_LOCATION).toBe('Global');
    });
  });

  describe('readMinimumReleaseAge', () => {
    it('reads the minimum release age', () => {
      expect(readMinimumReleaseAge('minimumReleaseAge: 4320\n', 'foo')).toBe(4320);
    });

    it('returns 0 when the value is missing or is not a number', () => {
      expect(readMinimumReleaseAge('packages: []\n', 'foo')).toBe(0);
      expect(readMinimumReleaseAge('minimumReleaseAge: soon\n', 'foo')).toBe(0);
    });

    it('returns 0 for an empty workspace', () => {
      expect(readMinimumReleaseAge('', 'foo')).toBe(0);
    });

    it.each([
      ['foo', 'foo'],
      ['foo', 'foo@1.0.0'],
      ['@scope/foo', '@scope/foo'],
      ['@scope/foo', '@scope/foo@1.0.0'],
      ['@scope/foo', '@scope/'],
    ])('returns 0 when %s is excluded by %s', (name, exclusion) => {
      const yaml = `minimumReleaseAge: 10\nminimumReleaseAgeExclude:\n  - '${exclusion}'\n`;

      expect(readMinimumReleaseAge(yaml, name)).toBe(0);
    });

    it('keeps the age when the exclusions do not match the package', () => {
      const yaml = [
        'minimumReleaseAge: 10',
        'minimumReleaseAgeExclude:',
        "  - 'other'",
        "  - '@other/'",
        '  - 1',
        '',
      ].join('\n');

      expect(readMinimumReleaseAge(yaml, 'foo')).toBe(10);
      expect(readMinimumReleaseAge(yaml, '@scope/foo')).toBe(10);
    });

    it('does not look for a scope in a scoped name that has none', () => {
      const yaml = "minimumReleaseAge: 10\nminimumReleaseAgeExclude:\n  - '@other/'\n";

      expect(readMinimumReleaseAge(yaml, '@foo')).toBe(10);
    });

    it('ignores exclusions that are not a list', () => {
      const yaml = 'minimumReleaseAge: 10\nminimumReleaseAgeExclude: foo\n';

      expect(readMinimumReleaseAge(yaml, 'foo')).toBe(10);
    });
  });

  describe('versionSpec', () => {
    it('adds a caret from major 1', () => {
      expect(versionSpec('1.2.3')).toBe('^1.2.3');
      expect(versionSpec('12.0.0')).toBe('^12.0.0');
    });

    it('keeps the exact version for 0.x', () => {
      expect(versionSpec('0.4.1')).toBe('0.4.1');
    });
  });

  describe('resolveVersion', () => {
    const day = 24 * 60 * 60 * 1000;
    const daysAgo = (days: number): string =>
      new Date(Date.now() - days * day).toISOString();

    /** Makes `fetch` answer with a registry document. */
    const mockRegistry = (
      data: unknown,
      init: { ok?: boolean; status?: number } = {},
    ) => {
      const fetchMock = vi.fn(async () => ({
        ok: init.ok ?? true,
        status: init.status ?? 200,
        json: async () => data,
      }));
      vi.stubGlobal('fetch', fetchMock);
      return fetchMock;
    };

    it('returns the latest dist-tag when it is old enough', async () => {
      mockRegistry({
        versions: { '1.0.0': {}, '1.1.0': {} },
        time: { '1.0.0': daysAgo(10), '1.1.0': daysAgo(5) },
        'dist-tags': { latest: '1.1.0' },
      });

      await expect(resolveVersion('foo', 3 * 24 * 60)).resolves.toBe('1.1.0');
    });

    it('returns the newest eligible version when the latest is too new', async () => {
      mockRegistry({
        versions: { '1.0.0': {}, '1.10.0': {}, '1.2.0': {}, '2.0.0': {} },
        time: {
          '1.0.0': daysAgo(30),
          '1.10.0': daysAgo(20),
          '1.2.0': daysAgo(25),
          '2.0.0': daysAgo(1),
        },
        'dist-tags': { latest: '2.0.0' },
      });

      await expect(resolveVersion('foo', 3 * 24 * 60)).resolves.toBe('1.10.0');
    });

    it('works with no dist-tags, ignoring pre-releases and versions with no time', async () => {
      mockRegistry({
        versions: { '1.0.0': {}, '1.1.0': {}, '1.2.0-beta.1': {} },
        time: { '1.0.0': daysAgo(30), '1.2.0-beta.1': daysAgo(30) },
      });

      await expect(resolveVersion('foo', 0)).resolves.toBe('1.0.0');
    });

    it('breaks ties in the version parts one by one', async () => {
      mockRegistry({
        versions: { '1.2.3': {}, '1.2.4': {}, '1.2.3-x': {} },
        time: { '1.2.3': daysAgo(9), '1.2.4': daysAgo(9) },
      });

      await expect(resolveVersion('foo', 0)).resolves.toBe('1.2.4');
    });

    it('requests the encoded name of a scoped package', async () => {
      const fetchMock = mockRegistry({
        versions: { '1.0.0': {} },
        time: { '1.0.0': daysAgo(9) },
      });

      await resolveVersion('@scope/foo', 0);

      expect(fetchMock).toHaveBeenCalledWith('https://registry.npmjs.org/@scope%2Ffoo');
    });

    it('requests the encoded name of an unscoped package', async () => {
      const fetchMock = mockRegistry({
        versions: { '1.0.0': {} },
        time: { '1.0.0': daysAgo(9) },
      });

      await resolveVersion('foo', 0);

      expect(fetchMock).toHaveBeenCalledWith('https://registry.npmjs.org/foo');
    });

    it('throws when the registry fails', async () => {
      mockRegistry({}, { ok: false, status: 404 });

      await expect(resolveVersion('foo', 0)).rejects.toThrow(
        'npm registry returned 404 for foo',
      );
    });

    it('throws when the package has no stable versions', async () => {
      mockRegistry({ versions: { '1.0.0-beta.1': {} } });

      await expect(resolveVersion('foo', 0)).rejects.toThrow(
        'No stable versions found for foo',
      );
    });

    it('throws when the registry has no versions at all', async () => {
      mockRegistry({});

      await expect(resolveVersion('foo', 0)).rejects.toThrow(
        'No stable versions found for foo',
      );
    });

    it('throws when no version is old enough', async () => {
      mockRegistry({
        versions: { '1.0.0': {} },
        time: { '1.0.0': daysAgo(1) },
        'dist-tags': { latest: '1.0.0' },
      });

      await expect(resolveVersion('foo', 3 * 24 * 60)).rejects.toThrow(
        'No version of foo satisfies minimumReleaseAge 4320',
      );
    });
  });

  describe('addToWorkspaceCatalog', () => {
    it('adds a new entry at the end of the Extensions section', async () => {
      mockFiles({ [WORKSPACE_PATH]: workspace });

      await addToWorkspaceCatalog('new-pkg', '^1.2.3');

      expect(writeFile).toHaveBeenCalledWith(
        WORKSPACE_PATH,
        workspace.replace(
          "foo.bar': '^1.0.0'\n",
          'foo.bar\': \'^1.0.0\'\n  "new-pkg": "^1.2.3"\n',
        ),
      );
    });

    it('updates an existing entry, whatever its quotes', async () => {
      mockFiles({ [WORKSPACE_PATH]: workspace });

      await addToWorkspaceCatalog('@scope/foo.bar', '^2.0.0');

      expect(writeFile).toHaveBeenCalledWith(
        WORKSPACE_PATH,
        workspace.replace("  '@scope/foo.bar': '^1.0.0'", '  "@scope/foo.bar": "^2.0.0"'),
      );
    });

    it('does not treat the dots of a name as wildcards', async () => {
      mockFiles({ [WORKSPACE_PATH]: workspace });

      await addToWorkspaceCatalog('@scope/fooXbar', '1.0.0');

      expect(vi.mocked(writeFile).mock.calls[0]![1]).toContain('"@scope/fooXbar"');
      expect(vi.mocked(writeFile).mock.calls[0]![1]).toContain("'@scope/foo.bar'");
    });

    it('throws when there is no Extensions section', async () => {
      mockFiles({ [WORKSPACE_PATH]: 'catalog:\n  # Core\n' });

      await expect(addToWorkspaceCatalog('foo', '1.0.0')).rejects.toThrow(
        'Could not find # Extensions catalog section',
      );
      expect(writeFile).not.toHaveBeenCalled();
    });
  });

  describe('removeFromWorkspaceCatalog', () => {
    it('removes the entry and returns its version without the caret', async () => {
      mockFiles({ [WORKSPACE_PATH]: workspace });

      await expect(removeFromWorkspaceCatalog('@scope/foo.bar')).resolves.toBe('1.0.0');

      expect(writeFile).toHaveBeenCalledWith(
        WORKSPACE_PATH,
        workspace.replace("  '@scope/foo.bar': '^1.0.0'\n", ''),
      );
    });

    it('returns an exact version as it is', async () => {
      mockFiles({ [WORKSPACE_PATH]: workspace });

      await expect(removeFromWorkspaceCatalog('bar')).resolves.toBe('2.0.0');
    });

    it('returns undefined and writes nothing when there is no entry', async () => {
      mockFiles({ [WORKSPACE_PATH]: workspace });

      await expect(removeFromWorkspaceCatalog('missing')).resolves.toBeUndefined();
      expect(writeFile).not.toHaveBeenCalled();
    });
  });

  describe('catalog dependencies', () => {
    it('adds a dependency and keeps them sorted', async () => {
      mockFiles({
        '/pkg.json': JSON.stringify({ name: 'x', dependencies: { b: '1', z: '1' } }),
      });

      await addCatalogDependency('/pkg.json', 'c');

      expect(writtenJson('/pkg.json')).toEqual({
        name: 'x',
        dependencies: { b: '1', c: 'catalog:', z: '1' },
      });
      expect(
        Object.keys((writtenJson('/pkg.json') as { dependencies: object }).dependencies),
      ).toEqual(['b', 'c', 'z']);
      expect(vi.mocked(writeFile).mock.calls[0]![1]).toMatch(/\n$/);
    });

    it('creates the dependencies when there are none', async () => {
      mockFiles({ '/pkg.json': '{}' });

      await addCatalogDependency('/pkg.json', 'c');

      expect(writtenJson('/pkg.json')).toEqual({ dependencies: { c: 'catalog:' } });
    });

    it('removes a dependency', async () => {
      mockFiles({ '/pkg.json': JSON.stringify({ dependencies: { a: '1', b: '1' } }) });

      await removeCatalogDependency('/pkg.json', 'a');

      expect(writtenJson('/pkg.json')).toEqual({ dependencies: { b: '1' } });
    });

    it('removes nothing when there are no dependencies', async () => {
      mockFiles({ '/pkg.json': '{"name":"x"}' });

      await removeCatalogDependency('/pkg.json', 'a');

      expect(writtenJson('/pkg.json')).toEqual({ name: 'x' });
    });
  });

  describe('package entries', () => {
    it('adds an entry, sorted', async () => {
      mockFiles({ '/s.json': JSON.stringify({ theme: 'x', packages: ['./z', './b'] }) });

      await addPackageEntry('/s.json', './a');

      expect(writtenJson('/s.json')).toEqual({
        theme: 'x',
        packages: ['./a', './b', './z'],
      });
    });

    it('does not duplicate an entry that is already there', async () => {
      mockFiles({ '/s.json': JSON.stringify({ packages: ['./b'] }) });

      await addPackageEntry('/s.json', './b');

      expect(writtenJson('/s.json')).toEqual({ packages: ['./b'] });
    });

    it('creates the packages list when there is none', async () => {
      mockFiles({ '/s.json': '{}' });

      await addPackageEntry('/s.json', './a');

      expect(writtenJson('/s.json')).toEqual({ packages: ['./a'] });
    });

    it('removes an entry, with or without the leading ./', async () => {
      mockFiles({ '/s.json': JSON.stringify({ packages: ['./a', 'b', './c'] }) });

      await removePackageEntry('/s.json', 'a');
      expect(writtenJson('/s.json')).toEqual({ packages: ['b', './c'] });

      await removePackageEntry('/s.json', './b');
      expect(writtenJson('/s.json')).toEqual({ packages: ['./a', './c'] });
    });

    it('leaves an empty list when the file has no packages', async () => {
      mockFiles({ '/s.json': '{}' });

      await removePackageEntry('/s.json', './a');

      expect(writtenJson('/s.json')).toEqual({ packages: [] });
    });
  });

  describe('profilePaths', () => {
    it('builds the paths of a profile', () => {
      expect(profilePaths('regal')).toEqual({
        extensionPackagePath:
          '/home/test/.pi/agent/profiles/regal/extensions/pnpm/package.json',
        pnpmExtensionPackagePrefix: './profiles/regal/extensions/pnpm/node_modules/',
        settingsPath: '/home/test/.pi/agent/profiles/regal/packages.json',
        installCommitFiles: [
          'pnpm-workspace.yaml',
          'pnpm-lock.yaml',
          'agent/profiles/regal/packages.json',
          'agent/profiles/regal/extensions/pnpm/package.json',
        ],
      });
    });
  });

  describe('listProfiles', () => {
    it('returns the names of the directories only', async () => {
      vi.mocked(readdir).mockResolvedValue([
        { name: 'regal', isDirectory: () => true },
        { name: 'README.md', isDirectory: () => false },
        { name: 'solo', isDirectory: () => true },
      ] as never);

      await expect(listProfiles()).resolves.toEqual(['regal', 'solo']);
      expect(readdir).toHaveBeenCalledWith('/home/test/.pi/agent/profiles', {
        withFileTypes: true,
      });
    });

    it('returns an empty list when the directory cannot be read', async () => {
      vi.mocked(readdir).mockRejectedValue(new Error('ENOENT'));

      await expect(listProfiles()).resolves.toEqual([]);
    });
  });

  describe('resolveInstallPaths', () => {
    it('returns the global paths when there is no profile', async () => {
      await expect(resolveInstallPaths()).resolves.toEqual({
        extensionPackagePath: '/home/test/.pi/agent/extensions/pnpm/package.json',
        pnpmExtensionPackagePrefix: './extensions/pnpm/node_modules/',
        settingsPath: '/home/test/.pi/agent/settings.json',
        installCommitFiles: [
          'pnpm-workspace.yaml',
          'pnpm-lock.yaml',
          'agent/settings.json',
          'agent/extensions/pnpm/package.json',
        ],
      });
      expect(stat).not.toHaveBeenCalled();
    });

    it('returns the paths of a profile that already has its manifest', async () => {
      vi.mocked(stat).mockResolvedValue({} as never);

      await expect(resolveInstallPaths('regal')).resolves.toEqual(profilePaths('regal'));
      expect(mkdir).not.toHaveBeenCalled();
      expect(writeFile).not.toHaveBeenCalled();
    });

    it('creates the manifest of a profile that does not have one', async () => {
      vi.mocked(stat).mockRejectedValue(new Error('ENOENT'));
      const { extensionPackagePath } = profilePaths('regal');

      await expect(resolveInstallPaths('regal')).resolves.toEqual(profilePaths('regal'));

      expect(mkdir).toHaveBeenCalledWith(
        '/home/test/.pi/agent/profiles/regal/extensions/pnpm',
        { recursive: true },
      );
      expect(writtenJson(extensionPackagePath)).toEqual({
        name: 'pi-profile-regal-extensions',
        private: true,
        dependencies: {},
      });
    });
  });

  describe('findPackageLocations', () => {
    const globalSettings = '/home/test/.pi/agent/settings.json';

    it('finds the global and the profile registrations', async () => {
      mockFiles({
        [globalSettings]: JSON.stringify({
          packages: ['./extensions/pnpm/node_modules/foo'],
        }),
        [profilePaths('regal').settingsPath]: JSON.stringify({
          packages: ['./profiles/regal/extensions/pnpm/node_modules/foo'],
        }),
        [profilePaths('solo').settingsPath]: JSON.stringify({ packages: [] }),
      });
      vi.mocked(readdir).mockResolvedValue([
        { name: 'regal', isDirectory: () => true },
        { name: 'solo', isDirectory: () => true },
      ] as never);

      const locations = await findPackageLocations('foo');

      expect(locations.map((location) => location.label)).toEqual([
        GLOBAL_LOCATION,
        'regal',
      ]);
      expect(locations[0]!.paths.settingsPath).toBe(globalSettings);
      expect(locations[1]!.paths).toEqual(profilePaths('regal'));
    });

    it('finds nothing when no registry has the package or the files are missing', async () => {
      mockFiles({ [globalSettings]: '{}' });
      vi.mocked(readdir).mockResolvedValue([
        { name: 'regal', isDirectory: () => true },
      ] as never);

      await expect(findPackageLocations('foo')).resolves.toEqual([]);
    });
  });

  describe('run', () => {
    it('runs the command with the cwd and a bounded buffer', async () => {
      vi.mocked(execFile).mockImplementation(((...args: unknown[]) =>
        (args.at(-1) as (...cbArgs: unknown[]) => void)(null, {
          stdout: '',
          stderr: '',
        })) as never);

      await run({ command: 'git', args: ['status'], cwd: '/repo' });

      expect(execFile).toHaveBeenCalledWith(
        'git',
        ['status'],
        { cwd: '/repo', maxBuffer: 20_971_520 },
        expect.any(Function),
      );
    });

    it('throws with the message and the captured output when it fails', async () => {
      vi.mocked(execFile).mockImplementation(((...args: unknown[]) =>
        (args.at(-1) as (...cbArgs: unknown[]) => void)(
          Object.assign(new Error('exit 1'), { stderr: 'bad', stdout: 'out' }),
        )) as never);

      await expect(run({ command: 'git', args: [], cwd: '/repo' })).rejects.toThrow(
        'exit 1\nbad\nout',
      );
    });

    it('skips the output that is missing', async () => {
      vi.mocked(execFile).mockImplementation(((...args: unknown[]) =>
        (args.at(-1) as (...cbArgs: unknown[]) => void)(new Error('exit 1'))) as never);

      await expect(run({ command: 'git', args: [], cwd: '/repo' })).rejects.toThrow(
        /^exit 1$/,
      );
    });
  });
});
