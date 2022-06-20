import type { Jimple } from '../jimple';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- They are dynamically extended.
type GenericDict = Record<any, any>;
/**
 * A helper that reusable services can use to resolve dependencies in constructors and/or
 * providers.
 *
 * @template InjectDictionary  A dictionary of the dependencies and their types.
 * @template InjectKey         The literal type of the dictionary types.
 */
export class InjectHelper<
  InjectDictionary extends GenericDict,
  InjectKey = keyof InjectDictionary,
> {
  /**
   * This method is meant to be used to validate the dependencies a service receives, and
   * needs.
   * It will check on the received dependencies, if a specific dependency exists, it will
   * return it, otherwise, it will create a new instance.
   *
   * @param dependencies  The dependencies received by the implementation.
   * @param key           The key of the dependency to validate.
   * @param init          A function to create a dependency in case it doesn't exist in
   *                      the dictionary.
   * @returns An instance of the dependency.
   * @template DepKey   The literal key of the dependency to validate.
   * @template DepType  The type of the dependency, obtained from the dictionary sent
   *                    to the constructor.
   * @example
   *
   *   type Dependencies = {
   *     dep: string;
   *   };
   *   const helper = new InjectHelper<Dependencies>();
   *
   *   type MyServiceOptions = {
   *     inject?: Partial<Dependencies>;
   *   };
   *   const myService = ({ inject = {} }: MyServiceOptions) => {
   *     const dep = helper.get(inject, 'dep', () => 'default');
   *     console.log('dep:', dep);
   *   };
   *
   */
  get<DepKey extends InjectKey, DepType = InjectDictionary[DepKey]>(
    dependencies: Partial<InjectDictionary>,
    key: InjectKey,
    init: () => DepType,
  ): DepType {
    const existing = dependencies[key];
    if (typeof existing !== 'undefined') {
      return existing!;
    }

    return init();
  }
  /**
   * This is meant to be used in a provider creator to resolve dependencies' names sent as
   * options. For each dependency, the method will first check if a new name was
   * specified, and try to get it with that name, otherwise, it will try to get it with
   * the default name, and if it doesn't exist, it will just keep it as `undefined` and
   * expect the service implements {@link InjectHelper.get} to ensure the dependency.
   *
   * @param dependencies  The dependencies needed by the service.
   * @param container     A reference to the Jimple container.
   * @param inject        A dictionary of dependencies names.
   * @returns A dictionary of dependencies to send to the service.
   * @template DepKey     The literal key of the dependencies to validate.
   * @template Container  The type of the Jimple container.
   * @example
   *
   *   type Dependencies = {
   *     dep: string;
   *   };
   *   const helper = new InjectHelper<Dependencies>();
   *
   *   type MyProviderOptions = {
   *     services?: {
   *       [key in keyof Dependencies]?: string;
   *     };
   *   };
   *
   *   const myProvider = providerCreator(
   *     ({ services = {} }: MyProviderOptions) =>
   *       (container) => {
   *         container.set('myService', () => {
   *           const inject = helper.resolve(['dep'], container, services);
   *           return myService({ inject });
   *         });
   *       },
   *   );
   *
   */
  resolve<DepKey extends InjectKey, Container extends Jimple>(
    dependencies: DepKey[],
    container: Container,
    inject: Partial<Record<keyof InjectDictionary, string>>,
  ): Partial<InjectDictionary> {
    const result = dependencies.reduce<Partial<InjectDictionary>>((acc, key) => {
      if (inject[key]) {
        acc[key] = container.get<InjectDictionary[typeof key]>(inject[key]!);
        return acc;
      }

      const keyStr = key as unknown as string;
      if (container.has(keyStr)) {
        acc[key] = container.get<InjectDictionary[typeof key]>(keyStr);
        return acc;
      }

      return acc;
    }, {});

    return result;
  }
}
/**
 * Shorthand for `new InjectHelper()`.
 *
 * @returns A new instance of {@link InjectHelper}.
 */
export const injectHelper = <InjectDictionary extends GenericDict>() =>
  new InjectHelper<InjectDictionary>();
