/* eslint-disable n/no-process-env */
import { providerCreator } from '@homer0/jimple';

/**
 * A simple service to avoid calling `process.env` on multiples places of an app.
 */
export class EnvUtils {
  /**
   * The current `NODE_ENV`. If the variable is empty, the value will be `development`.
   */
  readonly env: string;
  /**
   * Whether or not the environment is production.
   */
  readonly production: boolean;
  constructor() {
    this.env = this.get('NODE_ENV', 'development');
    this.production = this.env === 'production';
  }
  /**
   * Checks whether an environment variable exists or not.
   *
   * @param name  The name of the variable.
   */
  exists(name: string): boolean {
    return typeof process.env[name] !== 'undefined';
  }
  /**
   * Gets the value of an environment variable.
   *
   * @param name          The name of the variable.
   * @param defaultValue  A fallback value in case the variable is `undefined`.
   * @param required      If the variable is required and `undefined`, it will throw an
   *                      error.
   * @throws If `required` is set to `true` and the variable is `undefined`.
   */
  get(name: string, defaultValue: string = '', required: boolean = false): string {
    if (this.exists(name)) {
      return process.env[name]!;
    }

    if (required) {
      throw new Error(`The following environment variable is missing: '${name}'`);
    }

    return defaultValue;
  }
  /**
   * Sets the value of an environment variable.
   *
   * @param name       The name of the variable.
   * @param value      The value of the variable.
   * @param overwrite  If the variable already exists, the method won't overwrite it,
   *                   unless you set this parameter to `true`.
   * @returns Whether or not the variable was set.
   */
  set(name: string, value: unknown, overwrite: boolean = false): boolean {
    if (!this.exists(name) || overwrite) {
      process.env[name] = String(value);
      return true;
    }

    return false;
  }
  /**
   * Whether or not the environment is for development.
   */
  get development(): boolean {
    return !this.production;
  }
}

/**
 * Shorthand for `new EnvUtils()`.
 *
 * @param args  The same parameters as the {@link EnvUtils} constructor.
 * @returns A new instance of {@link EnvUtils}.
 */
export const envUtils = (...args: ConstructorParameters<typeof EnvUtils>): EnvUtils =>
  new EnvUtils(...args);

/**
 * The options for the {@link EnvUtils} Jimple's provider creator.
 */
export type EnvUtilsProviderOptions = {
  /**
   * The name that will be used to register the service.
   *
   * @default 'envUtils'
   */
  serviceName?: string;
};
/**
 * A provider creator to register {@link PathUtils} in a Jimple container.
 */
export const envUtilsProvider = providerCreator(
  ({ serviceName = 'envUtils' }: EnvUtilsProviderOptions = {}) =>
    (container) => {
      container.set(serviceName, () => new EnvUtils());
    },
);
