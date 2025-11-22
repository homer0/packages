import importPlugin from 'eslint-plugin-import-x';
import type { Config } from 'eslint/config';
import type { LinterPlugin } from '../../commons/index.js';

const extensions = ['.js', '.mjs', '.jsx'];

export const importXPluginConfig: Config = {
  plugins: {
    'import-x': importPlugin as unknown as LinterPlugin,
  },
  settings: {
    'import-x/resolver': {
      node: {
        extensions,
      },
    },
    'import-x/extensions': extensions,
    'import-x/core-modules': [],
    'import-x/ignore': ['node_modules', '\\.(coffee|scss|css|less|hbs|svg|json)$'],
  },
  rules: {},
};
