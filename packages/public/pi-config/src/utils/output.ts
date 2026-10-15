import { z } from 'zod';

/**
 * Returns the error message string from any thrown value. Prettifies zod validation
 * errors instead of surfacing their raw JSON `.message`.
 *
 * @param error The thrown value.
 * @returns The message of the error, or the value as a string if it's not an error.
 */
export const ensureErrorMessage = (error: unknown): string => {
  if (error instanceof z.ZodError) {
    return error.issues.map((issue) => issue.message).join('; ');
  }
  return error instanceof Error ? error.message : String(error);
};
