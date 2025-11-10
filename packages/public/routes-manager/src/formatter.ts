import type {
  RoutePathGroup,
  FormattedRoutePaths,
  RoutePathAsString,
  RoutePathDefinition,
  RoutePathString,
  RoutePathDetail,
  PathParams,
  PathWithParams,
  PrefixedPath,
  PrefixedName,
  FormattedRoutePathDefinition,
} from './types.js';

/**
 * Type guard to validate if a target, that can be a route path defintion or a group of
 * routes, is a route path string.
 *
 * @param target  The target to validate.
 */
export const isRouteStringDefinition = (
  target: RoutePathDefinition | RoutePathGroup,
): target is RoutePathString => typeof target === 'string';
/**
 * Type guard to validate if a target, that can be a route path defintion or a group of
 * routes, is a route path definition object.
 *
 * @param target  The target to validate.
 */
export const isRouteDetailDefinition = (
  target: RoutePathDetail | RoutePathGroup,
): target is RoutePathDetail => 'path' in target;
/**
 * Type guard to validate if a target, that can be a route path defintion or a group of
 * routes, is a route path definition.
 *
 * @param target  The target to validate.
 */
export const isRouteDefinition = (
  target: RoutePathDefinition | RoutePathGroup,
): target is RoutePathDefinition =>
  isRouteStringDefinition(target) || isRouteDetailDefinition(target);
/**
 * Given a route path definition, regardless of the format, it returns the path as a
 * string.
 *
 * @param definition  The route path definition, can be a string or an object with a
 *                    path.
 */
export const ensureStringPath = <T extends RoutePathDefinition>(
  definition: T,
): RoutePathAsString<T> =>
  (isRouteStringDefinition(definition)
    ? definition
    : definition.path) as RoutePathAsString<T>;
/**
 * Given a route path definition, and parent route path definition, it prefixes the path
 * of the first with the one of the second, unless the second is just `/`, in which case
 * it returns the first as is (to avoid a route starting with `//`).
 *
 * @param routePath      The definition for the route path to prefix.
 * @param rootRoutePath  The definition of the parent route path to prefix with.
 */
export const prefixPath = <
  RoutePath extends RoutePathDefinition,
  RootRoutePath extends RoutePathDefinition,
>(
  routePath: RoutePath,
  rootRoutePath: RootRoutePath,
): PrefixedPath<RoutePath, RootRoutePath> => {
  const routePathStr = ensureStringPath(routePath);
  const rootRoutePathStr = ensureStringPath(rootRoutePath) as string;
  return (
    rootRoutePathStr === '/' ? routePathStr : `${rootRoutePathStr}${routePathStr}`
  ) as PrefixedPath<RoutePath, RootRoutePath>;
};
/**
 * Given a route name, and a parent route name, it prefixes the first with the second,
 * unless the second is an empty string, in which case it returns the first as is (to
 * avoid a route name starting with `.`). This is used when all the groups are flattened
 * to a single object.
 *
 * @param routeName        The name of the route to prefix.
 * @param parentRouteName  The name of the parent route to prefix with.
 */
export const prefixName = <RouteName extends string, ParentRouteName extends string>(
  routeName: RouteName,
  parentRouteName: ParentRouteName,
): PrefixedName<RouteName, ParentRouteName> =>
  (parentRouteName === ''
    ? routeName
    : `${parentRouteName}.${routeName}`) as PrefixedName<RouteName, ParentRouteName>;

/**
 * Given a route path string, it will extract all possible params from it into an array.
 *
 * @param route  The route path string to extract the params from.
 */
export const getParams = <T extends string>(route: T): PathParams<T> => {
  const params = route.split('/').reduce<string[]>((acc, part) => {
    if (!part.startsWith(':')) return acc;
    acc.push(part.slice(1));
    return acc;
  }, []);

  return params as PathParams<T>;
};
/**
 * Given a route path string, it will attempt to extract all possible params from it, and
 * if there are any, it will return an object with the `path` and the `params`; otherwise,
 * it will just return an object with the `path`.
 *
 * @param path  The path to extract the params from.
 */
export const getPathWithParams = <T extends string>(path: T): PathWithParams<T> => {
  const params = getParams(path);
  if (params.length) {
    return {
      path,
      params,
    };
  }

  return { path } as PathWithParams<T>;
};
/**
 * Takes a route path definition, string or object, and a root path string, and formats
 * the definition in order to prefix the path with the root path, and extract all possible
 * params from it.
 *
 * @param definition  The route path definition to format.
 * @param rootPath    The route path string that needs to be used to prefix the route
 *                    path.
 */
export const formatRouteDefinition = <
  T extends RoutePathDefinition,
  R extends RoutePathString,
>(
  definition: T,
  rootPath: R,
): FormattedRoutePathDefinition<T, R> => {
  if (isRouteStringDefinition(definition)) {
    const usePath = prefixPath(definition, rootPath);
    return getPathWithParams(usePath) as unknown as FormattedRoutePathDefinition<T, R>;
  }

  const usePath = prefixPath(definition.path, rootPath);
  return {
    ...(definition as Omit<T, 'path'>),
    ...getPathWithParams(usePath),
  } as unknown as FormattedRoutePathDefinition<T, R>;
};
/**
 * Takes a group of route path definitions, and recursively formats them in a flattened
 * dictionary.
 *
 * @param group       The group of routes to format.
 * @param parentName  The name of the parent route, to prefix all the group routes
 *                    with.
 * @param parentRoot  The root path of the parent route, to prefix all the group routes
 *                    with.
 */
export const formatGroup = <
  Group extends RoutePathGroup,
  ParentName extends string,
  ParentRoot extends RoutePathString,
>(
  group: Group,
  parentName: ParentName,
  parentRoot: ParentRoot,
): Record<string, FormattedRoutePathDefinition> => {
  const useParentRoot = prefixPath(group.root, parentRoot);
  const formatted = Object.entries(group).reduce<
    Record<string, FormattedRoutePathDefinition>
  >((acc, [key, value]) => {
    if (key === 'root') return acc;
    const accKey = prefixName(key as string, parentName);
    if (isRouteDefinition(value)) {
      acc[accKey as string] = formatRouteDefinition(
        value,
        useParentRoot,
      ) as unknown as FormattedRoutePathDefinition;
      return acc;
    }

    return {
      ...acc,
      ...formatGroup(value, accKey, useParentRoot),
    };
  }, {});

  return formatted;
};
/**
 * Takes the top level group of routes, and recursively formats all sub groups and routes
 * into a flattened dictionary of routes, where the keys are the route names (prefixed by
 * the parent route name), and the values are always objects, with the path and params.
 *
 * @param routes  The top level group of routes.
 */
export const formatRoutes = <T extends RoutePathGroup>(
  routes: T,
): FormattedRoutePaths<T> => {
  const formatted = formatGroup(routes, '', '/');
  return formatted as unknown as FormattedRoutePaths<T>;
};
