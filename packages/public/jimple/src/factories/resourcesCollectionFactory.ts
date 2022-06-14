import { resourceFactory } from './resourceFactory';
import type { GenericFn, Resource } from './factories.types';

export const resourcesCollectionFactory =
  <ResourceName extends string, ResourceFn extends GenericFn>() =>
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
