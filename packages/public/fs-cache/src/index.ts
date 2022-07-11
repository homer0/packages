import * as fs from 'fs/promises';
import { deferred, type DeferredPromise } from '@homer0/deferred';
import { pathUtils, type PathUtils } from '@homer0/path-utils';
import { providerCreator, injectHelper } from '@homer0/jimple';
import type {
  FsCacheOptions,
  FsCacheEntryOptions,
  FsCacheCustomEntryOptions,
  FsCacheMemoryEntry,
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

/* eslint-disable no-magic-numbers */
const FIVE_MINUTES = 5 * 60 * 1000;
const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
/* eslint-enable no-magic-numbers */

/**
 * The inject helper to resolve the dependencies.
 */
const deps = injectHelper<FsCacheInjectOptions>();

export class FsCache {
  protected options: FsCacheOptions;
  protected deletionTasks: Record<string, NodeJS.Timeout> = {};
  protected promises: Record<string, DeferredPromise<string>> = {};
  protected memory: Record<string, FsCacheMemoryEntry> = {};
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

    if (this.options.defaultTTL <= 0) {
      throw new Error('The TTL cannot be less than or equal to zero.');
    }

    if (this.options.defaultTTL > this.options.maxTTL) {
      throw new Error('The default TTL cannot be greater than the max TTL.');
    }
  }

  getOptions(): FsCacheOptions {
    return { ...this.options };
  }

  async useEntry(options: FsCacheEntryOptions<string>): Promise<string> {
    const {
      key,
      init,
      ttl = this.options.defaultTTL,
      keepInMemory = this.options.keepInMemory,
      skip = false,
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
        def.reject(error);
        delete this.promises[key];
        throw error;
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

      const filename = `${key}.${this.options.extension}`;
      const filepath = this.pathUtils.join(this.options.path, filename);
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
      this.deletionTasks[key] = setTimeout(async () => {
        await fs.unlink(filepath);
        delete this.deletionTasks[key];
        delete this.memory[key];
      }, ttl);

      def.resolve(value);
      delete this.promises[key];
      return value;
    } catch (error) {
      def.reject(error);
      delete this.promises[key];
      throw error;
    }
  }

  async useCustomEntry<T = unknown>({
    serialize,
    deserialize,
    ...options
  }: FsCacheCustomEntryOptions<T>): Promise<T> {
    const value = await this.useEntry({
      ...options,
      init: async () => {
        const result = await options.init();
        return serialize(result);
      },
    });

    return deserialize(value);
  }

  async useJSONEntry<T = unknown>(options: FsCacheEntryOptions<T>): Promise<T> {
    return this.useCustomEntry({
      ...options,
      serialize: JSON.stringify,
      deserialize: JSON.parse,
    });
  }

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

  protected async ensureCacheDir(): Promise<void> {
    const exists = await this.pathExists(this.pathUtils.join(this.options.path));
    if (!exists) {
      await fs.mkdir(this.options.path);
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
