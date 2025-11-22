import { simpleLogger, type SimpleLogger } from '@homer0/simple-logger';
import { providerCreator, injectHelper } from '@homer0/jimple';
/**
 * The dictionary of dependencies that need to be injected in {@link ErrorHandler}.
 */
type ErrorHandlerInjectOptions = {
  /**
   * The service that logs the messages on the console.
   */
  simpleLogger: SimpleLogger;
  /**
   * An alternative to the regular logger, with the project name.
   */
  appLogger: SimpleLogger;
};
/**
 * The inject helper to resolve the dependencies.
 */
const deps = injectHelper<ErrorHandlerInjectOptions>();
/**
 * The options for the service constructor.
 */
export type ErrorHandlerOptions = {
  /**
   * A dictionary with the dependency injections for the service. If one or more are not
   * provided, the service will create new instances.
   */
  inject?: Partial<ErrorHandlerInjectOptions>;
  /**
   * Whether or not to exit the process after receiving an error.
   *
   * @default true
   */
  exitOnError?: boolean;
};
/**
 * A small service that reads the contents of the implementation's package.json file.
 */
export class ErrorHandler {
  /**
   * Used to log the errors on the console.
   */
  protected logger: SimpleLogger;
  /**
   * Whether or not to exit the process after receiving an error.
   */
  readonly exitOnError: boolean;
  /**
   * The list of events this handler will listen for in order to catch errors.
   */
  protected eventNames: string[] = ['uncaughtException', 'unhandledRejection'];
  constructor({ inject = {}, exitOnError = true }: ErrorHandlerOptions = {}) {
    this.logger = deps.get(inject, 'simpleLogger', () => simpleLogger());
    this.exitOnError = exitOnError;
    this.handle = this.handle.bind(this);
    this.stopListening = this.stopListening.bind(this);
  }
  /**
   * Starts listening for unhandled errors.
   *
   * @returns A function to stop listing (a reference for
   *          {@link ErrorHandler.stopListening}).
   */
  listen() {
    this.eventNames.forEach((eventName) => {
      process.on(eventName, this.handle);
    });

    return this.stopListening;
  }
  /**
   * Stops listening for unhandled errors.
   */
  stopListening() {
    this.eventNames.forEach((eventName) => {
      process.removeListener(eventName, this.handle);
    });
  }
  /**
   * This is called by the process listeners when an uncaught exception is thrown or a
   * rejected promise is not handled. It logs the error on detail.
   * The process exits when after logging an error.
   *
   * @param error  The unhandled error.
   */
  handle(error: Error) {
    // If the logger is configured to show the time...
    if (this.logger.showTime) {
      // ...just send the error.
      this.logger.error(error);
    } else {
      // ...otherwise, get the time on a readable format.
      const time = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
      // Build the error message with the time.
      const message = `[${time}] ${error.message}`;
      // Log the new message with the exception.
      this.logger.error(message, error);
    }

    // Check if it should exit the process.
    if (this.exitOnError) {
      process.exit(1);
    }
  }
}
/**
 * Shorthand for `new ErrorHandler()`.
 *
 * @param args  The same parameters as the {@link ErrorHandler} constructor.
 * @returns A new instance of {@link ErrorHandler}.
 */
export const errorHandler = (
  ...args: ConstructorParameters<typeof ErrorHandler>
): ErrorHandler => new ErrorHandler(...args);

/**
 * The options for the {@link ErrorHandler} Jimple's provider creator.
 */
export type ErrorHandlerProviderOptions = Omit<ErrorHandlerOptions, 'inject'> & {
  /**
   * The name that will be used to register the service.
   *
   * @default 'errorHandler'
   */
  serviceName?: string;
  /**
   * A dictionary with the name of the services to inject. If one or more are not
   * provided, the service will create new instances.
   */
  services?: {
    [key in keyof ErrorHandlerInjectOptions]?: string;
  };
};
/**
 * A provider creator to register {@link ErrorHandler} in a Jimple container.
 */
export const errorHandlerProvider = providerCreator(
  ({ serviceName = 'errorHandler', ...rest }: ErrorHandlerProviderOptions = {}) =>
    (container) => {
      container.set(serviceName, () => {
        const { services = {}, ...options } = rest;
        const inject = deps.resolve(['simpleLogger', 'appLogger'], container, services);
        if (inject.appLogger) {
          delete inject.simpleLogger;
          inject.simpleLogger = inject.appLogger;
        }

        return new ErrorHandler({ inject, ...options });
      });
    },
);
