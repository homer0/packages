import type { z, ZodType } from 'zod';
import type { InMemoryCacheConfig } from './schemas.js';
import type { TimeStringUnitLike } from './utils.js';

/** Options for `getCached`, the primary public API of the client. */
export type GetCachedOptions<TSchema extends ZodType> = {
  /** Cache key — must be unique across all consumers sharing the daemon. */
  key: string;
  /** Zod schema used to validate values on both cache hit and cache miss. */
  schema: TSchema;
  /**
   * Time-to-live — milliseconds or a human-readable string (e.g. `'5m'`, `'2h'`). Use `0`
   * for no expiry (process lifetime).
   */
  ttl: TimeStringUnitLike;
  /** Called on a cache miss to produce the value to cache and return. */
  fetchFn: () => Promise<z.infer<TSchema>>;
};

/** Options for `getEntry`. */
export type GetEntryOptions<TSchema extends ZodType> = {
  /** Cache key — must be unique across all consumers sharing the daemon. */
  key: string;
  /** Zod schema used to validate the stored value. */
  schema: TSchema;
};

/** Options for `setEntry`. */
export type SetEntryOptions = {
  /** Cache key — must be unique across all consumers sharing the daemon. */
  key: string;
  /** Value to store, replacing any existing entry under `key`. */
  value: unknown;
  /** Time-to-live, same units as `GetCachedOptions.ttl`. Use `0` for no expiry. */
  ttl: TimeStringUnitLike;
};

/** Options for `removeEntry`. */
export type RemoveEntryOptions = {
  /** Cache key to remove. */
  key: string;
};

/** A single cached entry with its value and optional expiry timestamp. */
export type CacheEntry = { value: unknown; expiresAt: number | null };

declare module '@homer0/pi-config' {
  interface ExtensionsConfig {
    inMemoryCache?: InMemoryCacheConfig;
  }
}
