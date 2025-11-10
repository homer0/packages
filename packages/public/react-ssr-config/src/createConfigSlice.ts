import type { GenericConfig, ConfigSlice } from './types.js';
/**
 * Create a config slice to be used in a config.
 *
 * @param name       The name of the slice, which will be the key of the slice in the
 *                   config.
 * @param getConfig  The function that will return the slice settings.
 * @returns A slice that can be used to compose a config.
 */
export const createConfigSlice = <Name extends string, Settings extends GenericConfig>(
  name: Name,
  getConfig: () => Settings,
): ConfigSlice<Name, Settings> => {
  const slice = () => getConfig();
  slice.sliceName = name;
  return slice;
};
