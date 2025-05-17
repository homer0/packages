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
} from './types';

export const isRouteStringDefinition = (
  target: RoutePathDefinition | RoutePathGroup,
): target is RoutePathString => typeof target === 'string';

export const isRouteDetailDefinition = (
  target: RoutePathDetail | RoutePathGroup,
): target is RoutePathDetail => 'path' in target;

export const isRouteDefinition = (
  target: RoutePathDefinition | RoutePathGroup,
): target is RoutePathDefinition =>
  isRouteStringDefinition(target) || isRouteDetailDefinition(target);

export const ensureStringPath = <T extends RoutePathDefinition>(
  definition: T,
): RoutePathAsString<T> =>
  (isRouteStringDefinition(definition)
    ? definition
    : definition.path) as RoutePathAsString<T>;

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

export const prefixName = <RouteName extends string, ParentRouteName extends string>(
  routeName: RouteName,
  parentRouteName: ParentRouteName,
): PrefixedName<RouteName, ParentRouteName> =>
  (parentRouteName === ''
    ? routeName
    : `${parentRouteName}.${routeName}`) as PrefixedName<RouteName, ParentRouteName>;

export const getParams = <T extends string>(route: T): PathParams<T> => {
  const params = route.split('/').reduce<string[]>((acc, part) => {
    if (!part.startsWith(':')) return acc;
    acc.push(part.slice(1));
    return acc;
  }, []);

  return params as PathParams<T>;
};

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

export const formatRoutes = <T extends RoutePathGroup>(
  routes: T,
): FormattedRoutePaths<T> => {
  const formatted = formatGroup(routes, '', '/');
  return formatted as unknown as FormattedRoutePaths<T>;
};
