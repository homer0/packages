import type { Linter } from 'eslint';
import { prettierPluginConfigs } from '../plugins/index.js';

type WithPrettierConfigs<T extends Record<string, Linter.Config[]>> = {
  [K in keyof T]: Linter.Config[];
} & {
  [K in keyof T as `${K & string}-with-prettier`]: Linter.Config[];
};

export const addPrettierConfigs = <T extends Record<string, Linter.Config[]>>(
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
