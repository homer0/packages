import { Agent, fetch, type Response } from 'undici';
import { z } from 'zod';
import type {
  NamedSecretProviderConfig,
  SecretProvider,
  SecretsConfig,
} from '../../types.js';
import { getCachedValue, MS_PER_SECOND, setCachedValue } from '../../utils.js';

/** Runtime schema for Infisical Universal Auth credentials. */
const infisicalCredentialsSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  organizationSlug: z.string().optional(),
  projectId: z.string(),
  environment: z.string(),
  secretPath: z.string().default('/'),
  skipTLSVerify: z.boolean().optional(),
});

/** Runtime schema for Infisical Universal Auth login responses. */
const infisicalLoginResponseSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number(),
  tokenType: z.literal('Bearer'),
});

/** Runtime schema for the Infisical secret fields used by this provider. */
const infisicalSecretSchema = z.object({
  secretKey: z.string(),
  secretValue: z.string(),
});

/** Runtime schema for Infisical list secrets responses. */
const infisicalListSecretsResponseSchema = z.object({
  secrets: z.array(infisicalSecretSchema),
  imports: z
    .array(
      z.object({
        secrets: z.array(infisicalSecretSchema),
      }),
    )
    .optional(),
});

/** The credentials of an Infisical provider. */
export type InfisicalCredentials = z.infer<typeof infisicalCredentialsSchema>;

/** Options for {@link createCacheKey}. */
type CreateCacheKeyOptions = {
  /** The namespace of the cache key. */
  namespace: string;
  /** The name of the provider in the registry. */
  providerName: string;
  /** The credentials of the provider. */
  credentials: InfisicalCredentials;
};

/**
 * Removes the slashes at the end of a URL.
 *
 * @param value The URL.
 * @returns The URL, without the trailing slashes.
 */
const trimTrailingSlashes = (value: string): string => value.replace(/\/+$/u, '');

/**
 * Creates the key a provider caches its access token under, so the providers that point
 * to different projects, environments or paths don't share one.
 *
 * @param options The namespace, the name of the provider, and its credentials.
 * @returns The cache key.
 */
const createCacheKey = ({
  namespace,
  providerName,
  credentials,
}: CreateCacheKeyOptions): string =>
  [
    namespace,
    providerName,
    credentials.projectId,
    credentials.environment,
    credentials.secretPath,
    credentials.organizationSlug ?? '',
  ].join(':');

/**
 * Reads the body of a response as JSON.
 *
 * @param response The response.
 * @returns The body, or `undefined` if it's not valid JSON.
 */
const readJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
};

/** A provider that resolves secrets from Infisical, using Universal Auth. */
export class InfisicalSecretProvider implements SecretProvider {
  readonly name: string;

  readonly type = 'infisical' as const;

  private readonly baseUrl: string;
  private readonly credentials: InfisicalCredentials;
  private readonly tokenCacheNamespace: string;
  private readonly httpAgent: Agent;

  readonly secretsConfig: SecretsConfig;

  /**
   * @param providerConfig The config of the provider, with its name.
   * @param secretsConfig The resolved config of the secrets.
   * @throws {ZodError} When the credentials are not valid.
   */
  constructor(
    providerConfig: NamedSecretProviderConfig<'infisical'>,
    secretsConfig: SecretsConfig,
  ) {
    this.secretsConfig = secretsConfig;
    this.name = providerConfig.name;
    this.baseUrl = trimTrailingSlashes(providerConfig.url);
    this.credentials = infisicalCredentialsSchema.parse(providerConfig.credentials);
    this.tokenCacheNamespace = `infisical-token:${providerConfig.name}`;
    this.httpAgent = new Agent({
      connect: {
        rejectUnauthorized: !this.credentials.skipTLSVerify,
      },
    });
  }

  /** Closes the connections of the provider. */
  async close(): Promise<void> {
    await this.httpAgent.close();
  }

  /**
   * Resolves one secret.
   *
   * @param name The name of the secret.
   * @returns The value, or `undefined` if Infisical doesn't have it.
   */
  async getSecret(name: string): Promise<string | undefined> {
    const secrets = await this.getSecrets([name]);
    return secrets[name];
  }

  /**
   * Resolves multiple secrets from a single list-secrets request, instead of issuing one
   * full list fetch per secret name.
   *
   * @param names The names of the secrets.
   * @returns The values by name, `undefined` for the ones Infisical doesn't have.
   */
  async getSecrets(names: string[]): Promise<Record<string, string | undefined>> {
    const secrets = await this.listSecrets();
    const result: Record<string, string | undefined> = {};
    for (const name of names) result[name] = secrets[name];

    return result;
  }

  /**
   * Fetches and indexes every secret by key, including imports. When a key appears more
   * than once, the first occurrence wins, matching Infisical's own precedence of local
   * secrets over imports.
   *
   * @returns The values by key.
   * @throws {Error} When the request fails.
   */
  private async listSecrets(): Promise<Record<string, string | undefined>> {
    const token = await this.getAccessToken();
    const url = new URL(`${this.baseUrl}/api/v4/secrets`);
    url.searchParams.set('projectId', this.credentials.projectId);
    url.searchParams.set('environment', this.credentials.environment);
    url.searchParams.set('secretPath', this.credentials.secretPath);
    url.searchParams.set('viewSecretValue', 'true');
    url.searchParams.set('includeImports', 'true');

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      dispatcher: this.httpAgent,
    });

    if (!response.ok)
      throw new Error(`Infisical list secrets failed with status ${response.status}.`);

    const data = infisicalListSecretsResponseSchema.parse(await readJson(response));
    const importedSecrets = (data.imports ?? []).flatMap(
      (importEntry) => importEntry.secrets,
    );

    const result: Record<string, string | undefined> = {};
    for (const secret of data.secrets.concat(importedSecrets)) {
      if (!(secret.secretKey in result)) result[secret.secretKey] = secret.secretValue;
    }

    return result;
  }

  /**
   * Returns the access token, from the cache if there's one. A new one is cached for as
   * long as Infisical says it lives: `expiresIn` is in seconds.
   *
   * @returns The access token.
   * @throws {Error} When the login fails.
   */
  private async getAccessToken(): Promise<string> {
    const key = createCacheKey({
      namespace: this.tokenCacheNamespace,
      providerName: this.name,
      credentials: this.credentials,
    });
    const cached = getCachedValue<string>(key);
    if (cached) return cached;

    const response = await fetch(`${this.baseUrl}/api/v1/auth/universal-auth/login`, {
      body: JSON.stringify({
        clientId: this.credentials.clientId,
        clientSecret: this.credentials.clientSecret,
        organizationSlug: this.credentials.organizationSlug,
      }),
      dispatcher: this.httpAgent,
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok)
      throw new Error(`Infisical auth failed with status ${response.status}.`);

    const data = infisicalLoginResponseSchema.parse(await readJson(response));
    setCachedValue({
      key,
      value: data.accessToken,
      ttl: data.expiresIn * MS_PER_SECOND,
    });

    return data.accessToken;
  }
}
