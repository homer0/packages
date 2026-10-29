import type { ExtensionCommandContext } from '@earendil-works/pi-coding-agent';
import { readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleInstallPiPnpmPackage, handleUninstallPiPnpmPackage } from './handlers.js';
import {
  addCatalogDependency,
  addPackageEntry,
  addToWorkspaceCatalog,
  findPackageLocations,
  listProfiles,
  readMinimumReleaseAge,
  removeCatalogDependency,
  removeFromWorkspaceCatalog,
  removePackageEntry,
  resolveInstallPaths,
  resolveVersion,
  run,
  versionSpec,
  type InstallPaths,
} from './utils.js';

vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }));
vi.mock('./utils.js', () => ({
  GLOBAL_LOCATION: 'Global',
  REPO_ROOT: '/repo',
  WORKSPACE_PATH: '/repo/pnpm-workspace.yaml',
  addCatalogDependency: vi.fn(),
  addPackageEntry: vi.fn(),
  addToWorkspaceCatalog: vi.fn(),
  findPackageLocations: vi.fn(),
  listProfiles: vi.fn(),
  readMinimumReleaseAge: vi.fn(),
  removeCatalogDependency: vi.fn(),
  removeFromWorkspaceCatalog: vi.fn(),
  removePackageEntry: vi.fn(),
  resolveInstallPaths: vi.fn(),
  resolveVersion: vi.fn(),
  run: vi.fn(),
  versionSpec: vi.fn(),
}));

describe('handlers', () => {
  const paths: InstallPaths = {
    extensionPackagePath: '/repo/ext/package.json',
    pnpmExtensionPackagePrefix: './extensions/pnpm/node_modules/',
    settingsPath: '/repo/settings.json',
    installCommitFiles: ['pnpm-lock.yaml', 'settings.json'],
  };
  const profilePathsStub: InstallPaths = {
    ...paths,
    settingsPath: '/repo/regal/packages.json',
  };

  /** The mocked UI of a command context. */
  type MockUi = {
    notify: ReturnType<typeof vi.fn>;
    setStatus: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
  };

  /** A command context whose `select` answers with the given value. */
  const createCtx = (
    selection?: string,
  ): { ctx: ExtensionCommandContext; ui: MockUi } => {
    const ui = {
      notify: vi.fn(),
      setStatus: vi.fn(),
      select: vi.fn(async () => selection),
    };
    const ctx = { ui, waitForIdle: vi.fn(async () => undefined) };
    return { ctx: ctx as unknown as ExtensionCommandContext, ui };
  };

  /** The `[command, ...args]` of every `run` call. */
  const runCalls = (): unknown[][] =>
    vi.mocked(run).mock.calls.map(([options]) => [options.command, ...options.args]);

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(readFile).mockResolvedValue('workspace' as never);
    vi.mocked(readMinimumReleaseAge).mockReturnValue(4320);
    vi.mocked(resolveVersion).mockResolvedValue('1.2.3');
    vi.mocked(versionSpec).mockReturnValue('^1.2.3');
    vi.mocked(listProfiles).mockResolvedValue([]);
    vi.mocked(resolveInstallPaths).mockResolvedValue(paths);
  });

  describe('handleInstallPiPnpmPackage', () => {
    it('shows the usage when there is no name', async () => {
      const { ctx, ui } = createCtx();

      await handleInstallPiPnpmPackage({ args: '  ', ctx });

      expect(ui.notify).toHaveBeenCalledWith(
        'Usage: /install-pi-pnpm-package <name>',
        'error',
      );
      expect(resolveVersion).not.toHaveBeenCalled();
    });

    it('installs a package globally when there are no profiles', async () => {
      const { ctx, ui } = createCtx();

      await handleInstallPiPnpmPackage({ args: ' foo ', ctx });

      expect(readFile).toHaveBeenCalledWith('/repo/pnpm-workspace.yaml', 'utf8');
      expect(readMinimumReleaseAge).toHaveBeenCalledWith('workspace', 'foo');
      expect(resolveVersion).toHaveBeenCalledWith('foo', 4320);
      expect(ui.select).not.toHaveBeenCalled();
      expect(resolveInstallPaths).toHaveBeenCalledWith(undefined);
      expect(addToWorkspaceCatalog).toHaveBeenCalledWith('foo', '^1.2.3');
      expect(addCatalogDependency).toHaveBeenCalledWith(
        paths.extensionPackagePath,
        'foo',
      );
      expect(addPackageEntry).toHaveBeenCalledWith(
        paths.settingsPath,
        './extensions/pnpm/node_modules/foo',
      );
      expect(runCalls()).toEqual([
        ['pnpm', 'install'],
        ['git', 'add', 'pnpm-lock.yaml', 'settings.json'],
        ['git', 'commit', '-m', 'feat(pi): install foo@1.2.3'],
      ]);
      expect(
        vi.mocked(run).mock.calls.every(([options]) => options.cwd === '/repo'),
      ).toBe(true);
      expect(ui.notify).toHaveBeenCalledWith('Installed foo@1.2.3', 'info');
      expect(ui.setStatus).toHaveBeenLastCalledWith('install-pi-pnpm-package', undefined);
    });

    it('waits for the agent to be idle and reports its progress', async () => {
      const { ctx, ui } = createCtx();

      await handleInstallPiPnpmPackage({ args: 'foo', ctx });

      expect(ctx.waitForIdle).toHaveBeenCalled();
      expect(ui.setStatus).toHaveBeenCalledWith(
        'install-pi-pnpm-package',
        'Resolving foo...',
      );
      expect(ui.setStatus).toHaveBeenCalledWith(
        'install-pi-pnpm-package',
        'Installing foo@1.2.3...',
      );
    });

    it('asks for the location when there are profiles, and installs globally', async () => {
      vi.mocked(listProfiles).mockResolvedValue(['regal']);
      const { ctx, ui } = createCtx('Global');

      await handleInstallPiPnpmPackage({ args: 'foo', ctx });

      expect(ui.select).toHaveBeenCalledWith('Install location', ['Global', 'regal']);
      expect(resolveInstallPaths).toHaveBeenCalledWith(undefined);
    });

    it('installs into the profile that was selected', async () => {
      vi.mocked(listProfiles).mockResolvedValue(['regal']);
      vi.mocked(resolveInstallPaths).mockResolvedValue(profilePathsStub);
      const { ctx } = createCtx('regal');

      await handleInstallPiPnpmPackage({ args: 'foo', ctx });

      expect(resolveInstallPaths).toHaveBeenCalledWith('regal');
      expect(addPackageEntry).toHaveBeenCalledWith(
        '/repo/regal/packages.json',
        './extensions/pnpm/node_modules/foo',
      );
    });

    it('stops when the location picker is cancelled', async () => {
      vi.mocked(listProfiles).mockResolvedValue(['regal']);
      const { ctx, ui } = createCtx(undefined);

      await handleInstallPiPnpmPackage({ args: 'foo', ctx });

      expect(ui.notify).toHaveBeenCalledWith('install-pi-pnpm-package cancelled', 'info');
      expect(addToWorkspaceCatalog).not.toHaveBeenCalled();
      expect(ui.setStatus).toHaveBeenLastCalledWith('install-pi-pnpm-package', undefined);
    });

    it('reports the message of an error and clears the status', async () => {
      vi.mocked(resolveVersion).mockRejectedValue(new Error('registry down'));
      const { ctx, ui } = createCtx();

      await handleInstallPiPnpmPackage({ args: 'foo', ctx });

      expect(ui.notify).toHaveBeenCalledWith(
        'install-pi-pnpm-package failed: registry down',
        'error',
      );
      expect(ui.setStatus).toHaveBeenLastCalledWith('install-pi-pnpm-package', undefined);
    });

    it('reports an error that is not an Error', async () => {
      vi.mocked(resolveVersion).mockRejectedValue('nope');
      const { ctx, ui } = createCtx();

      await handleInstallPiPnpmPackage({ args: 'foo', ctx });

      expect(ui.notify).toHaveBeenCalledWith(
        'install-pi-pnpm-package failed: nope',
        'error',
      );
    });
  });

  describe('handleUninstallPiPnpmPackage', () => {
    it('shows the usage when there is no name', async () => {
      const { ctx, ui } = createCtx();

      await handleUninstallPiPnpmPackage({ args: '', ctx });

      expect(ui.notify).toHaveBeenCalledWith(
        'Usage: /uninstall-pi-pnpm-package <name>',
        'error',
      );
      expect(findPackageLocations).not.toHaveBeenCalled();
    });

    it('warns when the package is not installed', async () => {
      vi.mocked(findPackageLocations).mockResolvedValue([]);
      const { ctx, ui } = createCtx();

      await handleUninstallPiPnpmPackage({ args: 'foo', ctx });

      expect(ui.notify).toHaveBeenCalledWith(
        'uninstall-pi-pnpm-package: foo is not installed',
        'warning',
      );
      expect(removeFromWorkspaceCatalog).not.toHaveBeenCalled();
      expect(ui.setStatus).toHaveBeenLastCalledWith(
        'uninstall-pi-pnpm-package',
        undefined,
      );
    });

    it('uninstalls from the only location without asking', async () => {
      vi.mocked(findPackageLocations).mockResolvedValue([{ label: 'Global', paths }]);
      vi.mocked(removeFromWorkspaceCatalog).mockResolvedValue('1.2.3');
      const { ctx, ui } = createCtx();

      await handleUninstallPiPnpmPackage({ args: 'foo', ctx });

      expect(ctx.waitForIdle).toHaveBeenCalled();
      expect(ui.setStatus).toHaveBeenCalledWith(
        'uninstall-pi-pnpm-package',
        'Uninstalling foo...',
      );
      expect(ui.select).not.toHaveBeenCalled();
      expect(removeCatalogDependency).toHaveBeenCalledWith(
        paths.extensionPackagePath,
        'foo',
      );
      expect(removePackageEntry).toHaveBeenCalledWith(
        paths.settingsPath,
        './extensions/pnpm/node_modules/foo',
      );
      expect(runCalls()).toEqual([
        ['pnpm', 'install'],
        ['git', 'add', 'pnpm-lock.yaml', 'settings.json'],
        ['git', 'commit', '-m', 'fix(pi): uninstall foo@1.2.3'],
      ]);
      expect(ui.notify).toHaveBeenCalledWith('Uninstalled foo', 'info');
    });

    it('omits the version from the commit when the catalog had none', async () => {
      vi.mocked(findPackageLocations).mockResolvedValue([{ label: 'Global', paths }]);
      vi.mocked(removeFromWorkspaceCatalog).mockResolvedValue(undefined);
      const { ctx } = createCtx();

      await handleUninstallPiPnpmPackage({ args: 'foo', ctx });

      expect(runCalls().at(-1)).toEqual([
        'git',
        'commit',
        '-m',
        'fix(pi): uninstall foo',
      ]);
    });

    it('asks where to uninstall from when there are several locations', async () => {
      vi.mocked(findPackageLocations).mockResolvedValue([
        { label: 'Global', paths },
        { label: 'regal', paths: profilePathsStub },
      ]);
      const { ctx, ui } = createCtx('regal');

      await handleUninstallPiPnpmPackage({ args: 'foo', ctx });

      expect(ui.select).toHaveBeenCalledWith('Uninstall from', ['Global', 'regal']);
      expect(removePackageEntry).toHaveBeenCalledWith(
        '/repo/regal/packages.json',
        './extensions/pnpm/node_modules/foo',
      );
    });

    it('stops when the location picker is cancelled', async () => {
      vi.mocked(findPackageLocations).mockResolvedValue([
        { label: 'Global', paths },
        { label: 'regal', paths: profilePathsStub },
      ]);
      const { ctx, ui } = createCtx(undefined);

      await handleUninstallPiPnpmPackage({ args: 'foo', ctx });

      expect(ui.notify).toHaveBeenCalledWith(
        'uninstall-pi-pnpm-package cancelled',
        'info',
      );
      expect(removeFromWorkspaceCatalog).not.toHaveBeenCalled();
    });

    it('reports the message of an error and clears the status', async () => {
      vi.mocked(findPackageLocations).mockResolvedValue([{ label: 'Global', paths }]);
      vi.mocked(run).mockRejectedValue(new Error('pnpm failed'));
      const { ctx, ui } = createCtx();

      await handleUninstallPiPnpmPackage({ args: 'foo', ctx });

      expect(ui.notify).toHaveBeenCalledWith(
        'uninstall-pi-pnpm-package failed: pnpm failed',
        'error',
      );
      expect(ui.setStatus).toHaveBeenLastCalledWith(
        'uninstall-pi-pnpm-package',
        undefined,
      );
    });

    it('reports an error that is not an Error', async () => {
      vi.mocked(findPackageLocations).mockRejectedValue('nope');
      const { ctx, ui } = createCtx();

      await handleUninstallPiPnpmPackage({ args: 'foo', ctx });

      expect(ui.notify).toHaveBeenCalledWith(
        'uninstall-pi-pnpm-package failed: nope',
        'error',
      );
    });
  });
});
