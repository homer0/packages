import type { LinterPlugin } from '../commons/index.js';
import { PACKAGE_META, addPrettierConfigs } from '../utils/index.js';
import { nextjsConfig } from './configs/index.js';

const nextjsEslintPlugin: LinterPlugin = {
  meta: {
    ...PACKAGE_META,
    name: `${PACKAGE_META.name}-nextjs`,
  },
  configs: addPrettierConfigs({
    nextjs: nextjsConfig,
  }),
};

export default nextjsEslintPlugin;
