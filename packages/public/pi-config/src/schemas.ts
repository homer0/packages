import { z } from 'zod';

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
