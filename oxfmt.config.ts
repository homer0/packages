import { createConfig } from '@homer0/oxfmt-config';

export default createConfig({
  ignores: [
    '**/tests/**/fixtures',
    'packages/personal/eslint-plugin/',
    'packages/personal/prettier-config/',
  ],
});
