import { pathUtils, type PathUtils } from '@homer0/path-utils';
import { providerCreator, injectHelper } from '@homer0/jimple';
/**
 * The dictionary of dependencies that need to be injected in {@link RootFile}.
 */
type RootFileInjectOptions = {
  /**
   * The service that creates the path relative to the project root.
   */
  pathUtils: PathUtils;
};
/**
 * The inject helper to resolve the dependencies.
 */
const deps = injectHelper<RootFileInjectOptions>();
/**
 * The options for the service constructor.
 */
export type RootFileOptions = {
  /**
   * A dictionary with the dependency injections for the service. If one or more are not
   * provided, the service will create new instances.
   */
  inject?: Partial<RootFileInjectOptions>;
};
/**
 * A small service that reads the contents of the implementation's package.json file.
 */
export class RootFile {
  /**
   * Used to resolve the path of the files.
   */
  pathUtils: PathUtils;
  constructor({ inject = {} }: RootFileOptions = {}) {
    this.pathUtils = deps.get(inject, 'pathUtils', () => pathUtils());
  }
  /**
   * Require a file with a path relative to the project root.
   *
   * @param filepath  The path to the file, relative to the project root.
   * @template FileType  The type of the required file.
   */
  require<FileType = unknown>(filepath: string): FileType {
    // eslint-disable-next-line
    return require(this.pathUtils.join(filepath)) as FileType;
  }
  /**
   * Import a file with a path relative to the project root.
   *
   * @param filepath  The path to the file, relative to the project root.
   * @template FileType  The type of the required file.
   */
  import<FileType = unknown>(filepath: string): Promise<FileType> {
    return import(this.pathUtils.join(filepath)) as Promise<FileType>;
  }
}
/**
 * Shorthand for `new RootFile()`.
 *
 * @param args  The same parameters as the {@link RootFile} constructor.
 * @returns A new instance of {@link RootFile}.
 */
export const rootFile = (...args: ConstructorParameters<typeof RootFile>): RootFile =>
  new RootFile(...args);
/**
 * The options for the {@link RootFile} Jimple's provider creator.
 */
export type RootFileProviderOptions = {
  /**
   * The name that will be used to register the service.
   *
   * @default 'rootFile'
   */
  serviceName?: string;
  /**
   * A dictionary with the name of the services to inject. If one or more are not
   * provided, the service will create new instances.
   */
  services?: {
    [key in keyof RootFileInjectOptions]?: string;
  };
};
/**
 * A provider creator to register {@link RootFile} in a Jimple container.
 */
export const rootFileProvider = providerCreator(
  ({ serviceName = 'rootFile', ...rest }: RootFileProviderOptions = {}) =>
    (container) => {
      container.set(serviceName, () => {
        const { services = {} } = rest;
        const inject = deps.resolve(['pathUtils'], container, services);
        return new RootFile({ inject });
      });
    },
);
