import type { Linter } from 'eslint';
import { prettierPluginConfigs } from '../plugins/index.js';

export const addPrettierConfigs = (config: Linter.Config[]): Linter.Config[] => [
  ...config,
  ...prettierPluginConfigs,
];
