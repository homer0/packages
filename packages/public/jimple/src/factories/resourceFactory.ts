import type { GenericFn, Resource } from './factories.types.js';
/**
 * Generates a function to create resources of an specified type. This function itself
 * doesn't have logic, but it's just in charge of creating the constraint for the resource
 * function.
 *
 * As all the other _"factory functions"_, this is meant to be used as a building block
 * when extending the container.
 *
 * @example
 *   type ActionFn = (c: Jimple) => void;
 *   const factory = resourceFactory<ActionFn>();
 *   const myAction = factory('action', 'fn', (c) => {
 *     c.set('foo', 'bar');
 *   });
 *
 * @template ResourceFn The type of function the resource needs to have.
 * @returns A function that can be used to create a resource with a specified type of
 *   function.
 */
export const resourceFactory =
  <ResourceFn extends GenericFn>() =>
  /**
   * Generates a new resource using the contraint defined in the factory.
   *
   * @example
   *   const myAction = factory('action', 'fn', (c) => {
   *     c.set('foo', 'bar');
   *   });
   *
   * @template Name The literal type of `name`, to be used in the return object.
   * @template Key The literal type of `key`, to be used in the return object.
   * @template Fn The type of `fn`, restricted by the factory constraint.
   * @param name The name of the resource.
   * @param key The property key for the function.
   * @param fn The resource function.
   * @returns An object with the `name` set to `true`, and the `fn` as the `key`.
   */
  <Name extends string, Key extends string, Fn extends ResourceFn>(
    name: Name,
    key: Key,
    fn: Fn,
  ): Resource<Name, Key, Fn> =>
    ({
      [name]: true,
      [key]: fn,
    }) as Resource<Name, Key, Fn>;
