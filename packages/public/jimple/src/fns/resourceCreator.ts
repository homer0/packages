import { resource } from './resource';
import type {
  GenericCurriedFn,
  ResourceCreatorCurriedFn,
  ResourceCreatorHandler,
  ResourceCreator,
} from './fns.types';
/**
 * This is a helper to dynamically configure a resource before creating it. The idea here
 * is that the returned object can be used as a function, to configure the resource, or as
 * a resource.
 * The difference with {@link resource} is that, instead of providing the function to
 * interact with the generated resource, the `creatorFn`
 * parameter is a function that returns a function like the one you would use on
 * {@link resource}. What this function actually returns is a {@link Proxy}, that when
 * used as a function, it will return a resource; but when used as a resource, it will
 * internally call `creatorFn` (and cache it) without parameters. It's very important that
 * all the parameters of the `creatorFn` are optional, otherwise it will cause an error if
 * called as a resource.
 *
 * @param name       The name of the resource. The generated object will have a
 *                   property with its name and the value `true`.
 * @param key        The name of the key that will have the function on the generated
 *                   object.
 * @param creatorFn  The function that will generate the 'resource function'.
 * @example
 *
 * <caption>Let's use `provider` again, that requires a `register` function:</caption>
 *
 *   const someProvider = resourceCreator(
 *     'provider',
 *     'register',
 *     (options = {}) =>
 *       (app) => {
 *         // ...
 *       },
 *   );
 *
 *   // Register it as a resource
 *   container.register(someProvider);
 *
 *   // Register it after creating a configured resource
 *   container.register(someProvider({ enabled: false }));
 *
 */
export const resourceCreator = <
  N extends string,
  K extends string,
  F extends GenericCurriedFn,
>(
  name: N,
  key: K,
  creatorFn: F,
): ResourceCreator<N, K, F> => {
  const fnToProxy: ResourceCreatorCurriedFn<N, K, F> = (...args) => {
    const actualResource = creatorFn(...args) as ReturnType<F>;
    return resource(name, key, actualResource);
  };

  const handler: ResourceCreatorHandler<N, K, F> = {
    name,
    resource: null,
    get(target, property) {
      let result;
      if (property === this.name) {
        result = true;
      } else if (property === key) {
        if (this.resource === null) {
          const newResource = creatorFn() as ReturnType<F>;
          this.resource = newResource;
        }
        result = this.resource;
      } else {
        const targetKey = property as keyof typeof target;
        result = target[targetKey];
      }

      return result;
    },
  };

  return new Proxy(fnToProxy, handler) as unknown as ResourceCreator<N, K, F>;
};
