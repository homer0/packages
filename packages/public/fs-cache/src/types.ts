/**
 * The base options for the service.
 */
export type FsCacheOptions = {
  /**
   * The path, relative to the project root directory, where the files will be stored.
   */
  path: string;
  /**
   * The default TTL for the entries. It can be overridden when creating an entry.
   *
   * @default 300000  // five minutes.
   */
  defaultTTL: number;
  /**
   * The max TTL an entry can have.
   *
   * @default 604800000  // one week.
   */
  maxTTL: number;
  /**
   * When `true`, besides saving the entries into files, they'll also be kept in memory
   * until expiration.
   *
   * @default true
   */
  keepInMemory: boolean;
  /**
   * The extension for the files that will be created.
   *
   * @default 'tmp'
   */
  extension: string;
};
/**
 * The base options to create a cache entry.
 *
 * @template T  The type of the value that will be stored. This is a generic because,
 *              by default, the service works with string, but there are custom
 *              entries, like for JSON, that use a different type.
 */
export type FsCacheEntryOptions<T = string> = {
  /**
   * The unique key for the entry. It will be used for the filename.
   */
  key: string;
  /**
   * The function to generate the information that will be stored. This will be called
   * only if the entry is not found in the cache, or if it's expired.
   */
  init: () => Promise<T>;
  /**
   * The TTL for the entry. If not specified, the service default TTL will be used.
   */
  ttl?: number;
  /**
   * When `true`, the whole cache logic will be skipped, and the `init` function will be
   * returned.
   * The idea of this option is for cases where you have to decide whether or not to use
   * the cache: you won't have to define the `init` function outside the call, and then
   * use an `if` to decide whether to call it or send it as a parameter.
   *
   * @default false
   */
  skip?: boolean;
  /**
   * When `true`, the entry will be kept in memory until it expires. If not specified, the
   * service default will be used.
   */
  keepInMemory?: boolean;
};
/**
 * The options to create a custom cache entry. By custom, it means that it has a
 * serializer and a deserializer to transform the data before and after caching.
 *
 * @template T  The type of the value that will be stored.
 */
export type FsCacheCustomEntryOptions<T = unknown> = FsCacheEntryOptions<T> & {
  /**
   * The function to serialize the value before caching.
   */
  serialize: (value: T) => string;
  /**
   * The fucntion to deserialize the value after reading it from the cache.
   */
  deserialize: (value: string) => T;
};
/**
 * The format the entries stored in memory have.
 */
export type FsCacheMemoryEntry = {
  /**
   * The time when the entry was created.
   */
  time: number;
  /**
   * The actual data that was cached.
   */
  value: string;
};
