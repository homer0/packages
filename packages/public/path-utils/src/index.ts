import * as path from 'path';
import { providerCreator } from '@homer0/jimple';
/**
 * The options for the service constructor.
 */
export type PathUtilsOptions = {
  /**
   * The location of the project's `home`(root) directory. By default it uses
   * `process.cwd()`.
   */
  home?: string;
  /**
   * A dictionary of known locations in the project.
   */
  locations?: Record<string, string>;
};
/**
 * A utility services to manage paths on a project. It allows for path building relatives
 * to the project root or from where the app executable is located.
 */
export class PathUtils {
  /**
   * The root path from where the app is being executed.
   */
  protected path: string;
  /**
   * The dictionary with the known locations in the project.
   */
  protected locations: Record<string, string> = {};
  constructor(options: PathUtilsOptions = {}) {
    this.path = process.cwd();

    if (options.locations) {
      Object.entries(options.locations).forEach(([name, location]) => {
        this.addLocation(name, location);
      });
    }

    this.addLocation('home', options.home || this.path);
    this.addLocation('app', process.argv[1] ? path.dirname(process.argv[1]) : this.path);
  }
  /**
   * Adds a new location.
   *
   * @param name      The reference name.
   * @param location  The path of the location. It must be inside the path from where
   *                  the app is being executed.
   */
  addLocation(name: string, location: string) {
    let locPath = location;
    /**
     * If it doesn't starts with the root location, then prefix it with it. The project
     * should never attempt to access a location outside its directory.
     */
    if (locPath !== this.path && !locPath.startsWith(this.path)) {
      locPath = path.join(this.path, locPath);
    }
    // Fix it so all the locations will end with a separator.
    if (!locPath.endsWith(path.sep)) {
      locPath = `${locPath}${path.sep}`;
    }
    // Add it to the dictionary.
    this.locations[name] = locPath;
  }
  /**
   * Gets a location path by its name.
   *
   * @param name  The location name.
   * @throws If there location is not registered.
   */
  getLocation(name: string): string {
    const location = this.locations[name];
    if (!location) {
      throw new Error(`There's no location with the following name: ${name}`);
    }

    return location;
  }
  /**
   * Gets the dictionary with the known locations.
   */
  getLocations(): Record<string, string> {
    return { ...this.locations };
  }
  /**
   * Builds a path using a location path as base.
   *
   * @param location  The location name.
   * @param paths     The rest of the path components to join.
   */
  joinFrom(location: string, ...paths: string[]) {
    const locationPath = this.getLocation(location);
    return path.join(locationPath, ...paths);
  }
  /**
   * Alias to {@link PathUtils.joinFrom} that uses the `home` location by default.
   *
   * @param paths  The rest of the path components to join.
   */
  join(...paths: string[]) {
    return this.joinFrom('home', ...paths);
  }
  /**
   * Gets the project root path.
   */
  getHome(): string {
    return this.getLocation('home');
  }
  /**
   * The path to the directory where the app executable is located.
   */
  getApp(): string {
    return this.getLocation('app');
  }
  /**
   * The root path from where the app is being executed (`cwd`).
   */
  getPath(): string {
    return this.path;
  }
}
/**
 * Shorthand for `new PathUtils()`.
 *
 * @param args  The same parameters as the {@link PathUtils} constructor.
 * @returns A new instance of {@link PathUtils}.
 */
export const pathUtils = (...args: ConstructorParameters<typeof PathUtils>): PathUtils =>
  new PathUtils(...args);

/**
 * The options for the {@link PathUtils} Jimple's provider creator.
 */
export type PathUtilsProviderOptions = PathUtilsOptions & {
  /**
   * The name that will be used to register the service.
   *
   * @default 'pathUtils'
   */
  serviceName?: string;
};
/**
 * A provider creator to register {@link PathUtils} in a Jimple container.
 */
export const pathUtilsProvider = providerCreator(
  ({ serviceName = 'pathUtils', ...rest }: PathUtilsProviderOptions = {}) =>
    (container) => {
      container.set(serviceName, () => new PathUtils(rest));
    },
);
