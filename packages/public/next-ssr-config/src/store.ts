import { Config } from './config';
import type { GenericConfig, ConfigSlice } from './types';

export const store: Record<
  string,
  Config<Record<string, ConfigSlice<string, GenericConfig>>>
> = {};
