export type StorageType = 'local' | 'session' | 'memory';
export type StorageName = 'localStorage' | 'sessionStorage' | 'memoryStorage';
/**
 * A generic dictionary, for generic's defaults.
 */
export type Dict = Record<string, unknown>;
/**
 * Fome reason, the `Window` type doesn't include `console.warn`, so this extension is
 * just to avoid multiple type guards.
 */
export type StorageWindow = Window & {
  console: {
    warn: (...args: unknown[]) => void;
  };
};
/**
 * The pseudo-interface in which the service organizes the different types of storage.
 *
 * @template T  The type of the value that will be stored.
 */
export type Storage<T extends Dict> = {
  /**
   * The name of the storage, just for reference.
   */
  name: StorageName;
  /**
   * Whether or not the storage is available.
   *
   * @param fallbackForm  In case this is called due to another storage not being
   *                      available.
   */
  isAvailable: (fallbackFrom?: StorageName) => boolean;
  /**
   * Gets the data from the storage.
   *
   * @param key  The key in which the data is stored.
   */
  get: (key: string) => T | undefined;
  /**
   * Sets the data in the storage.
   *
   * @param key    The key in which the data is stored.
   * @param value  The new data to store.
   */
  set: (key: string, value: T) => void;
  /**
   * Remove the data from the storage.
   */
  remove: (key: string) => void;
};
/**
 * The service options specific to the storages.
 */
export type SimpleStorageStorageOptions = {
  /**
   * The name of the storage, just for reference.
   *
   * @default 'simpleStorage'
   */
  name: string;
  /**
   * The key that will be used in the storage to save the service data.
   *
   * @default 'simpleStorage'
   */
  key: string;
  /**
   * A prioritized list of the storages, as the service will try to use the first and if
   * it fails, the second, and so on.
   *
   * @default ['local', 'session', 'memory']
   */
  priority: StorageType[];
};
/**
 * The service options for the "entries feature".
 */
export type SimpleStorageEntriesOptions = {
  /**
   * Whether or not the feature is enabled.
   *
   * @default false
   */
  enabled: boolean;
  /**
   * The amount of seconds before an entry is considered expired.
   *
   * @default 3600  // 1 hour.
   */
  expiration: number;
  /**
   * Whether or not to check and delete expired entries when the service is initialized.
   *
   * @default true
   */
  deleteExpired: boolean;
  /**
   * Whether or not to sync (save) the storage after deleting an expired entry.
   *
   * @default true
   */
  saveWhenDeletingExpired: boolean;
};
/**
 * The interface of a logger the service could use.
 */
export type SimpleStorageLogger =
  | {
      warn: (message: string) => void;
    }
  | {
      warning: (message: string) => void;
    };

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};
/**
 * The service options.
 *
 * @template T  The type of the value that will be stored.
 */
export type SimpleStorageOptions<T extends Dict = Dict> = {
  /**
   * A reference for the window/global object.
   */
  window: StorageWindow;
  /**
   * Whether or not to initialize the service right from the constructor.
   * It means that it will validate the storage, check for existing data, and sync it.
   * This can be disabled in case you need to do something between the constructor and the
   * initialization.
   */
  initialize: boolean;
  /**
   * The function that will generate the initial data, in case there's none in the storage
   * (for the given `key`). If the "entries feature" is enabled, this will not be used, as
   * the data will be a dictionary of entries.
   */
  getInitialData: () => T;
  /**
   * The service options specific to the storages.
   */
  storage: SimpleStorageStorageOptions;
  /**
   * The service options for the "entries feature".
   */
  entries: SimpleStorageEntriesOptions;
  /**
   * The actual "in-memory" storage.
   */
  memoryStorage: Record<string, T>;
  /**
   * A custom logger to print out the warnings.
   */
  logger?: SimpleStorageLogger;
};
/**
 * The service options for the constructor.
 *
 * This is on a separated type because you can't use `DeepPartial` if one of the options
 * is the `Window`, and using it on the `memoryStorage` would also cause issues.
 *
 * @template T  The type of the value that will be stored.
 */
export type SimpleStorageConstructorOptions<T extends Dict = Dict> = {
  window?: StorageWindow;
  memoryStorage?: Record<string, T>;
} & DeepPartial<Omit<SimpleStorageOptions<T>, 'window' | 'memoryStorage'>>;
/**
 * The format the entries will have when saved in the storage.
 *
 * @template E  The type of the entry.
 */
export type SimpleStorageEntry<E = unknown> = {
  /**
   * The time when the entry was created.
   */
  time: number;
  /**
   * The actual data that was saved.
   */
  value: E;
};
