import { resourceFactory } from './resourceFactory.js';
import type {
  GenericFn,
  GenericCurriedFn,
  ResourceCreator,
  ResourceCreatorCurriedFn,
  ResourceCreatorHandler,
} from './factories.types.js';
/**
 * Generates a function to create resource creators of an specified type. This function
 * itself doesn't have logic, but it's just in charge of creating the constraint for the
 * resource creator function.
 *
 * As all the other _"factory functions"_, this is meant to be used as a building block
 * when extending the container.
 *
 * @returns A function that can be used to create "resource creators".
 * @template ResourceFn  The type of function the resource creator needs to have.
 * @example
 *
 *   type ActionFn = (c: Jimple) => void;
 *   const factory = resourceCreatorFactory<ActionFn>();
 *   const myAction = factory('action', 'fn', (name = 'foo') => (c) => {
 *     c.set(name, 'bar');
 *   });
 *
 */
export const resourceCreatorFactory =
  <ResourceFn extends GenericFn>() =>
  /**
   * Generates a new resource creator using the contraint defined in the factory.
   *
   * @param name       The name of the resource.
   * @param key        The property key for the function.
   * @param creatorFn  The curried function that returns the actual resource function.
   * @returns A resource creator: an object that can be used as a resource, and as a
   *          function that returns a resource.
   * @template Name       The literal type of `name`, to be used in the return object.
   * @template Key        The literal type of `key`, to be used in the return object.
   * @template ResFn      The type of the resource function, the creator function needs
   *                      to return. This is restricted by the factory constraint.
   * @template CreatorFn  The literal type of `creatorFn`, to be used in the return
   *                      object.
   * @example
   *
   *   const myAction = factory('action', 'fn', (name = 'foo') => (c) => {
   *     c.set(name, 'bar');
   *   });
   *
   */
  <
    Name extends string,
    Key extends string,
    ResFn extends ResourceFn,
    CreatorFn extends GenericCurriedFn<ResFn>,
  >(
    name: Name,
    key: Key,
    creatorFn: CreatorFn,
  ): ResourceCreator<Name, Key, CreatorFn, ResourceFn> => {
    const fnToProxy: ResourceCreatorCurriedFn<Name, Key, CreatorFn> = (...args) => {
      const actualResource = creatorFn(...args) as ReturnType<CreatorFn>;
      return resourceFactory<ResFn>()(name, key, actualResource);
    };

    const handler: ResourceCreatorHandler<Name, Key, CreatorFn> = {
      name,
      resource: null,
      get(target, property) {
        let result;
        if (property === this.name) {
          result = true;
        } else if (property === key) {
          if (this.resource === null) {
            const newResource = creatorFn() as ReturnType<CreatorFn>;
            this.resource = newResource;
          }
          result = this.resource;
        } else {
          const targetKey = property as keyof typeof target;
          result = target[targetKey];
        }

        return result;
      },
      has(target, property) {
        if (property === this.name || property === key) {
          return true;
        }

        const targetKey = property as keyof typeof target;
        return targetKey in target;
      },
    };

    return new Proxy(fnToProxy, handler) as unknown as ResourceCreator<
      Name,
      Key,
      CreatorFn,
      ResourceFn
    >;
  };
