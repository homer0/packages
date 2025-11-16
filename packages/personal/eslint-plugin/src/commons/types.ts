import { Linter } from 'eslint';

export type LinterPlugin = NonNullable<Linter.Config['plugins']>[string];

/**
 * Useful to flatten the type output to improve type hints shown in editors. And also to
 * transform an interface into a type to aide with assignability.
 *
 * This is copied from the `type-fest` package.
 */
export type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};
