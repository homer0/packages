import { z } from 'zod';

/** Runtime schema for `pi.profiles` in the Pi config. */
export const profilesConfigSchema = z.object({
  /** The names of the profiles that are always enabled. */
  enabled: z.array(z.string().min(1)).default([]),
  /**
   * The conditional profiles: each key is a profile name, and each value is the path of a
   * script that prints `true` when the profile should be enabled, or `false` to turn the
   * entry off.
   */
  enabledIf: z
    .record(z.string().min(1), z.union([z.literal(false), z.string().min(1)]))
    .default({}),
});

/** The resolved `pi.profiles` config. */
export type ProfilesConfig = z.infer<typeof profilesConfigSchema>;

/**
 * Runtime schema for one entry in a profile's `packages.json`: a path, or an object with
 * the path and a condition.
 */
export const packageEntrySchema = z.union([
  z.string().min(1),
  z.object({
    /** The path of the package, absolute or relative to the profile directory. */
    path: z.string().min(1),
    /**
     * The path of a script that prints `true` when the package should be loaded, or
     * `false` to turn the entry off.
     */
    enabledIf: z.union([z.literal(false), z.string().min(1)]),
  }),
]);

/** One entry in a profile's `packages.json`. */
export type PackageEntry = z.infer<typeof packageEntrySchema>;

/** Runtime schema for a profile's `packages.json` file. */
export const profilePackagesSchema = z.object({
  /** The packages the profile loads. */
  packages: z.array(packageEntrySchema).default([]),
});
