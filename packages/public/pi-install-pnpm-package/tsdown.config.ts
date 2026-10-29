import { defineConfig } from 'tsdown';

export default defineConfig((options) => ({
  minify: !options.watch,
  entry: ['src/extensions/install-pnpm-package.ts'],
  sourcemap: true,
  clean: true,
  dts: false,
  format: ['esm'],
  outExtensions({ format }) {
    if (format === 'es') {
      return { js: '.js' };
    }

    return {};
  },
}));
