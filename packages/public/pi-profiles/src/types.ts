import type {
  ExtensionAPI,
  ExtensionContext,
  SessionStartEvent,
} from '@earendil-works/pi-coding-agent';
import type { ProfilesConfig } from './schemas.js';

/**
 * Options shared by every profile-resolution/discovery function in this lib. Callers with
 * an active Pi session (e.g. the `profiles` extension) pass their own `onError` to
 * surface non-fatal issues through the session UI; other callers fall back to a
 * `console.warn`-based reporter.
 */
export type ProfileLibOptions = {
  /**
   * Working directory used to resolve config files and `enabledIf` scripts.
   *
   * @default process.cwd()
   */
  cwd?: string;
  /** Called with a human-readable message when resolution hits a non-fatal issue. */
  onError?: (message: string) => void;
};

/** Resources discovered across every currently-enabled profile. */
export type ProfileResources = {
  /** The names of the enabled profiles. */
  names: string[];
  /** The `skills` directories of the enabled profiles that have one. */
  skillPaths: string[];
  /** The `AGENTS.md` files of the enabled profiles, with their content. */
  agentsFiles: Array<{ path: string; content: string }>;
  /** The absolute paths of the packages the enabled profiles declare. */
  packages: string[];
};

/** Resource paths exposed by a profile's declared packages. */
export type PackageResourcePaths = {
  /** The paths of the skills. */
  skillPaths: string[];
  /** The paths of the prompt templates. */
  promptPaths: string[];
  /** The paths of the themes. */
  themePaths: string[];
};

/** Options for {@link loadProfileExtensions}. */
export type LoadProfileExtensionsOptions = ProfileLibOptions & {
  /**
   * Resolved package paths (from {@link ProfileResources.packages}) to load extensions
   * from.
   */
  packages: string[];
  /**
   * The in-flight `session_start` event, replayed for each dynamically loaded extension's
   * own `session_start` handler(s). Required because pi snapshots registered handlers
   * before dispatching an event, so a handler registered here (after that snapshot, since
   * this function itself runs from inside a `session_start` handler) would otherwise
   * never run for the very event that triggered this load.
   */
  sessionStartEvent: SessionStartEvent;
  /** Extension context for the in-flight `session_start`, passed to replayed handlers. */
  ctx: ExtensionContext;
};

/** Options for {@link resolveProfilePackageResources}. */
export type ResolveProfilePackageResourcesOptions = ProfileLibOptions & {
  /**
   * Resolved package paths (from {@link ProfileResources.packages}) to resolve resources
   * from.
   */
  packages: string[];
};

/** Mutable state shared by the entry and the lazily loaded handlers. */
export type ProfilesState = {
  /** Names of the profiles discovered for the current session. */
  sessionProfiles: string[];
};

/**
 * What the lazy handlers receive from the entry.
 *
 * This module is imported eagerly at startup: it must not import anything heavy.
 */
export type ProfilesRuntime = {
  /** The Pi extension API. */
  pi: ExtensionAPI;
  /** The state shared by the handlers. */
  state: ProfilesState;
};

declare module '@homer0/pi-config' {
  interface PiConfig {
    profiles?: ProfilesConfig;
  }
}
