/* eslint-disable max-classes-per-file -- The secrets errors live together. */
import { getAgentDir } from '@earendil-works/pi-coding-agent';
import originalMs from 'ms';
import { execSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';

/** The units a time string can have, like `'5m'` or `'2h'`. */
export type TimeStringUnit = originalMs.StringValue;

/** A time as a number of milliseconds, or as a string with units. */
export type TimeStringUnitLike = TimeStringUnit | number;

/** Options for {@link readAuthKey}. */
type ReadAuthKeyOptions = {
  /** The name of the entry of `auth.json`, which is the id of the provider. */
  name: string;
  /** Describes what's being resolved, for the error messages. */
  context: string;
};

/** Options for {@link resolveAuthKeyValue}. */
type ResolveAuthKeyValueOptions = {
  /** The `key` of the entry, as it is in `auth.json`. */
  key: string;
  /** The `env` of the entry, which has priority over the process environment. */
  env?: Record<string, string>;
};

/** The result of resolving the key of an auth entry. */
type AuthKeyResolution = {
  /** The resolved key, or `undefined` if a command failed or a variable is not set. */
  value?: string;
  /** The names of the environment variables that are not set. */
  missing: string[];
};

/** Options for {@link setCachedValue}. */
type SetCachedValueOptions<TValue> = {
  /** The key to store the value under. */
  key: string;
  /** The value to store. */
  value: TValue;
  /** How long the value lives, in milliseconds. */
  ttl: number;
};

/**
 * The longest delay `setTimeout` supports, in milliseconds (about 24.8 days). With a
 * longer one, Node fires the timer after 1 millisecond.
 */
export const MAX_TIMEOUT = 2_147_483_647;

/** Error thrown when a required secret cannot be resolved from any provider. */
class SecretNotFoundError extends Error {
  /** The name of the secret that was not found. */
  readonly secretName: string;

  /** @param secretName The name of the secret that was not found. */
  constructor(secretName: string) {
    super(`Secret not found: ${secretName}`);
    this.secretName = secretName;
    this.name = 'SecretNotFoundError';
  }
}

/** Error thrown when secrets configuration is structurally valid but inconsistent. */
class SecretsConfigError extends Error {
  /** @param message The description of what is wrong with the config. */
  constructor(message: string) {
    super(message);
    this.name = 'SecretsConfigError';
  }
}

/** The number of milliseconds in a second. */
export const MS_PER_SECOND = 1_000;

/** How long a command of an auth `key` can run, in milliseconds. */
const AUTH_COMMAND_TIMEOUT = 10_000;

/** The name of the file that has the credentials, in the agent directory. */
const AUTH_FILE_NAME = 'auth.json';

/**
 * What can be replaced in an `auth.json` key: `$NAME`, `${NAME}`, or one of the escapes
 * `$$` and `$!`. It captures nothing on purpose; each match is parsed from its own text.
 */
const AUTH_KEY_TEMPLATE_REGEX = /\$[$!]|\$\{[^}]*\}|\$[A-Za-z_][A-Za-z0-9_]*/g;

/** What a braced variable of an auth key starts with. */
const BRACED_VARIABLE_START = '${';

/** The names a `${NAME}` in an auth key can have to be an environment variable. */
const ENV_VAR_NAME_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** The part of an `auth.json` entry that is needed to get its key. */
const authEntrySchema = z.looseObject({
  key: z.string().min(1),
  env: z.record(z.string(), z.string()).optional(),
});

/** The output of the commands that were run, by command, for the life of the process. */
const authCommandOutputs = new Map<string, string>();

/** The values cached in this process, by key. */
const cache = new Map<string, unknown>();

/** The timers that remove the cached values, by key. */
const cacheTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Converts a time to milliseconds.
 *
 * @param value A number of milliseconds, or a string with units, like `'5m'`.
 * @returns The number of milliseconds.
 */
const ms = (value: TimeStringUnitLike): number => {
  if (typeof value === 'number') return value;
  return originalMs(value);
};

/**
 * Replaces `<word>` placeholders in `base` with values from `values`. Multi-word
 * angle-bracket sequences (e.g. LLM-facing hints) are left untouched, and a placeholder
 * that has no value is replaced with its own name.
 *
 * @param base The text with the placeholders.
 * @param values The values, by placeholder name.
 * @returns The text, with the placeholders replaced.
 */
const expandPlaceholders = (base: string, values: Record<string, string>): string =>
  base.replace(/<(\w+)>/g, (_, key: string) => values[key] ?? key);

/**
 * Removes a value from the in-process cache, and cancels its timer.
 *
 * @param key The key of the value.
 */
const deleteCachedValue = (key: string): void => {
  cache.delete(key);
  const timeout = cacheTimeouts.get(key);
  if (!timeout) return;
  clearTimeout(timeout);
  cacheTimeouts.delete(key);
};

/**
 * Returns a value from the in-process cache.
 *
 * @template TValue The type of the value.
 * @param key The key of the value.
 * @returns The value, or `undefined` if it's not there.
 */
const getCachedValue = <TValue>(key: string): TValue | undefined => {
  if (!cache.has(key)) return undefined;
  return cache.get(key) as TValue;
};

/**
 * Stores a value in the in-process cache, replacing the one that was there, and removes
 * it after `ttl`. A `ttl` over the limit of `setTimeout` is capped to it.
 *
 * @template TValue The type of the value.
 * @param options The key, the value, and how long it lives.
 */
const setCachedValue = <TValue>({
  key,
  value,
  ttl,
}: SetCachedValueOptions<TValue>): void => {
  deleteCachedValue(key);
  cache.set(key, value);
  const timeout = setTimeout(() => deleteCachedValue(key), Math.min(ttl, MAX_TIMEOUT));
  timeout.unref?.();
  cacheTimeouts.set(key, timeout);
};

/**
 * Runs the command of an auth `key`, which is the text after the `!`. Its trimmed output
 * is the key. The output is kept for the life of the process, so the command doesn't run
 * again, but a command that fails is not remembered.
 *
 * @param command The command, without the `!`.
 * @returns The key, or `undefined` if the command failed, timed out, or printed nothing.
 */
const runAuthCommand = (command: string): string | undefined => {
  const cached = authCommandOutputs.get(command);
  if (typeof cached !== 'undefined') return cached;

  let output: string;
  try {
    output = execSync(command, {
      encoding: 'utf-8',
      timeout: AUTH_COMMAND_TIMEOUT,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }

  if (!output) return undefined;
  authCommandOutputs.set(command, output);
  return output;
};

/**
 * Looks up an environment variable for an `auth.json` key. The `env` of the entry has
 * priority over the process environment, and an empty value counts as not set.
 *
 * @param name The name of the variable.
 * @param env The `env` of the entry of `auth.json`, if it has one.
 * @returns The value, or an empty string if the variable is not set.
 */
const lookupAuthEnvVar = (name: string, env?: Record<string, string>): string =>
  // eslint-disable-next-line n/no-process-env -- The key of an auth entry can reference environment variables, like Pi allows.
  env?.[name] || process.env[name] || '';

/**
 * Resolves the `key` of an `auth.json` entry the way Pi does. A key that starts with `!`
 * is a shell command, and its output is the key. Any other key is a template: `$NAME` and
 * `${NAME}` are replaced with the environment variable (the `env` of the entry has
 * priority over the process environment, and an empty value counts as not set), `$$` is a
 * literal `$`, and `$!` is a literal `!`.
 *
 * @param options The key, and the `env` of its entry.
 * @returns The resolved key, or the names of the environment variables that are not set,
 *   or `undefined` if a command failed.
 */
const resolveAuthKeyValue = ({
  key,
  env,
}: ResolveAuthKeyValueOptions): AuthKeyResolution => {
  if (key.startsWith('!')) return { value: runAuthCommand(key.slice(1)), missing: [] };

  const missing: string[] = [];
  const value = key.replace(AUTH_KEY_TEMPLATE_REGEX, (match) => {
    if (match === '$$' || match === '$!') return match.slice(1);

    const name = match.startsWith(BRACED_VARIABLE_START)
      ? match.slice(BRACED_VARIABLE_START.length, -1)
      : match.slice(1);
    if (!ENV_VAR_NAME_REGEX.test(name)) return match;

    const variable = lookupAuthEnvVar(name, env);
    if (!variable && !missing.includes(name)) missing.push(name);
    return variable;
  });

  return { value: missing.length ? undefined : value, missing };
};

/**
 * Reads the `key` of an entry of `<agent-dir>/auth.json`, and resolves it the way Pi does
 * (see {@link resolveAuthKeyValue}).
 *
 * @param options The name of the entry, and what is being resolved.
 * @returns The key.
 * @throws {Error} When the file can't be read or is not valid JSON, when the entry
 *   doesn't exist or has no `key` (like an OAuth credential), or when the key can't be
 *   resolved.
 */
const readAuthKey = async ({ name, context }: ReadAuthKeyOptions): Promise<string> => {
  const path = join(getAgentDir(), AUTH_FILE_NAME);
  const prefix = `${context} references auth entry "${name}"`;

  let content: string;
  try {
    content = await readFile(path, 'utf-8');
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`${prefix}, but ${path} can't be read: ${reason}`);
  }

  let credentials: unknown;
  try {
    credentials = JSON.parse(content);
  } catch {
    throw new Error(`${prefix}, but ${path} is not valid JSON.`);
  }

  const entry = authEntrySchema.safeParse(
    typeof credentials === 'object' &&
      credentials !== null &&
      Object.hasOwn(credentials, name)
      ? Reflect.get(credentials, name)
      : undefined,
  );
  if (!entry.success) {
    throw new Error(`${prefix}, which is not in ${path} or has no "key".`);
  }

  const { value, missing } = resolveAuthKeyValue(entry.data);
  if (typeof value !== 'undefined') return value;

  if (missing.length) {
    throw new Error(
      `${prefix}, whose key needs the environment variable(s) that are not set: ${missing.join(', ')}.`,
    );
  }

  throw new Error(`${prefix}, whose key is a command that failed or printed nothing.`);
};

export {
  expandPlaceholders,
  getCachedValue,
  ms,
  readAuthKey,
  SecretNotFoundError,
  SecretsConfigError,
  setCachedValue,
};
