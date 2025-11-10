jest.unmock('../src/index.js');

import * as path from 'path';
import { Jimple } from '@homer0/jimple';
import { PathUtils, pathUtilsProvider, pathUtils } from '../src/index.js';

const originalProcesssCwd = process.cwd;
const originalRootFile = process.argv[1];

describe('PathUtils', () => {
  describe('class', () => {
    beforeEach(() => {
      process.cwd = originalProcesssCwd;
      // @ts-expect-error -- We are restoring the original process.argv[1]
      process.argv[1] = originalRootFile;
    });

    it('should be instantiated with the current directory (cwd) as home/base', () => {
      // Given
      const home = '/some-folder/';
      process.cwd = jest.fn(() => home);
      process.argv[1] = '';
      // When
      const sut = new PathUtils();
      // Then
      expect(sut.getPath()).toBe(home);
      expect(sut.getHome()).toBe(home);
      expect(sut.getApp()).toBe(home);
      expect(process.cwd).toHaveBeenCalledTimes(1);
    });

    it('should have getters for the app and home locations', () => {
      // Given
      const home = `${path.sep}some-folder${path.sep}`;
      process.cwd = jest.fn(() => home);
      const expectedAppPath = path.join(home, path.dirname(process.argv[1]!));
      // When
      const sut = new PathUtils();
      // Then
      expect(sut.getHome()).toBe(home);
      expect(sut.getApp()).toBe(`${expectedAppPath}${path.sep}`);
    });

    it('should be able to be instantiated with a custom home/base ', () => {
      // Given
      const customHome = '/custom-folder/';
      const home = '/some-folder/';
      process.cwd = jest.fn(() => home);
      // When
      const sut = new PathUtils({ home: customHome });
      // Then
      expect(sut.getPath()).toBe(home);
      expect(sut.getHome()).toBe(path.join(home, customHome));
      expect(process.cwd).toHaveBeenCalledTimes(1);
    });

    it('should be able to join multiple paths using the home as origin', () => {
      // Given
      const home = '/some-folder/';
      const testPathOne = '/sub-dir-one/';
      const testPathTwo = '/sub-file.js';
      process.cwd = jest.fn(() => home);
      // When
      const sut = new PathUtils();
      const result = sut.join(testPathOne, testPathTwo);
      // Then
      expect(result).toBe(path.join(home, testPathOne, testPathTwo));
    });

    it('should be able to add a custom location', () => {
      // Given
      const home = '/some-folder/';
      const locationName = 'customLocation';
      const locationPath = '/custom-location/';
      process.cwd = jest.fn(() => home);
      // When
      const sut = new PathUtils();
      sut.addLocation(locationName, locationPath);
      const result = sut.getLocation(locationName);
      // Then
      expect(result).toBe(path.join(home, locationPath));
    });

    it('should be able to add a custom location from the constructor', () => {
      // Given
      const home = '/some-folder/';
      const locationName = 'customLocation';
      const locationPath = '/custom-location/';
      process.cwd = jest.fn(() => home);
      const expectedAppPath = path.join(home, path.dirname(process.argv[1]!));
      const expectedLocationPath = path.join(home, locationPath);
      // When
      const sut = new PathUtils({
        locations: {
          [locationName]: locationPath,
        },
      });
      const locations = sut.getLocations();
      // Then
      expect(locations).toEqual({
        home,
        app: `${expectedAppPath}${path.sep}`,
        [locationName]: expectedLocationPath,
      });
    });

    it("should throw an error if a requested location doesn't exist", () => {
      // Given/When/Then
      const sut = new PathUtils();
      expect(() => sut.getLocation('custom')).toThrow(/there's no location/i);
    });
  });

  describe('shorthand', () => {
    beforeEach(() => {
      process.cwd = originalProcesssCwd;
    });

    it('should have a shorthand function', () => {
      // Given/When/Then
      expect(pathUtils()).toBeInstanceOf(PathUtils);
    });
  });

  describe('provider', () => {
    beforeEach(() => {
      process.cwd = originalProcesssCwd;
    });

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
      pathUtilsProvider.register(container);
      const [[serviceName, serviceFn]] = setFn.mock.calls as [[string, () => PathUtils]];
      const sut = serviceFn();
      // Then
      expect(serviceName).toBe('pathUtils');
      expect(sut).toBeInstanceOf(PathUtils);
    });

    it('should allow custom options on its service provider', () => {
      // Given
      const setFn = jest.fn();
      class Container extends Jimple {
        override set(...args: Parameters<Jimple['set']>) {
          setFn(...args);
          super.set(...args);
        }
      }
      const container = new Container();
      const customHome = '/custom-folder/';
      const home = '/some-folder/';
      process.cwd = jest.fn(() => home);
      const options = {
        serviceName: 'myPaths',
        home: customHome,
      };
      // When
      pathUtilsProvider(options).register(container);
      const [[serviceName, serviceFn]] = setFn.mock.calls as [[string, () => PathUtils]];
      const sut = serviceFn();
      // Then
      expect(serviceName).toBe(options.serviceName);
      expect(sut).toBeInstanceOf(PathUtils);
      expect(sut.getPath()).toBe(home);
      expect(sut.getHome()).toBe(path.join(home, customHome));
    });
  });
});
