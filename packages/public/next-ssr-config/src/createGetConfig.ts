import { store } from './store';
import { DEFAULT_CONFIG_STORE } from './consts';
import type { Config } from './config';
import type { GenericConfig, ConfigSlice } from './types';

type ConfigFromSettings<TSettings extends Record<string, GenericConfig>> = Config<{
  [K in keyof TSettings]: ConfigSlice<K & string, TSettings[K]>;
}>;

export const createGetConfig = <
  TSettings extends Record<string, GenericConfig> = Record<string, GenericConfig>,
>(
  configName: string = DEFAULT_CONFIG_STORE,
): ConfigFromSettings<TSettings>['getConfig'] => {
  const config = store[configName] as ConfigFromSettings<TSettings> | undefined;
  if (!config) {
    throw new Error(`No config with name ${configName} found`);
  }

  return config.getConfig;
};

type Getter = ReturnType<typeof createGetConfig>;
let defaultGetConfig: Getter | undefined;

export const getConfig = (...args: Parameters<Getter>): ReturnType<Getter> => {
  if (!defaultGetConfig) {
    defaultGetConfig = createGetConfig();
  }

  return defaultGetConfig(...args);
};
