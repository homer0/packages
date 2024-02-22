import * as path from 'path';
import * as fs from 'fs/promises';
import { deferred, type DeferredPromise } from '@homer0/deferred';
import { pathUtils, type PathUtils } from '@homer0/path-utils';
import { providerCreator, injectHelper } from '@homer0/jimple';
import type {
  FsCacheOptions,
  FsCacheEntryOptions,
  FsCacheCustomEntryOptions,
  FsCacheMemoryEntry,
  FsCacheCleanFsOptions,
  FsCacheCleanMemoryOptions,
  FsCacheShouldRemoveFileInfo,
  FsCacheCleanOptions,
} from './types';
/**
 * The dictionary of dependencies that need to be injected in {@link FsCache}.
 */
export type FsCacheInjectOptions = {
  /**
   * The service that generates paths relative to the project root.
   */
  pathUtils: PathUtils;
};
/**
 * The options to construct the {@link FsCache} service.
 */
export type FsCacheConstructorOptions = Partial<FsCacheOptions> & {
  inject?: Partial<FsCacheInjectOptions>;
};

type FsCacheCleanFsData = {
  filename: string;
  filepath: string;
  expired: boolean;
  exists: boolean;
  mtime: number;
};

/* eslint-disable no-magic-numbers */
const FIVE_MINUTES = 5 * 60 * 1000;
const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
/* eslint-enable no-magic-numbers */

/**
 * The inject helper to resolve the dependencies.
 */
const deps = injectHelper<FsCacheInjectOptions>();
/**
 * A small and friendly service to cache data on the file system.
 */
export class FsCache {
  /**
   * The service customization options.
   */
  protected options: FsCacheOptions;
  /**
   * A dictionary with timeout functions for the entries that need to be expired.
   */
  protected deletionTasks: Record<string, NodeJS.Timeout> = {};
  /**
   * A dictionary of deferred promises for the entries, in case the same entry is
   * requested multiple times.
   */
  protected promises: Record<string, DeferredPromise<string>> = {};
  /**
   * The "in memory cache" the service uses.
   */
  protected memory: Record<string, FsCacheMemoryEntry> = {};
  /**
   * The service that generates paths relative to the project root.
   */
  protected pathUtils: PathUtils;
  constructor({ inject = {}, ...options }: FsCacheConstructorOptions = {}) {
    this.pathUtils = deps.get(inject, 'pathUtils', () => pathUtils());
    this.options = {
      path: '.cache',
      defaultTTL: FIVE_MINUTES,
      maxTTL: ONE_WEEK,
      keepInMemory: true,
      extension: 'tmp',
      ...options,
    };

    this.validateOptions();
  }
  /**
   * Gets the service options.
   */
  getOptions(): FsCacheOptions {
    return { ...this.options };
  }
  /**
   * Generates a cache entry: given the unique `key` and the `init` function, the service
   * will try to recover a cached value in order to return, but if it doesn't exist or is
   * expired, it will call the `init` function and cache it result.
   *
   * @param options  The options to generate the entry.
   * @returns The value, cached or not.
   * @throws If the TTL is less than or equal to zero.
   * @throws If the TTL is greater than the service max TTL.
   * @example
   *
   * <caption>Basic</caption>
   *
   *   const cachedResponse = await cache.use({
   *     key: 'my-key',
   *     init: async () => {
   *       const res = await fetch('https://example.com');
   *       const data = await res.json();
   *       return JSON.stringify(data);
   *     },
   *   });
   *
   * @example
   *
   * <caption>Custom TTL</caption>
   *
   *   const cachedResponse = await cache.use({
   *     key: 'my-key',
   *     ttl: 60 * 60 * 24, // 1 day
   *     init: async () => {
   *       const res = await fetch('https://example.com');
   *       const data = await res.json();
   *       return JSON.stringify(data);
   *     },
   *   });
   *
   */
  async use(options: FsCacheEntryOptions<string>): Promise<string> {
    const {
      key,
      init,
      ttl = this.options.defaultTTL,
      keepInMemory = this.options.keepInMemory,
      extension = this.options.extension,
      skip = false,
      scheduleRemoval = true,
    } = options;

    if (ttl <= 0) {
      throw new Error('The TTL cannot be less than or equal to zero.');
    }

    if (ttl > this.options.maxTTL) {
      throw new Error('The TTL cannot be greater than the service max TTL.');
    }

    if (this.promises[key]) {
      const def = this.promises[key]!;
      return def.promise;
    }

    const def = deferred<string>();
    this.promises[key] = def;

    if (skip) {
      try {
        const result = await init();
        def.resolve(result);
        delete this.promises[key];
        return result;
      } catch (error) {
        setTimeout(() => {
          def.reject(error);
          delete this.promises[key];
        }, 0);

        return def.promise;
      }
    }

    if (keepInMemory && this.memory[key]) {
      const memoryEntry = this.memory[key]!;
      if (Date.now() - memoryEntry.time < ttl) {
        const result = memoryEntry.value;
        def.resolve(result);
        delete this.promises[key];
        return result;
      }

      delete this.memory[key];
    }

    try {
      await this.ensureCacheDir();
      if (this.deletionTasks[key]) {
        clearTimeout(this.deletionTasks[key]);
        delete this.deletionTasks[key];
      }

      const [filepath] = this.getFilepathInfo(key, extension);
      const exists = await this.pathExists(filepath);
      if (exists) {
        const stats = await fs.stat(filepath);
        if (Date.now() - stats.mtimeMs < ttl) {
          const result = await fs.readFile(filepath, 'utf8');
          def.resolve(result);
          delete this.promises[key];
          return result;
        }
      }

      const value = await init();
      await fs.writeFile(filepath, String(value));
      if (keepInMemory) {
        this.memory[key] = {
          time: Date.now(),
          value,
        };
      }

      if (scheduleRemoval) {
        this.deletionTasks[key] = setTimeout(async () => {
          await fs.unlink(filepath);
          delete this.deletionTasks[key];
          delete this.memory[key];
        }, ttl);
      }

      def.resolve(value);
      delete this.promises[key];
      return value;
    } catch (error) {
      setTimeout(() => {
        def.reject(error);
        delete this.promises[key];
      }, 0);
      return def.promise;
    }
  }
  /**
   * This is a wrapper on top of {@link FsCache.use} that allows for custom
   * serialization/deserialization so the value can be something different than a string.
   * Yes, this is used behind {@link FsCache.useJSON}.
   *
   * @param options  The options to generate the entry.
   * @template T  The type of the value.
   */
  async useCustom<T = unknown>({
    serialize,
    deserialize,
    ...options
  }: FsCacheCustomEntryOptions<T>): Promise<T> {
    const value = await this.use({
      ...options,
      init: async () => {
        const result = await options.init();
        return serialize(result);
      },
    });

    return deserialize(value);
  }
  /**
   * Generates a JSON entry: The value will be stored as a JSON string, and parsed when
   * read.
   *
   * @param options  The options to generate the entry.
   * @template T  The type of the value.
   */
  async useJSON<T = unknown>(options: FsCacheEntryOptions<T>): Promise<T> {
    return this.useCustom({
      ...options,
      serialize: JSON.stringify,
      deserialize: JSON.parse,
    });
  }
  /**
   * Removes an entry from the service memory.
   *
   * @param key      The key of the entry.
   * @param options  Custom options in case the file for the removed entry should be
   *                 removed too.
   */
  async removeFromMemory(
    key: string,
    options: FsCacheCleanMemoryOptions = {},
  ): Promise<void> {
    const { includeFs = true, ...fsOptions } = options;
    if (this.deletionTasks[key]) {
      clearTimeout(this.deletionTasks[key]);
      delete this.deletionTasks[key];
    }

    delete this.memory[key];
    if (includeFs) {
      await this.removeFromFs(key, {
        ...fsOptions,
        includeMemory: false,
      });
    }
  }
  /**
   * Removes an entry from the fs.
   *
   * @param key      The key of the entry.
   * @param options  Custom options to validate the file before removing it.
   */
  async removeFromFs(key: string, options: FsCacheCleanFsOptions = {}): Promise<void> {
    const { extension = this.options.extension, ttl = this.options.defaultTTL } = options;
    const [filepath, filename] = this.getFilepathInfo(key, extension);
    const exists = await this.pathExists(filepath);
    const data: FsCacheCleanFsData = {
      filename,
      filepath,
      exists,
      expired: true,
      mtime: 0,
    };
    if (data.exists) {
      const stats = await fs.stat(filepath);
      data.expired = Date.now() - stats.mtimeMs > ttl;
      data.mtime = stats.mtimeMs;
    }

    return this.removeEntryFromFs(key, options, data);
  }
  /**
   * Removes an entry from the service memory, and the fs.
   *
   * @param key      The key of the entry.
   * @param options  Custom options to validate the file before removing it.
   */
  remove(key: string, options: FsCacheCleanOptions = {}): Promise<void> {
    return this.removeFromFs(key, {
      ...options,
      includeMemory: true,
    });
  }
  /**
   * Removes all entries from the service memory.
   *
   * @param options  Custom options in case the files for the removed entries should be
   *                 removed too.
   */
  async cleanMemory(options: FsCacheCleanMemoryOptions = {}): Promise<void> {
    await Promise.all(
      Object.keys(this.memory).map(async (key) => this.removeFromMemory(key, options)),
    );
  }
  /**
   * Removes all entries from the fs.
   *
   * @param options  Custom options to validate the files before removing them.
   */
  async cleanFs(options: FsCacheCleanFsOptions = {}): Promise<void> {
    const { extension = this.options.extension } = options;
    const dirPath = this.pathUtils.join(this.options.path);
    const dirContents = await fs.readdir(dirPath);
    const files = this.filterFiles(dirContents, extension);
    await Promise.all(
      files.map(async (file) => {
        const key = this.getKeyFromFilepath(file, extension);
        return this.removeFromFs(key, options);
      }),
    );
  }
  /**
   * Removes all entries from the service memory, and the fs.
   *
   * @param options  Custom options to validate the files before removing them.
   */
  clean(options: Omit<FsCacheCleanFsOptions, 'includeMemory'> = {}): Promise<void> {
    return this.cleanFs({
      ...options,
      includeMemory: true,
    });
  }
  /**
   * Removes all expired entries from the service memory.
   *
   * @param options  Custom options in case the files for the removed entries should be
   *                 removed too.
   */
  async purgeMemory(options: FsCacheCleanMemoryOptions = {}): Promise<void> {
    const { ttl = this.options.defaultTTL } = options;
    const now = Date.now();
    const expiredKeys = Object.keys(this.memory).filter((key) => {
      const entry = this.memory[key]!;
      return now - entry.time > ttl;
    });

    if (!expiredKeys.length) return;
    await Promise.all(expiredKeys.map((key) => this.removeFromMemory(key, options)));
  }
  /**
   * Removes all expired entries from the fs.
   *
   * @param options  Custom options to validate the files before removing them.
   */
  async purgeFs(options: FsCacheCleanFsOptions = {}): Promise<void> {
    const { extension = this.options.extension, ttl = this.options.defaultTTL } = options;
    const dirPath = this.pathUtils.join(this.options.path);
    const dirContents = await fs.readdir(dirPath);
    const files = this.filterFiles(dirContents, extension);
    const info = await Promise.all(
      files.map(async (file) => {
        const filepath = path.join(dirPath, file);
        const stats = await fs.stat(filepath);
        const expired = Date.now() - stats.mtimeMs > ttl;
        return {
          filename: file,
          filepath,
          expired,
          mtime: stats.mtimeMs,
        };
      }),
    );

    const expiredFiles = info.filter(({ expired }) => expired);
    if (!expiredFiles.length) return;
    await Promise.all(
      expiredFiles.map(async (fileInfo) => {
        const key = this.getKeyFromFilepath(fileInfo.filename, extension);
        return this.removeEntryFromFs(key, options, {
          ...fileInfo,
          exists: true,
        });
      }),
    );
  }
  /**
   * Removes all expired entries from the fs and the service memory.
   *
   * @param options  Custom options to validate the files before removing them.
   */
  async purge(options: Omit<FsCacheCleanFsOptions, 'includeMemory'> = {}): Promise<void> {
    return this.purgeFs({
      ...options,
      includeMemory: true,
    });
  }
  /**
   * Validates the options sent to the constructor.
   *
   * @throws If the default TTL is less than or equal to zero.
   * @throws If the default TTL is greater than the max TTL.
   */
  protected validateOptions() {
    if (this.options.defaultTTL <= 0) {
      throw new Error('The TTL cannot be less than or equal to zero.');
    }

    if (this.options.defaultTTL > this.options.maxTTL) {
      throw new Error('The default TTL cannot be greater than the max TTL.');
    }
  }
  /**
   * Small utility to validate if a path exists in the file system.
   *
   * @param filepath  The filepath to validate.
   */
  protected async pathExists(filepath: string): Promise<boolean> {
    let exists = false;
    try {
      await fs.access(filepath);
      exists = true;
    } catch (error) {
      if (
        !(error instanceof Error) ||
        (error as NodeJS.ErrnoException).code !== 'ENOENT'
      ) {
        throw error;
      }
    }

    return exists;
  }
  /**
   * Ensures that the cache directory exists: if it doesn't, it will create it.
   */
  protected async ensureCacheDir(): Promise<void> {
    const exists = await this.pathExists(this.pathUtils.join(this.options.path));
    if (!exists) {
      await fs.mkdir(this.options.path);
    }
  }
  /**
   * Generates the file (name and path) information for an entry key.
   *
   * @param key        The key of the entry.
   * @param extension  The extension to add.
   * @returns The filename for the entry, and its absolute path.
   */
  protected getFilepathInfo(
    key: string,
    extension: string,
  ): [filepath: string, filename: string] {
    const filename = `${key}.${extension}`;
    const filepath = this.pathUtils.join(this.options.path, filename);
    return [filepath, filename];
  }
  /**
   * Extracts an entry key from a filepath.
   *
   * @param filepath   The filepath to an entry.
   * @param extension  The extension to remove.
   */
  protected getKeyFromFilepath(filepath: string, extension: string): string {
    const filename = path.basename(filepath);
    return filename.slice(0, -(extension.length + 1));
  }
  /**
   * Filters a list of files by validating it against the extension set in the
   * constructor.
   *
   * @param files      The files to filter.
   * @param extension  The extension the files should have.
   */
  protected filterFiles(files: string[], extension: string): string[] {
    return files.filter((file) => file.endsWith(`.${extension}`));
  }
  /**
   * This is actually the method behind {@link FsCache.removeFromFs}. The logic is
   * separated in two methods because the the removal functionality could be called from
   * different places, and we don't want to repeat calls to the file system (to check if
   * the file exists and get the stats).
   *
   * @param key      The key of the entry.
   * @param options  Custom options to validate the file before removing it.
   */
  protected async removeEntryFromFs(
    key: string,
    options: FsCacheCleanFsOptions,
    data: FsCacheCleanFsData,
  ): Promise<void> {
    const { includeMemory = true, shouldRemove = () => true } = options;
    const { exists, expired, filename, filepath, mtime } = data;
    if (exists) {
      const param: FsCacheShouldRemoveFileInfo = {
        key,
        filepath,
        filename,
        mtime,
        expired,
      };

      const shouldRemoveResult = shouldRemove(param);
      const should =
        typeof shouldRemoveResult === 'boolean'
          ? shouldRemoveResult
          : await shouldRemoveResult;
      if (should) {
        await fs.unlink(filepath);
      }
    }

    if (includeMemory) {
      await this.removeFromMemory(key, { includeFs: false });
    }
  }
}
/**
 * Shorthand for `new FsCache()`.
 *
 * @param args  The same parameters as the {@link FsCache} constructor.
 * @returns A new instance of {@link FsCache}.
 */
export const fsCache = (...args: ConstructorParameters<typeof FsCache>): FsCache =>
  new FsCache(...args);

/**
 * The options for the {@link FsCache} Jimple's provider creator.
 */
export type FsCacheProviderOptions = Omit<FsCacheConstructorOptions, 'inject'> & {
  /**
   * The name that will be used to register the service.
   *
   * @default 'fsCache'
   */
  serviceName?: string;
  /**
   * A dictionary with the name of the services to inject. If one or more are not
   * provided, the service will create new instances.
   */
  services?: {
    [key in keyof FsCacheInjectOptions]?: string;
  };
};
/**
 * A provider creator to register {@link FsCache} in a Jimple container.
 */
export const fsCacheProvider = providerCreator(
  ({ serviceName = 'fsCache', ...rest }: FsCacheProviderOptions = {}) =>
    (container) => {
      container.set(serviceName, () => {
        const { services = {}, ...options } = rest;
        const inject = deps.resolve(['pathUtils'], container, services);
        return new FsCache({ inject, ...options });
      });
    },
);
