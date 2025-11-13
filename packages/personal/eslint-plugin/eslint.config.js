import { defineConfig } from 'eslint/config';
import plugin from './src/index.js';

export default defineConfig([
  {
    files: ['**/*.js'],
    extends: [plugin.configs['node-with-prettier'], plugin.configs.esm],
    rules: {},
  },
]);
