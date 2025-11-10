jest.unmock('@src/index.js');

import { Jimple } from '@homer0/jimple';
import { PathUtils } from '@homer0/path-utils';
import pkg from '@root/package.json' with { type: 'json' };
import { RootFile, rootFile, rootFileProvider } from '@src/index.js';

describe('RootFile', () => {
  describe('class', () => {
    it('should be instantiated', () => {
      // Given/When
      const sut = new RootFile();
      // Then
      expect(sut).toBeInstanceOf(RootFile);
    });

    it('should require a file from the root', () => {
      // Given
      type PkgContents = {
        name: string;
        license: string;
      };
      // When
      const sut = new RootFile();
      const result = sut.require<PkgContents>('package.json');
      // Then
      expect(result).toEqual(pkg);
    });

    it('should import a file from the root', async () => {
      // Given
      type PkgContents = {
        default: {
          name: string;
          license: string;
        };
      };
      // When
      const sut = new RootFile();
      const { default: result } = await sut.import<PkgContents>('package.json');
      // Then
      expect(result).toEqual(pkg);
    });
  });

  describe('shorthand', () => {
    it('should have a shorthand function', () => {
      // Given/When/Then
      expect(rootFile()).toBeInstanceOf(RootFile);
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
      rootFileProvider.register(container);
      const [[serviceName, serviceFn]] = setFn.mock.calls as [[string, () => RootFile]];
      const sut = serviceFn();
      // Then
      expect(serviceName).toBe('rootFile');
      expect(sut).toBeInstanceOf(RootFile);
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
      const providerServiceName = 'myRootFile';
      // When
      rootFileProvider({
        serviceName: providerServiceName,
      }).register(container);
      const [, [serviceName, serviceFn]] = setFn.mock.calls as [
        [string, () => PathUtils],
        [string, () => RootFile],
      ];
      const sut = serviceFn();
      // Then
      expect(serviceName).toBe(providerServiceName);
      expect(sut).toBeInstanceOf(RootFile);
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
      const providerServiceName = 'myRootFile';
      // When
      rootFileProvider({
        serviceName: providerServiceName,
        services: {
          pathUtils: 'myPathUtils',
        },
      }).register(container);
      const [, [serviceName, serviceFn]] = setFn.mock.calls as [
        [string, () => PathUtils],
        [string, () => RootFile],
      ];
      const sut = serviceFn();
      // Then
      expect(serviceName).toBe(providerServiceName);
      expect(sut).toBeInstanceOf(RootFile);
    });
  });
});
