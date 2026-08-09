import { defineConfig } from 'oxlint';
import { createConfig } from './dist/index.js';

export default defineConfig(
  createConfig({
    configs: ['node'],
    ignores: ['dist/**'],
    tests: 'directory',
    ts: true,
  }),
);
