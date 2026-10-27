import {
  AuthExpiredError,
  createClient,
  DesktopAuth,
  DesktopSessionExpiredError,
  type Client,
  type ResolveAllResponse,
  type ResolveReferenceError,
} from '@1password/sdk';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import type {
  NamedSecretProviderConfig,
  SecretProvider,
  SecretsConfig,
} from '../../types.js';
import { getPackageVersion } from '../../utils.js';

/** What 1Password shows as the integration that is using the SDK. */
const INTEGRATION_NAME = 'pi-secrets';

/** The start of every secret reference. */
const REFERENCE_PREFIX = 'op://';

/**
 * Runtime schema for the credentials of a 1Password provider: a service account token, or
 * the account name of the desktop app, and only one of them.
 */
const onePasswordCredentialsSchema = z.union(
  [
    z.strictObject({
      /** The token of a service account. */
      serviceAccountToken: z.string().min(1),
    }),
    z.strictObject({
      /** The name or the UUID of the account in the desktop app. */
      accountName: z.string().min(1),
    }),
  ],
  {
    error:
      'The credentials need a serviceAccountToken or an accountName, one of them, and not empty.',
  },
);

/** The credentials of a 1Password provider. */
export type OnePasswordCredentials = z.infer<typeof onePasswordCredentialsSchema>;

/**
 * The clients that are open, by credentials, as promises so a call that comes while the
 * client is being created waits for it. They are shared by all the providers.
 */
const clients = new Map<string, Promise<Client>>();

/**
 * Creates the key a client is shared under. The token is hashed, so it's not kept as a
 * key.
 *
 * @param credentials The credentials of the provider.
 * @returns The key.
 */
const createClientKey = (credentials: OnePasswordCredentials): string =>
  'accountName' in credentials
    ? `desktop:${credentials.accountName}`
    : `token:${createHash('sha256').update(credentials.serviceAccountToken).digest('hex')}`;

/**
 * Gets the client of some credentials, creating it if there isn't one. Creating a client
 * logs in, which has limits (service accounts) or needs the approval of the user (desktop
 * app), so it's shared instead of created for each provider. A creation that fails is not
 * kept.
 *
 * @param credentials The credentials of the provider.
 * @returns The client.
 * @throws {Error} When the client can't be created.
 */
const getClient = (credentials: OnePasswordCredentials): Promise<Client> => {
  const key = createClientKey(credentials);
  const existing = clients.get(key);
  if (existing) return existing;

  const created = createClient({
    auth:
      'accountName' in credentials
        ? new DesktopAuth(credentials.accountName)
        : credentials.serviceAccountToken,
    integrationName: INTEGRATION_NAME,
    integrationVersion: getPackageVersion(),
  });
  clients.set(key, created);
  // The error still reaches whoever awaits `created`: this only makes the next call try
  // again, instead of getting the same failure.
  created.catch(() => {
    if (clients.get(key) === created) clients.delete(key);
  });

  return created;
};

/**
 * Forgets a client, so the next call creates a new one.
 *
 * @param credentials The credentials of the provider.
 * @param client The client to forget, if it's still the one that is kept.
 */
const evictClient = (
  credentials: OnePasswordCredentials,
  client: Promise<Client>,
): void => {
  const key = createClientKey(credentials);
  if (clients.get(key) === client) clients.delete(key);
};

/**
 * Checks whether a reference error means that what the reference points to doesn't exist.
 *
 * @param error The error of the reference.
 * @returns Whether it's a "not found".
 */
const isNotFound = ({ type }: ResolveReferenceError): boolean =>
  type === 'vaultNotFound' ||
  type === 'itemNotFound' ||
  type === 'fieldNotFound' ||
  type === 'noMatchingSections';

/**
 * A provider that resolves secrets from 1Password with its SDK. The name of a secret is a
 * secret reference, like `op://vault/item/field`.
 */
export class OnePasswordSecretProvider implements SecretProvider {
  readonly name: string;

  readonly type = '1password' as const;

  private readonly credentials: OnePasswordCredentials;

  readonly secretsConfig: SecretsConfig;

  /**
   * @param providerConfig The config of the provider, with its name.
   * @param secretsConfig The resolved config of the secrets.
   * @throws {ZodError} When the credentials are not valid.
   */
  constructor(
    providerConfig: NamedSecretProviderConfig<'1password'>,
    secretsConfig: SecretsConfig,
  ) {
    this.secretsConfig = secretsConfig;
    this.name = providerConfig.name;
    this.credentials = onePasswordCredentialsSchema.parse(providerConfig.credentials);
  }

  /**
   * Does nothing: the client is shared by all the providers with the same credentials,
   * and creating it logs in again, so it's kept open on purpose. The SDK has no way to
   * close it either.
   */
  async close(): Promise<void> {
    // Nothing to release, see above.
  }

  /**
   * Resolves one secret.
   *
   * @param name The name of the secret, a reference like `op://vault/item/field`.
   * @returns The value, or `undefined` if the name is not a reference or 1Password
   *   doesn't have what it points to.
   * @throws {Error} When the login or the request fails.
   */
  async getSecret(name: string): Promise<string | undefined> {
    const secrets = await this.getSecrets([name]);
    return secrets[name];
  }

  /**
   * Resolves many secrets with one request. The names that are not references are not
   * asked for.
   *
   * @param names The names of the secrets, references like `op://vault/item/field`.
   * @returns The values by name, `undefined` for the ones 1Password doesn't have.
   * @throws {Error} When the login or the request fails, or a reference can't be resolved
   *   for a reason other than not existing.
   */
  async getSecrets(names: string[]): Promise<Record<string, string | undefined>> {
    const references = Array.from(
      new Set(
        names.filter(
          (name) =>
            name.startsWith(REFERENCE_PREFIX) && name.length > REFERENCE_PREFIX.length,
        ),
      ),
    );
    const result: Record<string, string | undefined> = {};
    for (const name of names) result[name] = undefined;
    if (references.length === 0) return result;

    const { individualResponses } = await this.resolveAll(references);
    for (const reference of references) {
      const response = individualResponses[reference];
      if (response?.content) {
        result[reference] = response.content.secret;
      } else if (response?.error && !isNotFound(response.error)) {
        throw new Error(
          `1Password could not resolve '${reference}': ${response.error.type}.`,
        );
      }
    }

    return result;
  }

  /**
   * Asks 1Password for the references, and forgets the client if its session is over.
   *
   * @param references The secret references.
   * @returns The response of 1Password.
   * @throws {Error} When the login or the request fails.
   */
  private async resolveAll(references: string[]): Promise<ResolveAllResponse> {
    const client = getClient(this.credentials);
    try {
      return await (await client).secrets.resolveAll(references);
    } catch (error) {
      if (
        error instanceof AuthExpiredError ||
        error instanceof DesktopSessionExpiredError
      ) {
        evictClient(this.credentials, client);
      }

      throw error;
    }
  }
}
