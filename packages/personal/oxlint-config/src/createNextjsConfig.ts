import { createConfig } from './createConfig.js';
import type { CreateNextjsConfigOptions } from './types.js';

const NEXTJS_IGNORES = ['.next/', 'out/', 'build/', 'next-env.d.ts'];

/** Creates a native Oxlint configuration for a Next.js TypeScript project. */
export const createNextjsConfig = ({
  globals = {},
  ignores = [],
  ...options
}: CreateNextjsConfigOptions) =>
  createConfig({
    ...options,
    configs: ['node'],
    globals: { $browser: true, ...globals },
    ignores: [...NEXTJS_IGNORES, ...ignores],
    nextjs: true,
    react: true,
    ts: true,
  });
