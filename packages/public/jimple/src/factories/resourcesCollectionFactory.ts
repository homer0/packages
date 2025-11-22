import { resourceFactory } from './resourceFactory.js';
import type { GenericFn, Resource } from './factories.types.js';
/**
 * Generates a function to configure a collection of resources of an specified type. This
 * function itself doesn't have logic, but it's just in charge of creating the constraint
 * for the resource name and function.
 *
 * As all the other _"factory functions"_, this is meant to be used as a building block
 * when extending the container.
 *
 * @returns A function that can be used to configure a collection of resources.
 * @template ResourceName  The literal type of the name the resources needs to have.
 * @template ResourceFn    The type of function the resources needs to have.
 * @example
 *
 *   type ActionFn = (c: Jimple) => void;
 *   const factory = resourcesCollectionFactory<'action', ActionFn>();
 *   const myActions = factory('action', 'fn')({ myActionA, myActionB });
 *
 */
export const resourcesCollectionFactory =
  <ResourceName extends string, ResourceFn extends GenericFn>() =>
  /**
   * Generates a function to create a collection of resources of an specified type. A
   * collection is a dictionary of resources, and a resource itself, and when its
   * "resource function" gets called, it calls the function of every resource (with the
   * same args it recevied).
   *
   * @param name  The resource name the items in the collection must have.
   * @param key   The key property the items in the collection must have.
   * @param fn    A custom function to process the items in the collection, when the
   *              collection function gets called.
   * @returns A function that can be used to create a resources collection.
   * @template Name      The literal type of `name`, to be used in the return object.
   * @template Key       The literal type of `key`, to be used in the return object.
   * @template ItemKey   To capture the name of the resources in the collection.
   * @template Items     The kind of dictionary of resources the return function will
   *                     expect.
   * @template CustomFn  The type of `fn`, restricted by the factory constraint.
   * @example
   *
   *   const myActions = factory('action', 'fn')({ myActionA, myActionB });
   *
   */
  <
    Name extends string,
    Key extends string,
    ItemKey extends string,
    Items extends Record<ItemKey, Resource<ResourceName, Key, ResourceFn>>,
    CustomFn extends (items: Items, ...rest: Parameters<ResourceFn>) => void,
  >(
    name: Name,
    key: Key,
    fn?: CustomFn,
  ) => {
    const collectionResourceFactory = resourceFactory<ResourceFn>();
    /**
     * The actual function that recevies the items and creates the collection.
     *
     * @param items  A dictionary of resources for the collection.
     * @returns A dictionary of the resources, that it's also a resource.
     * @template ItemsParam  The literal type of `items`, to be used in the return
     *                       object.
     * @throws If the dictionary contains the resource name or function key as keys.
     * @throws If one of the items doesn't have the resource function.
     */
    return <ItemsParam>(
      items: ItemsParam & Items,
    ): typeof items & Resource<Name, Key, ResourceFn> => {
      const invalidKeys: string[] = [name, key];
      const itemsKeys = Object.keys(items) as Array<keyof Items>;

      const invalidKey = itemsKeys.some((itemKey) =>
        invalidKeys.includes(String(itemKey)),
      );
      if (invalidKey) {
        throw new Error(
          `No item on the collection can have the keys \`${name}\` nor \`${key}\``,
        );
      }

      const invalidItem = itemsKeys.find(
        (itemKey) => typeof items[itemKey]?.[key] !== 'function',
      );
      if (invalidItem) {
        throw new Error(
          `The item \`${String(
            invalidItem,
          )}\` is invalid: it doesn't have a \`${key}\` function`,
        );
      }

      const useFn = fn
        ? (...args: Parameters<ResourceFn>) => fn(items, ...args)
        : (...args: Parameters<ResourceFn>) => {
            itemsKeys.forEach((itemK) => {
              const item = items[itemK]!;
              const itemFn = item[key];
              itemFn(...args);
            });
          };

      return {
        ...collectionResourceFactory(name, key, useFn as ResourceFn),
        ...items,
      };
    };
  };
