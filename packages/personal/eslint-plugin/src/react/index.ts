import { PACKAGE_META } from '../utils/index.js';
import { reactConfig } from './configs/index.js';

const reactEslintPlugin = {
  meta: {
    ...PACKAGE_META,
    name: `${PACKAGE_META.name}-react`,
  },
  configs: {
    react: reactConfig,
  },
};

export default reactEslintPlugin;
