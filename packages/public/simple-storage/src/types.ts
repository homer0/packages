export type StorageType = 'local' | 'session' | 'memory';
export type StorageName = 'localStorage' | 'sessionStorage' | 'memoryStorage';

export type Dict = Record<string, unknown>;

export type StorageWindow = Window & {
  console: {
    warn: (...args: unknown[]) => void;
  };
};

export type Storage<T extends Dict> = {
  name: StorageName;
  isAvailable: (fallbackFrom?: StorageName) => boolean;
  get: (key: string) => T | undefined;
  set: (key: string, value: T) => void;
  remove: (key: string) => void;
};

export type SimpleStorageStorageOptions = {
  name: string;
  key: string;
  priority: StorageType[];
};

export type SimpleStorageEntriesOptions = {
  enabled: boolean;
  expiration: number;
  deleteExpired: boolean;
  saveWhenDeletingExpired: boolean;
};

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

export type SimpleStorageOptions<T extends Dict = Dict> = {
  window: StorageWindow;
  initialize: boolean;
  getInitialData: () => T;
  storage: SimpleStorageStorageOptions;
  entries: SimpleStorageEntriesOptions;
  memoryStorage: Record<string, T>;
  logger?: SimpleStorageLogger;
};

export type SimpleStoragePartialOptions<T extends Dict = Dict> = {
  window?: StorageWindow;
  memoryStorage?: Record<string, T>;
} & DeepPartial<Omit<SimpleStorageOptions<T>, 'window' | 'memoryStorage'>>;

export type SimpleStorageEntry<E = unknown> = {
  time: number;
  value: E;
};
