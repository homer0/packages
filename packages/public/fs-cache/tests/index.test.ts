jest.mock('fs/promises');
jest.unmock('../src');

import { Jimple } from '@homer0/jimple';
import * as originalFsPromises from 'fs/promises';
import type { Stats, Dirent } from 'fs';
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
    fs.readdir.mockReset();
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
    constructor(
      message: string,
      public code: string,
    ) {
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

    describe('use', () => {
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
        const result = await sut.use(options);
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
          sut.use(options),
          sut.use(options),
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
        jest.useRealTimers();
        await Promise.all([
          expect(sut.use(options)).rejects.toThrow(message),
          expect(sut.use(options)).rejects.toThrow(message),
        ]);
        jest.useFakeTimers();
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
        const result = await sut.use(entryOptions);
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
        const resultOne = await sut.use(entryOptions);
        const resultTwo = await sut.use(entryOptions);
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
        const resultOne = await sut.use(entryOptions);
        const resultTwo = await sut.use(entryOptions);
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
        const resultOne = await sut.use(entryOptions);
        jest.runAllTimers();
        const resultTwo = await sut.use(entryOptions);
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

      it('should cache a value but not schedule the deletion for it when it expires', async () => {
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
          scheduleRemoval: false,
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
        // When
        const sut = new FsCache(sutOptions);
        const resultOne = await sut.use(entryOptions);
        jest.runAllTimers();
        const resultTwo = await sut.use(entryOptions);
        // Then
        expect(resultOne).toBe(value);
        expect(resultTwo).toBe(value);
        expect(fs.unlink).toHaveBeenCalledTimes(0);
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
        const resultOne = await sut.use(entryOptions);
        const resultTwo = await sut.use(entryOptions);
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
        jest.useRealTimers();
        await Promise.all([
          expect(sut.use(options)).rejects.toThrow(message),
          expect(sut.use(options)).rejects.toThrow(message),
        ]);
        jest.useFakeTimers();
      });

      it('should throw an error if the TTL is greater than the service max TTL', async () => {
        // Given
        const sut = new FsCache({
          maxTTL: 10,
          defaultTTL: 9,
        });
        // When/Then
        await expect(
          sut.use({ key: 'key', ttl: 12, init: () => Promise.resolve('') }),
        ).rejects.toThrow(/the ttl cannot be greater than the service max ttl/i);
      });

      it('should throw an error if the TTL is less than 0', async () => {
        // Given
        const sut = new FsCache();
        // When/Then
        await expect(
          sut.use({ key: 'key', ttl: -1, init: () => Promise.resolve('') }),
        ).rejects.toThrow(/the ttl cannot be less than or equal to zero/i);
      });
    });

    describe('useJSON', () => {
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
        const result = await sut.useJSON(entryOptions);
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
        const resultOne = await sut.useJSON(entryOptions);
        const resultTwo = await sut.useJSON(entryOptions);
        // Then
        expect(resultOne).toEqual(value);
        expect(resultTwo).toEqual(value);
        expect(fs.writeFile).toHaveBeenCalledTimes(1);
        expect(fs.writeFile).toHaveBeenCalledWith(expectedFilepath, valueJSON);
        expect(fs.readFile).toHaveBeenCalledTimes(1);
        expect(fs.readFile).toHaveBeenCalledWith(expectedFilepath, 'utf8');
      });
    });

    describe('removeFromMemory', () => {
      beforeEach(() => {
        resetFs();
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.runOnlyPendingTimers();
      });

      it('should remove an entry from the memory and the fs', async () => {
        // Given
        const value = 'Rosario & Pilar';
        const initFn = jest.fn(() => Promise.resolve(value));
        const filename = 'daughters-fs-remove';
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
        fs.access.mockResolvedValueOnce();
        // - File stats for removal check
        fs.stat.mockResolvedValueOnce({
          mtimeMs: 0,
        } as Stats);
        // - File stats for the second time
        fs.stat.mockResolvedValueOnce({
          mtimeMs: Date.now(),
        } as Stats);
        // - File deletion
        fs.unlink.mockResolvedValueOnce();
        // - File creation
        fs.writeFile.mockResolvedValueOnce();
        // - File read
        fs.readFile.mockResolvedValueOnce(value);
        const expectedFilename = `${filename}.${sutOptions.extension}`;
        const expectedFilepath = [sutOptions.path, expectedFilename].join('/');
        // When
        const sut = new FsCache(sutOptions);
        const resultOne = await sut.use(entryOptions);
        const resultTwo = await sut.use(entryOptions);
        await sut.removeFromMemory(entryOptions.key);
        const resultThree = await sut.use(entryOptions);
        // Then
        expect(resultOne).toBe(value);
        expect(resultTwo).toBe(value);
        expect(resultThree).toBe(value);
        expect(fs.access).toHaveBeenCalledTimes(5);
        expect(fs.access).toHaveBeenNthCalledWith(1, sutOptions.path);
        expect(fs.access).toHaveBeenNthCalledWith(2, expectedFilepath);
        expect(fs.access).toHaveBeenNthCalledWith(3, expectedFilepath);
        expect(fs.access).toHaveBeenNthCalledWith(4, sutOptions.path);
        expect(fs.access).toHaveBeenNthCalledWith(5, expectedFilepath);
        expect(fs.stat).toHaveBeenCalledTimes(2);
        expect(fs.stat).toHaveBeenNthCalledWith(1, expectedFilepath);
        expect(fs.stat).toHaveBeenNthCalledWith(2, expectedFilepath);
        expect(fs.unlink).toHaveBeenCalledTimes(1);
        expect(fs.unlink).toHaveBeenCalledWith(expectedFilepath);
        expect(fs.writeFile).toHaveBeenCalledTimes(1);
        expect(fs.writeFile).toHaveBeenCalledWith(expectedFilepath, value);
      });

      it('should remove an entry from the memory but not the fs', async () => {
        // Given
        const value = 'Rosario & Pilar';
        const initFn = jest.fn(() => Promise.resolve(value));
        const filename = 'daughters-fs-remove';
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
        fs.access.mockResolvedValueOnce();
        // - File stats for removal check
        fs.stat.mockResolvedValueOnce({
          mtimeMs: Date.now(),
        } as Stats);
        // - File creation
        fs.writeFile.mockResolvedValueOnce();
        // - File read
        fs.readFile.mockResolvedValueOnce(value);
        const expectedFilename = `${filename}.${sutOptions.extension}`;
        const expectedFilepath = [sutOptions.path, expectedFilename].join('/');
        // When
        const sut = new FsCache(sutOptions);
        const resultOne = await sut.use(entryOptions);
        const resultTwo = await sut.use(entryOptions);
        await sut.removeFromMemory(entryOptions.key, {
          includeFs: false,
        });
        const resultThree = await sut.use(entryOptions);
        // Then
        expect(resultOne).toBe(value);
        expect(resultTwo).toBe(value);
        expect(resultThree).toBe(value);
        expect(fs.unlink).toHaveBeenCalledTimes(0);
        expect(fs.writeFile).toHaveBeenCalledTimes(1);
        expect(fs.writeFile).toHaveBeenCalledWith(expectedFilepath, value);
        expect(fs.readFile).toHaveBeenCalledTimes(1);
        expect(fs.readFile).toHaveBeenCalledWith(expectedFilepath, 'utf8');
      });
    });

    describe('removeFile', () => {
      beforeEach(() => {
        resetFs();
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.runOnlyPendingTimers();
      });

      it('should remove an entry from the fs and the memory', async () => {
        // Given
        const value = 'Rosario & Pilar';
        const initFn = jest.fn(() => Promise.resolve(value));
        const filename = 'daughters-fs-remove';
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
        fs.access.mockResolvedValueOnce();
        // - File stats for removal check
        fs.stat.mockResolvedValueOnce({
          mtimeMs: 0,
        } as Stats);
        // - File stats for the second time
        fs.stat.mockResolvedValueOnce({
          mtimeMs: Date.now(),
        } as Stats);
        // - File deletion
        fs.unlink.mockResolvedValueOnce();
        // - File creation
        fs.writeFile.mockResolvedValueOnce();
        // - File read
        fs.readFile.mockResolvedValueOnce(value);
        const expectedFilename = `${filename}.${sutOptions.extension}`;
        const expectedFilepath = [sutOptions.path, expectedFilename].join('/');
        // When
        const sut = new FsCache(sutOptions);
        const resultOne = await sut.use(entryOptions);
        const resultTwo = await sut.use(entryOptions);
        await sut.removeFromFs(entryOptions.key);
        const resultThree = await sut.use(entryOptions);
        // Then
        expect(resultOne).toBe(value);
        expect(resultTwo).toBe(value);
        expect(resultThree).toBe(value);
        expect(fs.access).toHaveBeenCalledTimes(5);
        expect(fs.access).toHaveBeenNthCalledWith(1, sutOptions.path);
        expect(fs.access).toHaveBeenNthCalledWith(2, expectedFilepath);
        expect(fs.access).toHaveBeenNthCalledWith(3, expectedFilepath);
        expect(fs.access).toHaveBeenNthCalledWith(4, sutOptions.path);
        expect(fs.access).toHaveBeenNthCalledWith(5, expectedFilepath);
        expect(fs.stat).toHaveBeenCalledTimes(2);
        expect(fs.stat).toHaveBeenNthCalledWith(1, expectedFilepath);
        expect(fs.stat).toHaveBeenNthCalledWith(2, expectedFilepath);
        expect(fs.unlink).toHaveBeenCalledTimes(1);
        expect(fs.unlink).toHaveBeenCalledWith(expectedFilepath);
        expect(fs.writeFile).toHaveBeenCalledTimes(1);
        expect(fs.writeFile).toHaveBeenCalledWith(expectedFilepath, value);
      });

      it('should remove an entry from the memory but not the memory', async () => {
        // Given
        const value = 'Rosario & Pilar';
        const initFn = jest.fn(() => Promise.resolve(value));
        const filename = 'daughters-fs-remove';
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
        // - Second file check
        fs.access.mockResolvedValueOnce();
        // - File stats for removal check
        fs.stat.mockResolvedValueOnce({
          mtimeMs: 0,
        } as Stats);
        // - File deletion
        fs.unlink.mockResolvedValueOnce();
        // - File creation
        fs.writeFile.mockResolvedValueOnce();
        // - File read
        fs.readFile.mockResolvedValueOnce(value);
        const expectedFilename = `${filename}.${sutOptions.extension}`;
        const expectedFilepath = [sutOptions.path, expectedFilename].join('/');
        // When
        const sut = new FsCache(sutOptions);
        const resultOne = await sut.use(entryOptions);
        const resultTwo = await sut.use(entryOptions);
        await sut.removeFromFs(entryOptions.key, {
          includeMemory: false,
        });
        const resultThree = await sut.use(entryOptions);
        // Then
        expect(resultOne).toBe(value);
        expect(resultTwo).toBe(value);
        expect(resultThree).toBe(value);
        expect(fs.access).toHaveBeenCalledTimes(3);
        expect(fs.access).toHaveBeenNthCalledWith(1, sutOptions.path);
        expect(fs.access).toHaveBeenNthCalledWith(2, expectedFilepath);
        expect(fs.access).toHaveBeenNthCalledWith(3, expectedFilepath);
        expect(fs.stat).toHaveBeenCalledTimes(1);
        expect(fs.stat).toHaveBeenNthCalledWith(1, expectedFilepath);
        expect(fs.unlink).toHaveBeenCalledTimes(1);
        expect(fs.unlink).toHaveBeenCalledWith(expectedFilepath);
        expect(fs.writeFile).toHaveBeenCalledTimes(1);
        expect(fs.writeFile).toHaveBeenCalledWith(expectedFilepath, value);
      });

      it('should provide file information before removing a file', async () => {
        // Given
        const value = 'Rosario & Pilar';
        const initFn = jest.fn(() => Promise.resolve(value));
        const filename = 'daughters-fs-remove';
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
        const shouldRemove = jest.fn(() => true);
        // - First cache directory check
        fs.access.mockResolvedValueOnce();
        // - First file check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - Second file check
        fs.access.mockResolvedValueOnce();
        // - File stats for removal check
        fs.stat.mockResolvedValueOnce({
          mtimeMs: 0,
        } as Stats);
        // - File deletion
        fs.unlink.mockResolvedValueOnce();
        // - File creation
        fs.writeFile.mockResolvedValueOnce();
        // - File read
        fs.readFile.mockResolvedValueOnce(value);
        const expectedFilename = `${filename}.${sutOptions.extension}`;
        const expectedFilepath = [sutOptions.path, expectedFilename].join('/');
        // When
        const sut = new FsCache(sutOptions);
        const resultOne = await sut.use(entryOptions);
        await sut.removeFromFs(entryOptions.key, {
          includeMemory: false,
          shouldRemove,
        });
        const resultTwo = await sut.use(entryOptions);
        // Then
        expect(resultOne).toBe(value);
        expect(resultTwo).toBe(value);
        expect(shouldRemove).toHaveBeenCalledTimes(1);
        expect(shouldRemove).toHaveBeenCalledWith(
          expect.objectContaining({
            key: entryOptions.key,
            filename: expectedFilename,
            filepath: expectedFilepath,
            mtime: 0,
            expired: true,
          }),
        );
        expect(fs.unlink).toHaveBeenCalledTimes(1);
        expect(fs.unlink).toHaveBeenCalledWith(expectedFilepath);
      });

      it('should prevent a file deletion', async () => {
        // Given
        const value = 'Rosario & Pilar';
        const initFn = jest.fn(() => Promise.resolve(value));
        const filename = 'daughters-fs-remove';
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
        const shouldRemove = jest.fn(() => Promise.resolve(false));
        // - First cache directory check
        fs.access.mockResolvedValueOnce();
        // - First file check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - Second file check
        fs.access.mockResolvedValueOnce();
        // - File stats for removal check
        fs.stat.mockResolvedValueOnce({
          mtimeMs: 0,
        } as Stats);
        // - File creation
        fs.writeFile.mockResolvedValueOnce();
        // - File read
        fs.readFile.mockResolvedValueOnce(value);
        const expectedFilename = `${filename}.${sutOptions.extension}`;
        const expectedFilepath = [sutOptions.path, expectedFilename].join('/');
        // When
        const sut = new FsCache(sutOptions);
        const resultOne = await sut.use(entryOptions);
        await sut.removeFromFs(entryOptions.key, {
          includeMemory: false,
          shouldRemove,
        });
        const resultTwo = await sut.use(entryOptions);
        // Then
        expect(resultOne).toBe(value);
        expect(resultTwo).toBe(value);
        expect(shouldRemove).toHaveBeenCalledTimes(1);
        expect(shouldRemove).toHaveBeenCalledWith(
          expect.objectContaining({
            key: entryOptions.key,
            filename: expectedFilename,
            filepath: expectedFilepath,
            mtime: 0,
            expired: true,
          }),
        );
        expect(fs.unlink).toHaveBeenCalledTimes(0);
      });
    });

    describe('remove', () => {
      beforeEach(() => {
        resetFs();
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.runOnlyPendingTimers();
      });

      it('should remove an entry from the fs and the memory', async () => {
        // Given
        const value = 'Rosario & Pilar';
        const initFn = jest.fn(() => Promise.resolve(value));
        const filename = 'daughters-fs-remove';
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
        fs.access.mockResolvedValueOnce();
        // - File stats for removal check
        fs.stat.mockResolvedValueOnce({
          mtimeMs: 0,
        } as Stats);
        // - File stats for the second time
        fs.stat.mockResolvedValueOnce({
          mtimeMs: Date.now(),
        } as Stats);
        // - File deletion
        fs.unlink.mockResolvedValueOnce();
        // - File creation
        fs.writeFile.mockResolvedValueOnce();
        // - File read
        fs.readFile.mockResolvedValueOnce(value);
        const expectedFilename = `${filename}.${sutOptions.extension}`;
        const expectedFilepath = [sutOptions.path, expectedFilename].join('/');
        // When
        const sut = new FsCache(sutOptions);
        const resultOne = await sut.use(entryOptions);
        const resultTwo = await sut.use(entryOptions);
        await sut.remove(entryOptions.key);
        const resultThree = await sut.use(entryOptions);
        // Then
        expect(resultOne).toBe(value);
        expect(resultTwo).toBe(value);
        expect(resultThree).toBe(value);
        expect(fs.unlink).toHaveBeenCalledTimes(1);
        expect(fs.unlink).toHaveBeenCalledWith(expectedFilepath);
      });

      it('should remove an entry from the fs and the memory with custom extension', async () => {
        // Given
        const value = 'Rosario & Pilar';
        const initFn = jest.fn(() => Promise.resolve(value));
        const filename = 'daughters-fs-remove';
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
        const extension = 'cache';
        // - First cache directory check
        fs.access.mockResolvedValueOnce();
        // - First file check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - Second cache directory check
        fs.access.mockResolvedValueOnce();
        // - Second file check
        fs.access.mockResolvedValueOnce();
        // - File stats for removal check
        fs.stat.mockResolvedValueOnce({
          mtimeMs: 0,
        } as Stats);
        // - File stats for the second time
        fs.stat.mockResolvedValueOnce({
          mtimeMs: Date.now(),
        } as Stats);
        // - File deletion
        fs.unlink.mockResolvedValueOnce();
        // - File creation
        fs.writeFile.mockResolvedValueOnce();
        // - File read
        fs.readFile.mockResolvedValueOnce(value);
        const expectedFilename = `${filename}.${extension}`;
        const expectedFilepath = [sutOptions.path, expectedFilename].join('/');
        // When
        const sut = new FsCache(sutOptions);
        const resultOne = await sut.use(entryOptions);
        const resultTwo = await sut.use(entryOptions);
        await sut.remove(entryOptions.key, { extension });
        const resultThree = await sut.use(entryOptions);
        // Then
        expect(resultOne).toBe(value);
        expect(resultTwo).toBe(value);
        expect(resultThree).toBe(value);
        expect(fs.unlink).toHaveBeenCalledTimes(1);
        expect(fs.unlink).toHaveBeenCalledWith(expectedFilepath);
      });
    });

    describe('cleanMemory', () => {
      beforeEach(() => {
        resetFs();
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.runOnlyPendingTimers();
      });

      it('should remove all entries from the memory and the fs', async () => {
        // Given
        const valueOne = 'Rosario & Pilar';
        const initFnOne = jest.fn(() => Promise.resolve(valueOne));
        const filenameOne = 'daughters-fs-clean-one';
        const valueTwo = 'Pilar & Rosario';
        const initFnTwo = jest.fn(() => Promise.resolve(valueTwo));
        const filenameTwo = 'daughters-fs-clean-two';
        const [usePathUtils] = getPathUtils();
        const sutOptions: FsCacheConstructorOptions = {
          inject: {
            pathUtils: usePathUtils,
          },
          path: '.cache',
          extension: 'tmp',
          keepInMemory: true,
        };
        const entryOptionsOne: FsCacheEntryOptions = {
          key: filenameOne,
          init: initFnOne,
        };
        const entryOptionsTwo: FsCacheEntryOptions = {
          key: filenameTwo,
          init: initFnTwo,
        };
        // - First file, first cache directory check
        fs.access.mockResolvedValueOnce();
        // - First file, first check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - First file creation
        fs.writeFile.mockResolvedValueOnce();
        // - Second file, first cache directory check
        fs.access.mockResolvedValueOnce();
        // - Second file, first check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - Second file creation
        fs.writeFile.mockResolvedValueOnce();
        // - First file, deletion check
        fs.access.mockResolvedValueOnce();
        // - First file, stats for removal check
        fs.stat.mockResolvedValueOnce({
          mtimeMs: 0,
        } as Stats);
        // - Second file, deletion check
        fs.access.mockResolvedValueOnce();
        // - Second file, stats for removal check
        fs.stat.mockResolvedValueOnce({
          mtimeMs: 0,
        } as Stats);
        // - First File, deletion
        fs.unlink.mockResolvedValueOnce();
        // - Second File, deletion
        fs.unlink.mockResolvedValueOnce();
        // - First file, second cache directory check
        fs.access.mockResolvedValueOnce();
        // - First file, second check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - First file, second creation
        fs.writeFile.mockResolvedValueOnce();
        // - Second file, second cache directory check
        fs.access.mockResolvedValueOnce();
        // - Second file, second check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - Second file, second creation
        fs.writeFile.mockResolvedValueOnce();
        const expectedFilenameOne = `${filenameOne}.${sutOptions.extension}`;
        const expectedFilepathOne = [sutOptions.path, expectedFilenameOne].join('/');
        const expectedFilenameTwo = `${filenameTwo}.${sutOptions.extension}`;
        const expectedFilepathTwo = [sutOptions.path, expectedFilenameTwo].join('/');
        // When
        const sut = new FsCache(sutOptions);
        const resultOneFileOne = await sut.use(entryOptionsOne);
        const resultOneFileTwo = await sut.use(entryOptionsTwo);
        await sut.cleanMemory();
        const resultTwoFileOne = await sut.use(entryOptionsOne);
        const resultTwoFileTwo = await sut.use(entryOptionsTwo);
        // Then
        expect(resultOneFileOne).toBe(valueOne);
        expect(resultOneFileTwo).toBe(valueTwo);
        expect(resultTwoFileOne).toBe(valueOne);
        expect(resultTwoFileTwo).toBe(valueTwo);
        expect(fs.access).toHaveBeenCalledTimes(10);
        expect(fs.access).toHaveBeenNthCalledWith(1, sutOptions.path);
        expect(fs.access).toHaveBeenNthCalledWith(2, expectedFilepathOne);
        expect(fs.access).toHaveBeenNthCalledWith(3, sutOptions.path);
        expect(fs.access).toHaveBeenNthCalledWith(4, expectedFilepathTwo);
        expect(fs.access).toHaveBeenNthCalledWith(5, expectedFilepathOne);
        expect(fs.access).toHaveBeenNthCalledWith(6, expectedFilepathTwo);
        expect(fs.access).toHaveBeenNthCalledWith(7, sutOptions.path);
        expect(fs.access).toHaveBeenNthCalledWith(8, expectedFilepathOne);
        expect(fs.access).toHaveBeenNthCalledWith(9, sutOptions.path);
        expect(fs.access).toHaveBeenNthCalledWith(10, expectedFilepathTwo);
        expect(fs.stat).toHaveBeenCalledTimes(2);
        expect(fs.stat).toHaveBeenNthCalledWith(1, expectedFilepathOne);
        expect(fs.stat).toHaveBeenNthCalledWith(2, expectedFilepathTwo);
        expect(fs.unlink).toHaveBeenCalledTimes(2);
        expect(fs.unlink).toHaveBeenNthCalledWith(1, expectedFilepathOne);
        expect(fs.unlink).toHaveBeenNthCalledWith(2, expectedFilepathTwo);
        expect(fs.writeFile).toHaveBeenCalledTimes(4);
        expect(fs.writeFile).toHaveBeenNthCalledWith(1, expectedFilepathOne, valueOne);
        expect(fs.writeFile).toHaveBeenNthCalledWith(2, expectedFilepathTwo, valueTwo);
        expect(fs.writeFile).toHaveBeenNthCalledWith(3, expectedFilepathOne, valueOne);
        expect(fs.writeFile).toHaveBeenNthCalledWith(4, expectedFilepathTwo, valueTwo);
      });

      it('should remove all entries from the memory but not the fs', async () => {
        // Given
        const valueOne = 'Rosario & Pilar';
        const initFnOne = jest.fn(() => Promise.resolve(valueOne));
        const filenameOne = 'daughters-fs-clean-one';
        const valueTwo = 'Pilar & Rosario';
        const initFnTwo = jest.fn(() => Promise.resolve(valueTwo));
        const filenameTwo = 'daughters-fs-clean-two';
        const [usePathUtils] = getPathUtils();
        const sutOptions: FsCacheConstructorOptions = {
          inject: {
            pathUtils: usePathUtils,
          },
          path: '.cache',
          extension: 'tmp',
          keepInMemory: true,
        };
        const entryOptionsOne: FsCacheEntryOptions = {
          key: filenameOne,
          init: initFnOne,
        };
        const entryOptionsTwo: FsCacheEntryOptions = {
          key: filenameTwo,
          init: initFnTwo,
        };
        // - First file, first cache directory check
        fs.access.mockResolvedValueOnce();
        // - First file, first check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - First file creation
        fs.writeFile.mockResolvedValueOnce();
        // - Second file, first cache directory check
        fs.access.mockResolvedValueOnce();
        // - Second file, first check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - First file, second cache directory check
        fs.access.mockResolvedValueOnce();
        // - Second file creation
        fs.writeFile.mockResolvedValueOnce();
        // - First file, read check
        fs.access.mockResolvedValueOnce();
        // - First file, stats for reading
        fs.stat.mockResolvedValueOnce({
          mtimeMs: Date.now(),
        } as Stats);
        // - First file, reading
        fs.readFile.mockResolvedValueOnce(valueOne);
        // - Second file, read check
        fs.access.mockResolvedValueOnce();
        // - Second file, stats for reading
        fs.stat.mockResolvedValueOnce({
          mtimeMs: Date.now(),
        } as Stats);
        // - Second file, reading
        fs.readFile.mockResolvedValueOnce(valueTwo);
        const expectedFilenameOne = `${filenameOne}.${sutOptions.extension}`;
        const expectedFilepathOne = [sutOptions.path, expectedFilenameOne].join('/');
        const expectedFilenameTwo = `${filenameTwo}.${sutOptions.extension}`;
        const expectedFilepathTwo = [sutOptions.path, expectedFilenameTwo].join('/');
        // When
        const sut = new FsCache(sutOptions);
        const resultOneFileOne = await sut.use(entryOptionsOne);
        const resultOneFileTwo = await sut.use(entryOptionsTwo);
        await sut.cleanMemory({
          includeFs: false,
        });
        const resultTwoFileOne = await sut.use(entryOptionsOne);
        const resultTwoFileTwo = await sut.use(entryOptionsTwo);
        // Then
        expect(resultOneFileOne).toBe(valueOne);
        expect(resultOneFileTwo).toBe(valueTwo);
        expect(resultTwoFileOne).toBe(valueOne);
        expect(resultTwoFileTwo).toBe(valueTwo);
        expect(fs.unlink).toHaveBeenCalledTimes(0);
        expect(fs.writeFile).toHaveBeenCalledTimes(2);
        expect(fs.writeFile).toHaveBeenNthCalledWith(1, expectedFilepathOne, valueOne);
        expect(fs.writeFile).toHaveBeenNthCalledWith(2, expectedFilepathTwo, valueTwo);
        expect(fs.readFile).toHaveBeenCalledTimes(2);
        expect(fs.readFile).toHaveBeenNthCalledWith(1, expectedFilepathOne, 'utf8');
        expect(fs.readFile).toHaveBeenNthCalledWith(2, expectedFilepathTwo, 'utf8');
      });
    });

    describe('cleanFs', () => {
      beforeEach(() => {
        resetFs();
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.runOnlyPendingTimers();
      });

      it('should remove all entries from the fs and the memory', async () => {
        // Given
        const valueOne = 'Rosario & Pilar';
        const initFnOne = jest.fn(() => Promise.resolve(valueOne));
        const filenameOne = 'daughters-fs-clean-one';
        const valueTwo = 'Pilar & Rosario';
        const initFnTwo = jest.fn(() => Promise.resolve(valueTwo));
        const filenameTwo = 'daughters-fs-clean-two';
        const [usePathUtils] = getPathUtils();
        const sutOptions: FsCacheConstructorOptions = {
          inject: {
            pathUtils: usePathUtils,
          },
          path: '.cache',
          extension: 'tmp',
          keepInMemory: true,
        };
        const entryOptionsOne: FsCacheEntryOptions = {
          key: filenameOne,
          init: initFnOne,
        };
        const entryOptionsTwo: FsCacheEntryOptions = {
          key: filenameTwo,
          init: initFnTwo,
        };
        // - First file, first cache directory check
        fs.access.mockResolvedValueOnce();
        // - First file, first check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - First file creation
        fs.writeFile.mockResolvedValueOnce();
        // - Second file, first cache directory check
        fs.access.mockResolvedValueOnce();
        // - Second file, first check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - Second file creation
        fs.writeFile.mockResolvedValueOnce();
        // - Read cache dir
        fs.readdir.mockResolvedValueOnce([
          `${filenameOne}.${sutOptions.extension}`,
          `${filenameTwo}.${sutOptions.extension}`,
        ] as unknown as Dirent[]);
        // - First file, deletion check
        fs.access.mockResolvedValueOnce();
        // - First file, stats for removal check
        fs.stat.mockResolvedValueOnce({
          mtimeMs: 0,
        } as Stats);
        // - Second file, deletion check
        fs.access.mockResolvedValueOnce();
        // - Second file, stats for removal check
        fs.stat.mockResolvedValueOnce({
          mtimeMs: 0,
        } as Stats);
        // - First File, deletion
        fs.unlink.mockResolvedValueOnce();
        // - Second File, deletion
        fs.unlink.mockResolvedValueOnce();
        // - First file, second cache directory check
        fs.access.mockResolvedValueOnce();
        // - First file, second check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - First file, second creation
        fs.writeFile.mockResolvedValueOnce();
        // - Second file, second cache directory check
        fs.access.mockResolvedValueOnce();
        // - Second file, second check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - Second file, second creation
        fs.writeFile.mockResolvedValueOnce();
        const expectedFilenameOne = `${filenameOne}.${sutOptions.extension}`;
        const expectedFilepathOne = [sutOptions.path, expectedFilenameOne].join('/');
        const expectedFilenameTwo = `${filenameTwo}.${sutOptions.extension}`;
        const expectedFilepathTwo = [sutOptions.path, expectedFilenameTwo].join('/');
        // When
        const sut = new FsCache(sutOptions);
        const resultOneFileOne = await sut.use(entryOptionsOne);
        const resultOneFileTwo = await sut.use(entryOptionsTwo);
        await sut.cleanFs();
        const resultTwoFileOne = await sut.use(entryOptionsOne);
        const resultTwoFileTwo = await sut.use(entryOptionsTwo);
        // Then
        expect(resultOneFileOne).toBe(valueOne);
        expect(resultOneFileTwo).toBe(valueTwo);
        expect(resultTwoFileOne).toBe(valueOne);
        expect(resultTwoFileTwo).toBe(valueTwo);
        expect(fs.readdir).toHaveBeenCalledTimes(1);
        expect(fs.readdir).toHaveBeenCalledWith(sutOptions.path);
        expect(fs.unlink).toHaveBeenCalledTimes(2);
        expect(fs.unlink).toHaveBeenNthCalledWith(1, expectedFilepathOne);
        expect(fs.unlink).toHaveBeenNthCalledWith(2, expectedFilepathTwo);
        expect(fs.writeFile).toHaveBeenCalledTimes(4);
        expect(fs.writeFile).toHaveBeenNthCalledWith(1, expectedFilepathOne, valueOne);
        expect(fs.writeFile).toHaveBeenNthCalledWith(2, expectedFilepathTwo, valueTwo);
        expect(fs.writeFile).toHaveBeenNthCalledWith(3, expectedFilepathOne, valueOne);
        expect(fs.writeFile).toHaveBeenNthCalledWith(4, expectedFilepathTwo, valueTwo);
      });

      it('should remove all entries from the fs but not the memory', async () => {
        // Given
        const valueOne = 'Rosario & Pilar';
        const initFnOne = jest.fn(() => Promise.resolve(valueOne));
        const filenameOne = 'daughters-fs-clean-one';
        const valueTwo = 'Pilar & Rosario';
        const initFnTwo = jest.fn(() => Promise.resolve(valueTwo));
        const filenameTwo = 'daughters-fs-clean-two';
        const [usePathUtils] = getPathUtils();
        const sutOptions: FsCacheConstructorOptions = {
          inject: {
            pathUtils: usePathUtils,
          },
          path: '.cache',
          extension: 'tmp',
          keepInMemory: true,
        };
        const entryOptionsOne: FsCacheEntryOptions = {
          key: filenameOne,
          init: initFnOne,
        };
        const entryOptionsTwo: FsCacheEntryOptions = {
          key: filenameTwo,
          init: initFnTwo,
        };
        const shouldRemove = jest.fn(() => true);
        // - First file, first cache directory check
        fs.access.mockResolvedValueOnce();
        // - First file, first check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - First file creation
        fs.writeFile.mockResolvedValueOnce();
        // - Second file, first cache directory check
        fs.access.mockResolvedValueOnce();
        // - Second file, first check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - Second file creation
        fs.writeFile.mockResolvedValueOnce();
        // - Read cache dir
        fs.readdir.mockResolvedValueOnce([
          `${filenameOne}.${sutOptions.extension}`,
          `${filenameTwo}.${sutOptions.extension}`,
        ] as unknown as Dirent[]);
        // - First file, deletion check
        fs.access.mockResolvedValueOnce();
        // - First file, stats for removal check
        fs.stat.mockResolvedValueOnce({
          mtimeMs: 0,
        } as Stats);
        // - Second file, deletion check
        fs.access.mockResolvedValueOnce();
        // - Second file, stats for removal check
        const secondFileMTime = Date.now();
        fs.stat.mockResolvedValueOnce({
          mtimeMs: secondFileMTime,
        } as Stats);
        // - First File, deletion
        fs.unlink.mockResolvedValueOnce();
        // - Second File, deletion
        fs.unlink.mockResolvedValueOnce();
        const expectedFilenameOne = `${filenameOne}.${sutOptions.extension}`;
        const expectedFilepathOne = [sutOptions.path, expectedFilenameOne].join('/');
        const expectedFilenameTwo = `${filenameTwo}.${sutOptions.extension}`;
        const expectedFilepathTwo = [sutOptions.path, expectedFilenameTwo].join('/');
        // When
        const sut = new FsCache(sutOptions);
        const resultOneFileOne = await sut.use(entryOptionsOne);
        const resultOneFileTwo = await sut.use(entryOptionsTwo);
        await sut.cleanFs({
          includeMemory: false,
          shouldRemove,
        });
        const resultTwoFileOne = await sut.use(entryOptionsOne);
        const resultTwoFileTwo = await sut.use(entryOptionsTwo);
        // Then
        expect(resultOneFileOne).toBe(valueOne);
        expect(resultOneFileTwo).toBe(valueTwo);
        expect(resultTwoFileOne).toBe(valueOne);
        expect(resultTwoFileTwo).toBe(valueTwo);
        expect(fs.readdir).toHaveBeenCalledTimes(1);
        expect(fs.readdir).toHaveBeenCalledWith(sutOptions.path);
        expect(fs.unlink).toHaveBeenCalledTimes(2);
        expect(fs.unlink).toHaveBeenNthCalledWith(1, expectedFilepathOne);
        expect(fs.unlink).toHaveBeenNthCalledWith(2, expectedFilepathTwo);
        expect(fs.writeFile).toHaveBeenCalledTimes(2);
        expect(fs.writeFile).toHaveBeenNthCalledWith(1, expectedFilepathOne, valueOne);
        expect(fs.writeFile).toHaveBeenNthCalledWith(2, expectedFilepathTwo, valueTwo);
        expect(shouldRemove).toHaveBeenCalledTimes(2);
        expect(shouldRemove).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({
            key: entryOptionsOne.key,
            filename: expectedFilenameOne,
            filepath: expectedFilepathOne,
            mtime: 0,
            expired: true,
          }),
        );
        expect(shouldRemove).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({
            key: entryOptionsTwo.key,
            filename: expectedFilenameTwo,
            filepath: expectedFilepathTwo,
            mtime: secondFileMTime,
            expired: false,
          }),
        );
      });
    });
    describe('clean', () => {
      beforeEach(() => {
        resetFs();
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.runOnlyPendingTimers();
      });

      it('should remove all entries from the fs and the memory', async () => {
        // Given
        const valueOne = 'Rosario & Pilar';
        const initFnOne = jest.fn(() => Promise.resolve(valueOne));
        const filenameOne = 'daughters-fs-clean-one';
        const valueTwo = 'Pilar & Rosario';
        const initFnTwo = jest.fn(() => Promise.resolve(valueTwo));
        const filenameTwo = 'daughters-fs-clean-two';
        const [usePathUtils] = getPathUtils();
        const sutOptions: FsCacheConstructorOptions = {
          inject: {
            pathUtils: usePathUtils,
          },
          path: '.cache',
          extension: 'tmp',
          keepInMemory: true,
        };
        const entryOptionsOne: FsCacheEntryOptions = {
          key: filenameOne,
          init: initFnOne,
        };
        const entryOptionsTwo: FsCacheEntryOptions = {
          key: filenameTwo,
          init: initFnTwo,
        };
        // - First file, first cache directory check
        fs.access.mockResolvedValueOnce();
        // - First file, first check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - First file creation
        fs.writeFile.mockResolvedValueOnce();
        // - Second file, first cache directory check
        fs.access.mockResolvedValueOnce();
        // - Second file, first check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - Second file creation
        fs.writeFile.mockResolvedValueOnce();
        // - Read cache dir
        fs.readdir.mockResolvedValueOnce([
          `${filenameOne}.${sutOptions.extension}`,
          `${filenameTwo}.${sutOptions.extension}`,
        ] as unknown as Dirent[]);
        // - First file, deletion check
        fs.access.mockResolvedValueOnce();
        // - First file, stats for removal check
        fs.stat.mockResolvedValueOnce({
          mtimeMs: 0,
        } as Stats);
        // - Second file, deletion check
        fs.access.mockResolvedValueOnce();
        // - Second file, stats for removal check
        fs.stat.mockResolvedValueOnce({
          mtimeMs: 0,
        } as Stats);
        // - First File, deletion
        fs.unlink.mockResolvedValueOnce();
        // - Second File, deletion
        fs.unlink.mockResolvedValueOnce();
        // - First file, second cache directory check
        fs.access.mockResolvedValueOnce();
        // - First file, second check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - First file, second creation
        fs.writeFile.mockResolvedValueOnce();
        // - Second file, second cache directory check
        fs.access.mockResolvedValueOnce();
        // - Second file, second check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - Second file, second creation
        fs.writeFile.mockResolvedValueOnce();
        const expectedFilenameOne = `${filenameOne}.${sutOptions.extension}`;
        const expectedFilepathOne = [sutOptions.path, expectedFilenameOne].join('/');
        const expectedFilenameTwo = `${filenameTwo}.${sutOptions.extension}`;
        const expectedFilepathTwo = [sutOptions.path, expectedFilenameTwo].join('/');
        // When
        const sut = new FsCache(sutOptions);
        const resultOneFileOne = await sut.use(entryOptionsOne);
        const resultOneFileTwo = await sut.use(entryOptionsTwo);
        await sut.clean();
        const resultTwoFileOne = await sut.use(entryOptionsOne);
        const resultTwoFileTwo = await sut.use(entryOptionsTwo);
        // Then
        expect(resultOneFileOne).toBe(valueOne);
        expect(resultOneFileTwo).toBe(valueTwo);
        expect(resultTwoFileOne).toBe(valueOne);
        expect(resultTwoFileTwo).toBe(valueTwo);
        expect(fs.readdir).toHaveBeenCalledTimes(1);
        expect(fs.readdir).toHaveBeenCalledWith(sutOptions.path);
        expect(fs.unlink).toHaveBeenCalledTimes(2);
        expect(fs.unlink).toHaveBeenNthCalledWith(1, expectedFilepathOne);
        expect(fs.unlink).toHaveBeenNthCalledWith(2, expectedFilepathTwo);
        expect(fs.writeFile).toHaveBeenCalledTimes(4);
        expect(fs.writeFile).toHaveBeenNthCalledWith(1, expectedFilepathOne, valueOne);
        expect(fs.writeFile).toHaveBeenNthCalledWith(2, expectedFilepathTwo, valueTwo);
        expect(fs.writeFile).toHaveBeenNthCalledWith(3, expectedFilepathOne, valueOne);
        expect(fs.writeFile).toHaveBeenNthCalledWith(4, expectedFilepathTwo, valueTwo);
      });

      it('should remove all entries from the fs and the memory with custom ext', async () => {
        // Given
        const valueOne = 'Rosario & Pilar';
        const initFnOne = jest.fn(() => Promise.resolve(valueOne));
        const filenameOne = 'daughters-fs-clean-one';
        const valueTwo = 'Pilar & Rosario';
        const initFnTwo = jest.fn(() => Promise.resolve(valueTwo));
        const filenameTwo = 'daughters-fs-clean-two';
        const [usePathUtils] = getPathUtils();
        const sutOptions: FsCacheConstructorOptions = {
          inject: {
            pathUtils: usePathUtils,
          },
          path: '.cache',
          extension: 'tmp',
          keepInMemory: true,
        };
        const extension = 'cache';
        const entryOptionsOne: FsCacheEntryOptions = {
          key: filenameOne,
          init: initFnOne,
          extension,
        };
        const entryOptionsTwo: FsCacheEntryOptions = {
          key: filenameTwo,
          init: initFnTwo,
          extension,
        };
        // - First file, first cache directory check
        fs.access.mockResolvedValueOnce();
        // - First file, first check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - First file creation
        fs.writeFile.mockResolvedValueOnce();
        // - Second file, first cache directory check
        fs.access.mockResolvedValueOnce();
        // - Second file, first check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - Second file creation
        fs.writeFile.mockResolvedValueOnce();
        // - Read cache dir
        fs.readdir.mockResolvedValueOnce([
          `${filenameOne}.${extension}`,
          `${filenameTwo}.${extension}`,
        ] as unknown as Dirent[]);
        // - First file, deletion check
        fs.access.mockResolvedValueOnce();
        // - First file, stats for removal check
        fs.stat.mockResolvedValueOnce({
          mtimeMs: 0,
        } as Stats);
        // - Second file, deletion check
        fs.access.mockResolvedValueOnce();
        // - Second file, stats for removal check
        fs.stat.mockResolvedValueOnce({
          mtimeMs: 0,
        } as Stats);
        // - First File, deletion
        fs.unlink.mockResolvedValueOnce();
        // - Second File, deletion
        fs.unlink.mockResolvedValueOnce();
        // - First file, second cache directory check
        fs.access.mockResolvedValueOnce();
        // - First file, second check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - First file, second creation
        fs.writeFile.mockResolvedValueOnce();
        // - Second file, second cache directory check
        fs.access.mockResolvedValueOnce();
        // - Second file, second check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - Second file, second creation
        fs.writeFile.mockResolvedValueOnce();
        const expectedFilenameOne = `${filenameOne}.${extension}`;
        const expectedFilepathOne = [sutOptions.path, expectedFilenameOne].join('/');
        const expectedFilenameTwo = `${filenameTwo}.${extension}`;
        const expectedFilepathTwo = [sutOptions.path, expectedFilenameTwo].join('/');
        // When
        const sut = new FsCache(sutOptions);
        const resultOneFileOne = await sut.use(entryOptionsOne);
        const resultOneFileTwo = await sut.use(entryOptionsTwo);
        await sut.clean({
          extension,
        });
        const resultTwoFileOne = await sut.use(entryOptionsOne);
        const resultTwoFileTwo = await sut.use(entryOptionsTwo);
        // Then
        expect(resultOneFileOne).toBe(valueOne);
        expect(resultOneFileTwo).toBe(valueTwo);
        expect(resultTwoFileOne).toBe(valueOne);
        expect(resultTwoFileTwo).toBe(valueTwo);
        expect(fs.readdir).toHaveBeenCalledTimes(1);
        expect(fs.readdir).toHaveBeenCalledWith(sutOptions.path);
        expect(fs.unlink).toHaveBeenCalledTimes(2);
        expect(fs.unlink).toHaveBeenNthCalledWith(1, expectedFilepathOne);
        expect(fs.unlink).toHaveBeenNthCalledWith(2, expectedFilepathTwo);
        expect(fs.writeFile).toHaveBeenCalledTimes(4);
        expect(fs.writeFile).toHaveBeenNthCalledWith(1, expectedFilepathOne, valueOne);
        expect(fs.writeFile).toHaveBeenNthCalledWith(2, expectedFilepathTwo, valueTwo);
        expect(fs.writeFile).toHaveBeenNthCalledWith(3, expectedFilepathOne, valueOne);
        expect(fs.writeFile).toHaveBeenNthCalledWith(4, expectedFilepathTwo, valueTwo);
      });
    });

    describe('purgeMemory', () => {
      beforeEach(() => {
        resetFs();
        jest.useFakeTimers();
        jest.setTimeout(10000);
      });

      afterEach(() => {
        jest.runOnlyPendingTimers();
      });

      it('should remove expired entries from the memory and the fs', async () => {
        // Given
        const valueOne = 'Rosario & Pilar';
        const initFnOne = jest.fn(() => Promise.resolve(valueOne));
        const filenameOne = 'daughters-fs-clean-one';
        const valueTwo = 'Pilar & Rosario';
        const initFnTwo = jest.fn(() => Promise.resolve(valueTwo));
        const filenameTwo = 'daughters-fs-clean-two';
        const [usePathUtils] = getPathUtils();
        const sutOptions: FsCacheConstructorOptions = {
          inject: {
            pathUtils: usePathUtils,
          },
          path: '.cache',
          extension: 'tmp',
          keepInMemory: true,
          defaultTTL: 100,
        };
        const entryOptionsOne: FsCacheEntryOptions = {
          key: filenameOne,
          init: initFnOne,
        };
        const entryOptionsTwo: FsCacheEntryOptions = {
          key: filenameTwo,
          init: initFnTwo,
        };
        const now = Date.now();
        // - First file, first cache directory check
        fs.access.mockResolvedValueOnce();
        // - First file, first check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - First file creation
        fs.writeFile.mockResolvedValueOnce();
        // - Second file, first cache directory check
        fs.access.mockResolvedValueOnce();
        // - Second file, first check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - Second file creation
        fs.writeFile.mockResolvedValueOnce();
        // - First file, deletion check
        fs.access.mockResolvedValueOnce();
        // - First file, stats for removal check
        fs.stat.mockResolvedValueOnce({
          mtimeMs: now,
        } as Stats);
        // - Second file, deletion check
        fs.access.mockResolvedValueOnce();
        // - Second file, stats for removal check
        fs.stat.mockResolvedValueOnce({
          mtimeMs: now,
        } as Stats);
        // - First File, deletion
        fs.unlink.mockResolvedValueOnce();
        // - Second File, deletion
        fs.unlink.mockResolvedValueOnce();
        // - First file, second cache directory check
        fs.access.mockResolvedValueOnce();
        // - First file, second check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - First file, second creation
        fs.writeFile.mockResolvedValueOnce();
        // - Second file, second cache directory check
        fs.access.mockResolvedValueOnce();
        // - Second file, second check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - Second file, second creation
        fs.writeFile.mockResolvedValueOnce();
        const expectedFilenameOne = `${filenameOne}.${sutOptions.extension}`;
        const expectedFilepathOne = [sutOptions.path, expectedFilenameOne].join('/');
        const expectedFilenameTwo = `${filenameTwo}.${sutOptions.extension}`;
        const expectedFilepathTwo = [sutOptions.path, expectedFilenameTwo].join('/');
        // When
        const sut = new FsCache(sutOptions);
        const resultOneFileOne = await sut.use(entryOptionsOne);
        const resultOneFileTwo = await sut.use(entryOptionsTwo);
        jest
          .spyOn(global.Date, 'now')
          .mockReturnValueOnce(now + sutOptions.defaultTTL! * 2);
        await sut.purgeMemory();
        const resultTwoFileOne = await sut.use(entryOptionsOne);
        const resultTwoFileTwo = await sut.use(entryOptionsTwo);
        // Then
        expect(resultOneFileOne).toBe(valueOne);
        expect(resultOneFileTwo).toBe(valueTwo);
        expect(resultTwoFileOne).toBe(valueOne);
        expect(resultTwoFileTwo).toBe(valueTwo);
        expect(fs.access).toHaveBeenCalledTimes(10);
        expect(fs.access).toHaveBeenNthCalledWith(1, sutOptions.path);
        expect(fs.access).toHaveBeenNthCalledWith(2, expectedFilepathOne);
        expect(fs.access).toHaveBeenNthCalledWith(3, sutOptions.path);
        expect(fs.access).toHaveBeenNthCalledWith(4, expectedFilepathTwo);
        expect(fs.access).toHaveBeenNthCalledWith(5, expectedFilepathOne);
        expect(fs.access).toHaveBeenNthCalledWith(6, expectedFilepathTwo);
        expect(fs.access).toHaveBeenNthCalledWith(7, sutOptions.path);
        expect(fs.access).toHaveBeenNthCalledWith(8, expectedFilepathOne);
        expect(fs.access).toHaveBeenNthCalledWith(9, sutOptions.path);
        expect(fs.access).toHaveBeenNthCalledWith(10, expectedFilepathTwo);
        expect(fs.stat).toHaveBeenCalledTimes(2);
        expect(fs.stat).toHaveBeenNthCalledWith(1, expectedFilepathOne);
        expect(fs.stat).toHaveBeenNthCalledWith(2, expectedFilepathTwo);
        expect(fs.unlink).toHaveBeenCalledTimes(2);
        expect(fs.unlink).toHaveBeenNthCalledWith(1, expectedFilepathOne);
        expect(fs.unlink).toHaveBeenNthCalledWith(2, expectedFilepathTwo);
        expect(fs.writeFile).toHaveBeenCalledTimes(4);
        expect(fs.writeFile).toHaveBeenNthCalledWith(1, expectedFilepathOne, valueOne);
        expect(fs.writeFile).toHaveBeenNthCalledWith(2, expectedFilepathTwo, valueTwo);
        expect(fs.writeFile).toHaveBeenNthCalledWith(3, expectedFilepathOne, valueOne);
        expect(fs.writeFile).toHaveBeenNthCalledWith(4, expectedFilepathTwo, valueTwo);
      });

      it("shouldn't remove non expired entries", async () => {
        // Given
        const valueOne = 'Rosario & Pilar';
        const initFnOne = jest.fn(() => Promise.resolve(valueOne));
        const filenameOne = 'daughters-fs-clean-one';
        const valueTwo = 'Pilar & Rosario';
        const initFnTwo = jest.fn(() => Promise.resolve(valueTwo));
        const filenameTwo = 'daughters-fs-clean-two';
        const [usePathUtils] = getPathUtils();
        const sutOptions: FsCacheConstructorOptions = {
          inject: {
            pathUtils: usePathUtils,
          },
          path: '.cache',
          extension: 'tmp',
          keepInMemory: true,
          defaultTTL: 100,
        };
        const entryOptionsOne: FsCacheEntryOptions = {
          key: filenameOne,
          init: initFnOne,
        };
        const entryOptionsTwo: FsCacheEntryOptions = {
          key: filenameTwo,
          init: initFnTwo,
        };
        // - First file, first cache directory check
        fs.access.mockResolvedValueOnce();
        // - First file, first check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - First file creation
        fs.writeFile.mockResolvedValueOnce();
        // - Second file, first cache directory check
        fs.access.mockResolvedValueOnce();
        // - Second file, first check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - Second file creation
        fs.writeFile.mockResolvedValueOnce();
        // - First file, second cache directory check
        fs.access.mockResolvedValueOnce();
        // - First file, read check
        fs.access.mockResolvedValueOnce();
        // - First file, stats for reading
        fs.stat.mockResolvedValueOnce({
          mtimeMs: Date.now(),
        } as Stats);
        // - First file, reading
        fs.readFile.mockResolvedValueOnce(valueOne);
        // - Second file, read check
        fs.access.mockResolvedValueOnce();
        // - Second file, stats for reading
        fs.stat.mockResolvedValueOnce({
          mtimeMs: Date.now(),
        } as Stats);
        // - Second file, reading
        fs.readFile.mockResolvedValueOnce(valueTwo);
        const expectedFilenameOne = `${filenameOne}.${sutOptions.extension}`;
        const expectedFilepathOne = [sutOptions.path, expectedFilenameOne].join('/');
        const expectedFilenameTwo = `${filenameTwo}.${sutOptions.extension}`;
        const expectedFilepathTwo = [sutOptions.path, expectedFilenameTwo].join('/');
        // When
        const sut = new FsCache(sutOptions);
        const resultOneFileOne = await sut.use(entryOptionsOne);
        const resultOneFileTwo = await sut.use(entryOptionsTwo);
        await sut.purgeMemory();
        const resultTwoFileOne = await sut.use(entryOptionsOne);
        const resultTwoFileTwo = await sut.use(entryOptionsTwo);
        // Then
        expect(resultOneFileOne).toBe(valueOne);
        expect(resultOneFileTwo).toBe(valueTwo);
        expect(resultTwoFileOne).toBe(valueOne);
        expect(resultTwoFileTwo).toBe(valueTwo);
        expect(fs.unlink).toHaveBeenCalledTimes(0);
        expect(fs.writeFile).toHaveBeenCalledTimes(2);
        expect(fs.writeFile).toHaveBeenNthCalledWith(1, expectedFilepathOne, valueOne);
        expect(fs.writeFile).toHaveBeenNthCalledWith(2, expectedFilepathTwo, valueTwo);
      });
    });

    describe('purgeFs', () => {
      beforeEach(() => {
        resetFs();
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.runOnlyPendingTimers();
      });

      it('should remove expired entries from the memory and the fs', async () => {
        // Given
        const valueOne = 'Rosario & Pilar';
        const initFnOne = jest.fn(() => Promise.resolve(valueOne));
        const filenameOne = 'daughters-fs-clean-one';
        const valueTwo = 'Pilar & Rosario';
        const initFnTwo = jest.fn(() => Promise.resolve(valueTwo));
        const filenameTwo = 'daughters-fs-clean-two';
        const [usePathUtils] = getPathUtils();
        const sutOptions: FsCacheConstructorOptions = {
          inject: {
            pathUtils: usePathUtils,
          },
          path: '.cache',
          extension: 'tmp',
          keepInMemory: true,
          defaultTTL: 100,
        };
        const entryOptionsOne: FsCacheEntryOptions = {
          key: filenameOne,
          init: initFnOne,
        };
        const entryOptionsTwo: FsCacheEntryOptions = {
          key: filenameTwo,
          init: initFnTwo,
        };
        const now = Date.now();
        // - First file, first cache directory check
        fs.access.mockResolvedValueOnce();
        // - First file, first check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - First file creation
        fs.writeFile.mockResolvedValueOnce();
        // - Second file, first cache directory check
        fs.access.mockResolvedValueOnce();
        // - Second file, first check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - Second file creation
        fs.writeFile.mockResolvedValueOnce();
        // - Read cache dir
        fs.readdir.mockResolvedValueOnce([
          `${filenameOne}.${sutOptions.extension}`,
          `${filenameTwo}.${sutOptions.extension}`,
        ] as unknown as Dirent[]);
        // - First file, stats for removal check
        fs.stat.mockResolvedValueOnce({
          mtimeMs: now / 2,
        } as Stats);
        // - Second file, stats for removal check
        fs.stat.mockResolvedValueOnce({
          mtimeMs: now / 2,
        } as Stats);
        // - First File, deletion
        fs.unlink.mockResolvedValueOnce();
        // - Second File, deletion
        fs.unlink.mockResolvedValueOnce();
        // - First file, second cache directory check
        fs.access.mockResolvedValueOnce();
        // - First file, second check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - First file, second creation
        fs.writeFile.mockResolvedValueOnce();
        // - Second file, second cache directory check
        fs.access.mockResolvedValueOnce();
        // - Second file, second check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - Second file, second creation
        fs.writeFile.mockResolvedValueOnce();
        const expectedFilenameOne = `${filenameOne}.${sutOptions.extension}`;
        const expectedFilepathOne = [sutOptions.path, expectedFilenameOne].join('/');
        const expectedFilenameTwo = `${filenameTwo}.${sutOptions.extension}`;
        const expectedFilepathTwo = [sutOptions.path, expectedFilenameTwo].join('/');
        // When
        const sut = new FsCache(sutOptions);
        const resultOneFileOne = await sut.use(entryOptionsOne);
        const resultOneFileTwo = await sut.use(entryOptionsTwo);
        await sut.purgeFs();
        const resultTwoFileOne = await sut.use(entryOptionsOne);
        const resultTwoFileTwo = await sut.use(entryOptionsTwo);
        // Then
        expect(resultOneFileOne).toBe(valueOne);
        expect(resultOneFileTwo).toBe(valueTwo);
        expect(resultTwoFileOne).toBe(valueOne);
        expect(resultTwoFileTwo).toBe(valueTwo);
        expect(fs.access).toHaveBeenCalledTimes(8);
        expect(fs.access).toHaveBeenNthCalledWith(1, sutOptions.path);
        expect(fs.access).toHaveBeenNthCalledWith(2, expectedFilepathOne);
        expect(fs.access).toHaveBeenNthCalledWith(3, sutOptions.path);
        expect(fs.access).toHaveBeenNthCalledWith(4, expectedFilepathTwo);
        expect(fs.access).toHaveBeenNthCalledWith(5, sutOptions.path);
        expect(fs.access).toHaveBeenNthCalledWith(6, expectedFilepathOne);
        expect(fs.access).toHaveBeenNthCalledWith(7, sutOptions.path);
        expect(fs.access).toHaveBeenNthCalledWith(8, expectedFilepathTwo);
        expect(fs.stat).toHaveBeenCalledTimes(2);
        expect(fs.stat).toHaveBeenNthCalledWith(1, expectedFilepathOne);
        expect(fs.stat).toHaveBeenNthCalledWith(2, expectedFilepathTwo);
        expect(fs.unlink).toHaveBeenCalledTimes(2);
        expect(fs.unlink).toHaveBeenNthCalledWith(1, expectedFilepathOne);
        expect(fs.unlink).toHaveBeenNthCalledWith(2, expectedFilepathTwo);
        expect(fs.writeFile).toHaveBeenCalledTimes(4);
        expect(fs.writeFile).toHaveBeenNthCalledWith(1, expectedFilepathOne, valueOne);
        expect(fs.writeFile).toHaveBeenNthCalledWith(2, expectedFilepathTwo, valueTwo);
        expect(fs.writeFile).toHaveBeenNthCalledWith(3, expectedFilepathOne, valueOne);
        expect(fs.writeFile).toHaveBeenNthCalledWith(4, expectedFilepathTwo, valueTwo);
      });

      it("shouldn't remove non expired entries", async () => {
        // Given
        const valueOne = 'Rosario & Pilar';
        const initFnOne = jest.fn(() => Promise.resolve(valueOne));
        const filenameOne = 'daughters-fs-clean-one';
        const valueTwo = 'Pilar & Rosario';
        const initFnTwo = jest.fn(() => Promise.resolve(valueTwo));
        const filenameTwo = 'daughters-fs-clean-two';
        const [usePathUtils] = getPathUtils();
        const sutOptions: FsCacheConstructorOptions = {
          inject: {
            pathUtils: usePathUtils,
          },
          path: '.cache',
          extension: 'tmp',
          keepInMemory: true,
          defaultTTL: 100,
        };
        const entryOptionsOne: FsCacheEntryOptions = {
          key: filenameOne,
          init: initFnOne,
        };
        const entryOptionsTwo: FsCacheEntryOptions = {
          key: filenameTwo,
          init: initFnTwo,
        };
        const now = Date.now();
        // - First file, first cache directory check
        fs.access.mockResolvedValueOnce();
        // - First file, first check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - First file creation
        fs.writeFile.mockResolvedValueOnce();
        // - Second file, first cache directory check
        fs.access.mockResolvedValueOnce();
        // - Second file, first check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - Second file creation
        fs.writeFile.mockResolvedValueOnce();
        // - Read cache dir
        fs.readdir.mockResolvedValueOnce([
          `${filenameOne}.${sutOptions.extension}`,
          `${filenameTwo}.${sutOptions.extension}`,
        ] as unknown as Dirent[]);
        // - First file, stats for removal check
        fs.stat.mockResolvedValueOnce({
          mtimeMs: now,
        } as Stats);
        // - Second file, stats for removal check
        fs.stat.mockResolvedValueOnce({
          mtimeMs: now,
        } as Stats);
        // - First file, second cache directory check
        fs.access.mockResolvedValueOnce();
        // - First file, second check
        fs.access.mockResolvedValueOnce();
        // - First file, reading
        fs.readFile.mockResolvedValueOnce(valueOne);
        // - Second file, second cache directory check
        fs.access.mockResolvedValueOnce();
        // - Second file, second check
        fs.access.mockResolvedValueOnce();
        // - Second file, reading
        fs.readFile.mockResolvedValueOnce(valueTwo);
        const expectedFilenameOne = `${filenameOne}.${sutOptions.extension}`;
        const expectedFilepathOne = [sutOptions.path, expectedFilenameOne].join('/');
        const expectedFilenameTwo = `${filenameTwo}.${sutOptions.extension}`;
        const expectedFilepathTwo = [sutOptions.path, expectedFilenameTwo].join('/');
        // When
        const sut = new FsCache(sutOptions);
        const resultOneFileOne = await sut.use(entryOptionsOne);
        const resultOneFileTwo = await sut.use(entryOptionsTwo);
        await sut.purgeFs();
        const resultTwoFileOne = await sut.use(entryOptionsOne);
        const resultTwoFileTwo = await sut.use(entryOptionsTwo);
        // Then
        expect(resultOneFileOne).toBe(valueOne);
        expect(resultOneFileTwo).toBe(valueTwo);
        expect(resultTwoFileOne).toBe(valueOne);
        expect(resultTwoFileTwo).toBe(valueTwo);
        expect(fs.unlink).toHaveBeenCalledTimes(0);
        expect(fs.writeFile).toHaveBeenCalledTimes(2);
        expect(fs.writeFile).toHaveBeenNthCalledWith(1, expectedFilepathOne, valueOne);
        expect(fs.writeFile).toHaveBeenNthCalledWith(2, expectedFilepathTwo, valueTwo);
      });
    });

    describe('purge', () => {
      beforeEach(() => {
        resetFs();
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.runOnlyPendingTimers();
      });

      it('should remove all expired entries from the memory and the fs', async () => {
        // Given
        const valueOne = 'Rosario & Pilar';
        const initFnOne = jest.fn(() => Promise.resolve(valueOne));
        const filenameOne = 'daughters-fs-clean-one';
        const valueTwo = 'Pilar & Rosario';
        const initFnTwo = jest.fn(() => Promise.resolve(valueTwo));
        const filenameTwo = 'daughters-fs-clean-two';
        const [usePathUtils] = getPathUtils();
        const sutOptions: FsCacheConstructorOptions = {
          inject: {
            pathUtils: usePathUtils,
          },
          path: '.cache',
          extension: 'tmp',
          keepInMemory: true,
          defaultTTL: 100,
        };
        const entryOptionsOne: FsCacheEntryOptions = {
          key: filenameOne,
          init: initFnOne,
        };
        const entryOptionsTwo: FsCacheEntryOptions = {
          key: filenameTwo,
          init: initFnTwo,
        };
        const now = Date.now();
        // - First file, first cache directory check
        fs.access.mockResolvedValueOnce();
        // - First file, first check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - First file creation
        fs.writeFile.mockResolvedValueOnce();
        // - Second file, first cache directory check
        fs.access.mockResolvedValueOnce();
        // - Second file, first check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - Second file creation
        fs.writeFile.mockResolvedValueOnce();
        // - Read cache dir
        fs.readdir.mockResolvedValueOnce([
          `${filenameOne}.${sutOptions.extension}`,
          `${filenameTwo}.${sutOptions.extension}`,
        ] as unknown as Dirent[]);
        // - First file, stats for removal check
        fs.stat.mockResolvedValueOnce({
          mtimeMs: now / 2,
        } as Stats);
        // - Second file, stats for removal check
        fs.stat.mockResolvedValueOnce({
          mtimeMs: now / 2,
        } as Stats);
        // - First File, deletion
        fs.unlink.mockResolvedValueOnce();
        // - Second File, deletion
        fs.unlink.mockResolvedValueOnce();
        // - First file, second cache directory check
        fs.access.mockResolvedValueOnce();
        // - First file, second check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - First file, second creation
        fs.writeFile.mockResolvedValueOnce();
        // - Second file, second cache directory check
        fs.access.mockResolvedValueOnce();
        // - Second file, second check
        fs.access.mockRejectedValueOnce(new FakeFsError('not found', 'ENOENT'));
        // - Second file, second creation
        fs.writeFile.mockResolvedValueOnce();
        const expectedFilenameOne = `${filenameOne}.${sutOptions.extension}`;
        const expectedFilepathOne = [sutOptions.path, expectedFilenameOne].join('/');
        const expectedFilenameTwo = `${filenameTwo}.${sutOptions.extension}`;
        const expectedFilepathTwo = [sutOptions.path, expectedFilenameTwo].join('/');
        // When
        const sut = new FsCache(sutOptions);
        const resultOneFileOne = await sut.use(entryOptionsOne);
        const resultOneFileTwo = await sut.use(entryOptionsTwo);
        await sut.purge();
        const resultTwoFileOne = await sut.use(entryOptionsOne);
        const resultTwoFileTwo = await sut.use(entryOptionsTwo);
        // Then
        expect(resultOneFileOne).toBe(valueOne);
        expect(resultOneFileTwo).toBe(valueTwo);
        expect(resultTwoFileOne).toBe(valueOne);
        expect(resultTwoFileTwo).toBe(valueTwo);
        expect(fs.access).toHaveBeenCalledTimes(8);
        expect(fs.access).toHaveBeenNthCalledWith(1, sutOptions.path);
        expect(fs.access).toHaveBeenNthCalledWith(2, expectedFilepathOne);
        expect(fs.access).toHaveBeenNthCalledWith(3, sutOptions.path);
        expect(fs.access).toHaveBeenNthCalledWith(4, expectedFilepathTwo);
        expect(fs.access).toHaveBeenNthCalledWith(5, sutOptions.path);
        expect(fs.access).toHaveBeenNthCalledWith(6, expectedFilepathOne);
        expect(fs.access).toHaveBeenNthCalledWith(7, sutOptions.path);
        expect(fs.access).toHaveBeenNthCalledWith(8, expectedFilepathTwo);
        expect(fs.stat).toHaveBeenCalledTimes(2);
        expect(fs.stat).toHaveBeenNthCalledWith(1, expectedFilepathOne);
        expect(fs.stat).toHaveBeenNthCalledWith(2, expectedFilepathTwo);
        expect(fs.unlink).toHaveBeenCalledTimes(2);
        expect(fs.unlink).toHaveBeenNthCalledWith(1, expectedFilepathOne);
        expect(fs.unlink).toHaveBeenNthCalledWith(2, expectedFilepathTwo);
        expect(fs.writeFile).toHaveBeenCalledTimes(4);
        expect(fs.writeFile).toHaveBeenNthCalledWith(1, expectedFilepathOne, valueOne);
        expect(fs.writeFile).toHaveBeenNthCalledWith(2, expectedFilepathTwo, valueTwo);
        expect(fs.writeFile).toHaveBeenNthCalledWith(3, expectedFilepathOne, valueOne);
        expect(fs.writeFile).toHaveBeenNthCalledWith(4, expectedFilepathTwo, valueTwo);
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
