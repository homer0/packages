import { defineConfig } from 'tsup';

export default defineConfig({
  sourcemap: true,
  clean: true,
  format: ['esm', 'cjs'],
  legacyOutput: true,
  dts: true,
  bundle: false,
});
