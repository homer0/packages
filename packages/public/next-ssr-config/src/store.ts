import { Config } from './config';
import type { GenericConfig, ConfigSlice } from './types';

type Store = Record<string, Config<Record<string, ConfigSlice<string, GenericConfig>>>>;

const store: Store = {};

export const getStore = (): Store => store;
export const resetStore = (): void => {
  Object.keys(store).forEach((key) => {
    delete store[key];
  });
};
