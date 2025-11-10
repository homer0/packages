import { formatRoutes } from './formatter.js';
import { Route } from './route.js';
import type {
  RoutePathGroup,
  RoutePath,
  FormattedRoutePaths,
  RoutePathParams,
} from './types.js';

/**
 * A dictionary of all the routes that are sent to the manager, but wrapped inside
 * {@link Route} instances.
 */
type RoutesDict<
  Definitions extends RoutePathGroup,
  Routes = FormattedRoutePaths<Definitions>,
> = {
  [K in keyof Routes as Routes[K] extends RoutePath
    ? K
    : never]: Routes[K] extends RoutePath ? Route<Routes[K]> : never;
};
/**
 * Extracts the parameters from a route definition inside a {@link Route} instance.
 */
type RouteClassFormatParams<T> = T extends Route<infer P> ? RoutePathParams<P> : [];
/**
 * The orchestrator class that takes all the route defintions, formats them into {@link Route}
 * instances, and provides a way to access them.
 */
export class RoutesManager<
  Definitions extends RoutePathGroup,
  Routes = FormattedRoutePaths<Definitions>,
  RoutesDictionary = RoutesDict<Definitions>,
> {
  /**
   * A dictionary of all the routes' formatted definitions. Theses are just formatted, but
   * not wrapped inside {@link Route} instances. The keys are the route names.
   */
  protected definitions: Routes;
  /**
   * A dictionary of the formatted routes, wrapped inside {@link Route} instances. The
   * keys are the route names.
   */
  protected routes: RoutesDictionary;
  /**
   * @param routes  The raw defintions of the routes.
   */
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
  /**
   * Gets a readonly dictionary with the the formatted definitions of the routes.
   */
  getDefinitions(): Readonly<Routes> {
    return this.definitions as Routes;
  }
  /**
   * Gets a specific route definition by its key. The key is the name of the route, and if
   * it is a sub route, it will be prefixed with the parent route name and a dot.
   *
   * @param key  The key of the route definition to get.
   * @throws An error if the route definition is not found.
   */
  getDefinition<K extends keyof Routes>(key: K): Routes[K] {
    const definition = this.definitions[key];
    if (!definition) {
      const stringKey = key as string;
      throw new Error(`Definition not found for key '${stringKey}'`);
    }

    return definition;
  }
  /**
   * Gets a readonly dictionary with all the routes, wrapped inside {@link Route}
   * instances.
   */
  getRoutes(): Readonly<RoutesDictionary> {
    return this.routes;
  }
  /**
   * Gets a specific {@link Route} by its key. The key is the name of the route, and if it
   * is a sub route, it will be prefixed with the parent route name and a dot.
   *
   * @param key  The key of the route definition to get.
   * @throws An error if the route definition is not found.
   */
  getRoute<K extends keyof RoutesDictionary>(key: K): RoutesDictionary[K] {
    const route = this.routes[key];
    if (!route) {
      const stringKey = key as string;
      throw new Error(`Route not found for key '${stringKey}'`);
    }

    return route;
  }
  /**
   * Generates a route string path.
   *
   * @param key     The key of the route definition.
   * @param params  The dictionary of parameters to replace in the route path.
   *                Parameters not present in the definition will be added as query
   *                parameters.
   */
  getPath<K extends keyof RoutesDictionary>(
    key: K,
    ...params: RouteClassFormatParams<RoutesDictionary[K]>
  ): string {
    const route = this.getRoute(key) as Route<RoutePath>;
    const formattedParams = params as RoutePathParams<RoutePath>;
    return route.format(...formattedParams);
  }
}
/**
 * Shorthand to create a new {@link RoutesManager} instance.
 *
 * @param routes  The raw definitions of the routes.
 */
export const createRoutesManager = <Definitions extends RoutePathGroup>(
  routes: Definitions,
): RoutesManager<Definitions> => new RoutesManager(routes);
