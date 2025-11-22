import type { RoutePath, RoutePathParams } from './types.js';
/**
 * A utility class that wraps a route definition in order to provider helper methods for
 * formatting.
 */
export class Route<Definition extends RoutePath = RoutePath> {
  /**
   * A list of all the components on a route path. This is created in the constructor and
   * kept around in order to optimize the formatting process: in cases with parameters, we
   * don't need to split the path again, look up the parameters and do the replacements;
   * we just copy the list, get the indexes from `knownParamsIndex`, and replace the
   * values.
   */
  protected pathComponents: string[];
  /**
   * A map of all the parameters on the route path, and their indexes in `pathComponents`.
   * This is used during formatting to avoid re-parsing the path and just replacing the
   * component at the index.
   */
  protected knownParamsIndex: Map<string, number> = new Map();
  /**
   * @param definition  The route definition to wrap.
   * @throws An error if a param in the route path is not defined in the params
   *         array.
   * @throws An error if a param in the params array is not defined in the route
   *         path.
   */
  constructor(public readonly definition: Definition) {
    this.pathComponents = definition.path.split('/').filter(Boolean);
    const definitionParams = definition.params || [];
    this.pathComponents.forEach((part, index) => {
      if (part.startsWith(':')) {
        const paramName = part.slice(1);
        if (!definitionParams.includes(paramName)) {
          throw new Error(
            `Route param '${paramName}' is not defined in the params array`,
          );
        }

        this.knownParamsIndex.set(paramName, index);
      }
    });

    definitionParams.forEach((param) => {
      if (!this.knownParamsIndex.has(param)) {
        throw new Error(
          `Route param '${param}' is defined in the params array but not in the path`,
        );
      }
    });

    this.format = this.format.bind(this);
  }
  /**
   * Creates a route path string from the definition.
   *
   * @param params  The parameters to replace in the route path. If the route has no
   *                params, this can be omitted. Params not present in the definition
   *                will be added as query parameters.
   * @throws An error if the params are required but not provided.
   * @throws An error if a required param is missing.
   * @throws An error if a required query param is missing.
   */
  format(...params: RoutePathParams<Definition>): string {
    const [paramsObj] = params;
    if (typeof paramsObj === 'undefined') {
      if (this.knownParamsIndex.size > 0) {
        throw new Error('Route params are required');
      }

      const path = this.pathComponents.slice().join('/');
      return `/${path}`;
    }

    if (this.knownParamsIndex.size) {
      const missingParam = this.definition.params!.find((param) => {
        const paramName = param as keyof typeof paramsObj;
        return !paramsObj[paramName];
      });

      if (typeof missingParam !== 'undefined') {
        throw new Error(`Missing required param: ${missingParam}`);
      }
    }

    const { queryParams: requiredQueryParams } = this.definition;
    if (requiredQueryParams) {
      const missingQueryParam = requiredQueryParams.find((param) => {
        const paramName = param as keyof typeof paramsObj;
        return !paramsObj[paramName];
      });

      if (typeof missingQueryParam !== 'undefined') {
        throw new Error(`Missing required query param: ${missingQueryParam}`);
      }
    }

    const { pathComponents, queryParams } = Object.entries(paramsObj).reduce<{
      pathComponents: string[];
      queryParams: URLSearchParams;
    }>(
      (acc, [key, valueUnknown]) => {
        const value = valueUnknown as string;
        const knownParamIndex = this.knownParamsIndex.get(key);

        if (typeof knownParamIndex !== 'undefined') {
          acc.pathComponents[knownParamIndex] = value;
        } else {
          acc.queryParams.set(key, value);
        }

        return acc;
      },
      { pathComponents: this.pathComponents.slice(), queryParams: new URLSearchParams() },
    );

    const queryParamString = queryParams.toString();
    const queryString = queryParamString ? `?${queryParamString}` : '';
    const path = pathComponents.join('/');
    return `/${path}${queryString}`;
  }
}
