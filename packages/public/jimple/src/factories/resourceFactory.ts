import type { GenericFn, Resource } from './factories.types';

export const resourceFactory =
  <ResourceFn extends GenericFn>() =>
  <Name extends string, Key extends string, Fn extends ResourceFn>(
    name: Name,
    key: Key,
    fn: Fn,
  ): Resource<Name, Key, Fn> =>
    ({
      [name]: true,
      [key]: fn,
    } as Resource<Name, Key, Fn>);
