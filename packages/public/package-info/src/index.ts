import * as fsSync from 'fs';
import * as fsPromises from 'fs/promises';
import type { IPackageJson } from 'package-json-type';
import { pathUtils, type PathUtils } from '@homer0/path-utils';
import { deferred, type DeferredPromise } from '@homer0/deferred';
import { providerCreator } from '@homer0/jimple';
/**
 * The dictionary of dependencies that need to be injected in {@link PackageInfo}.
 */
type PackageInfoInjectOptions = {
  /**
   * The service that creates the path relative to the project root.
   */
  pathUtils: PathUtils;
};
/**
 * The list of services the provider will check when registering the service.
 */
const INJECT_NAMES: Array<keyof PackageInfoInjectOptions> = ['pathUtils'];
/**
 * The options for the service constructor.
 */
export type PackageInfoOptions = {
  /**
   * A dictionary with the dependency injections for the service. If one or more are not
   * provided, the service will create new instances.
   */
  inject?: Partial<PackageInfoInjectOptions>;
};
/**
 * A small service that reads the contents of the implementation's package.json file.
 */
export class PackageInfo {
  /**
   * A deferred promise that resolves when the package.json file is read. It will be
   * `undefined` if the file hasn't been read yet, or the contents are already saved in
   * the service.
   */
  protected defer?: DeferredPromise<IPackageJson>;
  /**
   * This property will store the contents of the file once it is read.
   */
  protected contents?: IPackageJson;
  /**
   * The absolute path to the package.json file.
   */
  protected filepath: string;
  constructor(options: PackageInfoOptions = {}) {
    const { inject = {} } = options;
    const usePathUtils = inject.pathUtils || pathUtils();
    this.filepath = usePathUtils.join('package.json');
  }
  /**
   * Gets the contents of the implementation's package.json file.
   */
  async get(): Promise<Readonly<IPackageJson>> {
    if (this.contents) return this.contents;
    if (this.defer) return this.defer.promise;

    this.defer = deferred<IPackageJson>();
    const packageJson = await fsPromises.readFile(this.filepath, 'utf8');
    return this.updateContents(packageJson);
  }
  /**
   * Synchronously gets the contents of the implementation's package.json file.
   */
  getSync(): Readonly<IPackageJson> {
    if (this.contents) return this.contents;

    const packageJson = fsSync.readFileSync(this.filepath, 'utf8');
    return this.updateContents(packageJson);
  }
  /**
   * This is a helper that takes care of updating the property with the file contents, and
   * if the deferred promise exists, resolve it and delete it.
   *
   * @param contents  The contents of the package.json file.
   */
  protected updateContents(contents: string): IPackageJson {
    this.contents = JSON.parse(contents) as IPackageJson;
    if (this.defer) {
      this.defer.resolve(this.contents);
      this.defer = undefined;
    }
    return this.contents;
  }
}
/**
 * Shorthand for `new PackageInfo()`.
 *
 * @param args  The same parameters as the {@link PackageInfo} constructor.
 * @returns A new instance of {@link PackageInfo}.
 */
export const packageInfo = (
  ...args: ConstructorParameters<typeof PackageInfo>
): PackageInfo => new PackageInfo(...args);
/**
 * The options for the {@link PackageInfo} Jimple's provider creator.
 */
export type PackageInfoProviderOptions = {
  /**
   * The name that will be used to register the service.
   *
   * @default 'packageInfo'
   */
  serviceName?: string;
  /**
   * A dictionary with the name of the services to inject. If one or more are not
   * provided, the service will create new instances.
   */
  services?: {
    [key in keyof PackageInfoInjectOptions]?: string;
  };
};
/**
 * A provider creator to register {@link PackageInfo} in a Jimple container.
 */
export const packageInfoProvider = providerCreator(
  ({ serviceName = 'packageInfo', ...rest }: PackageInfoProviderOptions = {}) =>
    (container) => {
      container.set(serviceName, () => {
        const { services = {} } = rest;
        const inject = INJECT_NAMES.reduce<Partial<PackageInfoInjectOptions>>(
          (acc, key) => {
            const injectName = key as keyof PackageInfoInjectOptions;
            if (services[injectName]) {
              acc[injectName] = container.get<
                PackageInfoInjectOptions[typeof injectName]
              >(services[injectName]);
            } else if (container.has(injectName)) {
              acc[injectName] =
                container.get<PackageInfoInjectOptions[typeof injectName]>(injectName);
            }

            return acc;
          },
          {},
        );

        return new PackageInfo({ inject });
      });
    },
);
