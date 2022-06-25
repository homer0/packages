import colors from 'colors/safe';
import { pathUtils, type PathUtils } from '@homer0/path-utils';
import { packageInfo, type PackageInfo } from '@homer0/package-info';
import { providerCreator, injectHelper } from '@homer0/jimple';

export type SimpleLoggerColor =
  | Exclude<keyof typeof colors, 'enabled' | 'enable' | 'disable' | 'setTheme'>
  | 'raw';

export type SimpleLoggerLine = string | [string, SimpleLoggerColor];
export type SimpleLoggerMessage = string | SimpleLoggerLine[];

export type SimpleLoggerOptions = {
  prefix?: string;
  showTime?: boolean;
};

type ExceptionLike = {
  stack: string;
};

export class SimpleLogger {
  readonly prefix: string;
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

  success(message: SimpleLoggerMessage): void {
    this.log(message, 'green');
  }

  info(message: SimpleLoggerMessage): void {
    this.log(message, 'grey');
  }

  warn(message: SimpleLoggerMessage): void {
    this.log(message, 'yellow');
  }

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

export type SimpleLoggerProviderOptions = SimpleLoggerOptions & {
  /**
   * The name that will be used to register the service.
   *
   * @default 'simpleLogger'
   */
  serviceName?: string;
};

export const simpleLoggerProvider = providerCreator(
  ({ serviceName = 'simpleLogger', ...rest }: SimpleLoggerProviderOptions = {}) =>
    (container) => {
      container.set(serviceName, () => new SimpleLogger(rest));
    },
);

type AppLoggerProviderInjectOptions = {
  packageInfo: PackageInfo;
  pathUtils: PathUtils;
};

export type AppLoggerProviderOptions = Omit<SimpleLoggerProviderOptions, 'prefix'> & {
  /**
   * A dictionary with the name of the services to inject. If one or more are not
   * provided, the service will create new instances.
   */
  services?: {
    [key in keyof AppLoggerProviderInjectOptions]?: string;
  };
};

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
        // eslint-disable-next-line dot-notation
        const prefix = pkg['nameForCLI'] || pkg.name!;
        return new SimpleLogger({ prefix, ...rest });
      });
    },
);
