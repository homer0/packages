export type EndpointDefinitionProps = {
  path: string;
  query?: Record<string, unknown>;
};

export type EndpointDefinition = string | EndpointDefinitionProps;

export type EndpointsDict = {
  [key: string]: EndpointDefinition | EndpointsDict;
};

export type FetchClient = Window['fetch'];

export type FetchOptions = NonNullable<Parameters<FetchClient>[1]>;

export type ErrorResponse = {
  error?: string;
};
