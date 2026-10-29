import { CONFIG_DIR_NAME } from '@earendil-works/pi-coding-agent';
import { execFile } from 'node:child_process';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';
import { parse } from 'yaml';

/** Root directory for the pi configuration repo. */
export const REPO_ROOT = join(homedir(), CONFIG_DIR_NAME);
/** Workspace manifest containing the pnpm catalog. */
export const WORKSPACE_PATH = join(REPO_ROOT, 'pnpm-workspace.yaml');
/**
 * The reason for these folder vars is that the installer needs the real path to the pnpm
 * extensions' package.json (for adding and removing dependencies), but the settings
 * package paths are relative to the agent folder.
 */
const AGENT_FOLDER = 'agent';
const PROFILES_FOLDER = 'profiles';
const EXTENSIONS_FOLDER = 'extensions';
const PNPM_FOLDER = 'pnpm';
/** Directory containing profile subdirectories. */
const PROFILES_DIR = join(REPO_ROOT, AGENT_FOLDER, PROFILES_FOLDER);
/** Workspace-relative directory for pnpm-installed pi extensions (global). */
const PNPM_EXTENSION_DIR = join(AGENT_FOLDER, EXTENSIONS_FOLDER, PNPM_FOLDER);
/** Pi user settings file where package paths are registered (global). */
const SETTINGS_PATH = join(REPO_ROOT, AGENT_FOLDER, 'settings.json');
/**
 * Settings package path prefix for pnpm-installed extensions (global). This is written
 * like this, instead of using join, to ensure it has the correct form for the settings
 * file regardless of OS. The settings file expects POSIX-style paths even on Windows, and
 * using join would produce backslashes on Windows which would not work as intended.
 */
const PNPM_EXTENSION_PACKAGE_PREFIX = `./${EXTENSIONS_FOLDER}/${PNPM_FOLDER}/node_modules/`;
/** JSON indentation used when rewriting config files. */
const JSON_INDENT = 2;
/**
 * Maximum bytes captured from child process output.
 *
 * Install and git commands can emit enough output to exceed Node's small default buffer,
 * so this gives failures room to include useful diagnostics. Keeping it bounded avoids
 * excessive memory use if a command loops or prints unexpectedly large output.
 */
const COMMAND_MAX_BUFFER = 20_971_520;

/** Label used in the install location picker to represent the global (non-profile) target. */
export const GLOBAL_LOCATION = 'Global';

/** The paths an install or uninstall works on. */
export type InstallPaths = {
  /** Absolute path to the pnpm package manifest for extensions. */
  extensionPackagePath: string;
  /** Path prefix written into the package registry for pnpm-installed extensions. */
  pnpmExtensionPackagePrefix: string;
  /**
   * Absolute path to the file where package paths are registered (settings or profile
   * packages).
   */
  settingsPath: string;
  /** Files to stage and commit after an install or uninstall. */
  installCommitFiles: string[];
};

/** A place (global or a profile) where a package is registered. */
export type PackageLocation = { label: string; paths: InstallPaths };

/** Options for {@link run}. */
export type RunOptions = {
  /** The command to execute. */
  command: string;
  /** The arguments for the command. */
  args: string[];
  /** The directory where the command runs. */
  cwd: string;
};

/** The paths of the global (non-profile) install target. */
const GLOBAL_PATHS: InstallPaths = {
  extensionPackagePath: join(REPO_ROOT, PNPM_EXTENSION_DIR, 'package.json'),
  pnpmExtensionPackagePrefix: PNPM_EXTENSION_PACKAGE_PREFIX,
  settingsPath: SETTINGS_PATH,
  installCommitFiles: [
    'pnpm-workspace.yaml',
    'pnpm-lock.yaml',
    'agent/settings.json',
    join(PNPM_EXTENSION_DIR, 'package.json'),
  ],
};

/** Promisified child process executor. */
const execFileAsync = promisify(execFile);

type WorkspaceConfig = {
  minimumReleaseAge?: unknown;
  minimumReleaseAgeExclude?: unknown;
};

/** The shape of a pi package registry file (settings.json or packages.json). */
type PackageRegistry = { packages?: string[] };

/** The shape of a `package.json` that has dependencies. */
type DependenciesManifest = { dependencies?: Record<string, string> };

/** Parse pnpm workspace YAML. */
const parseWorkspace = (workspace: string): WorkspaceConfig =>
  (parse(workspace) ?? {}) as WorkspaceConfig;

/** Read pnpm's minimum release age setting from workspace YAML. */
const readMinimumReleaseAgeValue = (workspace: WorkspaceConfig): number =>
  typeof workspace.minimumReleaseAge === 'number' ? workspace.minimumReleaseAge : 0;

/** Read pnpm's minimum release age exclusions from workspace YAML. */
const readMinimumReleaseAgeExclude = (workspace: WorkspaceConfig): string[] =>
  Array.isArray(workspace.minimumReleaseAgeExclude)
    ? workspace.minimumReleaseAgeExclude.filter(
        (value): value is string => typeof value === 'string',
      )
    : [];

/** Check whether a package matches pnpm's minimum release age exclusions. */
const isMinimumReleaseAgeExcluded = (name: string, exclusions: string[]): boolean => {
  if (exclusions.includes(name)) return true;

  if (name.startsWith('@')) {
    const scope = name.match(/^(@[^/]+\/)/)?.[1];
    return (
      exclusions.some((exclusion) => exclusion.startsWith(`${name}@`)) ||
      (scope ? exclusions.includes(scope) : false)
    );
  }

  return exclusions.some((exclusion) => exclusion.startsWith(`${name}@`));
};

/**
 * Read the effective minimum release age for a package from workspace YAML.
 *
 * @param workspace The contents of `pnpm-workspace.yaml`.
 * @param name The name of the package.
 * @returns The minimum release age in minutes, `0` if the package is excluded.
 */
export const readMinimumReleaseAge = (workspace: string, name: string): number => {
  const config = parseWorkspace(workspace);
  return isMinimumReleaseAgeExcluded(name, readMinimumReleaseAgeExclude(config))
    ? 0
    : readMinimumReleaseAgeValue(config);
};

/** Check whether a version is a stable x.y.z semver. */
const isStableSemver = (version: string): boolean => /^\d+\.\d+\.\d+$/.test(version);

/** Compare two stable semver strings. */
const compareSemver = (a: string, b: string): number => {
  const right = b.split('.').map(Number);
  return a
    .split('.')
    .map(Number)
    .reduce((diff, part, index) => diff || part - right[index]!, 0);
};

/**
 * Build the catalog version spec based on major version stability.
 *
 * @param version A stable `x.y.z` version.
 * @returns `^x.y.z` from major `1`, the exact version before that.
 */
export const versionSpec = (version: string): string => {
  const major = Number(version.split('.')[0]);
  return major >= 1 ? `^${version}` : version;
};

/** Escape text for literal use inside a regular expression. */
const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Resolve the newest registry version allowed by minimumReleaseAge.
 *
 * @param name The name of the package.
 * @param minimumReleaseAgeMinutes The minimum age a version must have, in minutes.
 * @returns The selected version.
 * @throws {Error} When the registry fails or no stable version is old enough.
 */
export const resolveVersion = async (
  name: string,
  minimumReleaseAgeMinutes: number,
): Promise<string> => {
  const encoded = name.startsWith('@')
    ? `@${encodeURIComponent(name.slice(1))}`
    : encodeURIComponent(name);
  const response = await fetch(`https://registry.npmjs.org/${encoded}`);
  if (!response.ok)
    throw new Error(`npm registry returned ${response.status} for ${name}`);

  const data = (await response.json()) as {
    versions?: Record<string, unknown>;
    time?: Record<string, string>;
    'dist-tags'?: Record<string, string>;
  };

  const versions = Object.keys(data.versions ?? {}).filter(isStableSemver);
  if (versions.length === 0) throw new Error(`No stable versions found for ${name}`);

  const cutoff = Date.now() - minimumReleaseAgeMinutes * 60 * 1000;
  const eligible = versions.filter((version) => {
    const publishedAt = data.time?.[version];
    return publishedAt ? Date.parse(publishedAt) <= cutoff : false;
  });

  const latest = data['dist-tags']?.['latest'];
  if (latest && eligible.includes(latest)) return latest;

  const selected = eligible.sort(compareSemver).at(-1);
  if (!selected)
    throw new Error(
      `No version of ${name} satisfies minimumReleaseAge ${minimumReleaseAgeMinutes}`,
    );
  return selected;
};

/**
 * Add or update a package entry in the workspace Extensions catalog.
 *
 * @param name The name of the package.
 * @param spec The version spec to write.
 * @throws {Error} When the workspace has no `# Extensions` section.
 */
export const addToWorkspaceCatalog = async (
  name: string,
  spec: string,
): Promise<void> => {
  let workspace = await readFile(WORKSPACE_PATH, 'utf8');
  const line = `  "${name}": "${spec}"`;
  const escaped = escapeRegExp(name);

  if (new RegExp(`^  ["']?${escaped}["']?:`, 'm').test(workspace)) {
    workspace = workspace.replace(new RegExp(`^  ["']?${escaped}["']?:.*$`, 'm'), line);
  } else {
    const marker = '  # Extensions\n';
    const index = workspace.indexOf(marker);
    if (index === -1) throw new Error('Could not find # Extensions catalog section');
    const insertAt = workspace.indexOf('\n\n', index);
    workspace = `${workspace.slice(0, insertAt)}\n${line}${workspace.slice(insertAt)}`;
  }

  await writeFile(WORKSPACE_PATH, workspace);
};

/**
 * Remove a package entry from the workspace catalog and return its version.
 *
 * @param name The name of the package.
 * @returns The version the entry had, or `undefined` if there was no entry.
 */
export const removeFromWorkspaceCatalog = async (
  name: string,
): Promise<string | undefined> => {
  let workspace = await readFile(WORKSPACE_PATH, 'utf8');
  const escaped = escapeRegExp(name);
  const entryPattern = new RegExp(
    `^  ["']?${escaped}["']?:\\s*["']([^"']+)["']\\n?`,
    'm',
  );
  const match = workspace.match(entryPattern);
  if (!match) return undefined;

  workspace = workspace.replace(entryPattern, '');
  await writeFile(WORKSPACE_PATH, workspace);
  return match[1]?.replace(/^\^/, '');
};

/** Write a JSON file with project-standard formatting. */
const writeJson = async (filePath: string, value: unknown): Promise<void> => {
  await writeFile(filePath, `${JSON.stringify(value, null, JSON_INDENT)}\n`);
};

/**
 * Add a catalog dependency to the pnpm extensions package manifest. The dependencies are
 * left sorted by name.
 *
 * @param packageJsonPath The path to the manifest.
 * @param name The name of the package.
 */
export const addCatalogDependency = async (
  packageJsonPath: string,
  name: string,
): Promise<void> => {
  const pkg = JSON.parse(await readFile(packageJsonPath, 'utf8')) as DependenciesManifest;
  pkg.dependencies = { ...(pkg.dependencies ?? {}), [name]: 'catalog:' };
  pkg.dependencies = Object.fromEntries(
    Object.entries(pkg.dependencies).sort(([a], [b]) => a.localeCompare(b)),
  );
  await writeJson(packageJsonPath, pkg);
};

/**
 * Remove a dependency from the pnpm extensions package manifest.
 *
 * @param packageJsonPath The path to the manifest.
 * @param name The name of the package.
 */
export const removeCatalogDependency = async (
  packageJsonPath: string,
  name: string,
): Promise<void> => {
  const pkg = JSON.parse(await readFile(packageJsonPath, 'utf8')) as DependenciesManifest;
  if (pkg.dependencies) delete pkg.dependencies[name];
  await writeJson(packageJsonPath, pkg);
};

/** Normalize a package path for settings comparisons. */
const normalizePath = (packagePath: string): string => packagePath.replace(/^\.\//, '');

/**
 * Add an installed package path to a pi package registry file (settings.json or
 * packages.json). The entries are left sorted and without duplicates.
 *
 * @param filePath The path to the registry file.
 * @param packagePath The package path to register.
 */
export const addPackageEntry = async (
  filePath: string,
  packagePath: string,
): Promise<void> => {
  const settings = JSON.parse(await readFile(filePath, 'utf8')) as PackageRegistry;
  settings.packages = Array.from(
    new Set([...(settings.packages ?? []), packagePath]),
  ).sort();
  await writeJson(filePath, settings);
};

/**
 * Remove an installed package path from a pi package registry file (settings.json or
 * packages.json). The paths are compared without a leading `./`.
 *
 * @param filePath The path to the registry file.
 * @param packagePath The package path to remove.
 */
export const removePackageEntry = async (
  filePath: string,
  packagePath: string,
): Promise<void> => {
  const settings = JSON.parse(await readFile(filePath, 'utf8')) as PackageRegistry;
  const normalizedPackagePath = normalizePath(packagePath);
  settings.packages = (settings.packages ?? []).filter(
    (item) => normalizePath(item) !== normalizedPackagePath,
  );
  await writeJson(filePath, settings);
};

/**
 * Returns paths scoped to a profile's pnpm extension directory. Used when installing or
 * uninstalling a package into a specific profile.
 *
 * @param name The name of the profile.
 * @returns The paths of the profile.
 */
export const profilePaths = (name: string): InstallPaths => {
  const profileDir = join(AGENT_FOLDER, PROFILES_FOLDER, name);
  const profilePnpmDir = join(profileDir, EXTENSIONS_FOLDER, PNPM_FOLDER);
  return {
    extensionPackagePath: join(REPO_ROOT, profilePnpmDir, 'package.json'),
    pnpmExtensionPackagePrefix: `./${PROFILES_FOLDER}/${name}/${EXTENSIONS_FOLDER}/${PNPM_FOLDER}/node_modules/`,
    settingsPath: join(REPO_ROOT, profileDir, 'packages.json'),
    installCommitFiles: [
      'pnpm-workspace.yaml',
      'pnpm-lock.yaml',
      join(profileDir, 'packages.json'),
      join(profilePnpmDir, 'package.json'),
    ],
  };
};

/**
 * Creates the pnpm package.json stub for a profile's extension dir if it doesn't exist
 * yet.
 */
const ensureProfilePnpmPackageJson = async (name: string): Promise<void> => {
  const paths = profilePaths(name);
  try {
    await stat(paths.extensionPackagePath);
  } catch {
    // Not finding the file is the expected case: it means the stub has to be created.
    await mkdir(dirname(paths.extensionPackagePath), { recursive: true });
    await writeJson(paths.extensionPackagePath, {
      name: `pi-profile-${name}-extensions`,
      private: true,
      dependencies: {},
    });
  }
};

/**
 * Returns the names of the existing profile subdirectories.
 *
 * @returns The names, or an empty list if the profiles directory can't be read.
 */
export const listProfiles = async (): Promise<string[]> => {
  try {
    const entries = await readdir(PROFILES_DIR, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch {
    // A repo without profiles has no directory to read, which means "no profiles".
    return [];
  }
};

/**
 * Resolves the install paths for a given profile name, or global paths when omitted. When
 * a profile name is provided, ensures its pnpm package.json stub exists.
 *
 * @param profileName The name of the profile.
 * @returns The paths to work on.
 */
export const resolveInstallPaths = async (
  profileName?: string,
): Promise<InstallPaths> => {
  if (typeof profileName === 'undefined') return GLOBAL_PATHS;

  await ensureProfilePnpmPackageJson(profileName);
  return profilePaths(profileName);
};

/** Options for {@link isPackageRegistered}. */
type IsPackageRegisteredOptions = {
  /** The path to the registry file. */
  filePath: string;
  /** The prefix the package path has in the file. */
  prefix: string;
  /** The name of the package. */
  name: string;
};

/**
 * Checks whether a package is registered in a pi package registry file at the given
 * prefix.
 */
const isPackageRegistered = async ({
  filePath,
  prefix,
  name,
}: IsPackageRegisteredOptions): Promise<boolean> => {
  try {
    const raw = JSON.parse(await readFile(filePath, 'utf8')) as PackageRegistry;
    const normalized = normalizePath(`${prefix}${name}`);
    return (raw.packages ?? []).some((pkg) => normalizePath(pkg) === normalized);
  } catch {
    // A registry that is missing or invalid doesn't have the package registered.
    return false;
  }
};

/**
 * Finds all the locations (global and profiles) where a package is registered.
 *
 * @param name The name of the package.
 * @returns The locations, each with its label and paths.
 */
export const findPackageLocations = async (name: string): Promise<PackageLocation[]> => {
  const locations: PackageLocation[] = [];

  if (
    await isPackageRegistered({
      filePath: GLOBAL_PATHS.settingsPath,
      prefix: GLOBAL_PATHS.pnpmExtensionPackagePrefix,
      name,
    })
  ) {
    locations.push({ label: GLOBAL_LOCATION, paths: GLOBAL_PATHS });
  }

  const profiles = await listProfiles();
  for (const profile of profiles) {
    const paths = profilePaths(profile);
    if (
      await isPackageRegistered({
        filePath: paths.settingsPath,
        prefix: paths.pnpmExtensionPackagePrefix,
        name,
      })
    ) {
      locations.push({ label: profile, paths });
    }
  }

  return locations;
};

/**
 * Run a command and surface captured output on failure.
 *
 * @param options The command, its arguments, and where to run it.
 * @throws {Error} With the message and the captured output when the command fails.
 */
export const run = async ({ command, args, cwd }: RunOptions): Promise<void> => {
  try {
    await execFileAsync(command, args, { cwd, maxBuffer: COMMAND_MAX_BUFFER });
  } catch (error) {
    const maybe = error as { stderr?: string; stdout?: string; message?: string };
    throw new Error(
      [maybe.message, maybe.stderr, maybe.stdout].filter(Boolean).join('\n'),
    );
  }
};
