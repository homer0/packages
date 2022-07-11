export type FsCacheOptions = {
  path: string;
  defaultTTL: number;
  maxTTL: number;
  keepInMemory: boolean;
  extension: string;
};

export type FsCacheEntryOptions<T = string> = {
  key: string;
  init: () => Promise<T>;
  ttl?: number;
  skip?: boolean;
  keepInMemory?: boolean;
};

export type FsCacheCustomEntryOptions<T = unknown> = FsCacheEntryOptions<T> & {
  serialize: (value: T) => string;
  deserialize: (value: string) => T;
};

export type FsCacheMemoryEntry = {
  time: number;
  value: string;
};
