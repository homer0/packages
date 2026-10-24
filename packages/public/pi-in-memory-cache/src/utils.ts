import type { ExtensionContext } from '@earendil-works/pi-coding-agent';
import originalMs from 'ms';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { z } from 'zod';

/** The units a time string can have, like `'5m'` or `'2h'`. */
export type TimeStringUnit = originalMs.StringValue;

/** A time as a number of milliseconds, or as a string with units. */
export type TimeStringUnitLike = TimeStringUnit | number;

/** The number of milliseconds in a second. */
const MS_PER_SECOND = 1_000;

/** The number of seconds in a minute. */
const SECONDS_PER_MINUTE = 60;

/** The number of seconds in an hour. */
const SECONDS_PER_HOUR = 3_600;

/** The number of bytes in a mebibyte. */
const BYTES_PER_MB = 1_048_576;

/**
 * Converts a time to milliseconds.
 *
 * @param value A number of milliseconds, or a string with units, like `'5m'`.
 * @returns The number of milliseconds.
 */
const ms = (value: TimeStringUnitLike): number => {
  if (typeof value === 'number') return value;
  return originalMs(value);
};

/**
 * Returns the error message string from any thrown value. Prettifies zod validation
 * errors instead of surfacing their raw JSON `.message`.
 *
 * @param error The thrown value.
 * @returns The message of the error, or the value as a string if it's not an error.
 */
const ensureErrorMessage = (error: unknown): string => {
  if (error instanceof z.ZodError) {
    return error.issues.map((issue) => issue.message).join('; ');
  }
  return error instanceof Error ? error.message : String(error);
};

/**
 * Returns an `Error` object from any thrown value, wrapping the values that are not
 * errors.
 *
 * @param error The thrown value.
 * @returns The error, or a new one with the value as its message.
 */
const ensureError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error));

/**
 * Resolves the absolute path to the jiti binary. In a pnpm workspace, the binary is
 * always at `<workspace-root>/node_modules/.bin/jiti`, derived by splitting the resolved
 * jiti package path on `/node_modules/`. Falls back to `npx jiti` when the package cannot
 * be resolved.
 *
 * @returns The command that runs jiti.
 */
const resolveJitiBin = (): string => {
  try {
    const requireFromHere = createRequire(import.meta.url);
    const pkgPath = requireFromHere.resolve('jiti/package.json');
    const workspaceRoot = pkgPath.split('/node_modules/')[0];
    if (workspaceRoot) return join(workspaceRoot, 'node_modules/.bin/jiti');
    // pnpm detected but workspace root could not be derived — use pnpm exec as a safe fallback
    if (pkgPath.includes('.pnpm')) return 'pnpm exec jiti';
  } catch {
    // fall through to npx fallback
  }
  return 'npx jiti';
};

/**
 * The resolved jiti binary for this workspace. Computed once at module load so callers
 * can use it directly in shell commands or spawn arguments.
 */
const JITI_BIN = resolveJitiBin();

/**
 * Formats a duration in milliseconds as a human-readable `Xh Xm Xs` string.
 *
 * @param duration The duration, in milliseconds.
 * @returns The formatted duration, without the units that are zero at the start.
 */
const formatUptime = (duration: number): string => {
  const totalSeconds = Math.floor(duration / MS_PER_SECOND);
  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

/**
 * Formats a byte count as a human-readable mebibyte string, like `64.3 MB`.
 *
 * @param bytes The number of bytes.
 * @returns The formatted size.
 */
const formatMemory = (bytes: number): string => `${(bytes / BYTES_PER_MB).toFixed(1)} MB`;

/**
 * Creates a function that outputs a message for one subsystem. When there is a UI, it
 * notifies through it; otherwise, it logs to stdout, with the subsystem as the prefix.
 *
 * @param subsystem The name that identifies the messages.
 * @returns The function that outputs the messages.
 */
const createOutputMessage =
  (subsystem: string) =>
  (ctx: ExtensionContext, message: string): void => {
    if (ctx.hasUI) {
      ctx.ui.notify(message, 'info');
      return;
    }

    // eslint-disable-next-line no-console -- Non-interactive sessions still need visible extension output.
    console.info(`[${subsystem}] ${message}`);
  };

export {
  createOutputMessage,
  ensureError,
  ensureErrorMessage,
  formatMemory,
  formatUptime,
  JITI_BIN,
  ms,
  resolveJitiBin,
};
