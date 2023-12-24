export type GenericConfig = Record<string, unknown>;

export type ConfigSliceGetConfigFn<Config extends GenericConfig> = () => Config;

export type ConfigSlice<
  Name extends string,
  Config extends GenericConfig,
> = ConfigSliceGetConfigFn<Config> & {
  sliceName: Name;
};

export type ConfigSettings<
  Slices extends Record<string, ConfigSlice<string, GenericConfig>>,
> = {
  [K in keyof Slices]: ReturnType<Slices[K]>;
};
