import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  minify: !options.watch,
  entry: ['src/**/*.ts'],
  sourcemap: true,
  clean: true,
  format: ['esm', 'cjs'],
  legacyOutput: true,
  bundle: false,
}));
