import {
  CONFIG_DIR_NAME,
  getAgentDir,
  type ExtensionAPI,
  type ExtensionContext,
} from '@earendil-works/pi-coding-agent';
import { getConfigValue } from '@homer0/pi-config';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { extname, isAbsolute, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { z } from 'zod';
import { profilesConfigSchema } from './schemas.js';
import type { ProfileLibOptions } from './types.js';

/**
 * Resolves a path relative to the Pi agent directory.
 *
 * @param segments The segments of the path, relative to the agent directory.
 * @returns The absolute path.
 */
export const getAgentPath = (...segments: string[]): string =>
  join(getAgentDir(), ...segments);

/**
 * Resolves the absolute path to the jiti binary. In a pnpm workspace, the binary is
 * always at `<workspace-root>/node_modules/.bin/jiti`, derived by splitting the resolved
 * jiti package path on `/node_modules/`. Falls back to `npx jiti` when the package cannot
 * be resolved.
 *
 * @returns The command that runs jiti.
 */
export const resolveJitiBin = (): string => {
  try {
    const requireFromHere = createRequire(import.meta.url);
    const pkgPath = requireFromHere.resolve('jiti/package.json');
    const workspaceRoot = pkgPath.split('/node_modules/')[0];
    if (workspaceRoot) return join(workspaceRoot, 'node_modules/.bin/jiti');
    // pnpm detected but workspace root could not be derived — use pnpm exec as a safe fallback
    if (pkgPath.includes('.pnpm')) return 'pnpm exec jiti';
  } catch {
    // fall through to npx fallback
  }
  return 'npx jiti';
};

/**
 * The resolved jiti binary for this workspace. Computed once at module load so callers
 * can use it directly in shell commands or spawn arguments.
 */
export const JITI_BIN = resolveJitiBin();

/**
 * Returns the error message string from any thrown value. Prettifies zod validation
 * errors instead of surfacing their raw JSON `.message`.
 *
 * @param error The thrown value.
 * @returns The message of the error, or the value as a string if it's not an error.
 */
export const ensureErrorMessage = (error: unknown): string => {
  if (error instanceof z.ZodError) {
    return error.issues.map((issue) => issue.message).join('; ');
  }
  return error instanceof Error ? error.message : String(error);
};

/** Options for {@link showAnnouncementWidget}. */
type AnnouncementWidgetOptions = {
  /** The Pi extension API, to listen for the user input. */
  pi: ExtensionAPI;
  /** The context of the session. */
  ctx: ExtensionContext;
  /** The key that identifies the widget. */
  key: string;
  /** The label of the announcement. */
  label: string;
  /** The value of the announcement. */
  value: string;
};

/**
 * Shows a labelled announcement widget above the editor and removes it on the first user
 * input. Intended for session-start status messages that should not persist or appear in
 * LLM context.
 *
 * @param options What to show, and where.
 */
export const showAnnouncementWidget = (options: AnnouncementWidgetOptions): void => {
  const { pi, ctx, key, label, value } = options;
  ctx.ui.setWidget(key, (_tui, theme) => ({
    render: () => [
      theme.fg('customMessageLabel', `${label}: `) + theme.fg('customMessageText', value),
    ],
    invalidate: () => {},
    dispose: () => {},
  }));

  pi.on('input', (_event, inputCtx) => {
    inputCtx.ui.setWidget(key, undefined);
  });
};

/**
 * Creates a function that outputs a message for one subsystem. When there is a UI, it
 * notifies through it; otherwise, it logs to stdout, with the subsystem as the prefix.
 *
 * @param subsystem The name that identifies the messages.
 * @returns The function that outputs the messages.
 */
export const createOutputMessage =
  (subsystem: string) =>
  (ctx: ExtensionContext, message: string): void => {
    if (ctx.hasUI) {
      ctx.ui.notify(message, 'info');
      return;
    }

    // eslint-disable-next-line no-console -- Non-interactive sessions still need visible extension output.
    console.info(`[${subsystem}] ${message}`);
  };

const CONFIG_PATH = 'pi.profiles';
const HOME_DIR = homedir();
const REPO_DIR = join(HOME_DIR, CONFIG_DIR_NAME);
const AGENT_DIR = getAgentDir();
const execFileAsync = promisify(execFile);

/**
 * Reports a non-fatal profile-resolution issue without an active UI session.
 *
 * @param message The description of the issue.
 * @param error The error behind the issue, if there is one.
 */
export const warnProfilesIssue = (message: string, error?: unknown): void => {
  if (typeof error === 'undefined') {
    // eslint-disable-next-line no-console -- Profile resolution issues should be visible without an active Pi session.
    console.warn(`[pi-profiles] ${message}`);
  } else {
    // eslint-disable-next-line no-console -- Profile resolution issues should be visible without an active Pi session.
    console.warn(`[pi-profiles] ${message}`, error);
  }
};

/**
 * Resolves a script path against the cwd, the agent directory, and the Pi directory, in
 * that order. An absolute path is only checked for existence.
 *
 * @param scriptPath The path of the script.
 * @param cwd The directory to resolve relative paths against first.
 * @returns The path of the script, or `undefined` if it doesn't exist anywhere.
 */
export const resolveScriptPath = (
  scriptPath: string,
  cwd: string,
): string | undefined => {
  if (isAbsolute(scriptPath)) return existsSync(scriptPath) ? scriptPath : undefined;
  for (const base of [cwd, AGENT_DIR, REPO_DIR]) {
    const candidate = resolve(base, scriptPath);
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
};

/**
 * Runs a script from the Pi directory: `.sh` with bash, `.ts` with jiti, and anything
 * else with node. If it fails, it warns and counts as `false`.
 *
 * @param scriptPath The absolute path of the script.
 * @returns Whether the script printed `true`.
 */
export const runScript = async (scriptPath: string): Promise<boolean> => {
  const ext = extname(scriptPath);
  let args: string[];
  if (ext === '.sh') {
    args = [scriptPath];
  } else if (ext === '.ts') {
    args = ['-c', `${JITI_BIN} "${scriptPath}"`];
  } else {
    args = ['-c', `node "${scriptPath}"`];
  }
  try {
    const { stdout } = await execFileAsync('bash', args, { cwd: REPO_DIR });
    return stdout.trim() === 'true';
  } catch (error) {
    warnProfilesIssue(`Script failed: ${scriptPath}`, error);
    return false;
  }
};

/**
 * Runs the `enabledIf` scripts and collects the profiles whose script printed `true`.
 * Entries set to `false`, and scripts that can't be found, are skipped.
 *
 * @param enabledIf The `enabledIf` entries, from profile name to script path.
 * @param cwd The directory to resolve relative script paths against first.
 * @returns The names of the profiles that passed.
 */
export const evaluateEnabledIf = async (
  enabledIf: Record<string, false | string>,
  cwd: string,
): Promise<string[]> => {
  const results: string[] = [];
  for (const [name, scriptPath] of Object.entries(enabledIf)) {
    if (scriptPath && scriptPath !== 'false') {
      const resolved = resolveScriptPath(scriptPath, cwd);
      if (typeof resolved === 'undefined') {
        warnProfilesIssue(
          `Could not resolve enabledIf script for "${name}": ${scriptPath}`,
        );
      } else {
        const passed = await runScript(resolved);
        if (passed) results.push(name);
      }
    }
  }
  return results;
};

/**
 * Resolves the names of the enabled profiles, from the `enabled` list and the `enabledIf`
 * scripts of the `pi.profiles` config. If the config is invalid, it reports it through
 * `onError` and no profile is enabled.
 *
 * This is the single source of truth for which profiles are active: the extension and any
 * other extension that needs to know them call this same function.
 *
 * @param options The directory to resolve from, and where to report non-fatal issues.
 * @returns The names of the enabled profiles, without duplicates.
 */
export const resolveEnabledProfiles = async (
  options: ProfileLibOptions = {},
): Promise<string[]> => {
  const cwd = options.cwd ?? process.cwd();
  const onError = options.onError ?? ((message: string) => warnProfilesIssue(message));

  try {
    const config = await getConfigValue(CONFIG_PATH, {
      cwd,
      schema: profilesConfigSchema,
    });
    if (!config) return [];
    const { enabled, enabledIf } = config;
    const conditional = await evaluateEnabledIf(enabledIf, cwd);
    return Array.from(new Set([...enabled, ...conditional]));
  } catch (error) {
    onError(
      `Invalid ${CONFIG_PATH} config; profiles skipped. ${ensureErrorMessage(error)}`,
    );
    return [];
  }
};
