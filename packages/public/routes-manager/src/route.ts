import type { RoutePath, RoutePathParams } from './types';

export class Route<Definition extends RoutePath = RoutePath> {
  protected pathComponents: string[];
  protected knownParamsIndex: Map<string, number> = new Map();

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
