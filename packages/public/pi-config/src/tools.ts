import { z } from 'zod';
import type { ConfigQuery } from './types.js';

/** Model-facing schema for the get_config tool. */
export const getConfigParamsSchema = z.object({
  path: z
    .string()
    .optional()
    .describe('Dot-path to read, for example skills.commit.runChecks.'),
  scope: z
    .enum(['all', 'pi', 'skills', 'tools', 'extensions', 'skill', 'tool', 'extension'])
    .optional()
    .describe(
      'Config scope to read. Use pi for general Pi settings, or skill/tool/extension with name.',
    ),
  name: z
    .string()
    .optional()
    .describe('Name for skill, tool, or extension scoped lookups.'),
});

/** The parameters the model sends to the `get_config` tool. */
export type GetConfigParams = z.infer<typeof getConfigParamsSchema>;

/** Model-facing schema for the set_config tool. */
export const setConfigParamsSchema = z.object({
  path: z
    .string()
    .describe(
      'Dot-path to override for the rest of this session, for example extensions.notifyMe.priority.',
    ),
  value: z
    .unknown()
    .describe(
      'Value to set at path. Only this path changes; the rest of the config is unaffected.',
    ),
});

/** The parameters the model sends to the `set_config` tool. */
export type SetConfigParams = z.infer<typeof setConfigParamsSchema>;

/** The number of spaces used to indent the JSON output. */
const JSON_INDENT = 2;
/** The max number of characters of a value preview. */
const SUMMARY_LIMIT = 120;

/**
 * Formats config values for model-facing tool output.
 *
 * @param value The value to format.
 * @returns The value as it is if it's a string, or as indented JSON for anything else.
 */
export const formatValue = (value: unknown): string => {
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, JSON_INDENT);
};

/**
 * Formats a compact single-line value preview for TUI rendering.
 *
 * @param value The value to preview.
 * @returns The formatted value in a single line, cut with an ellipsis if it's too long.
 */
export const formatValuePreview = (value: unknown): string => {
  const preview = formatValue(value).replaceAll('\n', ' ');
  if (preview.length <= SUMMARY_LIMIT) return preview;
  return `${preview.slice(0, SUMMARY_LIMIT - 1)}…`;
};

/**
 * Builds a compact label for displaying get_config calls.
 *
 * @param query The query of the call.
 * @returns The path if there's one; `scope:name` for a named integration; the scope for a
 *   namespace; or `all` for the whole config.
 */
export const getQueryLabel = (query: ConfigQuery): string => {
  if (query.path) return query.path;
  if (query.scope && query.name) return `${query.scope}:${query.name}`;
  if (query.scope) return query.scope;
  return 'all';
};

/**
 * Counts config source files that exist and contributed to a lookup.
 *
 * @param sources The `sources` of a query result. It comes from the details of a tool
 *   result, so it can't be trusted to have the right shape.
 * @returns The number of sources that were used, or `0` if `sources` is not a list.
 */
export const getUsedSourceCount = (sources: unknown): number => {
  if (!Array.isArray(sources)) return 0;
  return sources.filter(
    (source) =>
      source && typeof source === 'object' && 'used' in source && source.used === true,
  ).length;
};
