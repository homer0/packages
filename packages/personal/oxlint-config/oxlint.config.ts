import { defineConfig } from 'oxlint';
import { createConfig } from './dist/index.js';

export default defineConfig(
  createConfig({
    env: 'node',
    tests: 'directory',
  }),
);
