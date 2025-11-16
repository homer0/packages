import type { Config, defineConfig } from 'eslint/config';

export type LinterPlugin = NonNullable<Config['plugins']>[string];

export type LinterConfigWithExtends = Extract<
  Parameters<typeof defineConfig>[0],
  { basePath?: string }
>;
/**
 * Useful to flatten the type output to improve type hints shown in editors. And also to
 * transform an interface into a type to aide with assignability.
 *
 * This is copied from the `type-fest` package.
 */
export type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};
