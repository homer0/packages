import { z } from 'zod';

/** The `type` of the custom provider. */
const type = 'custom' as const;

/** The schema and the `type` of the custom provider config. */
export const customConfig = {
  type,
  schema: z.object({
    /** The implementation of the provider. */
    type: z.literal(type),
    /** Whether the provider can be used. */
    enabled: z.boolean(),
    /** The file with the class of the provider, which has to start with a Pi prefix. */
    file: z.string().min(1),
    /** What the class receives as it is, validated by the class itself. */
    data: z.record(z.string(), z.unknown()).optional(),
  }),
};
