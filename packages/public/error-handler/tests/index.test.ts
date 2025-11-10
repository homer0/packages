jest.unmock('../src/index.js');

import { Jimple } from '@homer0/jimple';
import { SimpleLogger } from '@homer0/simple-logger';
import { ErrorHandler, errorHandler, errorHandlerProvider } from '../src/index.js';

const originalProcessOn = process.on;
const originalProcessRemoveListener = process.removeListener;
const originalExit = process.exit;

describe('ErrorHandler', () => {
  describe('class', () => {
    afterEach(() => {
      process.on = originalProcessOn;
      process.removeListener = originalProcessRemoveListener;
      process.exit = originalExit;
    });

    it('should be instantiated', () => {
      // Given/When
      const sut = new ErrorHandler();
      // Then
      expect(sut).toBeInstanceOf(ErrorHandler);
    });

    it('should be instantiated with custom options', () => {
      // Given
      const exitOnError = false;
      // When
      const sut = new ErrorHandler({ exitOnError });
      // Then
      expect(sut).toBeInstanceOf(ErrorHandler);
      expect(sut.exitOnError).toBe(exitOnError);
    });

    it('should add the listeners for uncaught and rejected exceptions', () => {
      // Given
      const onMock = jest.fn();
      process.on = onMock;
      // When
      const sut = new ErrorHandler();
      sut.listen();
      // Then
      expect(onMock).toHaveBeenCalledTimes(2);
      expect(onMock).toHaveBeenNthCalledWith(
        1,
        'uncaughtException',
        expect.any(Function),
      );
      expect(onMock).toHaveBeenNthCalledWith(
        2,
        'unhandledRejection',
        expect.any(Function),
      );
    });

    it('should add and remove the listeners for uncaught and rejected exceptions', () => {
      // Given
      const onMock = jest.fn();
      process.on = onMock;
      const removeListenerMock = jest.fn();
      process.removeListener = removeListenerMock;
      // When
      const sut = new ErrorHandler();
      sut.listen();
      sut.stopListening();
      // Then
      expect(onMock).toHaveBeenCalledTimes(2);
      expect(removeListenerMock).toHaveBeenCalledTimes(2);
      expect(removeListenerMock).toHaveBeenNthCalledWith(
        1,
        'uncaughtException',
        expect.any(Function),
      );
      expect(removeListenerMock).toHaveBeenNthCalledWith(
        2,
        'unhandledRejection',
        expect.any(Function),
      );
    });

    it('should log an uncaught exception as it is if the logger already shows time', () => {
      // Given
      const exitMock = jest.fn();
      // @ts-expect-error - Because we are overwriting the default process.
      process.exit = exitMock;
      const logMock = jest.fn();
      class AppLogger extends SimpleLogger {
        override error(...args: Parameters<SimpleLogger['error']>) {
          logMock(...args);
        }
      }
      const appLogger = new AppLogger({ showTime: true });
      const exception = new Error('ORDER 66');
      // When
      const sut = new ErrorHandler({
        inject: {
          simpleLogger: appLogger,
        },
      });
      sut.handle(exception);
      // Then
      expect(logMock).toHaveBeenCalledTimes(1);
      expect(logMock).toHaveBeenCalledWith(exception);
      expect(exitMock).toHaveBeenCalledTimes(1);
      expect(exitMock).toHaveBeenCalledWith(1);
    });

    it('should log an uncaught exception with the time if the logger has it disabled', () => {
      // Given
      const exitMock = jest.fn();
      // @ts-expect-error - Because we are overwriting the default process.
      process.exit = exitMock;
      const logMock = jest.fn();
      class AppLogger extends SimpleLogger {
        override error(...args: Parameters<SimpleLogger['error']>) {
          logMock(...args);
        }
      }
      const appLogger = new AppLogger({ showTime: false });
      const exception = new Error('ORDER 66');
      // When
      const sut = new ErrorHandler({
        inject: {
          simpleLogger: appLogger,
        },
      });
      sut.handle(exception);
      // Then
      expect(logMock).toHaveBeenCalledTimes(1);
      expect(logMock).toHaveBeenCalledWith(
        expect.stringMatching(/^\[\d+-\d+-\d+ \d+:\d+:\d+]/),
        exception,
      );
      expect(exitMock).toHaveBeenCalledTimes(1);
      expect(exitMock).toHaveBeenCalledWith(1);
    });

    it("shouldn't exit the process when handling an error", () => {
      // Given
      const exitMock = jest.fn();
      // @ts-expect-error - Because we are overwriting the default process.
      process.exit = exitMock;
      const logMock = jest.fn();
      class AppLogger extends SimpleLogger {
        override error(...args: Parameters<SimpleLogger['error']>) {
          logMock(...args);
        }
      }
      const appLogger = new AppLogger({ showTime: true });
      const exception = new Error('ORDER 66');
      // When
      const sut = new ErrorHandler({
        inject: {
          simpleLogger: appLogger,
        },
        exitOnError: false,
      });
      sut.handle(exception);
      // Then
      expect(logMock).toHaveBeenCalledTimes(1);
      expect(logMock).toHaveBeenCalledWith(exception);
      expect(exitMock).toHaveBeenCalledTimes(0);
    });
  });

  describe('shorthand', () => {
    it('should have a shorthand function', () => {
      // Given/When/Then
      expect(errorHandler()).toBeInstanceOf(ErrorHandler);
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
      errorHandlerProvider.register(container);
      const [[serviceName, serviceFn]] = setFn.mock.calls as [
        [string, () => ErrorHandler],
      ];
      const sut = serviceFn();
      // Then
      expect(serviceName).toBe('errorHandler');
      expect(sut).toBeInstanceOf(ErrorHandler);
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
        logger: new SimpleLogger(),
      });
      const providerServiceName = 'myErrorHandler';
      // When
      errorHandlerProvider({
        serviceName: providerServiceName,
      }).register(container);
      const [, [serviceName, serviceFn]] = setFn.mock.calls as [
        unknown,
        [string, () => ErrorHandler],
      ];
      const sut = serviceFn();
      // Then
      expect(serviceName).toBe(providerServiceName);
      expect(sut).toBeInstanceOf(ErrorHandler);
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
      class MySimpleLogger extends SimpleLogger {}
      const container = new Container({
        mySimpleLogger: new MySimpleLogger(),
      });
      const providerServiceName = 'myErrorHandler';
      // When
      errorHandlerProvider({
        serviceName: providerServiceName,
        services: {
          simpleLogger: 'mySimpleLogger',
        },
      }).register(container);
      const [, [serviceName, serviceFn]] = setFn.mock.calls as [
        unknown,
        [string, () => ErrorHandler],
      ];
      const sut = serviceFn();
      // Then
      expect(serviceName).toBe(providerServiceName);
      expect(sut).toBeInstanceOf(ErrorHandler);
      expect(getFn).toHaveBeenCalledWith('mySimpleLogger');
    });

    it('should use the app logger if available', () => {
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
        appLogger: new SimpleLogger(),
      });
      // When
      errorHandlerProvider().register(container);
      const [, [, serviceFn]] = setFn.mock.calls as [
        unknown,
        [string, () => ErrorHandler],
      ];
      const sut = serviceFn();
      // Then
      expect(sut).toBeInstanceOf(ErrorHandler);
    });
  });
});
