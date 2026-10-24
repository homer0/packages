/* eslint-disable max-classes-per-file -- The secrets errors live together. */
import originalMs from 'ms';

/** The units a time string can have, like `'5m'` or `'2h'`. */
export type TimeStringUnit = originalMs.StringValue;

/** A time as a number of milliseconds, or as a string with units. */
export type TimeStringUnitLike = TimeStringUnit | number;

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

export {
  expandPlaceholders,
  getCachedValue,
  ms,
  SecretNotFoundError,
  SecretsConfigError,
  setCachedValue,
};
