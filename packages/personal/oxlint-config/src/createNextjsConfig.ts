import { createConfig } from './createConfig.js';
import type { CreateNextjsConfigOptions } from './types.js';

const NEXTJS_IGNORES = ['.next/', 'out/', 'build/', 'next-env.d.ts'];

/** Creates a native Oxlint configuration for a Next.js TypeScript project. */
export const createNextjsConfig = ({
  ignores = [],
  ...options
}: CreateNextjsConfigOptions) =>
  createConfig({
    ...options,
    configs: ['node'],
    ignores: [...NEXTJS_IGNORES, ...ignores],
    nextjs: true,
    react: true,
    ts: true,
  });
