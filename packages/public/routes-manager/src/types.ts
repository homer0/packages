// ============================================================
// Core
// ============================================================

/**
 * A representation of a route path, that always starts with a `/`.
 */
export type RoutePathString = `/${string}`;
/**
 * The properties that make a route path.
 */
export type RoutePathDetail = {
  /**
   * The path of the route, that always starts with a `/`.
   */
  path: RoutePathString;
  /**
   * A list of required query parameters.
   */
  queryParams?: ReadonlyArray<string>;
  /**
   * A list of optional query parameters.
   */
  optionalQueryParams?: ReadonlyArray<string>;
  /**
   * A comment string to describe the route.
   */
  comments?: Readonly<string>;
};
/**
 * A route can be defined as a string, or as an object with a path and other properties.
 */
export type RoutePathDefinition = RoutePathString | RoutePathDetail;
/**
 * The base properties all groups have. The reason this interface exists is so the
 * definition of {@link RoutePathGroup} can be recursive.
 */
interface BaseRouterPathGroups {
  root: RoutePathDefinition;
}
/**
 * A dictionary of named routes, where the keys are the names of the routes and the values
 * are either routes, or sub groups of routes.
 */
export interface RoutePathGroup extends BaseRouterPathGroups {
  [key: string]: RoutePathDefinition | RoutePathGroup;
}

// ============================================================
// Utils
// ============================================================

/**
 * This utility is used in conditional types to ensure an inferred object type has at
 * least one key.
 */
type HasAtLeastOneKey<T> = keyof T extends never ? false : true;
/**
 * Picks all the keys of an object type that can be undefined.
 */
type PickKeysWithPartialValues<T> = keyof {
  [K in keyof T as undefined extends T[K] ? K : never]: K;
};
/**
 * This utility is used in conditional types to ensure an inferred object type has at
 * least one key that is not optional (possibly `undefined`).
 */
type HasAtLeastOneRequiredKey<T> = HasAtLeastOneKey<
  Omit<T, PickKeysWithPartialValues<T>>
>;
/**
 * This utility is used in conditional types to ensure an inferred array type has at
 * least one item.
 */
type HasAtLeastOneItem<T> = T extends readonly unknown[]
  ? T['length'] extends 0
    ? false
    : true
  : false;
/**
 * Useful to flatten the type output to improve type hints shown in editors. And also to
 * transform an interface into a type to aide with assignability.
 *
 * This is copied from the `type-fest` package.
 */
type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};
/**
 * A version of the `Simplify` utility (from `type-fest`) that makes the object readonly.
 */
type SimplifyReadonly<T> = Simplify<Readonly<T>>;
/**
 * Extracts all the parameters from a path string into a tuple.
 *
 * @example
 *
 *   type Params = PathParams<'/root/:foo/:bar/:baz'>; // ['foo', 'bar', 'baz']
 *
 */
export type PathParams<
  T extends string,
  Acc extends readonly string[] = [],
> = T extends `${string}:${infer U}/${infer R}`
  ? PathParams<R, [...Acc, U]>
  : T extends `${string}:${infer U}`
    ? [...Acc, U]
    : Acc;
/**
 * Validates a path string and returns an object with the path, and if needed, the params.
 *
 * @example
 *
 *   type PathWithParams = PathWithParams<'/root/:foo/:bar'>;
 *   // { path: '/root/:foo/:bar', params: ['foo', 'bar'] }
 *   type PathWithNoParams = PathWithParams<'/root'>;
 *   // { path: '/root' }
 *
 */
export type PathWithParams<T extends string, TP = PathParams<T>> = {
  path: T;
} & (HasAtLeastOneItem<TP> extends true ? { params: Readonly<TP> } : object);
/**
 * Extracts the path from a route path definition, whether it's a string or an object.
 */
export type RoutePathAsString<T extends RoutePathDefinition> = T extends RoutePathDetail
  ? T['path']
  : T;
/**
 * Adds a prefix to a path string by evaluating if there's a root path (from the group)
 * and if it's just `/`, so we can avoid prefixing a path that already starts with `/`.
 *
 * @example
 *
 *   type PrefixedPath = PrefixedPath<'/route', '/root'>; // '/root/route'
 *   type PrefixedPathWithoutRoot = PrefixedPath<'/route', '/'>; // '/route'
 *
 */
export type PrefixedPath<
  RoutePath extends RoutePathDefinition,
  RootRoutePath extends RoutePathDefinition,
  RoutePathStr extends string = RoutePathAsString<RoutePath>,
  RootRoutePathStr extends string = RoutePathAsString<RootRoutePath>,
> = RootRoutePathStr extends '/' ? RoutePathStr : `${RootRoutePathStr}${RoutePathStr}`;
/**
 * Prefixes a route name with the parent route name, if there's one. This is used when all
 * the groups are flattened to a single object.
 *
 * @example
 *
 *   type PrefixedName = PrefixedName<'settings', 'account'>; // 'account.settings'
 *   type PrefixedNameWithoutParent = PrefixedName<'settings'>; // 'settings'
 *
 */
export type PrefixedName<
  RouteName extends string,
  ParentRouteName extends string = '',
> = ParentRouteName extends '' ? RouteName : `${ParentRouteName}.${RouteName}`;
/**
 * Formats a route path definition, by prefixing the path with a possible root path, and
 * ensuring the type is an object with the path and params.
 */
export type FormattedRoutePathDefinition<
  PathDefinition extends RoutePathDefinition = RoutePathDefinition,
  RootPath extends RoutePathString = RoutePathString,
> = PathDefinition extends RoutePathDetail
  ? SimplifyReadonly<
      Omit<PathDefinition, 'path'> &
        PathWithParams<PrefixedPath<PathDefinition['path'], RootPath>>
    >
  : PathDefinition extends RoutePathString
    ? SimplifyReadonly<PathWithParams<PrefixedPath<PathDefinition, RootPath>>>
    : never;

// ============================================================
// Inference
// ============================================================

/**
 * Recursively flattens a group of routes, and possible sub groups, into a single object,
 * where the keys are the route names (prefixed with the parent route name), and the values
 * are always objects, with the path and params.
 */
type FlattenGroup<
  Group extends RoutePathGroup,
  ParentName extends string = '',
  ParentRoot extends RoutePathString = '/',
  RootPath extends RoutePathString = ParentRoot extends '/'
    ? RoutePathAsString<Group['root']>
    : PrefixedPath<Group['root'], ParentRoot>,
> = {
  [K in keyof Group]: Group[K] extends RoutePathDefinition
    ? {
        [P in PrefixedName<K & string, ParentName>]: FormattedRoutePathDefinition<
          Group[K],
          RootPath
        >;
      }
    : Group[K] extends RoutePathGroup
      ? FlattenGroup<Group[K], PrefixedName<K & string, ParentName>, RootPath>
      : {
          [P in PrefixedName<K & string, ParentName>]: Group[K];
        };
}[keyof Omit<Group, 'root'>];
/**
 * Utility method that allows us to merge all the flattened groups into a single object.
 */
type Merge<T> = (T extends unknown ? (x: T) => void : never) extends (x: infer R) => void
  ? SimplifyReadonly<R>
  : never;
/**
 * Flattens and formats all the groups into a single object.
 */
export type FormattedRoutePaths<T extends RoutePathGroup> = Merge<FlattenGroup<T>>;

// ============================================================
// Route
// ============================================================

/**
 * After a route is formatted, this is the type the manager uses to store the route: the
 * base defintion, and a possible list of params.
 */
export type RoutePath = RoutePathDetail & {
  params?: ReadonlyArray<string>;
};

/**
 * A dictionary with all the possible params for a route path. This includes the path
 * params, the query params, and the optional query params.
 *
 * @todo Create a utility type that will allow us to extract the params from a path
 *       string.
 */
type RouteParamsObject<T extends RoutePath> = Simplify<
  // - path params
  (T extends {
    params: infer Params;
  }
    ? Params extends readonly string[]
      ? {
          [K in Params[number]]: string;
        }
      : object
    : object) &
    // - query params
    (T extends {
      queryParams: infer QueryParams;
    }
      ? QueryParams extends readonly string[]
        ? {
            [K in QueryParams[number]]: string;
          }
        : object
      : object) &
    // - optional query params
    (T extends {
      optionalQueryParams: infer OptionalQueryParams;
    }
      ? OptionalQueryParams extends readonly string[]
        ? {
            [K in OptionalQueryParams[number]]?: string;
          }
        : object
      : object)
>;

/**
 * This utility type is used to build a dynamic signature for the method that creates the
 * routes: the type returns an array of arguments which value may change depending on
 * whether the route has params or not. If the {@link RouteParamsObject} has at least one
 * key, the arguments' returned will be a dictionary with the params; but if it doesn't,
 * the params will be optional (as the manager always allows for unexpected query params).
 */
export type RoutePathParams<T extends RoutePath, P = RouteParamsObject<T>> =
  HasAtLeastOneKey<P> extends true
    ? HasAtLeastOneRequiredKey<P> extends true
      ? [P & Record<string, string>]
      : [(P & Record<string, string>) | undefined] | []
    : [Record<string, string>] | [];
