import { formatRoutes } from './formatter';
import { Route } from './route';
import type {
  RoutePathGroup,
  RoutePath,
  FormattedRoutePaths,
  RoutePathParams,
} from './types';

type RoutesDict<
  Definitions extends RoutePathGroup,
  Routes = FormattedRoutePaths<Definitions>,
> = {
  [K in keyof Routes as Routes[K] extends RoutePath
    ? K
    : never]: Routes[K] extends RoutePath ? Route<Routes[K]> : never;
};

type RouteClassFormatParams<T> = T extends Route<infer P> ? RoutePathParams<P> : [];

export class RoutesManager<
  Definitions extends RoutePathGroup,
  Routes = FormattedRoutePaths<Definitions>,
  RoutesDictionary = RoutesDict<Definitions>,
> {
  protected definitions: Routes;
  protected routes: RoutesDictionary;
  constructor(routes: Definitions) {
    const definitions = formatRoutes(routes);
    this.routes = Object.entries(definitions).reduce((acc, [keyRaw, valueRaw]) => {
      const key = keyRaw as keyof RoutesDictionary;
      const value = valueRaw as RoutePath;
      const route = new Route(value);
      acc[key] = route as RoutesDictionary[keyof RoutesDictionary];
      return acc;
    }, {} as RoutesDictionary);
    this.definitions = definitions as Routes;
  }

  getDefinitions(): Readonly<Routes> {
    return this.definitions as Routes;
  }

  getDefinition<K extends keyof Routes>(key: K): Routes[K] {
    const definition = this.definitions[key];
    if (!definition) {
      const stringKey = key as string;
      throw new Error(`Definition not found for key '${stringKey}'`);
    }

    return definition;
  }

  getRoutes(): Readonly<RoutesDictionary> {
    return this.routes;
  }

  getRoute<K extends keyof RoutesDictionary>(key: K): RoutesDictionary[K] {
    const route = this.routes[key];
    if (!route) {
      const stringKey = key as string;
      throw new Error(`Route not found for key '${stringKey}'`);
    }

    return route;
  }

  getPath<K extends keyof RoutesDictionary>(
    key: K,
    ...params: RouteClassFormatParams<RoutesDictionary[K]>
  ): string {
    const route = this.getRoute(key) as Route<RoutePath>;
    const formattedParams = params as RoutePathParams<RoutePath>;
    return route.format(...formattedParams);
  }
}

export const createRoutesManager = <Definitions extends RoutePathGroup>(
  routes: Definitions,
): RoutesManager<Definitions> => new RoutesManager(routes);
