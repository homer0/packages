import { DEFAULT_CONFIG_STORE, SCRIPT_CONFIG_ID } from './consts';
import { Config } from './config';
import { getStore } from './store';
import type { GenericConfig, ConfigSlice } from './types';
/**
 * The options to create a config.
 */
type ConfigOptions<Slices extends Record<string, ConfigSlice<string, GenericConfig>>> = {
  /**
   * The dictionary of slices that will compose the config.
   */
  slices: Slices;
  /**
   * The name of the config. If none is provider, the function will use a default name.
   */
  name?: string;
  /**
   * If true and there's already a config with the same name, it will be overwritten.
   * This may be useful in development.
   *
   * @default false
   */
  overwrite?: boolean;
};
/**
 * Creates a config instance.
 *
 * @param options  The slices and/or customization options for the config.
 * @returns A new config instance.
 * @throws If a config with the same name already exists and `overwrite` is `false`.
 */
function createConfig<Slices extends Record<string, ConfigSlice<string, GenericConfig>>>(
  options: Slices | ConfigOptions<Slices>,
): Config<Slices> {
  let useOptions: ConfigOptions<Slices>;
  if ('slices' in options) {
    useOptions = options as ConfigOptions<Slices>;
  } else {
    useOptions = { slices: options as Slices };
  }

  const { slices, name = DEFAULT_CONFIG_STORE, overwrite = false } = useOptions;

  const store = getStore();
  if (store[name] && !overwrite) {
    throw new Error(`The config "${name}" already exists`);
  }

  const scriptId = SCRIPT_CONFIG_ID.replace('{name}', name);
  const config = new Config(name, scriptId, slices);

  store[name] = config;

  return config;
}

export { createConfig };
