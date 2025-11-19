import { globalIgnores } from 'eslint/config';

export const nextjsIgnoresRulesConfig = globalIgnores(
  ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  '@homer0/nextjs: ignores',
);
