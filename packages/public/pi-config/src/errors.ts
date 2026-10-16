/* eslint-disable max-classes-per-file -- The config errors live together. */
import type { z } from 'zod';

/** The error for the config files that couldn't be read or parsed. */
export class ConfigReadError extends Error {
  /**
   * @param message The description of what failed.
   * @param filePath The path of the config file that failed.
   * @param options The error options, to preserve the original `cause`.
   */
  constructor(
    message: string,
    /** The path of the config file that failed. */
    public readonly filePath: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'ConfigReadError';
  }
}

/** The error thrown when the resolved config doesn't match the schema that was provided. */
export class ConfigValidationError extends Error {
  /**
   * @param message The description of what failed.
   * @param issues The Zod issues that explain why the value didn't match the schema.
   */
  constructor(
    message: string,
    /** The Zod issues that explain why the value didn't match the schema. */
    public readonly issues: z.core.$ZodIssue[],
  ) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}
