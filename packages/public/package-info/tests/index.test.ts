jest.mock('fs');
jest.mock('fs/promises');
jest.unmock('../src');

import { Jimple } from '@homer0/jimple';
import * as originalFsSync from 'fs';
import * as originalFsPromises from 'fs/promises';
import { PathUtils } from '@homer0/path-utils';
import { PackageInfo, packageInfo, packageInfoProvider } from '../src';

const mockFsSync = originalFsSync as jest.Mocked<typeof originalFsSync>;
const mockFsPromises = originalFsPromises as jest.Mocked<typeof originalFsPromises>;

describe('PackageInfo', () => {
  describe('class', () => {
    beforeEach(() => {
      mockFsSync.readFileSync.mockReset();
      mockFsPromises.readFile.mockReset();
    });

    it('should be instantiated', () => {
      // Given/When
      const sut = new PackageInfo();
      // Then
      expect(sut).toBeInstanceOf(PackageInfo);
    });

    it('should get the contents of the package.json', async () => {
      // Given
      const pkgJson = {
        name: '@homer0/test-package',
        dependencies: {
          '@homer0/jimple': '^1.0.0',
        },
      };
      mockFsPromises.readFile.mockResolvedValueOnce(JSON.stringify(pkgJson));
      // When
      const sut = new PackageInfo();
      const result = await sut.get();
      // Then
      expect(result).toEqual(pkgJson);
      expect(mockFsPromises.readFile).toHaveBeenCalledTimes(1);
    });

    it('should use a custom version of PathUtils', async () => {
      // Given
      const pkgJson = {
        name: '@homer0/test-package',
        dependencies: {
          '@homer0/jimple': '^1.0.0',
        },
      };
      mockFsPromises.readFile.mockResolvedValue(JSON.stringify(pkgJson));
      const joinFn = jest.fn();
      class MyPathUtils extends PathUtils {
        override join(
          ...args: Parameters<PathUtils['join']>
        ): ReturnType<PathUtils['join']> {
          joinFn(...args);
          return super.join(...args);
        }
      }
      const myPathUtils = new MyPathUtils();
      // When
      const sut = new PackageInfo({
        inject: {
          pathUtils: myPathUtils,
        },
      });
      const result = await sut.get();
      // Then
      expect(result).toEqual(pkgJson);
      expect(joinFn).toHaveBeenCalledTimes(1);
      expect(joinFn).toHaveBeenCalledWith('package.json');
    });

    it('should only read the file once', async () => {
      // Given
      const pkgJson = {
        name: '@homer0/test-package',
        dependencies: {
          '@homer0/jimple': '^1.0.0',
        },
      };
      mockFsPromises.readFile.mockResolvedValue(JSON.stringify(pkgJson));
      // When
      const sut = new PackageInfo();
      const [result1, result2] = await Promise.all([sut.get(), sut.get()]);
      const result3 = await sut.get();
      // Then
      expect(result1).toEqual(pkgJson);
      expect(result2).toEqual(pkgJson);
      expect(result3).toEqual(pkgJson);
      expect(mockFsPromises.readFile).toHaveBeenCalledTimes(1);
    });

    it('should synchronously get the contents of the package.json', () => {
      // Given
      const pkgJson = {
        name: '@homer0/test-package',
        dependencies: {
          '@homer0/jimple': '^1.0.0',
        },
      };
      mockFsSync.readFileSync.mockReturnValueOnce(JSON.stringify(pkgJson));
      // When
      const sut = new PackageInfo();
      const result1 = sut.getSync();
      const result2 = sut.getSync();
      // Then
      expect(result1).toEqual(pkgJson);
      expect(result2).toEqual(pkgJson);
      expect(mockFsSync.readFileSync).toHaveBeenCalledTimes(1);
    });
  });

  describe('shorthand', () => {
    it('should have a shorthand function', () => {
      // Given/When/Then
      expect(packageInfo()).toBeInstanceOf(PackageInfo);
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
      packageInfoProvider.register(container);
      const [[serviceName, serviceFn]] = setFn.mock.calls as [
        [string, () => PackageInfo],
      ];
      const sut = serviceFn();
      // Then
      expect(serviceName).toBe('packageInfo');
      expect(sut).toBeInstanceOf(PackageInfo);
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
      const providerServiceName = 'myPackageInfo';
      // When
      packageInfoProvider({
        serviceName: providerServiceName,
      }).register(container);
      const [, [serviceName, serviceFn]] = setFn.mock.calls as [
        [string, () => PathUtils],
        [string, () => PackageInfo],
      ];
      const sut = serviceFn();
      // Then
      expect(serviceName).toBe(providerServiceName);
      expect(sut).toBeInstanceOf(PackageInfo);
    });

    it('should allow custom services on its provider', () => {
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
      const joinFn = jest.fn();
      class MyPathUtils extends PathUtils {
        override join(
          ...args: Parameters<PathUtils['join']>
        ): ReturnType<PathUtils['join']> {
          joinFn(...args);
          return super.join(...args);
        }
      }
      const container = new Container({
        myPathUtils: new MyPathUtils(),
      });
      const providerServiceName = 'myPackageInfo';
      // When
      packageInfoProvider({
        serviceName: providerServiceName,
        services: {
          pathUtils: 'myPathUtils',
        },
      }).register(container);
      const [, [serviceName, serviceFn]] = setFn.mock.calls as [
        [string, () => PathUtils],
        [string, () => PackageInfo],
      ];
      const sut = serviceFn();
      // Then
      expect(serviceName).toBe(providerServiceName);
      expect(sut).toBeInstanceOf(PackageInfo);
    });
  });
});
