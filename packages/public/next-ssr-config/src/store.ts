import { Config } from './config';
import type { GenericConfig, ConfigSlice } from './types';

type Store = Record<string, Config<Record<string, ConfigSlice<string, GenericConfig>>>>;
/**
 * The global dictionary that will hold the reference to all the configs
 * that get created.
 */
const store: Store = {};
/**
 * Gets a reference for the configs store.
 */
export const getStore = (): Store => store;
/**
 * Resets the store and removes all configs.
 *
 * @ignore
 */
export const resetStore = (): void => {
  Object.keys(store).forEach((key) => {
    delete store[key];
  });
};
