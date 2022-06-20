import { EndpointsGenerator, type EndpointsGeneratorOptions } from './endpointsGenerator';
import type {
  EndpointDefinition,
  EndpointsDict,
  ErrorResponse,
  FetchClient,
  FetchOptions,
} from './types';
/**
 * The options for the client constructor.
 */
export type APIClientOptions = {
  /**
   * The base URL for the endpoints.
   */
  url: string;
  /**
   * The dictionary with the endpoints' definitions.
   */
  endpoints: EndpointsDict;
  /**
   * The fetch client that will be used to make the requests.
   */
  fetchClient: FetchClient;
  /**
   * A dictionary with default headers to include on every request.
   */
  defaultHeaders?: Record<string, unknown>;
  /**
   * Custom options for the service in charge of the endpoints.
   */
  endpointsGenerator?: {
    /**
     * The class to use for the endpoints generator. It has to to be a subclass of
     * {@link EndpointsGenerator}.
     */
    Class?: typeof EndpointsGenerator;
    /**
     * Custom options for the endpoints generator.
     *
     * @see {@link EndpointsGeneratorOptions} .
     */
    options?: EndpointsGeneratorOptions;
  };
};
/**
 * A custom overwrite for the fetch body, since the client supports objects, and later
 * stringifies them.
 */
export type APIClientBodyInit = string | Record<string | number, unknown> | BodyInit;
/**
 * A custom overwrite for the fetch options, to support the custom body type, and the
 * option for formatting.
 */
export type APIClientFetchOptions = Omit<FetchOptions, 'body'> & {
  /**
   * The body of the request.
   */
  body?: APIClientBodyInit;
  /**
   * Whether or not the response should _"JSON decoded"_.
   */
  json?: boolean;
};
/**
 * Responses with an status equal or greater than this one will be considered failed, and
 * their promises will be rejected.
 *
 * The reason for the variable is to avoid a magic number in the code, and to install a
 * lib just to get a single status code.
 */
const BAD_REQUEST_STATUS = 400;
/**
 * A very simple client to work with an API.
 */
export class APIClient {
  /**
   * The service in charge of generating the URLs for the endpoints.
   */
  protected endpoints: EndpointsGenerator;
  /**
   * A dictionary with default headers to include on every request.
   */
  protected defaultHeaders: Record<string, unknown>;
  /**
   * A "bearer" authentication token to include on every request.
   */
  protected authorizationToken: string = '';
  /**
   * The fetch client that will be used to make the requests.
   */
  protected fetchClient: FetchClient;
  constructor({
    url,
    endpoints,
    fetchClient,
    defaultHeaders = {},
    endpointsGenerator = {},
  }: APIClientOptions) {
    const { Class = EndpointsGenerator, options = {} } = endpointsGenerator;
    this.endpoints = new Class({ ...options, url, endpoints });
    this.fetchClient = fetchClient;
    this.defaultHeaders = defaultHeaders;
  }
  /**
   * Makes a `GET` request.
   *
   * @param url      The request URL.
   * @param options  The request options.
   * @template ResponseType  The data type for the response.
   */
  get<ResponseType = unknown>(
    url: string,
    options: APIClientFetchOptions = {},
  ): Promise<ResponseType> {
    return this.fetch(url, options);
  }
  /**
   * Makes a `HEAD` request.
   *
   * @param url      The request URL.
   * @param options  The request options.
   * @template ResponseType  The data type for the response.
   */
  head<ResponseType = unknown>(
    url: string,
    options: APIClientFetchOptions = {},
  ): Promise<ResponseType> {
    return this.fetch(url, { ...options, method: 'head' });
  }
  /**
   * Makes a `POST` request.
   *
   * @param url      The request URL.
   * @param body     The request payload.
   * @param options  The request options.
   * @template ResponseType  The data type for the response.
   */
  post<ResponseType = unknown>(
    url: string,
    body: APIClientBodyInit,
    options: APIClientFetchOptions = {},
  ): Promise<ResponseType> {
    return this.fetch(url, { method: 'post', ...options, body });
  }
  /**
   * Makes a `PATCH` request.
   *
   * @param url      The request URL.
   * @param body     The request payload.
   * @param options  The request options.
   * @template ResponseType  The data type for the response.
   */
  patch<ResponseType = unknown>(
    url: string,
    body: APIClientBodyInit,
    options: APIClientFetchOptions = {},
  ): Promise<ResponseType> {
    return this.post(url, body, { ...options, method: 'patch' });
  }
  /**
   * Makes a `PUT` request.
   *
   * @param url      The request URL.
   * @param body     The request payload.
   * @param options  The request options.
   * @template ResponseType  The data type for the response.
   */
  put<ResponseType = unknown>(
    url: string,
    body: APIClientBodyInit,
    options: APIClientFetchOptions = {},
  ): Promise<ResponseType> {
    return this.post(url, body, { ...options, method: 'put' });
  }
  /**
   * Makes a `DELETE` request.
   *
   * @param url      The request URL.
   * @param body     The request payload.
   * @param options  The request options.
   * @template ResponseType  The data type for the response.
   */
  delete<ResponseType = unknown>(
    url: string,
    body: APIClientBodyInit = {},
    options: APIClientFetchOptions = {},
  ): Promise<ResponseType> {
    return this.post(url, body, { ...options, method: 'delete' });
  }
  /**
   * Formats an error response into a proper Error object. This method should proabably be
   * overwritten to accomodate the error messages for the API it's being used for.
   *
   * @param response  A received response from a request.
   * @param status    The HTTP status of the response.
   * @template ResponseType  The type of the error response.
   */
  protected formatError<ResponseType extends ErrorResponse>(
    response: ResponseType,
    status: number,
  ) {
    const error = response.error || 'Unknown error';
    const message = `[${status}]: ${error}`;
    return new Error(message);
  }
  /**
   * Generates a dictionary of headers using the service's
   * {@link APIClient.defaultHeaders} property as base.
   * If a token was set using {@link APIClient.setAuthorizationToken}, the method will add
   * an `Authorization`
   * header for the bearer token.
   *
   * @param overwrites  Extra headers to add.
   */
  protected getHeaders(overwrites: Record<string, unknown> = {}): Record<string, string> {
    const headers = { ...this.defaultHeaders };
    if (this.authorizationToken) {
      // eslint-disable-next-line dot-notation
      headers['Authorization'] = `Bearer ${this.authorizationToken}`;
    }

    return Object.entries({ ...headers, ...overwrites }).reduce<Record<string, string>>(
      (acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      },
      {},
    );
  }
  /**
   * Makes a request.
   *
   * @param url      The request URL.
   * @param options  The request options.
   * @template ResponseType  The data type for the response.
   */
  protected async fetch<ResponseType = unknown>(
    url: string,
    options: APIClientFetchOptions,
  ): Promise<ResponseType> {
    // Get a new reference of the request options.
    const opts = { ...options };
    // Format the request method and check if it should use the default.
    opts.method = opts.method ? opts.method.toUpperCase() : 'GET';
    // Get the request headers.
    const headers = this.getHeaders(opts.headers as Record<string, string>);
    // Format the flag the method will use to decided whether to decode the response or not.
    const handleAsJSON = typeof opts.json === 'boolean' ? opts.json : true;
    // If the options include a body...
    let { body } = opts;
    if (body) {
      // Let's first check if there are headers and if a `Content-Type` has been set.
      const hasContentType = Object.keys(headers).some(
        (name) => name.toLowerCase() === 'content-type',
      );
      // If the body is an object...
      if (typeof opts.body === 'object') {
        // ...and if it's an object literal...
        if (Object.getPrototypeOf(opts.body).constructor.name === 'Object') {
          // ...encode it.
          body = JSON.stringify(opts.body);
        }
        // If no `Content-Type` was defined, let's assume is a JSON request.
        if (!hasContentType) {
          headers['Content-Type'] = 'application/json';
        }
      }
    }

    // Remove the necessary options in order to make it a valid `FetchOptions` object.
    delete opts.json;
    delete opts.body;
    const fetchOpts = opts as FetchOptions;
    // This check is to avoid pushing an empty object on the request options.
    if (Object.keys(headers).length) {
      fetchOpts.headers = headers;
    }

    fetchOpts.body = body as BodyInit;

    const response = await this.fetchClient(url, fetchOpts);
    const { status } = response;
    let nextStep: unknown;
    // If the response should be handled as JSON and it has a `json()` method...
    if (handleAsJSON && typeof response.json === 'function') {
      /**
       * Since some clients fail to decode an empty response, we'll try to decode it,
       * but if it fails, it will return an empty object.
       */
      nextStep = await response.json().catch(() => ({}));
    } else {
      // If the response shouldn't be handled as JSON, let's keep the raw object.
      nextStep = response;
    }

    if (status >= BAD_REQUEST_STATUS) {
      throw this.formatError(nextStep as ErrorResponse, status);
    }

    return nextStep as ResponseType;
  }
  /**
   * Sets a bearer token for all the requests.
   *
   * @param token  The new authorization token. If the value is empty, it will remove
   *               any token previously saved.
   */
  setAuthorizationToken(token: string = '') {
    this.authorizationToken = token;
  }
  /**
   * Gets the current authorization token used by the service.
   */
  getAuthorizationToken(): string {
    return this.authorizationToken;
  }
  /**
   * Sets the default headers for all the requests.
   *
   * @param headers    The new default headers.
   * @param overwrite  If `false`, it will merge the new default headers with the
   *                   current ones.
   */
  setDefaultHeaders(headers: Record<string, string> = {}, overwrite: boolean = true) {
    this.defaultHeaders = {
      ...(overwrite ? {} : this.defaultHeaders),
      ...headers,
    };
  }
  /**
   * Gets the current default headers used by the service.
   */
  getDefaultHeaders(): Record<string, unknown> {
    return {
      ...this.defaultHeaders,
    };
  }
  /**
   * Gets the dictionary of endpoints the service uses.
   */
  getEndpoints(): Record<string, EndpointDefinition> {
    return this.endpoints.getEndpoints();
  }
  /**
   * Gets the fetch client the service uses for making the requests.
   */
  getFetchClient(): FetchClient {
    return this.fetchClient;
  }
  /**
   * Gets the base URL the service uses for the endpoints.
   */
  getUrl() {
    return this.endpoints.getUrl();
  }
}
/**
 * Shorthand for `new APIClient()`.
 *
 * @param args  The same parameters as the {@link APIClient} constructor.
 * @returns A new instance of {@link APIClient}.
 */
export const apiClient = (...args: ConstructorParameters<typeof APIClient>): APIClient =>
  new APIClient(...args);
