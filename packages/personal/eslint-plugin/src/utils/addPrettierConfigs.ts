import type { Config } from 'eslint/config';
import { prettierPluginConfigs } from '../plugins/index.js';

type WithPrettierConfigs<T extends Record<string, Config[]>> = {
  [K in keyof T]: Config[];
} & {
  [K in keyof T as `${K & string}-with-prettier`]: Config[];
};

export const addPrettierConfigs = <T extends Record<string, Config[]>>(
  configs: T,
): WithPrettierConfigs<T> =>
  Object.entries(configs).reduce(
    (acc, [name, config]) => ({
      ...acc,
      [name]: config,
      [`${name}-with-prettier`]: [...config, ...prettierPluginConfigs],
    }),
    {} as WithPrettierConfigs<T>,
  );
