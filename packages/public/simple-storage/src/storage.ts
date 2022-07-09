import { deepAssignWithOverwrite, deepAssignWithShallowMerge } from '@homer0/deep-assign';
import type {
  Dict,
  SimpleStorageEntry,
  StorageType,
  StorageName,
  Storage,
  SimpleStoragePartialOptions,
  SimpleStorageOptions,
} from './types';
/**
 * A service that allows you to build functionality that relays on browser storage
 * (session/local) and simplifies the way you work it. You can specify the storage type
 * you want to use, the format in which you want to handle the data, and even expiration
 * time for it.
 *
 * @template T  The type of the value stored in the storage.
 * @template E  The type of the entries stored in the storage.
 */
export class SimpleStorage<T extends Dict, E = unknown> {
  /**
   * The service customization options.
   */
  protected options: SimpleStorageOptions<T>;
  /**
   * A dictionary with the different storages the service supports.
   */
  protected storages: Record<StorageType, Storage<T>>;
  /**
   * Once the service is initialized, this property will hold a reference to the storage
   * being used.
   */
  protected storage?: Storage<T>;
  /**
   * This is the object/dictionary the service will use to sync the content of the
   * storage. That way you won't need to write/read/parse from the storage every time you
   * need to do something.
   */
  protected data: T = {} as T;
  constructor(options: SimpleStoragePartialOptions<T> = {}) {
    this.options = this.mergeOptions(
      {
        window,
        initialize: true,
        storage: {
          name: 'simpleStorage',
          key: 'simpleStorage',
          priority: ['local', 'session', 'memory'],
        },
        entries: {
          enabled: false,
          expiration: 3600,
          deleteExpired: true,
          saveWhenDeletingExpired: true,
        },
        memoryStorage: {},
        getInitialData: () => ({} as T),
      },
      options,
    );

    this.storages = {
      local: {
        name: 'localStorage',
        isAvailable: this.isLocalStorageAvailable.bind(this),
        get: this.getFromLocalStorage.bind(this),
        set: this.setOnLocalStorage.bind(this),
        remove: this.removeFromLocalStorage.bind(this),
      },
      session: {
        name: 'sessionStorage',
        isAvailable: this.isSessionStorageAvailable.bind(this),
        get: this.getFromSessionStorage.bind(this),
        set: this.setOnSessionStorage.bind(this),
        remove: this.removeFromSessionStorage.bind(this),
      },
      memory: {
        name: 'memoryStorage',
        isAvailable: this.isMemoryStorageAvailable.bind(this),
        get: this.getFromMemoryStorage.bind(this),
        set: this.setOnMemoryStorage.bind(this),
        remove: this.removeFromMemoryStorage.bind(this),
      },
    };

    if (this.options.initialize) {
      this.initialize();
    }
  }
  /**
   * This method _"initializes"_ the service by validating custom options, loading the
   * reference for the required storage and synchronizing the data with the storage.
   */
  initialize(): void {
    this.validateOptions();
    this.storage = this.initializeStorage();
    this.data = this.initializeStorageData();
  }
  /**
   * Saves the data from the service into the storage.
   *
   * @throws If the storage is not available.
   */
  save(): void {
    if (!this.storage) {
      throw new Error('Storage is not initialized');
    }

    this.storage.set(this.options.storage.key, this.data);
  }
  /**
   * Gets the service options.
   */
  getOptions(): SimpleStorageOptions<T> {
    return deepAssignWithShallowMerge<SimpleStorageOptions<T>>({}, this.options);
  }
  /**
   * Gets the data the service saves on the storage.
   *
   * @throws If the storage is not available.
   */
  getData(): T {
    return this.data;
  }
  /**
   * Overwrites the data reference the service has and, if `save` is used, it also saves
   * it into the storage.
   *
   * @param data  The new data, or a {@link Promise} that resolves into the new data.
   * @param save  Whether or not the service should save the data into the storage.
   * @returns If `data` is an object, it will return the same object; but if `data` is
   *          a {@link Promise}, it will return the _"promise chain"_.
   */
  setData(data: T, save?: boolean): T;
  setData(data: Promise<T>, save?: boolean): Promise<T>;
  setData(data: T | Promise<T>, save: boolean = true): T | Promise<T> {
    return this.isPromise(data)
      ? data.then((realData) => this.setResolvedData(realData, save))
      : this.setResolvedData(data, save);
  }
  /**
   * Resets the data on the class; If entries are enabled, the data will become an empty
   * object; otherwise, it will call the `getInitialData` option fn.
   *
   * @param save  Whether or not the service should save the data into the storage.
   */
  resetData(save: boolean = true): T {
    const data = this.options.entries.enabled ? ({} as T) : this.options.getInitialData();
    return this.setData(data, save);
  }
  /**
   * Deletes the service data from the storage.
   *
   * @param reset  Whether or not to reset the data to the initial data
   *               (`getInitialData`), if entries area disabled, or to an empty object,
   *               if they are enabled.
   * @throws If the storage is not available.
   */
  remove(reset: boolean = true) {
    if (!this.storage) {
      throw new Error('Storage is not initialized');
    }

    this.storage.remove(this.options.storage.key);
    this.setData(reset ? this.options.getInitialData() : ({} as T), false);
  }
  /**
   * Gets an entry from the storage dictionary.
   *
   * @param {string} key  The entry key.
   * @returns {?SimpleStorageEntry} Whatever is on the storage, or `null`.
   * @throws {Error} If entries are not enabled.
   */
  getEntry(key: string): SimpleStorageEntry<E> | undefined {
    const { entries } = this.options;
    // Validate if the feature is enabled and fail with an error if it isn't.
    if (!entries.enabled) {
      throw new Error('Entries are not enabled for this storage');
    }
    const entriesDict = this.data as Record<string, SimpleStorageEntry<E>>;
    // Get the entry from the data reference.
    let entry = entriesDict[key];
    // If an entry was found and the setting to delete entries when expired is enabled...
    if (entry && entries.deleteExpired) {
      // ...validate if the entry is expired.
      ({ entry } = this.deleteExpiredEntries({ entry }, entries.expiration));
      // ... and if the entry is expired, delete it.
      if (!entry) {
        this.removeEntry(key, entries.saveWhenDeletingExpired);
      }
    }
    return entry;
  }
  /**
   * Gets the value of an entry.
   *
   * @param key  The entry key.
   */
  getEntryValue(key: string): E | undefined {
    const entry = this.getEntry(key);
    return entry ? entry.value : undefined;
  }
  addEntry(key: string, value: Promise<E>, save?: boolean): Promise<E>;
  addEntry(key: string, value: E, save?: boolean): E;
  /**
   * Adds a new entry to the service data, and if `save` is used, saves it into the
   * storage.
   *
   * @param key    The entry key.
   * @param value  The entry value, or a {@link Promise} that resolves into the value.
   * @param save   Whether or not the service should save the data into the storage.
   * @returns If `value` is an object, it will return the same object; but if `value`
   *          is a {@link Promise}, it will return the _"promise chain"_.
   */
  addEntry(key: string, value: E | Promise<E>, save: boolean = true): E | Promise<E> {
    return this.isPromise(value)
      ? value.then((realValue) => this.addResolvedEntry(key, realValue, save))
      : this.addResolvedEntry(key, value, save);
  }
  /**
   * Checks whether an entry exists or not.
   *
   * @param key  The entry key.
   */
  hasEntry(key: string): boolean {
    return !!(this.data as Record<string, E>)[key];
  }
  /**
   * Deletes an entry from the service data, and if `save` is used, the changes will be
   * saved on the storage.
   *
   * @param key   The entry key.
   * @param save  Whether or not the service should save the data into the storage
   *              after deleting the entry.
   * @returns Whether or not the entry was deleted.
   */
  removeEntry(key: string, save: boolean = true): boolean {
    const exists = this.hasEntry(key);
    if (exists) {
      delete this.data[key];
      if (save) {
        this.save();
      }
    }

    return exists;
  }
  /**
   * Merges the service default options with the custom ones that can be sent to the
   * constructor.
   * The reason there's a method for this is because of a specific (edgy) use case:
   * `memoryStorage`
   * can be a Proxy, and a Proxy without defined keys stops working after an
   * `Object.assign`/spread.
   *
   * @param defaults  The service default options.
   * @param custom    The custom options sent to the constructor.
   */
  protected mergeOptions(
    defaults: SimpleStorageOptions<T>,
    custom: SimpleStoragePartialOptions<T>,
  ): SimpleStorageOptions<T> {
    const { window: windowCustom, memoryStorage } = custom;
    // eslint-disable-next-line no-param-reassign
    delete custom.window;
    const options = deepAssignWithOverwrite<SimpleStorageOptions<T>>(defaults, custom);
    if (windowCustom) {
      options.window = windowCustom;
    }
    if (memoryStorage) {
      options.memoryStorage = memoryStorage;
    }

    return options;
  }
  /**
   * This is the real method behind {@link SimpleStorage.setData}. It overwrites the data
   * reference the service has and, if `save` is used, it also saves it into the storage.
   * The reason that there are two methods for this is, is because
   * {@link SimpleStorage.setData} can receive a {@link Promise}, and in that case, this
   * method gets called after it gets resolved.
   *
   * @param data  The new data.
   * @param save  Whether or not the service should save the data into the storage.
   * @returns The same data that was saved.
   */
  protected setResolvedData(data: T, save: boolean) {
    this.data = deepAssignWithShallowMerge<T>(data);
    if (save) {
      this.save();
    }

    return data;
  }
  /**
   * This method checks the list of priorities from the `storage.typePriority` option and
   * tries to find the first available storage.
   *
   * @throws If none of the storage options are available.
   */
  protected initializeStorage(): Storage<T> {
    let previousType: Storage<T> | undefined;
    const found = this.options.storage.priority
      .filter((storageType) => !!this.storages[storageType])
      .find((storageType) => {
        const storage = this.storages[storageType];
        const fallbackFrom = previousType ? storage.name : undefined;
        previousType = storage;
        return storage.isAvailable(fallbackFrom);
      });

    if (!found) {
      throw new Error('None of the specified storage types are available');
    }

    return this.storages[found];
  }
  /**
   * Initializes the data on the service and if needed, on the storage. It first tries to
   * load existing data from the storage, if there's nothing, it just sets an initial
   * stage; but if there was something on the storage, and entries are enabled, it will
   * try (if also enabled)
   * to delete expired entries.
   */
  protected initializeStorageData(): T {
    const { storage, entries, getInitialData } = this.options;
    let data = this.storage!.get(storage.key);
    if (data && entries.enabled && entries.deleteExpired) {
      const dataWithEntries = data as T & Record<string, SimpleStorageEntry<E>>;
      data = this.deleteExpiredEntries(dataWithEntries, entries.expiration) as T;
    } else if (!data) {
      data = entries.enabled ? ({} as T) : getInitialData();
      this.storage!.set(storage.key, data);
    }

    return data;
  }
  /**
   * Filters out a dictionary of entries by checking if they expired or not.
   *
   * @param entries     A dictionary of key-value, where the value is a
   *                    {@link SimpleStorageEntry}.
   * @param expiration  The amount of seconds that need to have passed in order to
   *                    consider an entry expired.
   * @returns A new dictionary without the expired entries.
   */
  protected deleteExpiredEntries(
    entries: Record<string, SimpleStorageEntry<E>>,
    expiration: number,
  ): Record<string, SimpleStorageEntry<E>> {
    const result: Record<string, SimpleStorageEntry<E>> = {};
    const now = Math.floor(Date.now() / 1000);
    Object.keys(entries).forEach((key) => {
      const entry = entries[key]!;
      if (now - entry.time < expiration) {
        result[key] = entry;
      }
    });

    return result;
  }
  /**
   * This is the real method behind {@link SimpleStorage.addEntry}. It Adds a new entry to
   * the service data and, if `save` is used, it also saves it into the storage.
   * The reason that there are two methods for this is, is because
   * {@link SimpleStorage.addEntry} can receive a {@link Promise}, and in that case, this
   * method gets called after it gets resolved.
   *
   * @param key    The entry key.
   * @param value  The entry value.
   * @param save   Whether or not the service should save the data into the storage.
   */
  protected addResolvedEntry(key: string, value: E, save?: boolean): E {
    const entries = this.data as Record<string, SimpleStorageEntry<E>>;
    entries[key] = {
      time: Math.floor(Date.now() / 1000),
      value: deepAssignWithShallowMerge<E>(value),
    };

    if (save) {
      this.save();
    }

    return value;
  }
  /**
   * This method is just here to comply with the {@link Storage}
   * _"interface"_ as the temp storage is always available.
   *
   * @param fallbackFrom  In case it's being used as a fallback, this will be the name
   *                      of the storage that wasn't available.
   */
  protected isMemoryStorageAvailable(fallbackFrom?: StorageName): boolean {
    if (fallbackFrom) {
      this.warnStorageFallback(fallbackFrom, 'memoryStorage');
    }

    return true;
  }
  /**
   * Gets an object from the _"memory storage"_.
   *
   * @param key  The key used to save the object.
   */
  protected getFromMemoryStorage(key: string): T | undefined {
    return this.options.memoryStorage[key];
  }
  /**
   * Sets an object into the _"memory storage"_.
   *
   * @param key    The object key.
   * @param value  The object to save.
   */
  protected setOnMemoryStorage(key: string, value: T): void {
    this.options.memoryStorage[key] = value;
  }
  /**
   * Deletes an object from the _"memory storage"_.
   *
   * @param key  The object key.
   */
  protected removeFromMemoryStorage(key: string): void {
    delete this.options.memoryStorage[key];
  }
  /**
   * Checks whether `localStorage` is available or not.
   *
   * @param fallbackFrom  In case it's being used as a fallback, this will be the name
   *                      of the storage that wasn't available.
   */
  protected isLocalStorageAvailable(fallbackFrom?: StorageName): boolean {
    if (fallbackFrom) {
      this.warnStorageFallback(fallbackFrom, 'localStorage');
    }

    return !!this.options.window.localStorage;
  }
  /**
   * Gets an object from `localStorage`.
   *
   * @param key  The key used to save the object.
   */
  protected getFromLocalStorage(key: string): T | undefined {
    const value = this.options.window.localStorage[key];
    return value ? JSON.parse(value) : undefined;
  }
  /**
   * Sets an object into the `localStorage`.
   *
   * @param key    The object key.
   * @param value  The object to save.
   */
  protected setOnLocalStorage(key: string, value: T): void {
    this.options.window.localStorage[key] = JSON.stringify(value);
  }
  /**
   * Deletes an object from the `localStorage`.
   *
   * @param key  The object key.
   */
  protected removeFromLocalStorage(key: string): void {
    delete this.options.window.localStorage[key];
  }
  /**
   * Checks whether `sessionStorage` is available or not.
   *
   * @param fallbackFrom  In case it's being used as a fallback, this will be the name
   *                      of the storage that wasn't available.
   */
  protected isSessionStorageAvailable(fallbackFrom?: StorageName): boolean {
    if (fallbackFrom) {
      this.warnStorageFallback(fallbackFrom, 'sessionStorage');
    }

    return !!this.options.window.sessionStorage;
  }
  /**
   * Gets an object from `sessionStorage`.
   *
   * @param key  The key used to save the object.
   */
  protected getFromSessionStorage(key: string): T | undefined {
    const value = this.options.window.sessionStorage[key];
    return value ? JSON.parse(value) : undefined;
  }
  /**
   * Sets an object into the `sessionStorage`.
   *
   * @param key    The object key.
   * @param value  The object to save.
   */
  protected setOnSessionStorage(key: string, value: T): void {
    this.options.window.sessionStorage[key] = JSON.stringify(value);
  }
  /**
   * Deletes an object from the `sessionStorage`.
   *
   * @param key  The object key.
   */
  protected removeFromSessionStorage(key: string): void {
    delete this.options.window.sessionStorage[key];
  }
  /**
   * Validates the service options before loading the storage and the data.
   *
   * @throws If either `storage.name` or `storage.key` are missing from the options.
   * @throws If the options have a custom logger but it doesn't have `warn` nor
   *         `warning`
   *         methods.
   */
  protected validateOptions(): void {
    const { storage, logger } = this.options;

    const requiredKeys = ['name', 'key'] as const;
    const missing = requiredKeys.find((key) => typeof storage[key] !== 'string');
    if (missing) {
      throw new Error(`Missing required configuration setting: ${missing}`);
    }

    if (logger && !('warn' in logger) && !('warning' in logger)) {
      throw new Error('The logger must implement a `warn` or `warning` method');
    }
  }
  /**
   * Prints out a warning message. The method will first check if there's a custom logger
   * (from the service options), otherwise, it will fallback to the `console` on the
   * `window` option.
   *
   * @param message  The message to print out.
   */
  protected warn(message: string): void {
    const { logger } = this.options;
    if (logger) {
      if ('warning' in logger) {
        logger.warning(message);
      } else {
        logger.warn(message);
      }
    } else {
      this.options.window.console.warn(message);
    }
  }
  /**
   * Prints out a message saying that the service is doing a fallback from a storage to
   * another one.
   *
   * @param from  The name of the storage that's not available.
   * @param to    The name of the storage that will be used instead.
   */
  protected warnStorageFallback(from: StorageName, to: StorageName): void {
    this.warn(`${from} is not available; switching to ${to}`);
  }
  /**
   * Checks whether an object is a Promise or not.
   *
   * @param value  The object to test.
   */
  protected isPromise<P>(value: P | Promise<P>): value is Promise<P> {
    return !!value && 'then' in value && typeof value.then === 'function';
  }
}
/**
 * Shorthand for `new SimpleStorage()`.
 *
 * @param options  The customatization options for the service.
 * @returns A new instance of {@link SimpleStorage}.
 * @template T  The type of the value stored in the storage.
 * @template E  The type of the entries stored in the storage.
 */
export const simpleStorage = <T extends Dict, E>(
  options?: SimpleStoragePartialOptions<T>,
): SimpleStorage<T, E> => new SimpleStorage<T, E>(options);
