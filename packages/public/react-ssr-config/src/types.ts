/**
 * This would be like an `unknown` type for the different functions that manage the configs.
 */
export type GenericConfig = Record<string, unknown>;
/**
 * The "slice function", which is the function that will return the settings for a slice, that
 * later will be used to compose the config.
 */
export type ConfigSliceGetConfigFn<Config extends GenericConfig> = () => Config;
/**
 * The config slices are what gets used to compose a config. The slices are just functions that
 * returns settings, and that have a special `sliceName` property, to indicate the name that
 * should be used to save its settings on the config.
 */
export type ConfigSlice<
  Name extends string,
  Config extends GenericConfig,
> = ConfigSliceGetConfigFn<Config> & {
  sliceName: Name;
};
/**
 * A utility type to get the settings from a slices' dictionary.
 */
export type ConfigSettings<
  Slices extends Record<string, ConfigSlice<string, GenericConfig>>,
> = {
  [K in keyof Slices]: ReturnType<Slices[K]>;
};
