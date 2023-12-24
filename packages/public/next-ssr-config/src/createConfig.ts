import { DEFAULT_CONFIG_STORE, SCRIPT_CONFIG_ID } from './consts';
import { Config } from './config';
import { getStore } from './store';
import type { GenericConfig, ConfigSlice } from './types';

type ConfigOptions<Slices extends Record<string, ConfigSlice<string, GenericConfig>>> = {
  name?: string;
  configClass?: typeof Config;
  slices: Slices;
};

function createConfig<Slices extends Record<string, ConfigSlice<string, GenericConfig>>>(
  options: Slices | ConfigOptions<Slices>,
): Config<Slices> {
  let useOptions: ConfigOptions<Slices>;
  if ('slices' in options) {
    useOptions = options as ConfigOptions<Slices>;
  } else {
    useOptions = { slices: options as Slices };
  }

  const {
    slices,
    name = DEFAULT_CONFIG_STORE,
    configClass: ConfigClass = Config,
  } = useOptions;

  const store = getStore();
  if (store[name]) {
    throw new Error(`The config "${name}" already exists`);
  }

  const scriptId = SCRIPT_CONFIG_ID.replace('{name}', name);
  const config = new ConfigClass(name, scriptId, slices);

  store[name] = config;

  return config;
}

export { createConfig };
