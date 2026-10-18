import { defineConfig } from 'tsdown';

export default defineConfig((options) => ({
  deps: {
    onlyBundle: false,
  },
  minify: !options.watch,
  entry: ['src/index.ts'],
  sourcemap: true,
  clean: true,
  dts: {
    sourcemap: false,
  },
  format: ['esm'],
  outExtensions({ format }) {
    if (format === 'es') {
      return { js: '.js', dts: '.d.ts' };
    }

    return {};
  },
}));
