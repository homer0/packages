import type { ExtensionCommandContext } from '@earendil-works/pi-coding-agent';
import { readFile } from 'node:fs/promises';
import {
  GLOBAL_LOCATION,
  REPO_ROOT,
  WORKSPACE_PATH,
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
} from './utils.js';

/** The name of the install command. */
const INSTALL_CMD = 'install-pi-pnpm-package';

/** The name of the uninstall command. */
const UNINSTALL_CMD = 'uninstall-pi-pnpm-package';

/** Options for the command handlers. */
export type HandlerOptions = {
  /** The raw string after the slash command. */
  args: string;
  /** The context of the command. */
  ctx: ExtensionCommandContext;
};

/**
 * Handle the command to install a pi pnpm package.
 *
 * @param options The args and context of the command.
 */
export const handleInstallPiPnpmPackage = async ({
  args,
  ctx,
}: HandlerOptions): Promise<void> => {
  const name = args.trim();
  if (!name) {
    ctx.ui.notify(`Usage: /${INSTALL_CMD} <name>`, 'error');
    return;
  }

  await ctx.waitForIdle();
  ctx.ui.setStatus(INSTALL_CMD, `Resolving ${name}...`);

  try {
    const workspace = await readFile(WORKSPACE_PATH, 'utf8');
    const minimumReleaseAgeMinutes = readMinimumReleaseAge(workspace, name);
    const version = await resolveVersion(name, minimumReleaseAgeMinutes);
    const spec = versionSpec(version);

    const profiles = await listProfiles();
    let profileName: string | undefined;
    if (profiles.length > 0) {
      const location = await ctx.ui.select('Install location', [
        GLOBAL_LOCATION,
        ...profiles,
      ]);
      if (typeof location === 'undefined') {
        ctx.ui.notify(`${INSTALL_CMD} cancelled`, 'info');
        return;
      }
      if (location !== GLOBAL_LOCATION) profileName = location;
    }

    const paths = await resolveInstallPaths(profileName);
    ctx.ui.setStatus(INSTALL_CMD, `Installing ${name}@${version}...`);
    await addToWorkspaceCatalog(name, spec);
    await addCatalogDependency(paths.extensionPackagePath, name);
    await addPackageEntry(
      paths.settingsPath,
      `${paths.pnpmExtensionPackagePrefix}${name}`,
    );
    await run({ command: 'pnpm', args: ['install'], cwd: REPO_ROOT });
    await run({
      command: 'git',
      args: ['add', ...paths.installCommitFiles],
      cwd: REPO_ROOT,
    });
    await run({
      command: 'git',
      args: ['commit', '-m', `feat(pi): install ${name}@${version}`],
      cwd: REPO_ROOT,
    });

    ctx.ui.notify(`Installed ${name}@${version}`, 'info');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ctx.ui.notify(`${INSTALL_CMD} failed: ${message}`, 'error');
  } finally {
    ctx.ui.setStatus(INSTALL_CMD, undefined);
  }
};

/**
 * Handle the command to uninstall a pi pnpm package.
 *
 * @param options The args and context of the command.
 */
export const handleUninstallPiPnpmPackage = async ({
  args,
  ctx,
}: HandlerOptions): Promise<void> => {
  const name = args.trim();
  if (!name) {
    ctx.ui.notify(`Usage: /${UNINSTALL_CMD} <name>`, 'error');
    return;
  }

  await ctx.waitForIdle();
  ctx.ui.setStatus(UNINSTALL_CMD, `Uninstalling ${name}...`);

  try {
    const locations = await findPackageLocations(name);

    if (locations.length === 0) {
      ctx.ui.notify(`${UNINSTALL_CMD}: ${name} is not installed`, 'warning');
      return;
    }

    let selectedPaths = locations[0]!.paths;
    if (locations.length > 1) {
      const choice = await ctx.ui.select(
        'Uninstall from',
        locations.map((l) => l.label),
      );
      if (typeof choice === 'undefined') {
        ctx.ui.notify(`${UNINSTALL_CMD} cancelled`, 'info');
        return;
      }
      selectedPaths = locations.find((l) => l.label === choice)!.paths;
    }

    const version = await removeFromWorkspaceCatalog(name);
    await removeCatalogDependency(selectedPaths.extensionPackagePath, name);
    await removePackageEntry(
      selectedPaths.settingsPath,
      `${selectedPaths.pnpmExtensionPackagePrefix}${name}`,
    );
    await run({ command: 'pnpm', args: ['install'], cwd: REPO_ROOT });
    await run({
      command: 'git',
      args: ['add', ...selectedPaths.installCommitFiles],
      cwd: REPO_ROOT,
    });
    await run({
      command: 'git',
      args: ['commit', '-m', `fix(pi): uninstall ${name}${version ? `@${version}` : ''}`],
      cwd: REPO_ROOT,
    });

    ctx.ui.notify(`Uninstalled ${name}`, 'info');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ctx.ui.notify(`${UNINSTALL_CMD} failed: ${message}`, 'error');
  } finally {
    ctx.ui.setStatus(UNINSTALL_CMD, undefined);
  }
};
