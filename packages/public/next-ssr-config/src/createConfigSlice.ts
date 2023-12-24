import type { GenericConfig, ConfigSlice } from './types';

export const createConfigSlice = <Name extends string, Settings extends GenericConfig>(
  name: Name,
  getConfig: () => Settings,
): ConfigSlice<Name, Settings> => {
  const slice = () => getConfig();
  slice.sliceName = name;
  return slice;
};
