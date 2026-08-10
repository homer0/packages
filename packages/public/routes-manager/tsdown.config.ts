import { defineConfig } from 'tsdown';

export default defineConfig((options) => ({
  minify: !options.watch,
  entry: ['src/**/*.ts', 'src/**/*.tsx'],
  sourcemap: true,
  clean: true,
  dts: false,
  format: ['esm'],
  unbundle: true,
  outExtensions({ format }) {
    if (format === 'es') {
      return { js: '.js' };
    }

    return {};
  },
  splitting: false,
}));
