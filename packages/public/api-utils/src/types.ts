export type EndpointDefinitionProps = {
  path: string;
  query?: Record<string, unknown>;
};

export type EndpointDefinition = string | EndpointDefinitionProps;

export type EndpointsDict = {
  [key: string]: EndpointDefinition | EndpointsDict;
};
