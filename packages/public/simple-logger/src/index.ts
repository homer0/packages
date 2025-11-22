import colors from 'colors/safe.js';
import { pathUtils, type PathUtils } from '@homer0/path-utils';
import { packageInfo, type PackageInfo } from '@homer0/package-info';
import { providerCreator, injectHelper } from '@homer0/jimple';
/**
 * The colors supported by the service.
 */
export type SimpleLoggerColor =
  | Exclude<keyof typeof colors, 'enabled' | 'enable' | 'disable' | 'setTheme'>
  | 'raw';
/**
 * It can be a simple text message, or a message and a color.
 */
export type SimpleLoggerLine = string | [string, SimpleLoggerColor];
/**
 * This is the type used on all the log methods: it can be a string, a list of strings, or
 * a list of messages and colors.
 */
export type SimpleLoggerMessage = string | SimpleLoggerLine[];
/**
 * The options for the service constructor.
 */
export type SimpleLoggerOptions = {
  /**
   * A prefix to include in front of all the messages.
   */
  prefix?: string;
  /**
   * Whether or not to show the time on each message.
   */
  showTime?: boolean;
};

type ExceptionLike = {
  stack: string;
};
/**
 * Utility service to log messages on the console.
 */
export class SimpleLogger {
  /**
   * A prefix to include in front of all the messages.
   */
  readonly prefix: string;
  /**
   * Whether or not to show the time on each message.
   */
  readonly showTime: boolean;
  constructor({ prefix = '', showTime = false }: SimpleLoggerOptions = {}) {
    this.prefix = prefix;
    this.showTime = showTime;
    this.log = this.log.bind(this);
    this.success = this.success.bind(this);
    this.info = this.info.bind(this);
    this.warn = this.warn.bind(this);
    this.error = this.error.bind(this);
  }
  /**
   * Logs a message with an specific color on the console.
   *
   * @param message  A text message to log or a list of them.
   * @param color    The color of the message (the default is the terminal default).
   *                 This can be overwritten line by line when the message is an array,
   *                 take a look at the example.
   * @example
   *
   *   // Simple
   *   logger.log('hello world');
   *   // Custom color
   *   logger.log('It was the shadow who did it', 'red');
   *   // A list of messages all the same color
   *   logger.log(["Ph'nglu", "mglw'nafh"], 'grey');
   *   // A list of messages with different colors per line
   *   logger.log(
   *     [
   *       "Ph'nglu",
   *       "mglw'nafh",
   *       ['Cthulhu', 'green'],
   *       ["R'lyeh wgah'nagl fhtagn", 'red'],
   *     ],
   *     'grey',
   *   );
   *
   */
  log(message: SimpleLoggerMessage, color: SimpleLoggerColor = 'raw'): void {
    const lines: string[] = [];
    if (Array.isArray(message)) {
      message.forEach((line) => {
        if (Array.isArray(line)) {
          lines.push(this.getColorFn(line[1])(this.addPrefix(line[0])));
        } else {
          lines.push(this.getColorFn(color)(this.addPrefix(line)));
        }
      });
    } else {
      lines.push(this.getColorFn(color)(this.addPrefix(message)));
    }

    // eslint-disable-next-line no-console
    lines.forEach((line) => console.log(line));
  }
  /**
   * Logs a success (green) message or messages on the console.
   *
   * @param message  A single message of a list of them.
   * @see {@link SimpleLogger.log}
   */
  success(message: SimpleLoggerMessage): void {
    this.log(message, 'green');
  }
  /**
   * Logs an information (gray) message or messages on the console.
   *
   * @param message  A single message of a list of them.
   * @see {@link SimpleLogger.log}
   */
  info(message: SimpleLoggerMessage): void {
    this.log(message, 'grey');
  }
  /**
   * Logs a warning (yellow) message or messages on the console.
   *
   * @param message  A single message of a list of them.
   * @see {@link SimpleLogger.log}
   */
  warn(message: SimpleLoggerMessage): void {
    this.log(message, 'yellow');
  }
  /**
   * Logs an error (red) message or messages on the console.
   *
   * @param message    A single message of a list of them.
   *                   See the `log()` documentation to see all the supported
   *                   properties for the `message` parameter. Different from the other
   *                   log methods, you can use an `Error` object and the method will
   *                   take care of extracting the message and the stack information.
   * @param exception  If the exception has a `stack`
   *                   property, the method will log each of the stack calls using
   *                   `info()`.
   * @template ErrorType  The type of the exception, to be infered and validate if it
   *                      has a `stack` property.
   * @see {@link SimpleLogger.log}
   */
  error<ErrorType extends Error, ExceptionType extends ExceptionLike | Error | string>(
    message: SimpleLoggerMessage | ErrorType,
    exception?: ExceptionType,
  ): void {
    if (message instanceof Error) {
      this.error(message.message, message);
      return;
    }
    this.log(message, 'red');
    if (exception) {
      if (typeof exception !== 'string' && exception.stack) {
        const stack = exception.stack.split('\n').map((line) => line.trim());
        stack.splice(0, 1);
        this.info(stack);
      } else {
        this.log(String(exception));
      }
    }
  }
  /**
   * Prefixes a message with the text sent to the constructor and, if enabled, the current
   * time.
   *
   * @param text  The text that needs the prefix.
   */
  protected addPrefix(text: string): string {
    const parts: string[] = [];
    // If a prefix was set on the constructor...
    if (this.prefix) {
      // ...add it as first element.
      parts.push(`[${this.prefix}]`);
    }
    // If the `showTime` setting is enabled...
    if (this.showTime) {
      // ...add the current time to the list.
      const time = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

      parts.push(`[${time}]`);
    }
    // Add the original text.
    parts.push(text);
    // Join the list into a single text message.
    return parts.join(' ').trim();
  }
  /**
   * Gets a function to modify the color of a string. The reason for this _"proxy method"_
   * is that the `colors` module doesn't have a `raw` option and the alternative would've
   * been adding a few `if`s on the `log` method.
   *
   * @param color  The name of the color.
   * @returns A function that receives a string and returns it colored.
   */
  protected getColorFn(color: SimpleLoggerColor): (str: string) => string {
    if (color === 'raw') {
      return (str: string) => str;
    }
    return colors[color];
  }
}
/**
 * Shorthand for `new SimpleLogger()`.
 *
 * @param args  The same parameters as the {@link SimpleLogger} constructor.
 * @returns A new instance of {@link SimpleLogger}.
 */
export const simpleLogger = (
  ...args: ConstructorParameters<typeof SimpleLogger>
): SimpleLogger => new SimpleLogger(...args);
/**
 * The options for the {@link SimpleLogger} Jimple's provider creator.
 */
export type SimpleLoggerProviderOptions = SimpleLoggerOptions & {
  /**
   * The name that will be used to register the service.
   *
   * @default 'simpleLogger'
   */
  serviceName?: string;
};
/**
 * A provider creator to register {@link SimpleLogger} in a Jimple container.
 */
export const simpleLoggerProvider = providerCreator(
  ({ serviceName = 'simpleLogger', ...rest }: SimpleLoggerProviderOptions = {}) =>
    (container) => {
      container.set(serviceName, () => new SimpleLogger(rest));
    },
);
/**
 * The dictionary of dependencies that can be injected in the "app logger provider".
 */
type AppLoggerProviderInjectOptions = {
  /**
   * The service that gets the information from the `package.json`.
   */
  packageInfo: PackageInfo;
  /**
   * The service that creates paths relative to the project root, needed to get the
   * `package.json`.
   */
  pathUtils: PathUtils;
};
/**
 * The options for the "app logger" Jimple's provider creator.
 */
export type AppLoggerProviderOptions = Omit<SimpleLoggerProviderOptions, 'prefix'> & {
  /**
   * A dictionary with the name of the services to inject. If one or more are not
   * provided, the service will create new instances.
   */
  services?: {
    [key in keyof AppLoggerProviderInjectOptions]?: string;
  };
};
/**
 * An alaternative to the basic {@link SimpleLogger} provider creator, that gets the
 * project name from the `package.json` and sets it as the prefix for the messages.
 */
export const appLoggerProvider = providerCreator(
  ({
    serviceName = 'appLogger',
    services = {},
    ...rest
  }: AppLoggerProviderOptions = {}) =>
    (container) => {
      container.set(serviceName, () => {
        const deps = injectHelper<AppLoggerProviderInjectOptions>();
        const inject = deps.resolve(['packageInfo', 'pathUtils'], container, services);
        const usePathUtils = deps.get(inject, 'pathUtils', () => pathUtils());
        const usePkgInfo = deps.get(inject, 'packageInfo', () =>
          packageInfo({
            inject: { pathUtils: usePathUtils },
          }),
        );
        const pkg = usePkgInfo.getSync();
        const prefix = pkg['appLoggerPrefix'] || pkg.name!;
        return new SimpleLogger({ prefix, ...rest });
      });
    },
);
