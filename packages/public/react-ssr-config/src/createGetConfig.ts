import { getStore } from './store.js';
import { DEFAULT_CONFIG_STORE } from './consts.js';
import type { Config } from './config.js';
import type { GenericConfig, ConfigSlice } from './types.js';
/**
 * Utility type to create a "config instance type" based on a dictionary of settings.
 * It will assume that the settings are the return type of the config slices.
 */
type ConfigFromSettings<TSettings extends Record<string, GenericConfig>> = Config<{
  [K in keyof TSettings]: ConfigSlice<K & string, TSettings[K]>;
}>;
/**
 * The idea of this function is for implementations to be able to create a typed getter
 * for the config, so that the user doesn't have to cast the config to the desired type.
 *
 * @param configName  The name of the config to get.
 * @returns A function that will return the config, or a slice of it.
 * @throws If no config with the provided name is found.
 * @example
 *
 *   export const getConfig = createGetConfig<MyConfigShape>();
 *
 */
export const createGetConfig = <
  TSettings extends Record<string, GenericConfig> = Record<string, GenericConfig>,
>(
  configName: string = DEFAULT_CONFIG_STORE,
): ConfigFromSettings<TSettings>['getConfig'] => {
  const store = getStore();
  const config = store[configName] as ConfigFromSettings<TSettings> | undefined;
  if (!config) {
    throw new Error(`No config with name "${configName}" found`);
  }

  return config.getConfig;
};

type Getter = ReturnType<typeof createGetConfig>;
/**
 * A reference for the default getter, in case the implementation doesn't use
 * `createGetConfig`,
 * or doesn't use TypeScript.
 *
 * @ignore
 */
let defaultGetConfig: Getter | undefined;
/**
 * Gets the main config, or a slice of it.
 *
 * @param args  The name of the slice to get, or nothing to get the whole config.
 */
export const getConfig = (...args: Parameters<Getter>): ReturnType<Getter> => {
  if (!defaultGetConfig) {
    defaultGetConfig = createGetConfig();
  }

  return defaultGetConfig(...args);
};
/**
 * A utility to reset the default getter.
 *
 * @ignore
 */
export const resetGetConfig = (): void => {
  defaultGetConfig = undefined;
};
