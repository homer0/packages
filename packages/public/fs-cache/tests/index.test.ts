jest.mock('fs/promises');
jest.unmock('../src');

import { Jimple } from '@homer0/jimple';
import * as originalFsPromises from 'fs/promises';
import type { Stats } from 'fs';
import { PathUtils } from '@homer0/path-utils';
import {
  FsCache,
  fsCache,
  fsCacheProvider,
  type FsCacheConstructorOptions,
} from '../src';
import { FsCacheEntryOptions } from '../src/types';

const fs = originalFsPromises as jest.Mocked<typeof originalFsPromises>;

describe('FsCache', () => {
  const resetFs = () => {
    fs.access.mockReset();
    fs.readFile.mockReset();
    fs.mkdir.mockReset();
    fs.writeFile.mockReset();
    fs.unlink.mockReset();
    fs.stat.mockReset();
  };

  const getPathUtils = (): [PathUtils, jest.Mocked<PathUtils['join']>] => {
    const joinFn = jest.fn((...paths: string[]) => paths.join('/'));
    class MyPathUtils extends PathUtils {
      override join(...paths: string[]): string {
        return joinFn(...paths);
      }
    }

    return [new MyPathUtils(), joinFn];
  };

  class FakeFsError extends Error {
    constructor(message: string, public code: string) {
      super(message);
    }
  }

  describe('class', () => {
    it('should be instantiated', () => {
      // Given/When
      const sut = new FsCache();
      // Then
      expect(sut).toBeInstanceOf(FsCache);
      expect(sut.getOptions()).toEqual({
        path: '.cache',
        defaultTTL: expect.any(Number),
        maxTTL: expect.any(Number),
        keepInMemory: true,
        extension: 'tmp',
      });
    });

    it('should be instantiated with custom options', () => {
      // Given
      const options: FsCacheConstructorOptions = {
        path: '.magic-cache',
        defaultTTL: 10,
        maxTTL: 100,
        keepInMemory: false,
        extension: 'magic',
      };
      // When
      const sut = new FsCache(options);
      // Then
      expect(sut).toBeInstanceOf(FsCache);
      expect(sut.getOptions()).toEqual(options);
    });

    it('should throw an error if the default TTL is greater than the max TTL', () => {
      // Given/When/Then
      expect(
        () =>
          new FsCache({
            defaultTTL: 100,
            maxTTL: 10,
          }),
      ).toThrow(/the default ttl cannot be greater than the max ttl/i);
    });

    it('should throw an error if the default TTL is less than 0', () => {
      // Given/When/Then
      expect(
        () =>
          new FsCache({
            defaultTTL: 0,
          }),
      ).toThrow(/the ttl cannot be less than or equal to zero/i);
    });

    describe('useEntry', () => {
      beforeEach(() => {
        resetFs();
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.runOnlyPendingTimers();
      });

      it('should skip the cache functionality', async () => {
        // Given
        const value = 'Batman';
        const initFn = jest.fn(() => Promise.resolve(value));
        const options: FsCacheEntryOptions = {
          key: value,
          init: initFn,
          skip: true,
        };
        // When
        const sut = new FsCache();
        const result = await sut.useEntry(options);
        // Then
        expect(result).toBe(value);
        expect(fs.access).toHaveBeenCalledTimes(0);
        expect(initFn).toHaveBeenCalledTimes(1);
      });

      it('should resolve all requests with a single promise', async () => {
        // Given
        const value = 'Batman';
        const initFn = jest.fn(() => Promise.resolve(value));
        const options: FsCacheEntryOptions = {
          key: value,
          init: initFn,
          skip: true,
        };
        // When
        const sut = new FsCache();
        const [resultOne, resultTwo] = await Promise.all([
          sut.useEntry(options),
          sut.useEntry(options),
        ]);
        // Then
        expect(resultOne).toBe(value);
        expect(resultTwo).toBe(value);
        expect(fs.access).toHaveBeenCalledTimes(0);
        expect(initFn).toHaveBeenCalledTimes(1);
      });

      it('should reject all requests when the init fails', async () => {
        // Given
        const message = 'Something went wrong!';
        const initFn = jest.fn(() => Promise.reject(new Error(message)));
        const options: FsCacheEntryOptions = {
          key: 'something',
          init: initFn,
          skip: true,
        };
        // When/Then
        const sut = new FsCache();
        await Promise.all([
          expect(sut.useEntry(options)).rejects.toThrow(message),
          expect(sut.useEntry(options)).rejects.toThrow(message),
        ]);
      });

      it('should cache a value in the fs', async () => {
        // Given
        const value = 'Rosario & Pilar';
        const initFn = jest.fn(() => Promise.resolve(value));
        const filename = 'daughters-fs';
        const [usePathUtils, joinFn] = getPathUtils();
        const sutOptions: FsCacheConstructorOptions = {
          inject: {
            pathUtils: usePathUtils,
          },
          path: '.cache',
          extension: 'tmp',
          keepInMemory: false,
        };
        const entryOptions: FsCacheEntryOptions = {
          key: filename,
          init: initFn,
        };
        // - Cache directory
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - Cache directory creation
        fs.mkdir.mockResolvedValueOnce('done');
        // - File check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - File creation
        fs.writeFile.mockResolvedValueOnce();
        const expectedFilename = `${filename}.${sutOptions.extension}`;
        const expectedFilepath = [sutOptions.path, expectedFilename].join('/');
        // When
        const sut = new FsCache(sutOptions);
        const result = await sut.useEntry(entryOptions);
        // Then
        expect(result).toBe(value);
        expect(joinFn).toHaveBeenCalledTimes(2);
        expect(joinFn).toHaveBeenNthCalledWith(1, sutOptions.path);
        expect(joinFn).toHaveBeenNthCalledWith(2, sutOptions.path, expectedFilename);
        expect(fs.access).toHaveBeenCalledTimes(2);
        expect(fs.access).toHaveBeenNthCalledWith(1, sutOptions.path);
        expect(fs.access).toHaveBeenNthCalledWith(2, expectedFilepath);
        expect(fs.mkdir).toHaveBeenCalledTimes(1);
        expect(fs.mkdir).toHaveBeenNthCalledWith(1, sutOptions.path);
        expect(fs.writeFile).toHaveBeenCalledTimes(1);
        expect(fs.writeFile).toHaveBeenCalledWith(expectedFilepath, value);
      });

      it('should cache a value in the fs and read it back', async () => {
        // Given
        const value = 'Rosario & Pilar';
        const initFn = jest.fn(() => Promise.resolve(value));
        const filename = 'daughters-fs-read';
        const [usePathUtils] = getPathUtils();
        const sutOptions: FsCacheConstructorOptions = {
          inject: {
            pathUtils: usePathUtils,
          },
          path: '.cache',
          extension: 'tmp',
          keepInMemory: false,
        };
        const entryOptions: FsCacheEntryOptions = {
          key: filename,
          init: initFn,
        };
        // - First cache directory check
        fs.access.mockResolvedValueOnce();
        // - First file check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - Second cache directory check
        fs.access.mockResolvedValueOnce();
        // - Second file check
        fs.access.mockResolvedValueOnce();
        // - File creation
        fs.writeFile.mockResolvedValueOnce();
        // - File stats for the second time
        fs.stat.mockResolvedValueOnce({
          mtimeMs: Date.now(),
        } as Stats);
        // - File read
        fs.readFile.mockResolvedValueOnce(value);
        const expectedFilename = `${filename}.${sutOptions.extension}`;
        const expectedFilepath = [sutOptions.path, expectedFilename].join('/');
        // When
        const sut = new FsCache(sutOptions);
        const resultOne = await sut.useEntry(entryOptions);
        const resultTwo = await sut.useEntry(entryOptions);
        // Then
        expect(resultOne).toBe(value);
        expect(resultTwo).toBe(value);
        expect(fs.access).toHaveBeenCalledTimes(4);
        expect(fs.access).toHaveBeenNthCalledWith(1, sutOptions.path);
        expect(fs.access).toHaveBeenNthCalledWith(2, expectedFilepath);
        expect(fs.access).toHaveBeenNthCalledWith(3, sutOptions.path);
        expect(fs.access).toHaveBeenNthCalledWith(4, expectedFilepath);
        expect(fs.mkdir).toHaveBeenCalledTimes(0);
        expect(fs.writeFile).toHaveBeenCalledTimes(1);
        expect(fs.writeFile).toHaveBeenCalledWith(expectedFilepath, value);
        expect(fs.readFile).toHaveBeenCalledTimes(1);
        expect(fs.readFile).toHaveBeenCalledWith(expectedFilepath, 'utf8');
      });

      it('should cache a value in the fs and memory', async () => {
        // Given
        const value = 'Rosario & Pilar';
        const initFn = jest.fn(() => Promise.resolve(value));
        const filename = 'daughters-fs-memory';
        const [usePathUtils] = getPathUtils();
        const sutOptions: FsCacheConstructorOptions = {
          inject: {
            pathUtils: usePathUtils,
          },
          path: '.cache',
          extension: 'tmp',
          keepInMemory: true,
        };
        const entryOptions: FsCacheEntryOptions = {
          key: filename,
          init: initFn,
        };
        // - Cache directory
        fs.access.mockResolvedValueOnce();
        // - First file check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - File creation
        fs.writeFile.mockResolvedValueOnce();
        const expectedFilename = `${filename}.${sutOptions.extension}`;
        const expectedFilepath = [sutOptions.path, expectedFilename].join('/');
        // When
        const sut = new FsCache(sutOptions);
        const resultOne = await sut.useEntry(entryOptions);
        const resultTwo = await sut.useEntry(entryOptions);
        // Then
        expect(resultOne).toBe(value);
        expect(resultTwo).toBe(value);
        expect(fs.access).toHaveBeenCalledTimes(2);
        expect(fs.access).toHaveBeenNthCalledWith(1, sutOptions.path);
        expect(fs.access).toHaveBeenNthCalledWith(2, expectedFilepath);
        expect(fs.writeFile).toHaveBeenCalledTimes(1);
        expect(fs.writeFile).toHaveBeenCalledWith(expectedFilepath, value);
        expect(fs.readFile).toHaveBeenCalledTimes(0);
      });

      it('should cache a value and delete it when it expires', async () => {
        // Given
        const value = 'Rosario & Pilar';
        const initFn = jest.fn(() => Promise.resolve(value));
        const filename = 'daughters-expires';
        const [usePathUtils] = getPathUtils();
        const sutOptions: FsCacheConstructorOptions = {
          inject: {
            pathUtils: usePathUtils,
          },
          path: '.cache',
          extension: 'tmp',
          keepInMemory: true,
        };
        const entryOptions: FsCacheEntryOptions = {
          key: filename,
          init: initFn,
        };
        // - First cache directory check
        fs.access.mockResolvedValueOnce();
        // - First file check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - Second cache directory check
        fs.access.mockResolvedValueOnce();
        // - Second file check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - First file creation
        fs.writeFile.mockResolvedValueOnce();
        // - Second file creation
        fs.writeFile.mockResolvedValueOnce();
        // - File deletion
        fs.unlink.mockResolvedValueOnce();
        const expectedFilename = `${filename}.${sutOptions.extension}`;
        const expectedFilepath = [sutOptions.path, expectedFilename].join('/');
        // When
        const sut = new FsCache(sutOptions);
        const resultOne = await sut.useEntry(entryOptions);
        jest.runAllTimers();
        const resultTwo = await sut.useEntry(entryOptions);
        // Then
        expect(resultOne).toBe(value);
        expect(resultTwo).toBe(value);
        expect(fs.access).toHaveBeenCalledTimes(4);
        expect(fs.access).toHaveBeenNthCalledWith(1, sutOptions.path);
        expect(fs.access).toHaveBeenNthCalledWith(2, expectedFilepath);
        expect(fs.access).toHaveBeenNthCalledWith(3, sutOptions.path);
        expect(fs.access).toHaveBeenNthCalledWith(4, expectedFilepath);
        expect(fs.writeFile).toHaveBeenCalledTimes(2);
        expect(fs.writeFile).toHaveBeenNthCalledWith(1, expectedFilepath, value);
        expect(fs.writeFile).toHaveBeenNthCalledWith(2, expectedFilepath, value);
        expect(fs.readFile).toHaveBeenCalledTimes(0);
        expect(fs.unlink).toHaveBeenCalledTimes(1);
        expect(fs.unlink).toHaveBeenCalledWith(expectedFilepath);
      });

      it("should manually expire an entry in case the timeout does't run", async () => {
        // Given
        const value = 'Rosario & Pilar';
        const initFn = jest.fn(() => Promise.resolve(value));
        const filename = 'daughters-expires';
        const [usePathUtils] = getPathUtils();
        const sutOptions: FsCacheConstructorOptions = {
          inject: {
            pathUtils: usePathUtils,
          },
          path: '.cache',
          extension: 'tmp',
          keepInMemory: false,
        };
        const entryOptions: FsCacheEntryOptions = {
          key: filename,
          init: initFn,
        };
        // - First cache directory check
        fs.access.mockResolvedValueOnce();
        // - First file check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - Second cache directory check
        fs.access.mockResolvedValueOnce();
        // - Second file check
        fs.access.mockResolvedValueOnce();
        // - First file creation
        fs.writeFile.mockResolvedValueOnce();
        // - File stats for the second time
        fs.stat.mockResolvedValueOnce({
          mtimeMs: 0,
        } as Stats);
        // - Second file creation
        fs.writeFile.mockResolvedValueOnce();
        // - File deletion
        fs.unlink.mockResolvedValueOnce();
        const expectedFilename = `${filename}.${sutOptions.extension}`;
        const expectedFilepath = [sutOptions.path, expectedFilename].join('/');
        // When
        const sut = new FsCache(sutOptions);
        const resultOne = await sut.useEntry(entryOptions);
        const resultTwo = await sut.useEntry(entryOptions);
        // Then
        expect(resultOne).toBe(value);
        expect(resultTwo).toBe(value);
        expect(fs.access).toHaveBeenCalledTimes(4);
        expect(fs.access).toHaveBeenNthCalledWith(1, sutOptions.path);
        expect(fs.access).toHaveBeenNthCalledWith(2, expectedFilepath);
        expect(fs.access).toHaveBeenNthCalledWith(3, sutOptions.path);
        expect(fs.access).toHaveBeenNthCalledWith(4, expectedFilepath);
        expect(fs.writeFile).toHaveBeenCalledTimes(2);
        expect(fs.writeFile).toHaveBeenNthCalledWith(1, expectedFilepath, value);
        expect(fs.writeFile).toHaveBeenNthCalledWith(2, expectedFilepath, value);
        expect(fs.readFile).toHaveBeenCalledTimes(0);
        expect(fs.stat).toHaveBeenCalledTimes(1);
        expect(fs.stat).toHaveBeenCalledWith(expectedFilepath);
      });

      it('should throw an error if the directory validation fails', async () => {
        // Given
        const message = 'Whoops!';
        const options = { key: 'key', init: () => Promise.resolve('') };
        // - Cache directory
        fs.access.mockRejectedValueOnce(new Error(message));
        // When/Then
        const sut = new FsCache();
        await Promise.all([
          expect(sut.useEntry(options)).rejects.toThrow(message),
          expect(sut.useEntry(options)).rejects.toThrow(message),
        ]);
      });

      it('should throw an error if the TTL is greater than the service max TTL', async () => {
        // Given
        const sut = new FsCache({
          maxTTL: 10,
          defaultTTL: 9,
        });
        // When/Then
        await expect(
          sut.useEntry({ key: 'key', ttl: 12, init: () => Promise.resolve('') }),
        ).rejects.toThrow(/the ttl cannot be greater than the service max ttl/i);
      });

      it('should throw an error if the TTL is less than 0', async () => {
        // Given
        const sut = new FsCache();
        // When/Then
        await expect(
          sut.useEntry({ key: 'key', ttl: -1, init: () => Promise.resolve('') }),
        ).rejects.toThrow(/the ttl cannot be less than or equal to zero/i);
      });
    });

    describe('useJSONEntry', () => {
      beforeEach(() => {
        resetFs();
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.runOnlyPendingTimers();
      });

      it('should cache a value in the fs', async () => {
        // Given
        const value = {
          daughters: ['Rosario', 'Pilar'],
        };
        const initFn = jest.fn(() => Promise.resolve(value));
        const filename = 'daughters-fs-json';
        const [usePathUtils] = getPathUtils();
        const sutOptions: FsCacheConstructorOptions = {
          inject: {
            pathUtils: usePathUtils,
          },
          path: '.cache',
          extension: 'tmp',
          keepInMemory: false,
        };
        const entryOptions: FsCacheEntryOptions<typeof value> = {
          key: filename,
          init: initFn,
        };
        // - Cache directory
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - Cache directory creation
        fs.mkdir.mockResolvedValueOnce('done');
        // - File check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - File creation
        fs.writeFile.mockResolvedValueOnce();
        const expectedFilename = `${filename}.${sutOptions.extension}`;
        const expectedFilepath = [sutOptions.path, expectedFilename].join('/');
        // When
        const sut = new FsCache(sutOptions);
        const result = await sut.useJSONEntry(entryOptions);
        // Then
        expect(result).toEqual(value);
        expect(fs.writeFile).toHaveBeenCalledTimes(1);
        expect(fs.writeFile).toHaveBeenCalledWith(
          expectedFilepath,
          JSON.stringify(value),
        );
      });

      it('should cache a value in the fs and read it back', async () => {
        // Given
        const value = {
          daughters: ['Rosario', 'Pilar'],
        };
        const valueJSON = JSON.stringify(value);
        const initFn = jest.fn(() => Promise.resolve(value));
        const filename = 'daughters-fs-json-read';
        const [usePathUtils] = getPathUtils();
        const sutOptions: FsCacheConstructorOptions = {
          inject: {
            pathUtils: usePathUtils,
          },
          path: '.cache',
          extension: 'tmp',
          keepInMemory: false,
        };
        const entryOptions: FsCacheEntryOptions<typeof value> = {
          key: filename,
          init: initFn,
        };
        // - First cache directory check
        fs.access.mockResolvedValueOnce();
        // - First file check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - Second cache directory check
        fs.access.mockResolvedValueOnce();
        // - Second file check
        fs.access.mockResolvedValueOnce();
        // - File creation
        fs.writeFile.mockResolvedValueOnce();
        // - File stats for the second time
        fs.stat.mockResolvedValueOnce({
          mtimeMs: Date.now(),
        } as Stats);
        // - File read
        fs.readFile.mockResolvedValueOnce(valueJSON);
        const expectedFilename = `${filename}.${sutOptions.extension}`;
        const expectedFilepath = [sutOptions.path, expectedFilename].join('/');
        // When
        const sut = new FsCache(sutOptions);
        const resultOne = await sut.useJSONEntry(entryOptions);
        const resultTwo = await sut.useJSONEntry(entryOptions);
        // Then
        expect(resultOne).toEqual(value);
        expect(resultTwo).toEqual(value);
        expect(fs.writeFile).toHaveBeenCalledTimes(1);
        expect(fs.writeFile).toHaveBeenCalledWith(expectedFilepath, valueJSON);
        expect(fs.readFile).toHaveBeenCalledTimes(1);
        expect(fs.readFile).toHaveBeenCalledWith(expectedFilepath, 'utf8');
      });
    });
  });

  describe('shorthand', () => {
    it('should have a shorthand function', () => {
      // Given/When/Then
      expect(fsCache()).toBeInstanceOf(FsCache);
    });
  });

  describe('provider', () => {
    it('should include a Jimple provider', () => {
      // Given
      const setFn = jest.fn();
      class Container extends Jimple {
        override set(...args: Parameters<Jimple['set']>) {
          setFn(...args);
          super.set(...args);
        }
      }
      const container = new Container();
      // When
      fsCacheProvider.register(container);
      const [[serviceName, serviceFn]] = setFn.mock.calls as [[string, () => FsCache]];
      const sut = serviceFn();
      // Then
      expect(serviceName).toBe('fsCache');
      expect(sut).toBeInstanceOf(FsCache);
    });

    it('should allow custom options on its provider', () => {
      // Given
      const getFn = jest.fn();
      const setFn = jest.fn();
      class Container extends Jimple {
        override get<T>(key: string): T {
          getFn(key);
          return super.get<T>(key);
        }
        override set(...args: Parameters<Jimple['set']>) {
          setFn(...args);
          super.set(...args);
        }
      }
      const container = new Container({
        pathUtils: new PathUtils(),
      });
      const providerServiceName = 'myFsCache';
      // When
      fsCacheProvider({
        serviceName: providerServiceName,
      }).register(container);
      const [, [serviceName, serviceFn]] = setFn.mock.calls as [
        [string, () => PathUtils],
        [string, () => FsCache],
      ];
      const sut = serviceFn();
      // Then
      expect(serviceName).toBe(providerServiceName);
      expect(sut).toBeInstanceOf(FsCache);
    });
  });
});
