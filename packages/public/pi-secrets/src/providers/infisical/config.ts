import { z } from 'zod';

/** The `type` of the Infisical provider. */
const type = 'infisical' as const;

/** The schema and the `type` of the Infisical provider config. */
export const infisicalConfig = {
  type,
  schema: z.object({
    /** The implementation of the provider. */
    type: z.literal(type),
    /** The base URL of the provider. */
    url: z.url(),
    /** The credentials, validated by the provider when it's created. */
    credentials: z.record(z.string(), z.unknown()),
    /** Whether the provider can be used. */
    enabled: z.boolean(),
  }),
};
