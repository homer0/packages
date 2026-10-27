import {
  DefaultPackageManager,
  SettingsManager,
  getAgentDir,
  type ExtensionAPI,
  type ExtensionContext,
  type ExtensionHandler,
  type SessionStartEvent,
} from '@earendil-works/pi-coding-agent';
import { existsSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, isAbsolute, join } from 'node:path';
import { profilePackagesSchema, type PackageEntry } from './schemas.js';
import type {
  LoadProfileExtensionsOptions,
  PackageResourcePaths,
  ProfileLibOptions,
  ProfileResources,
  ResolveProfilePackageResourcesOptions,
} from './types.js';
import {
  ensureErrorMessage,
  getAgentPath,
  resolveEnabledProfiles,
  resolveScriptPath,
  runScript,
  warnProfilesIssue,
} from './utils.js';

const AGENT_DIR = getAgentDir();
const PROFILES_DIR = getAgentPath('profiles');
const PACKAGES_FILENAME = 'packages.json';
const AGENTS_FILENAME = 'AGENTS.md';
const SKILLS_DIRNAME = 'skills';
const PROMPTS_DIRNAME = 'prompts';

/** Factory function signature exported by a pi extension module. */
type ExtensionFactory = (pi: ExtensionAPI) => void | Promise<void>;

/**
 * Checks if a path is an existing directory.
 *
 * @param path The path to check.
 * @returns Whether it's a directory.
 */
const isDirectory = (path: string): boolean => {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
};

/**
 * Resolves a single package entry to a path, evaluating its `enabledIf` condition if it
 * has one.
 *
 * @param entry The entry from the profile's `packages.json`.
 * @param profileDir The directory of the profile, to resolve the script against.
 * @returns The path of the package, or `undefined` if it's turned off.
 */
const resolvePackageEntry = async (
  entry: PackageEntry,
  profileDir: string,
): Promise<string | undefined> => {
  if (typeof entry === 'string') return entry;
  const { path: pkgPath, enabledIf } = entry;
  if (enabledIf === false || enabledIf === 'false') return undefined;
  const resolved = resolveScriptPath(enabledIf, profileDir);
  if (typeof resolved === 'undefined') {
    warnProfilesIssue(
      `Could not resolve package enabledIf script for "${pkgPath}": ${enabledIf}`,
    );
    return undefined;
  }
  return (await runScript(resolved)) ? pkgPath : undefined;
};

/**
 * Reads the packages a profile declares, evaluating the `enabledIf` condition of each. If
 * the file is invalid, it reports it through `onError` and the profile has no packages.
 *
 * @param packagesPath The path of the profile's `packages.json`.
 * @param onError Where to report non-fatal issues.
 * @returns The paths of the packages, as declared.
 */
const readProfilePackages = async (
  packagesPath: string,
  onError: (message: string) => void,
): Promise<string[]> => {
  if (!existsSync(packagesPath)) return [];
  const profileDir = dirname(packagesPath);

  try {
    const parsed = JSON.parse(await readFile(packagesPath, 'utf8')) as unknown;
    const { packages } = profilePackagesSchema.parse(parsed);
    const results: string[] = [];
    for (const entry of packages) {
      const pkgPath = await resolvePackageEntry(entry, profileDir);
      if (typeof pkgPath !== 'undefined') results.push(pkgPath);
    }
    return results;
  } catch (error) {
    onError(
      `Invalid profile packages file ${packagesPath}; skipped. ${ensureErrorMessage(error)}`,
    );
    return [];
  }
};

/**
 * Discovers what every enabled profile exposes: its `skills` and `prompts` directories,
 * its `AGENTS.md` context file, and its declared packages. Whatever can't be read is
 * reported through `onError` and skipped.
 *
 * @param options The directory to resolve from, and where to report non-fatal issues.
 * @returns The names of the profiles and what they expose.
 */
export const discoverProfileResources = async (
  options: ProfileLibOptions = {},
): Promise<ProfileResources> => {
  const onError = options.onError ?? ((message: string) => warnProfilesIssue(message));
  const names = await resolveEnabledProfiles(options);
  const resources: ProfileResources = {
    names,
    skillPaths: [],
    promptPaths: [],
    agentsFiles: [],
    packages: [],
  };

  if (names.length === 0) return resources;

  for (const name of names) {
    const profileDir = join(PROFILES_DIR, name);
    const skillsPath = join(profileDir, SKILLS_DIRNAME);
    const promptsPath = join(profileDir, PROMPTS_DIRNAME);
    const agentsPath = join(profileDir, AGENTS_FILENAME);
    const packagesPath = join(profileDir, PACKAGES_FILENAME);

    if (isDirectory(skillsPath)) resources.skillPaths.push(skillsPath);
    if (isDirectory(promptsPath)) resources.promptPaths.push(promptsPath);

    if (existsSync(agentsPath)) {
      try {
        resources.agentsFiles.push({
          path: agentsPath,
          content: await readFile(agentsPath, 'utf8'),
        });
      } catch (error) {
        onError(
          `Could not read profile context ${agentsPath}; skipped. ${ensureErrorMessage(error)}`,
        );
      }
    }

    const profilePackages = await readProfilePackages(packagesPath, onError);
    resources.packages.push(
      ...profilePackages.map((pkg) => (isAbsolute(pkg) ? pkg : join(profileDir, pkg))),
    );
  }

  return resources;
};

/**
 * One queued `session_start` handler registration, captured by {@link wrapPiForReplay} so
 * it can be replayed after its factory returns.
 */
type QueuedSessionStartReplay = () => Promise<void>;

/** Options for {@link wrapPiForReplay}. */
type WrapPiForReplayOptions = {
  /** The Pi extension API to wrap. */
  pi: ExtensionAPI;
  /** The in-flight `session_start` event. */
  sessionStartEvent: SessionStartEvent;
  /** The context of the in-flight `session_start`. */
  ctx: ExtensionContext;
};

/** Return value of {@link wrapPiForReplay}: the wrapped `pi` plus its replay queue. */
type WrapPiForReplayResult = { pi: ExtensionAPI; queue: QueuedSessionStartReplay[] };

/**
 * Wraps `pi` for one dynamically-loaded factory call so any `pi.on('session_start', ...)`
 * it makes still registers normally, but is also queued for replay. Pi snapshots
 * registered handlers before dispatching an event, so a handler registered by a factory
 * invoked from inside an in-flight `session_start` handler would otherwise never run for
 * the event that triggered this load.
 *
 * @param options The API to wrap, and the event and context to replay.
 * @returns The wrapped `pi`, and the replay queue in registration order.
 */
const wrapPiForReplay = ({
  pi,
  sessionStartEvent,
  ctx,
}: WrapPiForReplayOptions): WrapPiForReplayResult => {
  const queue: QueuedSessionStartReplay[] = [];
  // `ExtensionAPI.on` is a large overload union; a single forwarding implementation can't
  // match every overload, so the event/handler pair is cast through `never` at the
  // forwarding call and the finished function is cast once to the real overloaded type.
  const on = ((eventType: string, handler: ExtensionHandler<SessionStartEvent>) => {
    const unsubscribe = pi.on(eventType as never, handler as never);
    if (eventType === 'session_start') {
      queue.push(async () => {
        await handler(sessionStartEvent, ctx);
      });
    }
    return unsubscribe;
  }) as ExtensionAPI['on'];

  return { pi: { ...pi, on }, queue };
};

/**
 * Imports and runs the extension factories of the profile packages. It's meant to be
 * called from a `session_start` handler: the `session_start` handlers each factory
 * registers are replayed right after, with the same event, because Pi's own dispatch for
 * it has already taken its snapshot of the handlers. A handler that fails is reported and
 * doesn't stop the others.
 *
 * @param pi The Pi extension API to give to the factories.
 * @param options The packages to load, and the event and context to replay.
 */
export const loadProfileExtensions = async (
  pi: ExtensionAPI,
  options: LoadProfileExtensionsOptions,
): Promise<void> => {
  const { packages, sessionStartEvent, ctx } = options;
  if (packages.length === 0) return;
  const cwd = options.cwd ?? process.cwd();
  const onError = options.onError ?? ((message: string) => warnProfilesIssue(message));

  try {
    // Resolve the pi.extensions entry points declared by each profile package.
    const settingsManager = SettingsManager.create(cwd, AGENT_DIR);
    const packageManager = new DefaultPackageManager({
      cwd,
      agentDir: AGENT_DIR,
      settingsManager,
    });
    const resolved = await packageManager.resolveExtensionSources(packages, {
      temporary: true,
    });

    // Import each extension file and call its factory with a replay-wrapped pi API, then
    // replay any session_start registrations it made, in registration order, with
    // per-handler error isolation matching pi's own emit() behavior.
    for (const ext of resolved.extensions) {
      // Guard against the directory-path fallback that resolveExtensionSources emits
      // when a package has no pi.extensions manifest and no index.ts/index.js.
      if (ext.enabled && (ext.path.endsWith('.ts') || ext.path.endsWith('.js'))) {
        try {
          const imported = await import(ext.path);
          const factory = imported?.default;
          if (typeof factory === 'function') {
            const { pi: replayPi, queue } = wrapPiForReplay({
              pi,
              sessionStartEvent,
              ctx,
            });
            await (factory as ExtensionFactory)(replayPi);
            for (const replay of queue) {
              try {
                await replay();
              } catch (error) {
                onError(
                  `Profile extension ${ext.path} session_start handler failed. ${ensureErrorMessage(error)}`,
                );
              }
            }
          }
        } catch (error) {
          onError(
            `Could not load profile extension ${ext.path}; skipped. ${ensureErrorMessage(error)}`,
          );
        }
      }
    }
  } catch (error) {
    onError(`Could not load profile extensions; skipped. ${ensureErrorMessage(error)}`);
  }
};

/**
 * Resolves the skills, prompt templates and themes the profile packages expose. If they
 * can't be resolved, it reports it through `onError` and there are none.
 *
 * @param options The packages to resolve, the directory to resolve from, and where to
 *   report non-fatal issues.
 * @returns The paths of the enabled resources, by kind.
 */
export const resolveProfilePackageResources = async (
  options: ResolveProfilePackageResourcesOptions,
): Promise<PackageResourcePaths> => {
  const { packages } = options;
  if (packages.length === 0) {
    return { skillPaths: [], promptPaths: [], themePaths: [] };
  }
  const cwd = options.cwd ?? process.cwd();
  const onError = options.onError ?? ((message: string) => warnProfilesIssue(message));

  try {
    const settingsManager = SettingsManager.create(cwd, AGENT_DIR);
    const packageManager = new DefaultPackageManager({
      cwd,
      agentDir: AGENT_DIR,
      settingsManager,
    });
    const resolved = await packageManager.resolveExtensionSources(packages, {
      temporary: true,
    });
    const enabledPaths = (resources: typeof resolved.skills): string[] =>
      resources.filter((resource) => resource.enabled).map((resource) => resource.path);

    return {
      skillPaths: enabledPaths(resolved.skills),
      promptPaths: enabledPaths(resolved.prompts),
      themePaths: enabledPaths(resolved.themes),
    };
  } catch (error) {
    onError(`Could not load profile packages; skipped. ${ensureErrorMessage(error)}`);
    return { skillPaths: [], promptPaths: [], themePaths: [] };
  }
};
