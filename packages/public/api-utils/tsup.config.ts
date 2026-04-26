import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  minify: !options.watch,
  entry: ['src/index.ts'],
  sourcemap: true,
  clean: true,
  dts: {
    compilerOptions: {
      ignoreDeprecations: '6.0',
    },
  },
  format: ['esm'],
}));
