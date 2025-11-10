import urijs from 'urijs';
import { flat, copy } from '@homer0/object-utils';
import type {
  EndpointDefinition,
  EndpointDefinitionProps,
  EndpointsDict,
} from './types.js';
/**
 * The options for the service constructor.
 */
export type EndpointsGeneratorOptions = {
  /**
   * The base URL for the endpoints.
   */
  url: string;
  /**
   * The dictionary with the endpoints' definitions.
   */
  endpoints: EndpointsDict;
  /**
   * The format the placeholders must have in order to be replaced by the service. It can
   * be anything that includes `%name%`, for example `:%name%`, or `{{%name%}}`.
   *
   * @default ':%name%'
   */
  paramsPlaceholder?: string;
};
/**
 * A service that allows the generation of endpoints in a easy way.
 */
export class EndpointsGenerator {
  /**
   * The base URL for the endpoints.
   */
  protected url: string;
  /**
   * A flatten dictionary with the endpoints' definitions.
   */
  protected endpoints: Record<string, EndpointDefinition>;
  /**
   * The format the placeholders must have in order to be replaced by the service. It can
   * be anything that includes `%name%`, for example `:%name%`, or `{{%name%}}`.
   */
  protected paramsPlaceholder: string;
  constructor({
    url,
    endpoints,
    paramsPlaceholder = ':%name%',
  }: EndpointsGeneratorOptions) {
    this.url = url.replace(/\/+$/, '');
    this.endpoints = flat({
      target: endpoints,
      shouldFlatten: (_, value) => {
        const item = value as EndpointDefinition | EndpointsDict;
        return typeof item !== 'string' && !('path' in item);
      },
    });
    this.paramsPlaceholder = paramsPlaceholder;
  }
  /**
   * Generates an endpoint's URL.
   *
   * @param key         The key property of the endpoint in the flatten dictionary.
   * @param parameters  A dictionary of paramteres that will replace the placeholders
   *                    in the path. If a parameter doesn't have a placeholder, it will
   *                    be added to the query string.
   * @returns A generated endpoint URL.
   * @throws If the endpoint doesn't exist in the dictionary.
   */
  get(key: string, parameters: Record<string, unknown> = {}): string {
    // Get the endpoint information.
    const info = this.endpoints[key];
    // Validate that the endpoint exists.
    if (!info) {
      throw new Error(`Trying to access unknown endpoint: ${key}`);
    }
    // Get a new reference for the parameters.
    const params = { ...parameters };
    // If the endpoint is a string, format it into an object with `path`.
    const endpoint: EndpointDefinitionProps =
      typeof info === 'string' ? { path: info } : info;
    // Define the object that will have the query string.
    const newQuery: Record<string, unknown> = {};
    // We extract it so TypeScript can validate that it exists.
    const endpointQuery = endpoint.query;
    // If the endpoint has a `query` property...
    if (endpointQuery) {
      // ...Loog all the query parameters.
      Object.keys(endpointQuery).forEach((queryName) => {
        // Get the defined value of the parameter.
        const queryValue = endpointQuery[queryName];
        // If there's a value of this parameter on the received `parameters`...
        if (typeof params[queryName] !== 'undefined') {
          // ...add it to the query dictionary.
          newQuery[queryName] = params[queryName];
          // Remove the used parameter.
          delete params[queryName];
        } else if (queryValue !== null) {
          // If the default value of the parameter is not `null`, use it.
          newQuery[queryName] = queryValue;
        }
      });
    }
    // Get the endpoint path.
    let { path } = endpoint;
    // Loop all the received `parameters`...
    Object.keys(params).forEach((parameter) => {
      // Build how a placeholder for this parameter would look like.
      const placeholder = this.paramsPlaceholder.replace(/%name%/, parameter);
      // Get the parameter value.
      const value = params[parameter];
      // If the path has the placeholder...
      if (path.includes(placeholder)) {
        // ...replace the placeholder with the value.
        path = path.replace(placeholder, String(value));
      } else {
        // ...otherwise, add it on the query string.
        newQuery[parameter] = value;
      }
    });
    // Remove extra slashes, and a possible leading slash.
    path = path.replace(/\/+/g, '/').replace(/^\/+/, '');
    // Convert the URL into a `urijs` object.
    const uri = urijs(`${this.url}/${path}`);
    // Loop and add all the query string parameters.
    Object.keys(newQuery).forEach((queryName) => {
      uri.addQuery(queryName, newQuery[queryName]);
    });
    // Return the `urijs` object as a string.
    return uri.toString();
  }
  /**
   * Gets the dictionary of endpoints the service uses.
   */
  getEndpoints(): Record<string, EndpointDefinition> {
    return copy(this.endpoints);
  }
  /**
   * Gets the base URL for the endpoints.
   */
  getUrl(): string {
    return this.url;
  }
}
/**
 * Shorthand for `new EndpointsGenerator()`.
 *
 * @param args  The same parameters as the {@link EndpointsGenerator} constructor.
 * @returns A new instance of {@link EndpointsGenerator}.
 */
export const endpointsGenerator = (
  ...args: ConstructorParameters<typeof EndpointsGenerator>
): EndpointsGenerator => new EndpointsGenerator(...args);
