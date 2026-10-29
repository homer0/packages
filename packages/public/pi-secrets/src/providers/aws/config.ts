import { z } from 'zod';

/** The `type` of the AWS Secrets Manager provider. */
const type = 'aws' as const;

/** The schema and the `type` of the AWS Secrets Manager provider config. */
export const awsConfig = {
  type,
  schema: z.object({
    /** The implementation of the provider. */
    type: z.literal(type),
    /** The credentials, validated by the provider when it's created. */
    credentials: z.record(z.string(), z.unknown()),
    /** Whether the provider can be used. */
    enabled: z.boolean(),
  }),
};
