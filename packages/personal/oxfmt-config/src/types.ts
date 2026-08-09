import type { FormatOptions } from 'oxfmt';

export type CreateConfigOptions = {
  /** Enables native JSDoc formatting. Defaults to `true`. */
  jsdoc?: boolean;
  /** Appends patterns to the default ignored paths. */
  ignores?: string[];
  /** Applies Oxfmt options after the shared configuration and feature defaults. */
  overrides?: Partial<FormatOptions>;
  /** Enables Oxfmt import sorting. Defaults to `true`. */
  sortImports?: boolean;
  /** Enables Oxfmt package.json sorting. Defaults to `false`. */
  sortPackageJson?: boolean;
};

export type GeneratedConfig = FormatOptions;
