import importPlugin from 'eslint-plugin-import-x';
import type { Linter } from 'eslint';

type PluginType = NonNullable<Linter.Config['plugins']>[string];

const extensions = ['.js', '.mjs', '.jsx'];

export const importXPluginConfig: Linter.Config = {
  plugins: {
    'import-x': importPlugin as unknown as PluginType,
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
