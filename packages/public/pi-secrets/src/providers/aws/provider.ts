import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { get } from '@homer0/object-utils';
import { z } from 'zod';
import type {
  NamedSecretProviderConfig,
  SecretProvider,
  SecretsConfig,
} from '../../types.js';

/** Runtime schema for the credentials of an AWS Secrets Manager provider. */
const awsCredentialsSchema = z.object({
  /** The AWS region of the secrets. */
  region: z.string().min(1),
  /** The named profile to log in with. Without it, the default credential chain is used. */
  profile: z.string().min(1).optional(),
});

/** The credentials of an AWS Secrets Manager provider. */
export type AwsCredentials = z.infer<typeof awsCredentialsSchema>;

/** What a secret name points to: a secret, and maybe a key inside of it. */
type ParsedSecretName = {
  /** The id of the secret in AWS. */
  id: string;
  /** The path of the key inside the JSON of the secret, like `internal.api_key`. */
  keyPath?: string;
};

/** Options for {@link readKey}. */
type ReadKeyOptions = {
  /** The id of the secret in AWS. */
  id: string;
  /** The text of the secret, which has to be a JSON object. */
  secretString: string;
  /** The path of the key inside the JSON. */
  keyPath: string;
};

/**
 * Parses the name of a secret: the id of the secret in AWS, and an optional key path
 * after the last `#`, like `production/acme/service#internal.api_key`. AWS doesn't allow
 * `#` in the ids, so the last one is always the separator.
 *
 * @param name The name of the secret.
 * @returns The id and the key path, or `undefined` if the name has an empty id or an
 *   empty key path.
 */
const parseSecretName = (name: string): ParsedSecretName | undefined => {
  const separatorIndex = name.lastIndexOf('#');
  if (separatorIndex < 0) return { id: name };

  const id = name.slice(0, separatorIndex);
  const keyPath = name.slice(separatorIndex + 1);
  if (!id || !keyPath) return undefined;

  return { id, keyPath };
};

/**
 * Reads the key of a JSON secret. None of the errors have the content of the secret, not
 * even the ones of the JSON parser, which can quote it.
 *
 * @param options The id of the secret, its text, and the key path.
 * @returns The value, as a string, or `undefined` if the path is not in the secret.
 * @throws {Error} When the secret is not valid JSON, or the path doesn't end in a string
 *   or a number.
 */
const readKey = ({ id, secretString, keyPath }: ReadKeyOptions): string | undefined => {
  let secret: unknown;
  try {
    secret = JSON.parse(secretString);
  } catch {
    throw new Error(
      `AWS secret '${id}' is not valid JSON, so the key path '${keyPath}' can't be read.`,
    );
  }

  if (typeof secret !== 'object' || secret === null) return undefined;

  let current: unknown;
  try {
    current = get<unknown>(secret, keyPath);
  } catch {
    // `get` throws a `TypeError` when the path goes through a `null`: the key isn't there.
    return undefined;
  }

  if (typeof current === 'undefined') return undefined;
  if (typeof current === 'string') return current;
  if (typeof current === 'number') return String(current);

  throw new Error(
    `AWS secret '${id}' has a key path '${keyPath}' that is not a string or a number.`,
  );
};

/**
 * A provider that resolves secrets from AWS Secrets Manager. The name of a secret is its
 * id, with an optional `#key.path` to pick a key of a JSON secret.
 */
export class AwsSecretProvider implements SecretProvider {
  readonly name: string;

  readonly type = 'aws' as const;

  private readonly credentials: AwsCredentials;
  private client?: SecretsManagerClient;

  readonly secretsConfig: SecretsConfig;

  /**
   * @param providerConfig The config of the provider, with its name.
   * @param secretsConfig The resolved config of the secrets.
   * @throws {ZodError} When the credentials are not valid.
   */
  constructor(
    providerConfig: NamedSecretProviderConfig<'aws'>,
    secretsConfig: SecretsConfig,
  ) {
    this.secretsConfig = secretsConfig;
    this.name = providerConfig.name;
    this.credentials = awsCredentialsSchema.parse(providerConfig.credentials);
  }

  /** Releases the client of the provider, if it created one. */
  async close(): Promise<void> {
    this.client?.destroy();
    this.client = undefined;
  }

  /**
   * Resolves one secret.
   *
   * @param name The name of the secret, like `id` or `id#key.path`.
   * @returns The value, or `undefined` if AWS doesn't have the secret or the key.
   * @throws {Error} When the request fails, or the secret can't be read as text.
   */
  async getSecret(name: string): Promise<string | undefined> {
    const secrets = await this.getSecrets([name]);
    return secrets[name];
  }

  /**
   * Resolves many secrets, with one request for each secret id, in parallel. Names that
   * point to keys of the same secret share its request.
   *
   * @param names The names of the secrets, like `id` or `id#key.path`.
   * @returns The values by name, `undefined` for the ones AWS doesn't have.
   * @throws {Error} When a request fails, or a secret can't be read as text.
   */
  async getSecrets(names: string[]): Promise<Record<string, string | undefined>> {
    const parsedNames = names.map((name) => ({ name, parsed: parseSecretName(name) }));
    const ids = new Set(parsedNames.flatMap(({ parsed }) => (parsed ? [parsed.id] : [])));
    const secretStrings = new Map<string, string | undefined>(
      await Promise.all(
        Array.from(ids, async (id) => [id, await this.fetchSecretString(id)] as const),
      ),
    );

    const result: Record<string, string | undefined> = {};
    for (const { name, parsed } of parsedNames) {
      const secretString = parsed ? secretStrings.get(parsed.id) : undefined;
      if (!parsed || typeof secretString === 'undefined') {
        result[name] = undefined;
      } else if (typeof parsed.keyPath === 'undefined') {
        result[name] = secretString;
      } else {
        result[name] = readKey({
          id: parsed.id,
          secretString,
          keyPath: parsed.keyPath,
        });
      }
    }

    return result;
  }

  /**
   * Gets the text of a secret.
   *
   * @param id The id of the secret in AWS.
   * @returns The text, or `undefined` if AWS doesn't have the secret.
   * @throws {Error} When the request fails, or the secret is binary.
   */
  private async fetchSecretString(id: string): Promise<string | undefined> {
    try {
      const response = await this.getClient().send(
        new GetSecretValueCommand({ SecretId: id }),
      );
      if (typeof response.SecretString === 'undefined') {
        throw new Error(
          `AWS secret '${id}' has no text value, binary secrets are not supported.`,
        );
      }

      return response.SecretString;
    } catch (error) {
      if (error instanceof Error && error.name === 'ResourceNotFoundException') {
        return undefined;
      }

      throw error;
    }
  }

  /**
   * Gets the client of the provider, which is created the first time it's needed. The
   * client belongs to this instance, and an instance has one region and one profile, so
   * providers with a different profile or region never share a client.
   *
   * @returns The client.
   */
  private getClient(): SecretsManagerClient {
    this.client ??= new SecretsManagerClient({
      region: this.credentials.region,
      profile: this.credentials.profile,
    });

    return this.client;
  }
}
