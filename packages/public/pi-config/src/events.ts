/** The channel of `pi.events` where the change of the session override is announced. */
export const SESSION_OVERRIDE_CHANGED_CHANNEL = 'pi-config:session-override-changed';

/** The payload of the event emitted when the session override changes. */
export type SessionOverrideChange = {
  /** `set` when the override was set or replaced, `cleared` when it was removed. */
  type: 'set' | 'cleared';
};

/** The channel of `pi.events` where the profiles loaded for the session are announced. */
export const PROFILES_LOADED_CHANNEL = 'pi-profiles:profiles-loaded';

/** The payload of the event emitted when the profiles of the session are loaded. */
export type ProfilesLoaded = {
  /** The names of the loaded profiles, in the order they were loaded. */
  profiles: string[];
};

/** A function that is told about the changes of the session override. */
export type OnOverrideChange = (change: SessionOverrideChange) => void;
