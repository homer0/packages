import { deepAssignWithShallowMerge } from '@homer0/deep-assign';
import {
  simpleStorage,
  SimpleStorage,
  type Dict,
  type SimpleStoragePartialOptions,
  type StorageWindow,
} from '../src';

type getStorageProxyMocks<T> = {
  get: jest.Mock<T | undefined, [name: string]>;
  set: jest.Mock<void, [name: string, value: T]>;
  remove: jest.Mock<void, [name: string]>;
};

type getStorageProxyReturns<T> = [getStorageProxyMocks<T>, Record<string, T>];

const originalDate = global.Date;

describe('SimpleStorage', () => {
  const getStorageProxy = <T = Dict>(
    initialData: Record<string, T> = {},
  ): getStorageProxyReturns<T> => {
    const data = { ...initialData };
    const mocks: getStorageProxyMocks<T> = {
      get: jest.fn((name) => data[name]),
      set: jest.fn((name, value) => {
        data[name] = value;
      }),
      remove: jest.fn((name) => {
        delete data[name];
      }),
    };
    const storage = new Proxy({} as typeof data, {
      get(target, name) {
        if (name in target) {
          return target[name as keyof typeof target];
        }

        return mocks.get(String(name));
      },
      set(_, name, value) {
        const valueToSave =
          typeof value === 'object' ? deepAssignWithShallowMerge<T>({}, value) : value;
        mocks.set(String(name), valueToSave);
        return true;
      },
      deleteProperty(_, name) {
        mocks.remove(String(name));
        return true;
      },
    });

    return [mocks, storage];
  };

  describe('class', () => {
    it('should be instantiated', () => {
      // Given/When
      const sut = new SimpleStorage();
      const options = sut.getOptions();
      // Then
      expect(sut).toBeInstanceOf(SimpleStorage);
      expect({
        ...options,
        window: null,
      }).toEqual({
        window: null,
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
        getInitialData: expect.any(Function),
      });
    });

    it('should be instantiated with custom options', () => {
      // Given
      const initialData = {
        initial: 'data',
      };
      const getInitialDataFn = jest.fn(() => initialData);
      const newOptions: SimpleStoragePartialOptions<typeof initialData> = {
        initialize: false,
        storage: {
          name: 'mySimpleStorage',
          key: 'mySimpleStorage',
          priority: ['local', 'session', 'memory'],
        },
        entries: {
          enabled: false,
          expiration: 2509,
          deleteExpired: false,
          saveWhenDeletingExpired: true,
        },
        memoryStorage: {
          something: initialData,
        },
        getInitialData: getInitialDataFn,
      };
      // When
      const sut = new SimpleStorage(newOptions);
      const options = sut.getOptions();
      // Then
      expect(sut).toBeInstanceOf(SimpleStorage);
      expect({
        ...options,
        window: null,
      }).toEqual({ ...newOptions, window: null });
    });

    it('should throw error if a storage setting is missing', () => {
      // Given/When/Then
      expect(
        () =>
          new SimpleStorage({
            storage: {
              // @ts-expect-error - We are testing an invalid property.
              name: null,
            },
          }),
      ).toThrow(/missing required configuration setting/i);
    });

    it('should throw error if the logger doesnt have valid methods', () => {
      // Given/When/Then
      expect(
        () =>
          new SimpleStorage({
            // @ts-expect-error - We are testing an invalid property.
            logger: {},
          }),
      ).toThrow(/the logger must implement a `warn` or `warning` method/i);
    });

    it('should throw error when none of the storages is available', () => {
      // Given/When/Then
      expect(
        () =>
          new SimpleStorage({
            window: {} as StorageWindow,
            storage: {
              priority: ['session', 'local'],
            },
            logger: {
              warn: jest.fn(),
            },
          }),
      ).toThrow(/none of the specified storage types are available/i);
    });

    describe('memoryStorage and basic functionality', () => {
      it('should initialize the storage with empty data', () => {
        // Given
        const storageKey = 'myStorage';
        const [storageMocks, storage] = getStorageProxy();
        const options: SimpleStoragePartialOptions = {
          storage: {
            key: storageKey,
            priority: ['memory', 'local', 'session'],
          },
          memoryStorage: storage,
        };
        // When
        const sut = new SimpleStorage(options);
        const result = sut.getData();
        // Then
        expect(result).toEqual({});
        expect(storageMocks.get).toHaveBeenCalledTimes(1);
        expect(storageMocks.get).toHaveBeenCalledWith(storageKey);
        expect(storageMocks.set).toHaveBeenCalledTimes(1);
        expect(storageMocks.set).toHaveBeenCalledWith(storageKey, {});
      });

      it('should initialize the storage and restore saved data', () => {
        // Given
        const storageKey = 'myStorage';
        const savedData = {
          names: ['Charito', 'Pili'],
        };
        const [storageMocks, storage] = getStorageProxy({
          [storageKey]: savedData,
        });
        const options: SimpleStoragePartialOptions = {
          storage: {
            key: storageKey,
            priority: ['memory', 'local', 'session'],
          },
          memoryStorage: storage,
        };
        // When
        const sut = new SimpleStorage(options);
        const result = sut.getData();
        // Then
        expect(result).toEqual(savedData);
        expect(storageMocks.get).toHaveBeenCalledTimes(1);
        expect(storageMocks.get).toHaveBeenCalledWith(storageKey);
        expect(storageMocks.set).toHaveBeenCalledTimes(0);
      });

      it('should initialize as a fallback for another storage (logger.warn)', () => {
        // Given
        const [, storage] = getStorageProxy();
        const logger = {
          warn: jest.fn(),
        };
        const fakeWindow = {} as StorageWindow;
        const options: SimpleStoragePartialOptions = {
          window: fakeWindow,
          storage: {
            priority: ['local', 'memory', 'session'],
          },
          memoryStorage: storage,
          logger,
        };
        // When
        const sut = new SimpleStorage(options);
        const result = sut.getData();
        // Then
        expect(result).toEqual({});
        expect(logger.warn).toHaveBeenCalledWith(
          expect.stringMatching(/is not available; switching to/i),
        );
      });

      it('should initialize as a fallback for another storage (logger.warning)', () => {
        // Given
        const [, storage] = getStorageProxy();
        const logger = {
          warning: jest.fn(),
        };
        const fakeWindow = {} as StorageWindow;
        const options: SimpleStoragePartialOptions = {
          window: fakeWindow,
          storage: {
            priority: ['local', 'memory', 'session'],
          },
          memoryStorage: storage,
          logger,
        };
        // When
        const sut = new SimpleStorage(options);
        const result = sut.getData();
        // Then
        expect(result).toEqual({});
        expect(logger.warning).toHaveBeenCalledWith(
          expect.stringMatching(/is not available; switching to/i),
        );
      });

      it('should initialize as a fallback for another storage (console.warn)', () => {
        // Given
        const [, storage] = getStorageProxy();
        const fakeWindow = {
          console: {
            warn: jest.fn(),
          },
        } as unknown as StorageWindow;
        const options: SimpleStoragePartialOptions = {
          window: fakeWindow,
          storage: {
            priority: ['local', 'memory', 'session'],
          },
          memoryStorage: storage,
        };
        // When
        const sut = new SimpleStorage(options);
        const result = sut.getData();
        // Then
        expect(result).toEqual({});
        expect(fakeWindow.console.warn).toHaveBeenCalledWith(
          expect.stringMatching(/is not available; switching to/i),
        );
      });

      it('should remove the data from the storage and reset it to its initial state', () => {
        // Given
        const storageKey = 'myStorage';
        const savedData = {
          names: ['Charito', 'Pili'],
        };
        const initialData = {
          names: ['Rosario', 'Pilar'],
        };
        const getInitialData = jest.fn(() => initialData);
        const [storageMocks, storage] = getStorageProxy({
          [storageKey]: savedData,
        });
        const options: SimpleStoragePartialOptions = {
          storage: {
            key: storageKey,
            priority: ['memory', 'local', 'session'],
          },
          memoryStorage: storage,
          getInitialData,
        };
        // When
        const sut = new SimpleStorage(options);
        const result = sut.getData();
        sut.remove();
        const resultAfterRemove = sut.getData();
        // Then
        expect(result).toEqual(savedData);
        expect(resultAfterRemove).toEqual(initialData);
        expect(getInitialData).toHaveBeenCalledTimes(1);
        expect(storageMocks.remove).toHaveBeenCalledTimes(1);
        expect(storageMocks.remove).toHaveBeenCalledWith(storageKey);
        expect(storageMocks.set).toHaveBeenCalledTimes(0);
      });

      it('should remove the data from the storage without resetting it', () => {
        // Given
        const storageKey = 'myStorage';
        const savedData = {
          names: ['Charito', 'Pili'],
        };
        const [storageMocks, storage] = getStorageProxy({
          [storageKey]: savedData,
        });
        const options: SimpleStoragePartialOptions = {
          storage: {
            key: storageKey,
            priority: ['memory', 'local', 'session'],
          },
          memoryStorage: storage,
        };
        // When
        const sut = new SimpleStorage(options);
        const result = sut.getData();
        sut.remove(false);
        const resultAfterRemove = sut.getData();
        // Then
        expect(result).toEqual(savedData);
        expect(resultAfterRemove).toEqual({});
        expect(storageMocks.remove).toHaveBeenCalledTimes(1);
        expect(storageMocks.remove).toHaveBeenCalledWith(storageKey);
        expect(storageMocks.set).toHaveBeenCalledTimes(0);
      });

      it('should throw an error when trying to remove without initializing', () => {
        // Given/When/Then
        const sut = new SimpleStorage({
          initialize: false,
        });
        expect(() => sut.remove()).toThrow(/storage is not initialized/i);
      });

      it('should overwrite the data on the service and save it', () => {
        // Given
        const storageKey = 'myStorage';
        const [storageMocks, storage] = getStorageProxy();
        const options: SimpleStoragePartialOptions = {
          storage: {
            key: storageKey,
            priority: ['memory', 'local', 'session'],
          },
          memoryStorage: storage,
        };
        const newData = {
          name: 'Charito',
          age: 3,
        };
        // When
        const sut = new SimpleStorage(options);
        sut.setData(newData);
        const result = sut.getData();
        // Then
        expect(result).toEqual(newData);
        expect(storageMocks.get).toHaveBeenCalledTimes(1);
        expect(storageMocks.get).toHaveBeenCalledWith(storageKey);
        expect(storageMocks.set).toHaveBeenCalledTimes(2);
        expect(storageMocks.set).toHaveBeenNthCalledWith(1, storageKey, {});
        expect(storageMocks.set).toHaveBeenNthCalledWith(2, storageKey, newData);
      });

      it('should overwrite the data on the service with a promise', async () => {
        // Given
        const storageKey = 'myStorage';
        const [storageMocks, storage] = getStorageProxy();
        const options: SimpleStoragePartialOptions = {
          storage: {
            key: storageKey,
            priority: ['memory', 'local', 'session'],
          },
          memoryStorage: storage,
        };
        const newData = {
          name: 'Charito',
          age: 3,
        };
        // When
        const sut = new SimpleStorage(options);
        await sut.setData(Promise.resolve(newData));
        // Then
        expect(storageMocks.set).toHaveBeenCalledTimes(2);
        expect(storageMocks.set).toHaveBeenNthCalledWith(1, storageKey, {});
        expect(storageMocks.set).toHaveBeenNthCalledWith(2, storageKey, newData);
      });

      it('should overwrite the data on the service but not save it', () => {
        // Given
        const storageKey = 'myStorage';
        const [storageMocks, storage] = getStorageProxy();
        const options: SimpleStoragePartialOptions = {
          storage: {
            key: storageKey,
            priority: ['memory', 'local', 'session'],
          },
          memoryStorage: storage,
        };
        const newData = {
          name: 'Charito',
          age: 3,
        };
        // When
        const sut = new SimpleStorage(options);
        sut.setData(newData, false);
        const result = sut.getData();
        // Then
        expect(result).toEqual(newData);
        expect(storageMocks.set).toHaveBeenCalledTimes(1);
        expect(storageMocks.set).toHaveBeenCalledWith(storageKey, {});
      });

      it('should overwrite the data on the service and save it manually', () => {
        // Given
        const storageKey = 'myStorage';
        const [storageMocks, storage] = getStorageProxy();
        const options: SimpleStoragePartialOptions = {
          storage: {
            key: storageKey,
            priority: ['memory', 'local', 'session'],
          },
          memoryStorage: storage,
        };
        const newData = {
          name: 'Charito',
          age: 3,
        };
        // When
        const sut = new SimpleStorage(options);
        sut.setData(newData, false);
        sut.save();
        // Then
        expect(storageMocks.set).toHaveBeenCalledTimes(2);
        expect(storageMocks.set).toHaveBeenNthCalledWith(1, storageKey, {});
        expect(storageMocks.set).toHaveBeenNthCalledWith(2, storageKey, newData);
      });

      it('should reset the data on the service and save it', () => {
        // Given
        const storageKey = 'myStorage';
        const [storageMocks, storage] = getStorageProxy();
        const options: SimpleStoragePartialOptions = {
          storage: {
            key: storageKey,
            priority: ['memory', 'local', 'session'],
          },
          memoryStorage: storage,
        };
        const newData = {
          name: 'Charito',
          age: 3,
        };
        // When
        const sut = new SimpleStorage(options);
        sut.setData(newData);
        const result = sut.getData();
        sut.resetData();
        const resultAfterReset = sut.getData();
        // Then
        expect(result).toEqual(newData);
        expect(resultAfterReset).toEqual({});
        expect(storageMocks.set).toHaveBeenCalledTimes(3);
        expect(storageMocks.set).toHaveBeenNthCalledWith(1, storageKey, {});
        expect(storageMocks.set).toHaveBeenNthCalledWith(2, storageKey, newData);
        expect(storageMocks.set).toHaveBeenNthCalledWith(3, storageKey, {});
      });

      it('should reset the data as an entries dict and save it', () => {
        // Given
        const storageKey = 'myStorage';
        const [, storage] = getStorageProxy();
        const initialData = {
          initial: 'data',
        };
        const getInitialData = jest.fn(() => initialData);
        const options: SimpleStoragePartialOptions = {
          entries: {
            enabled: true,
          },
          storage: {
            key: storageKey,
            priority: ['memory', 'local', 'session'],
          },
          memoryStorage: storage,
          getInitialData,
        };
        // When
        const sut = new SimpleStorage(options);
        sut.resetData();
        const result = sut.getData();
        // Then
        expect(result).toEqual({});
        expect(getInitialData).toHaveBeenCalledTimes(0);
      });

      it('should reset the data on the service but not save it', () => {
        // Given
        const storageKey = 'myStorage';
        const [storageMocks, storage] = getStorageProxy();
        const options: SimpleStoragePartialOptions = {
          storage: {
            key: storageKey,
            priority: ['memory', 'local', 'session'],
          },
          memoryStorage: storage,
        };
        const newData = {
          name: 'Charito',
          age: 3,
        };
        // When
        const sut = new SimpleStorage(options);
        sut.setData(newData);
        const result = sut.getData();
        sut.resetData(false);
        const resultAfterReset = sut.getData();
        // Then
        expect(result).toEqual(newData);
        expect(resultAfterReset).toEqual({});
        expect(storageMocks.set).toHaveBeenCalledTimes(2);
        expect(storageMocks.set).toHaveBeenNthCalledWith(1, storageKey, {});
        expect(storageMocks.set).toHaveBeenNthCalledWith(2, storageKey, newData);
      });

      it('should throw an error when trying to save without initializing', () => {
        // Given/When/Then
        const sut = new SimpleStorage({
          initialize: false,
        });
        expect(() => sut.save()).toThrow(/storage is not initialized/i);
      });
    });

    describe('entries', () => {
      afterEach(() => {
        global.Date = originalDate;
      });

      it('should throw an error when trying to access an entry and `entries` is disabled', () => {
        // Given
        const storageKey = 'myStorage';
        const [, storage] = getStorageProxy();
        const options: SimpleStoragePartialOptions = {
          storage: {
            key: storageKey,
            priority: ['memory', 'local', 'session'],
          },
          memoryStorage: storage,
        };
        // When/Then
        const sut = new SimpleStorage(options);
        expect(() => sut.getEntry('myEntry')).toThrow(
          /Entries are not enabled for this storag/i,
        );
      });

      it('should return a saved entry', () => {
        // Given
        const storageKey = 'myStorage';
        const entryKey = 'user';
        const entryValue = {
          name: 'Rosario',
        };
        const entry = {
          time: Math.floor(Date.now() / 1000),
          value: entryValue,
        };
        const savedData = {
          [entryKey]: entry,
        };
        const [storageMocks, storage] = getStorageProxy({
          [storageKey]: savedData,
        });
        const options: SimpleStoragePartialOptions = {
          storage: {
            key: storageKey,
            priority: ['memory'],
          },
          entries: {
            enabled: true,
          },
          memoryStorage: storage,
        };
        // When
        const sut = new SimpleStorage(options);
        const result = sut.getEntry(entryKey);
        const resultValue = sut.getEntryValue(entryKey);
        // Then
        expect(result).toEqual(entry);
        expect(resultValue).toEqual(entryValue);
        expect(storageMocks.get).toHaveBeenCalledTimes(1);
        expect(storageMocks.get).toHaveBeenCalledWith(options.storage!.key);
        expect(storageMocks.set).toHaveBeenCalledTimes(0);
      });

      it('should expire a saved entry', () => {
        // Given
        const currentTime = Date.now();
        const expiration = 3600;
        const future = currentTime + expiration * 1000 * 2;
        const now = jest.fn();
        now.mockImplementationOnce(() => currentTime);
        now.mockImplementationOnce(() => currentTime);
        now.mockImplementationOnce(() => future);
        // @ts-expect-error - we're mocking the Date object
        global.Date = { now };
        const storageKey = 'myStorage';
        const entryKey = 'user';
        const entryValue = {
          name: 'Rosario',
        };
        const entry = {
          time: Math.floor(currentTime / 1000),
          value: entryValue,
        };
        const savedData = {
          [entryKey]: entry,
        };
        const [storageMocks, storage] = getStorageProxy({
          [storageKey]: savedData,
        });
        const options: SimpleStoragePartialOptions = {
          storage: {
            key: storageKey,
            priority: ['memory'],
          },
          entries: {
            enabled: true,
            expiration,
          },
          memoryStorage: storage,
        };
        // When
        const sut = new SimpleStorage(options);
        const result = sut.getEntry(entryKey);
        const resultAfterExpiration = sut.getEntry(entryKey);
        // Then
        expect(result).toEqual(entry);
        expect(resultAfterExpiration).toBeUndefined();
        expect(storageMocks.get).toHaveBeenCalledTimes(1);
        expect(storageMocks.get).toHaveBeenCalledWith(options.storage!.key);
        expect(storageMocks.set).toHaveBeenCalledTimes(1);
        expect(storageMocks.set).toHaveBeenCalledWith(options.storage!.key, {});
      });

      it('should remove expired entries when they are loaded', () => {
        // Given
        const storageKey = 'myStorage';
        const entryKey = 'user';
        const entry = {
          time: 0,
          value: {
            name: 'Rosario',
          },
        };
        const savedData = {
          [entryKey]: entry,
        };
        const [storageMocks, storage] = getStorageProxy({
          [storageKey]: savedData,
        });
        const options: SimpleStoragePartialOptions = {
          storage: {
            key: storageKey,
            priority: ['memory'],
          },
          entries: {
            enabled: true,
          },
          memoryStorage: storage,
        };
        // When
        const sut = new SimpleStorage(options);
        const result = sut.getEntry(entryKey);
        // Then
        expect(result).toBeUndefined();
        expect(storageMocks.get).toHaveBeenCalledTimes(1);
        expect(storageMocks.get).toHaveBeenCalledWith(options.storage!.key);
        expect(storageMocks.set).toHaveBeenCalledTimes(0);
      });

      it('should initialize the storage as an empty object for entries', () => {
        // Given
        const storageKey = 'myStorage';
        const [storageMocks, storage] = getStorageProxy();
        const options: SimpleStoragePartialOptions = {
          storage: {
            key: storageKey,
            priority: ['memory'],
          },
          entries: {
            enabled: true,
          },
          memoryStorage: storage,
        };
        // When
        const sut = new SimpleStorage(options);
        const result = sut.getData();
        const resultEntry = sut.getEntry('unknownEntry');
        const resultEntryValue = sut.getEntryValue('unknownEntry');
        // Then
        expect(result).toEqual({});
        expect(resultEntry).toBeUndefined();
        expect(resultEntryValue).toBeUndefined();
        expect(storageMocks.get).toHaveBeenCalledTimes(1);
        expect(storageMocks.get).toHaveBeenCalledWith(options.storage!.key);
        expect(storageMocks.set).toHaveBeenCalledTimes(1);
        expect(storageMocks.set).toHaveBeenCalledWith(options.storage!.key, {});
      });

      it('should add and save a new entry', async () => {
        // Given
        const currentTime = 0;
        // @ts-expect-error - we're mocking the Date object
        global.Date = {
          now: jest.fn(() => currentTime),
        };
        const storageKey = 'myStorage';
        const entryKey = 'user';
        const entryValue = {
          name: 'Rosario',
        };
        const [storageMocks, storage] = getStorageProxy();
        const options: SimpleStoragePartialOptions = {
          storage: {
            key: storageKey,
            priority: ['memory'],
          },
          entries: {
            enabled: true,
            deleteExpired: false,
          },
          memoryStorage: storage,
        };
        // When
        const sut = new SimpleStorage(options);
        const resultBeforeAdding = sut.getEntryValue(entryKey);
        const resultFromAdding = sut.addEntry(entryKey, entryValue);
        const resultAfterAdding = sut.getEntryValue(entryKey);
        // Then
        expect(resultBeforeAdding).toBeUndefined();
        expect(resultFromAdding).toEqual(entryValue);
        expect(resultAfterAdding).toEqual(entryValue);
        expect(storageMocks.get).toHaveBeenCalledTimes(1);
        expect(storageMocks.get).toHaveBeenCalledWith(options.storage!.key);
        expect(storageMocks.set).toHaveBeenCalledTimes(2);
        expect(storageMocks.set).toHaveBeenNthCalledWith(1, options.storage!.key, {});
        expect(storageMocks.set).toHaveBeenNthCalledWith(2, options.storage!.key, {
          [entryKey]: {
            time: currentTime,
            value: entryValue,
          },
        });
      });

      it('should add and save a new array entry', () => {
        // Given
        const currentTime = 0;
        // @ts-expect-error - we're mocking the Date object
        global.Date = {
          now: jest.fn(() => currentTime),
        };
        const storageKey = 'myStorage';
        const entryKey = 'user';
        const entryValue = ['Rosario', 'Charo', 'Charito'];
        const [storageMocks, storage] = getStorageProxy();
        const options: SimpleStoragePartialOptions = {
          storage: {
            key: storageKey,
            priority: ['memory'],
          },
          entries: {
            enabled: true,
            deleteExpired: true,
          },
          memoryStorage: storage,
        };
        // When
        const sut = new SimpleStorage(options);
        const resultBeforeAdding = sut.getEntryValue(entryKey);
        const resultFromAdding = sut.addEntry(entryKey, entryValue);
        const resultAfterAdding = sut.getEntryValue(entryKey);
        // Then
        expect(resultBeforeAdding).toBeUndefined();
        expect(resultFromAdding).toEqual(entryValue);
        expect(resultAfterAdding).toEqual(entryValue);
        expect(storageMocks.get).toHaveBeenCalledTimes(1);
        expect(storageMocks.get).toHaveBeenCalledWith(options.storage!.key);
        expect(storageMocks.set).toHaveBeenCalledTimes(2);
        expect(storageMocks.set).toHaveBeenNthCalledWith(1, options.storage!.key, {});
        expect(storageMocks.set).toHaveBeenNthCalledWith(2, options.storage!.key, {
          [entryKey]: {
            time: currentTime,
            value: entryValue,
          },
        });
      });

      it('should add a new entry but not save it', () => {
        // Given
        const currentTime = 0;
        // @ts-expect-error - we're mocking the Date object
        global.Date = {
          now: jest.fn(() => currentTime),
        };
        const storageKey = 'myStorage';
        const entryKey = 'user';
        const entryValue = {
          name: 'Rosario',
        };
        const [storageMocks, storage] = getStorageProxy();
        const options: SimpleStoragePartialOptions = {
          storage: {
            key: storageKey,
            priority: ['memory'],
          },
          entries: {
            enabled: true,
            deleteExpired: false,
          },
          memoryStorage: storage,
        };
        // When
        const sut = new SimpleStorage(options);
        const resultBeforeAdding = sut.getEntryValue(entryKey);
        const resultFromAdding = sut.addEntry(entryKey, entryValue, false);
        const resultAfterAdding = sut.getEntryValue(entryKey);
        // Then
        expect(resultBeforeAdding).toBeUndefined();
        expect(resultFromAdding).toEqual(entryValue);
        expect(resultAfterAdding).toEqual(entryValue);
        expect(storageMocks.get).toHaveBeenCalledTimes(1);
        expect(storageMocks.get).toHaveBeenCalledWith(options.storage!.key);
        expect(storageMocks.set).toHaveBeenCalledTimes(1);
        expect(storageMocks.set).toHaveBeenCalledWith(options.storage!.key, {});
      });

      it('should add and save a new entry from a promise', async () => {
        // Given
        const currentTime = 0;
        // @ts-expect-error - we're mocking the Date object
        global.Date = {
          now: jest.fn(() => currentTime),
        };
        const storageKey = 'myStorage';
        const entryKey = 'user';
        const entryValue = {
          name: 'Rosario',
        };
        const entryPromise = Promise.resolve(entryValue);
        const [storageMocks, storage] = getStorageProxy();
        const options: SimpleStoragePartialOptions = {
          storage: {
            key: storageKey,
            priority: ['memory'],
          },
          entries: {
            enabled: true,
            deleteExpired: false,
          },
          memoryStorage: storage,
        };
        // When
        const sut = new SimpleStorage(options);
        const resultBeforeAdding = sut.getEntryValue(entryKey);
        const resultFromAdding = await sut.addEntry(entryKey, entryPromise);
        const resultAfterAdding = sut.getEntryValue(entryKey);
        // Then
        expect(resultBeforeAdding).toBeUndefined();
        expect(resultFromAdding).toEqual(entryValue);
        expect(resultAfterAdding).toEqual(entryValue);
        expect(storageMocks.get).toHaveBeenCalledTimes(1);
        expect(storageMocks.get).toHaveBeenCalledWith(options.storage!.key);
        expect(storageMocks.set).toHaveBeenCalledTimes(2);
        expect(storageMocks.set).toHaveBeenNthCalledWith(1, options.storage!.key, {});
        expect(storageMocks.set).toHaveBeenNthCalledWith(2, options.storage!.key, {
          [entryKey]: {
            time: currentTime,
            value: entryValue,
          },
        });
      });

      it('should delete an entry and save the storage', () => {
        // Given
        const currentTime = 0;
        // @ts-expect-error - we're mocking the Date object
        global.Date = {
          now: jest.fn(() => currentTime),
        };
        const storageKey = 'myStorage';
        const entryKey = 'user';
        const entryValue = {
          name: 'Rosario',
        };
        const [storageMocks, storage] = getStorageProxy();
        const options: SimpleStoragePartialOptions = {
          storage: {
            key: storageKey,
            priority: ['memory'],
          },
          entries: {
            enabled: true,
            deleteExpired: false,
          },
          memoryStorage: storage,
        };
        // When
        const sut = new SimpleStorage(options);
        sut.addEntry(entryKey, entryValue);
        const resultBeforeDeleting = sut.getEntryValue(entryKey);
        const resultFromDeleting = sut.removeEntry(entryKey);
        const resultAfterDeleting = sut.getEntryValue(entryKey);
        // Then
        expect(resultBeforeDeleting).toEqual(entryValue);
        expect(resultFromDeleting).toBe(true);
        expect(resultAfterDeleting).toBeUndefined();
        expect(storageMocks.get).toHaveBeenCalledTimes(1);
        expect(storageMocks.get).toHaveBeenCalledWith(options.storage!.key);
        expect(storageMocks.set).toHaveBeenCalledTimes(3);
        expect(storageMocks.set).toHaveBeenNthCalledWith(1, options.storage!.key, {});
        expect(storageMocks.set).toHaveBeenNthCalledWith(2, options.storage!.key, {
          [entryKey]: {
            time: currentTime,
            value: entryValue,
          },
        });
        expect(storageMocks.set).toHaveBeenNthCalledWith(3, options.storage!.key, {});
      });

      it('should delete an entry but not save it on the storage', () => {
        // Given
        const currentTime = 0;
        // @ts-expect-error - we're mocking the Date object
        global.Date = {
          now: jest.fn(() => currentTime),
        };
        const storageKey = 'myStorage';
        const entryKey = 'user';
        const entryValue = {
          name: 'Rosario',
        };
        const [storageMocks, storage] = getStorageProxy();
        const options: SimpleStoragePartialOptions = {
          storage: {
            key: storageKey,
            priority: ['memory'],
          },
          entries: {
            enabled: true,
            deleteExpired: false,
          },
          memoryStorage: storage,
        };
        // When
        const sut = new SimpleStorage(options);
        sut.addEntry(entryKey, entryValue);
        const resultBeforeDeleting = sut.getEntryValue(entryKey);
        const resultFromDeleting = sut.removeEntry(entryKey, false);
        const resultAfterDeleting = sut.getEntryValue(entryKey);
        // Then
        expect(resultBeforeDeleting).toEqual(entryValue);
        expect(resultFromDeleting).toBe(true);
        expect(resultAfterDeleting).toBeUndefined();
        expect(storageMocks.get).toHaveBeenCalledTimes(1);
        expect(storageMocks.get).toHaveBeenCalledWith(options.storage!.key);
        expect(storageMocks.set).toHaveBeenCalledTimes(2);
        expect(storageMocks.set).toHaveBeenNthCalledWith(1, options.storage!.key, {});
        expect(storageMocks.set).toHaveBeenNthCalledWith(2, options.storage!.key, {
          [entryKey]: {
            time: currentTime,
            value: entryValue,
          },
        });
      });

      it('should fail to delete an entry', () => {
        // Given
        const storageKey = 'myStorage';
        const [, storage] = getStorageProxy();
        const options: SimpleStoragePartialOptions = {
          storage: {
            key: storageKey,
            priority: ['memory'],
          },
          entries: {
            enabled: true,
          },
          memoryStorage: storage,
        };
        // When
        const sut = new SimpleStorage(options);
        const result = sut.removeEntry('randomKey');
        // Then
        expect(result).toBe(false);
      });
    });

    describe.each(['local', 'session'] as const)('%sStorage', (storageName) => {
      it('should initialize the storage with empty data', () => {
        // Given
        const storageKey = 'myStorage';
        const [storageMocks, storage] = getStorageProxy();
        const fakeWindow = {
          [`${storageName}Storage`]: storage,
        } as unknown as StorageWindow;
        const options: SimpleStoragePartialOptions = {
          window: fakeWindow,
          storage: {
            key: storageKey,
            priority: [storageName],
          },
        };
        // When
        const sut = new SimpleStorage(options);
        const result = sut.getData();
        // Then
        expect(result).toEqual({});
        expect(storageMocks.get).toHaveBeenCalledTimes(1);
        expect(storageMocks.get).toHaveBeenCalledWith(storageKey);
        expect(storageMocks.set).toHaveBeenCalledTimes(1);
        expect(storageMocks.set).toHaveBeenCalledWith(storageKey, '{}');
      });

      it('should initialize the storage and restore saved data', () => {
        // Given
        const storageKey = 'myStorage';
        const savedData = {
          names: ['Charito', 'Pili'],
        };
        const [storageMocks, storage] = getStorageProxy({
          [storageKey]: JSON.stringify(savedData),
        });
        const fakeWindow = {
          [`${storageName}Storage`]: storage,
        } as unknown as StorageWindow;
        const options: SimpleStoragePartialOptions = {
          window: fakeWindow,
          storage: {
            key: storageKey,
            priority: [storageName],
          },
        };
        // When
        const sut = new SimpleStorage(options);
        const result = sut.getData();
        // Then
        expect(result).toEqual(savedData);
        expect(storageMocks.get).toHaveBeenCalledTimes(1);
        expect(storageMocks.get).toHaveBeenCalledWith(storageKey);
        expect(storageMocks.set).toHaveBeenCalledTimes(0);
      });

      it('should initialize as a fallback for another storage', () => {
        // Given
        const other = (['local', 'session'] as const).find(
          (storage) => storage !== storageName,
        )!;
        const [, storage] = getStorageProxy();
        const logger = {
          warn: jest.fn(),
        };
        const fakeWindow = {
          [`${storageName}Storage`]: storage,
        } as unknown as StorageWindow;
        const options: SimpleStoragePartialOptions = {
          window: fakeWindow,
          storage: {
            priority: [other, storageName],
          },
          logger,
        };
        // When
        const sut = new SimpleStorage(options);
        const result = sut.getData();
        // Then
        expect(result).toEqual({});
        expect(logger.warn).toHaveBeenCalledWith(
          expect.stringMatching(/is not available; switching to/i),
        );
      });

      it('should remove the data from the storage and reset it to its initial state', () => {
        // Given
        const storageKey = 'myStorage';
        const savedData = {
          names: ['Charito', 'Pili'],
        };
        const initialData = {
          names: ['Rosario', 'Pilar'],
        };
        const getInitialData = jest.fn(() => initialData);
        const [storageMocks, storage] = getStorageProxy({
          [storageKey]: JSON.stringify(savedData),
        });
        const fakeWindow = {
          [`${storageName}Storage`]: storage,
        } as unknown as StorageWindow;
        const options: SimpleStoragePartialOptions = {
          window: fakeWindow,
          storage: {
            key: storageKey,
            priority: [storageName],
          },
          getInitialData,
        };
        // When
        const sut = new SimpleStorage(options);
        const result = sut.getData();
        sut.remove();
        const resultAfterRemove = sut.getData();
        // Then
        expect(result).toEqual(savedData);
        expect(resultAfterRemove).toEqual(initialData);
        expect(getInitialData).toHaveBeenCalledTimes(1);
        expect(storageMocks.remove).toHaveBeenCalledTimes(1);
        expect(storageMocks.remove).toHaveBeenCalledWith(storageKey);
        expect(storageMocks.set).toHaveBeenCalledTimes(0);
      });

      it('should overwrite the data on the service and save it', () => {
        // Given
        const storageKey = 'myStorage';
        const [storageMocks, storage] = getStorageProxy();
        const fakeWindow = {
          [`${storageName}Storage`]: storage,
        } as unknown as StorageWindow;
        const options: SimpleStoragePartialOptions = {
          window: fakeWindow,
          storage: {
            key: storageKey,
            priority: [storageName],
          },
        };
        const newData = {
          name: 'Charito',
          age: 3,
        };
        // When
        const sut = new SimpleStorage(options);
        sut.setData(newData);
        const result = sut.getData();
        // Then
        expect(result).toEqual(newData);
        expect(storageMocks.get).toHaveBeenCalledTimes(1);
        expect(storageMocks.get).toHaveBeenCalledWith(storageKey);
        expect(storageMocks.set).toHaveBeenCalledTimes(2);
        expect(storageMocks.set).toHaveBeenNthCalledWith(1, storageKey, '{}');
        expect(storageMocks.set).toHaveBeenNthCalledWith(
          2,
          storageKey,
          JSON.stringify(newData),
        );
      });
    });
  });

  describe('shorthand', () => {
    it('should have a shorthand function', () => {
      // Given/When/Then
      expect(simpleStorage()).toBeInstanceOf(SimpleStorage);
    });
  });
});
