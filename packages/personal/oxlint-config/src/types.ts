import type { configProfiles, extensionFragments } from './fragments.js';

export type ConfigName = keyof typeof configProfiles;

export type ExtensionFragmentName = keyof typeof extensionFragments;

/** Adds rules to the selected generated fragment without replacing its other settings. */
export type ConfigFragment = {
  rules?: Record<string, unknown>;
};

/** Overrides are keyed by the generated fragment they extend. */
export type ExtensionFragments = Partial<Record<ExtensionFragmentName, ConfigFragment>>;

/** Narrows a test override to matching files and optionally applies TypeScript rules. */
export type TestConfigOptions = {
  files?: string | string[];
  ts?: boolean;
};

/** Selects both conventions, one built-in convention, or a custom test override. */
export type TestsOption = boolean | 'colocated' | 'directory' | TestConfigOptions;

export type CreateConfigOptions = {
  configs: ConfigName[];
  extensions?: ExtensionFragments;
  ignores?: string[];
  tests?: TestsOption;
  ts?: boolean;
  /** Enables Oxlint's root-only type-aware mode. Requires oxlint-tsgolint and TypeScript 7+. */
  typeAware?: boolean;
};
