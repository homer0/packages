/* eslint-disable no-console */
vi.mock('colors/safe.js', async (original) => {
  try {
    const mock = await import('./mocks/colors.mock.js');
    return mock;
  } catch (error) {
    console.log({ error });
  }
  return original;
});
vi.mock('@homer0/package-info');

import { describe, expect, it, beforeEach, type MockedObject, type Mock } from 'vitest';
import colorsOriginal from 'colors/safe.js';
import { Jimple } from '@homer0/jimple';
import { PathUtils } from '@homer0/path-utils';
import { PackageInfo, packageInfo as originalPackageInfo } from '@homer0/package-info';
import {
  SimpleLogger,
  simpleLogger,
  simpleLoggerProvider,
  appLoggerProvider,
  type SimpleLoggerMessage,
} from '@src/index.js';

const originalConsoleLog = console.log;

const colors = colorsOriginal as MockedObject<typeof colorsOriginal> & {
  clear: Mock;
};

const packageInfo = originalPackageInfo as Mock<typeof originalPackageInfo>;

describe('SimpleLogger', () => {
  describe('class', () => {
    beforeEach(() => {
      console.log = originalConsoleLog;
      colors.clear();
    });

    it('should be instantiated', () => {
      // Given/When
      const sut = new SimpleLogger();
      // Then
      expect(sut).toBeInstanceOf(SimpleLogger);
    });

    it('should be instantiated with custom options', () => {
      // Given
      const options = { prefix: 'test', showTime: true };
      // When
      const sut = new SimpleLogger(options);
      // Then
      expect(sut).toBeInstanceOf(SimpleLogger);
      expect(sut.prefix).toBe(options.prefix);
      expect(sut.showTime).toBe(options.showTime);
    });

    it('should log a message', () => {
      // Given
      const message = 'hello world';
      const logFn = vi.fn();
      vi.spyOn(console, 'log').mockImplementation(logFn);
      // When
      const sut = new SimpleLogger();
      sut.log(message);
      // Then
      expect(logFn).toHaveBeenCalledTimes(1);
      expect(logFn).toHaveBeenCalledWith(message);
    });

    it('should log a message with a prefix', () => {
      // Given
      const prefix = 'my-app';
      const message = 'hello world';
      const logFn = vi.fn();
      vi.spyOn(console, 'log').mockImplementation(logFn);
      // When
      const sut = new SimpleLogger({ prefix });
      sut.log(message);
      // Then
      expect(logFn).toHaveBeenCalledTimes(1);
      expect(logFn).toHaveBeenCalledWith(`[${prefix}] ${message}`);
    });

    it('should log a message with the time', () => {
      // Given
      const now = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
      const message = 'hello world';
      const logFn = vi.fn();
      vi.spyOn(console, 'log').mockImplementation(logFn);
      // When
      const sut = new SimpleLogger({ showTime: true });
      sut.log(message);
      // Then
      expect(logFn).toHaveBeenCalledTimes(1);
      expect(logFn).toHaveBeenCalledWith(`[${now}] ${message}`);
    });

    it('should log a colored message', () => {
      // Given
      const message = 'hello world';
      const color = 'red';
      const logFn = vi.fn();
      vi.spyOn(console, 'log').mockImplementation(logFn);
      // // When
      const sut = new SimpleLogger();
      sut.log(message, color);
      // // Then
      expect(logFn).toHaveBeenCalledTimes(1);
      expect(logFn).toHaveBeenCalledWith(message);
      expect(colors[color]).toHaveBeenCalledTimes(1);
      expect(colors[color]).toHaveBeenCalledWith(message);
    });

    it('should log a list of messages', () => {
      // Given
      const messages = ['hello world', 'goodbye world'];
      const log = vi.fn();
      vi.spyOn(console, 'log').mockImplementation(log);
      // When
      const sut = new SimpleLogger();
      sut.log(messages);
      // Then
      expect(log).toHaveBeenCalledTimes(messages.length);
      messages.forEach((message) => {
        expect(log).toHaveBeenCalledWith(message);
      });
    });

    it('should log a list of colored messages', () => {
      // Given
      const messages = ['hello world', 'goodbye world'];
      const color = 'blue';
      const log = vi.fn();
      vi.spyOn(console, 'log').mockImplementation(log);
      // When
      const sut = new SimpleLogger();
      sut.log(messages, color);
      // Then
      expect(log).toHaveBeenCalledTimes(messages.length);
      expect(colors[color]).toHaveBeenCalledTimes(messages.length);
      messages.forEach((message) => {
        expect(log).toHaveBeenCalledWith(message);
        expect(colors[color]).toHaveBeenCalledWith(message);
      });
    });

    it('should log a list messages with different colors', () => {
      // Given
      const messages: SimpleLoggerMessage = [
        ['hello world', 'green'],
        ['goodbye world', 'yellow'],
      ];
      const log = vi.fn();
      vi.spyOn(console, 'log').mockImplementation(log);
      // When
      const sut = new SimpleLogger();
      sut.log(messages);
      // Then
      expect(log).toHaveBeenCalledTimes(messages.length);
      messages.forEach((line) => {
        const [message, color] = line as [string, keyof typeof colors];
        expect(log).toHaveBeenCalledWith(message);
        expect(colors[color]).toHaveBeenCalledWith(message);
      });
    });

    it('should log a warning message (yellow)', () => {
      // Given
      const message = 'Something is not working';
      const color = 'yellow';
      const log = vi.fn();
      vi.spyOn(console, 'log').mockImplementation(log);
      // When
      const sut = new SimpleLogger();
      sut.warn(message);
      // Then
      expect(log).toHaveBeenCalledTimes(1);
      expect(log).toHaveBeenCalledWith(message);
      expect(colors[color]).toHaveBeenCalledTimes(1);
      expect(colors[color]).toHaveBeenCalledWith(message);
    });

    it('should log a success message (green)', () => {
      // Given
      const message = 'Everything works!';
      const color = 'green';
      const log = vi.fn();
      vi.spyOn(console, 'log').mockImplementation(log);
      // When
      const sut = new SimpleLogger();
      sut.success(message);
      // Then
      expect(log).toHaveBeenCalledTimes(1);
      expect(log).toHaveBeenCalledWith(message);
      expect(colors[color]).toHaveBeenCalledTimes(1);
      expect(colors[color]).toHaveBeenCalledWith(message);
    });

    it('should log an informative message (grey)', () => {
      // Given
      const message = 'Be aware of the Batman';
      const color = 'grey';
      const log = vi.fn();
      vi.spyOn(console, 'log').mockImplementation(log);
      // When
      const sut = new SimpleLogger();
      sut.info(message);
      // Then
      expect(log).toHaveBeenCalledTimes(1);
      expect(log).toHaveBeenCalledWith(message);
      expect(colors[color]).toHaveBeenCalledTimes(1);
      expect(colors[color]).toHaveBeenCalledWith(message);
    });

    it('should log an error message (red)', () => {
      // Given
      const message = 'Something went terribly wrong';
      const color = 'red';
      const log = vi.fn();
      vi.spyOn(console, 'log').mockImplementation(log);
      // When
      const sut = new SimpleLogger();
      sut.error(message);
      // Then
      expect(log).toHaveBeenCalledTimes(1);
      expect(log).toHaveBeenCalledWith(message);
      expect(colors[color]).toHaveBeenCalledTimes(1);
      expect(colors[color]).toHaveBeenCalledWith(message);
    });

    it('should log an error message (red) and include an exception information', () => {
      // Given
      const message = 'Something went terribly wrong';
      const exception = 'ORDER 66';
      const color = 'red';
      const log = vi.fn();
      vi.spyOn(console, 'log').mockImplementation(log);
      // When
      const sut = new SimpleLogger();
      sut.error(message, exception);
      // Then
      expect(log).toHaveBeenCalledTimes(2);
      expect(log).toHaveBeenNthCalledWith(1, message);
      expect(log).toHaveBeenNthCalledWith(2, exception);
      expect(colors[color]).toHaveBeenCalledTimes(1);
      expect(colors[color]).toHaveBeenCalledWith(message);
    });

    it('should log an error message (red) and include an error exception stack', () => {
      // Given
      const message = 'Something went terribly wrong';
      const exception = new Error('ORDER 66');
      const stack = exception.stack!.split('\n').map((line) => line.trim());
      stack.splice(0, 1);
      const errorColor = 'red';
      const stackColor = 'grey';
      const log = vi.fn();
      vi.spyOn(console, 'log').mockImplementation(log);
      // When
      const sut = new SimpleLogger();
      sut.error(message, exception);
      // Then
      expect(log).toHaveBeenCalledTimes(stack.length + 1);
      expect(log).toHaveBeenCalledWith(message);
      stack.forEach((line) => {
        expect(log).toHaveBeenCalledWith(line);
      });

      expect(colors[errorColor]).toHaveBeenCalledTimes(1);
      expect(colors[stackColor]).toHaveBeenCalledTimes(stack.length);
    });

    it('should log an exception error and its stack', () => {
      // Given
      const exception = new Error('ORDER 66');
      const stack = exception.stack!.split('\n').map((line) => line.trim());
      stack.splice(0, 1);
      const errorColor = 'red';
      const stackColor = 'grey';
      const log = vi.fn();
      vi.spyOn(console, 'log').mockImplementation(log);
      // When
      const sut = new SimpleLogger();
      sut.error(exception);
      // Then
      expect(log).toHaveBeenCalledTimes(stack.length + 1);
      expect(log).toHaveBeenCalledWith(exception.message);
      stack.forEach((line) => {
        expect(log).toHaveBeenCalledWith(line);
      });

      expect(colors[errorColor]).toHaveBeenCalledTimes(1);
      expect(colors[stackColor]).toHaveBeenCalledTimes(stack.length);
    });
  });

  describe('shorthand', () => {
    it('should have a shorthand function', () => {
      // Given/When/Then
      expect(simpleLogger()).toBeInstanceOf(SimpleLogger);
    });
  });

  describe('provider', () => {
    it('should include a Jimple provider', () => {
      // Given
      const setFn = vi.fn();
      class Container extends Jimple {
        override set(...args: Parameters<Jimple['set']>) {
          setFn(...args);
          super.set(...args);
        }
      }
      const container = new Container();
      // When
      simpleLoggerProvider.register(container);
      const [[serviceName, serviceFn]] = setFn.mock.calls as [
        [string, () => SimpleLogger],
      ];
      const sut = serviceFn();
      // Then
      expect(serviceName).toBe('simpleLogger');
      expect(sut).toBeInstanceOf(SimpleLogger);
    });

    it('should allow custom options on its provider', () => {
      // Given
      const setFn = vi.fn();
      class Container extends Jimple {
        override set(...args: Parameters<Jimple['set']>) {
          setFn(...args);
          super.set(...args);
        }
      }
      const container = new Container();
      const providerServiceName = 'mySimpleLogger';
      // When
      simpleLoggerProvider({
        serviceName: providerServiceName,
      }).register(container);
      const [[serviceName, serviceFn]] = setFn.mock.calls as [
        [string, () => SimpleLogger],
      ];
      const sut = serviceFn();
      // Then
      expect(serviceName).toBe(providerServiceName);
      expect(sut).toBeInstanceOf(SimpleLogger);
    });
  });

  describe('appLogger provider', () => {
    it('should register the service with the app name as prefix', () => {
      // Given
      const getFn = vi.fn();
      const setFn = vi.fn();
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
      const usePathUtils = new PathUtils();
      const usePackageInfo = new PackageInfo({
        inject: {
          pathUtils: usePathUtils,
        },
      });
      const pkgJson = {
        name: 'my-app',
      };
      vi.spyOn(usePackageInfo, 'getSync').mockReturnValueOnce(pkgJson);
      const container = new Container({
        pathUtils: usePathUtils,
        packageInfo: usePackageInfo,
      });
      // When
      appLoggerProvider.register(container);
      const [, , [serviceName, serviceFn]] = setFn.mock.calls as [
        unknown,
        unknown,
        [string, () => SimpleLogger],
      ];
      const sut = serviceFn();
      // Then
      expect(serviceName).toBe('appLogger');
      expect(sut).toBeInstanceOf(SimpleLogger);
      expect(sut.prefix).toBe(pkgJson.name);
    });

    it('should use appLoggerPrefix instead of the package name', () => {
      // Given
      const getFn = vi.fn();
      const setFn = vi.fn();
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
      const usePathUtils = new PathUtils();
      const usePackageInfo = new PackageInfo({
        inject: {
          pathUtils: usePathUtils,
        },
      });
      const pkgJson = {
        name: 'my-app',
        appLoggerPrefix: 'my-cli-app',
      };
      vi.spyOn(usePackageInfo, 'getSync').mockReturnValueOnce(pkgJson);
      const container = new Container({
        pathUtils: usePathUtils,
        packageInfo: usePackageInfo,
      });
      // When
      appLoggerProvider.register(container);
      const [, , [serviceName, serviceFn]] = setFn.mock.calls as [
        unknown,
        unknown,
        [string, () => SimpleLogger],
      ];
      const sut = serviceFn();
      // Then
      expect(serviceName).toBe('appLogger');
      expect(sut).toBeInstanceOf(SimpleLogger);
      expect(sut.prefix).toBe(pkgJson.appLoggerPrefix);
    });

    it('should create the services to inject if they are not available', () => {
      // Given
      const getFn = vi.fn();
      const setFn = vi.fn();
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
      const usePackageInfo = new PackageInfo();
      const pkgJson = {
        name: 'my-app',
      };
      vi.spyOn(usePackageInfo, 'getSync').mockReturnValueOnce(pkgJson);
      packageInfo.mockReturnValueOnce(usePackageInfo);
      const container = new Container();
      // When
      appLoggerProvider.register(container);
      const [[serviceName, serviceFn]] = setFn.mock.calls as [
        [string, () => SimpleLogger],
      ];
      const sut = serviceFn();
      // // Then
      expect(serviceName).toBe('appLogger');
      expect(sut).toBeInstanceOf(SimpleLogger);
      expect(sut.prefix).toBe(pkgJson.name);
    });

    it('should register the service with custom options', () => {
      // Given
      const getFn = vi.fn();
      const setFn = vi.fn();
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
      const usePathUtils = new PathUtils();
      const usePackageInfo = new PackageInfo({
        inject: {
          pathUtils: usePathUtils,
        },
      });
      const pkgJson = {
        name: 'my-app',
      };
      vi.spyOn(usePackageInfo, 'getSync').mockReturnValueOnce(pkgJson);
      const container = new Container({
        myPathUtils: usePathUtils,
        myPackageInfo: usePackageInfo,
      });
      const providerServiceName = 'myAppLogger';
      // When
      appLoggerProvider({
        serviceName: providerServiceName,
        services: {
          pathUtils: 'myPathUtils',
          packageInfo: 'myPackageInfo',
        },
      }).register(container);
      const [, , [serviceName, serviceFn]] = setFn.mock.calls as [
        unknown,
        unknown,
        [string, () => SimpleLogger],
      ];
      const sut = serviceFn();
      // Then
      expect(serviceName).toBe(providerServiceName);
      expect(sut).toBeInstanceOf(SimpleLogger);
      expect(sut.prefix).toBe(pkgJson.name);
    });
  });
});
