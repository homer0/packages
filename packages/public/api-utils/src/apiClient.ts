import { EndpointsGenerator, type EndpointsGeneratorOptions } from './endpointsGenerator';
import type {
  EndpointDefinition,
  EndpointsDict,
  ErrorResponse,
  FetchClient,
  FetchOptions,
} from './types';

export type APIClientOptions = {
  url: string;
  endpoints: EndpointsDict;
  fetchClient: FetchClient;
  defaultHeaders?: Record<string, unknown>;
  endpointsGenerator?: {
    Class?: typeof EndpointsGenerator;
    options?: EndpointsGeneratorOptions;
  };
};

export type APIClientBodyInit = string | Record<string | number, unknown> | BodyInit;

export type APIClientFetchOptions = Omit<FetchOptions, 'body'> & {
  body?: APIClientBodyInit;
  json?: boolean;
};

const BAD_REQUEST_STATUS = 400;

export class APIClient {
  protected url: string;
  protected endpoints: EndpointsGenerator;
  protected defaultHeaders: Record<string, unknown>;
  protected authorizationToken: string = '';
  protected fetchClient: FetchClient;

  constructor({
    url,
    endpoints,
    fetchClient,
    defaultHeaders = {},
    endpointsGenerator = {},
  }: APIClientOptions) {
    this.url = url;
    const { Class = EndpointsGenerator, options = {} } = endpointsGenerator;
    this.endpoints = new Class({ ...options, url, endpoints });
    this.fetchClient = fetchClient;
    this.defaultHeaders = defaultHeaders;
  }

  get<ResponseType = unknown>(
    url: string,
    options: APIClientFetchOptions = {},
  ): Promise<ResponseType> {
    return this.fetch(url, options);
  }

  head<ResponseType = unknown>(
    url: string,
    options: APIClientFetchOptions = {},
  ): Promise<ResponseType> {
    return this.fetch(url, { ...options, method: 'head' });
  }

  post<ResponseType = unknown>(
    url: string,
    body: APIClientBodyInit,
    options: APIClientFetchOptions = {},
  ): Promise<ResponseType> {
    return this.fetch(url, { method: 'post', ...options, body });
  }

  patch<ResponseType = unknown>(
    url: string,
    body: APIClientBodyInit,
    options: APIClientFetchOptions = {},
  ): Promise<ResponseType> {
    return this.post(url, body, { ...options, method: 'patch' });
  }

  put<ResponseType = unknown>(
    url: string,
    body: APIClientBodyInit,
    options: APIClientFetchOptions = {},
  ): Promise<ResponseType> {
    return this.post(url, body, { ...options, method: 'put' });
  }

  delete<ResponseType = unknown>(
    url: string,
    body: APIClientBodyInit = {},
    options: APIClientFetchOptions = {},
  ): Promise<ResponseType> {
    return this.post(url, body, { ...options, method: 'delete' });
  }

  protected formatError<Err extends ErrorResponse>(response: Err, status: number) {
    const error = response.error || 'Unknown error';
    const message = `[${status}]: ${error}`;
    return new Error(message);
  }

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

  setAuthorizationToken(token: string = '') {
    this.authorizationToken = token;
  }

  getAuthorizationToken(): string {
    return this.authorizationToken;
  }

  setDefaultHeaders(headers: Record<string, string> = {}, overwrite: boolean = true) {
    this.defaultHeaders = {
      ...(overwrite ? {} : this.defaultHeaders),
      ...headers,
    };
  }

  getDefaultHeaders(): Record<string, unknown> {
    return {
      ...this.defaultHeaders,
    };
  }

  getEndpoints(): Record<string, EndpointDefinition> {
    return this.endpoints.getEndpoints();
  }

  getFetchClient(): FetchClient {
    return this.fetchClient;
  }

  getUrl() {
    return this.url;
  }
}

export const apiClient = (...args: ConstructorParameters<typeof APIClient>): APIClient =>
  new APIClient(...args);
