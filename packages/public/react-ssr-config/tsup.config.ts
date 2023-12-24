import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  minify: !options.watch,
  entry: ['src/**/*.ts', 'src/**/*.tsx'],
  sourcemap: true,
  clean: true,
  format: ['esm', 'cjs'],
  legacyOutput: true,
  bundle: false,
  splitting: false,
  external: ['react'],
}));
