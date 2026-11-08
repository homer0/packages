import { z } from 'zod';

/**
 * The name of the environment variable that carries the loaded profiles to the processes
 * Pi starts (a skill's `skill.sh`, for example), which can't see `globalThis` of the Pi
 * process. Its value is a JSON array with the names of the profiles.
 */
export const LOADED_PROFILES_ENV = 'PI_CONFIG_LOADED_PROFILES';

/** The characters that would make a profile name more than one path segment. */
const PATH_SEPARATOR_PATTERN = /[\\/]/u;

/**
 * The names of profiles. The ones that couldn't be the name of a directory are dropped,
 * so a name that comes from an event or from the environment can't make the config
 * readers look somewhere else.
 */
export const profileNamesSchema = z
  .array(z.string())
  .transform((names) =>
    names.filter(
      (name) =>
        name !== '' &&
        name !== '.' &&
        name !== '..' &&
        !PATH_SEPARATOR_PATTERN.test(name),
    ),
  );

/**
 * The profiles loaded for the session, held on `globalThis` for the same reason as the
 * session override: Pi loads each extension with its own copy of the modules it imports,
 * so module state would not be shared between the extension that is told about the
 * profiles and the code that reads the config. One pi process is assumed to correspond to
 * one session.
 *
 * This is `globalThis` typed with the property that holds the profiles. The assertion is
 * the only place that needs to know about it.
 *
 * This module has to stay light: the extension imports it eagerly, and the listener that
 * stores the profiles can't wait for a lazy import.
 */
const profilesStore = globalThis as typeof globalThis & {
  __piConfigLoadedProfiles?: string[];
};

/**
 * Replaces the loaded profiles, and publishes them in {@link LOADED_PROFILES_ENV} so the
 * processes Pi starts from here on get the same list. The names are used as they come:
 * whoever calls this has to make sure they are valid directory names.
 *
 * @param names The names of the profiles, in the order they were loaded.
 */
export const setLoadedProfiles = (names: string[]): void => {
  profilesStore.__piConfigLoadedProfiles = names.slice();
  // eslint-disable-next-line n/no-process-env -- The environment is how the processes Pi starts get the profiles.
  process.env[LOADED_PROFILES_ENV] = JSON.stringify(names);
};

/**
 * Reads the loaded profiles from {@link LOADED_PROFILES_ENV}. A value that isn't a JSON
 * array of names is ignored without a warning: only the extension writes it, so there's
 * nothing the reader's user could do about it.
 *
 * @returns The names of the profiles; empty if the variable is not set or not valid.
 */
const getLoadedProfilesFromEnv = (): string[] => {
  // eslint-disable-next-line n/no-process-env -- The environment is how the processes Pi starts get the profiles.
  const value = process.env[LOADED_PROFILES_ENV];
  if (!value) return [];

  try {
    const result = profileNamesSchema.safeParse(JSON.parse(value));
    return result.success ? result.data : [];
  } catch {
    return [];
  }
};

/**
 * Gets the loaded profiles: the ones this process was told about, or, in a process that
 * wasn't (one that Pi started), the ones it passed in {@link LOADED_PROFILES_ENV}.
 *
 * @returns The names of the profiles, in the order they were loaded; empty if none were.
 */
export const getLoadedProfiles = (): string[] => {
  const stored = profilesStore.__piConfigLoadedProfiles;
  return typeof stored === 'undefined' ? getLoadedProfilesFromEnv() : stored.slice();
};
