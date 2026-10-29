import type { z } from 'zod';
import type {
  secretProviderConfigSchema,
  secretProviderTypeSchema,
  secretsConfigSchema,
} from './schemas.js';

/** Supported secret provider implementations. */
export type SecretProviderType = z.infer<typeof secretProviderTypeSchema>;

/** The config of one secret provider. */
export type SecretProviderConfig = z.infer<typeof secretProviderConfigSchema>;

/** The config of a secret provider, with the name it has in the registry. */
export type NamedSecretProviderConfig<T extends SecretProviderType = SecretProviderType> =
  Extract<SecretProviderConfig, { type: T }> & { name: string };

/** The resolved `extensions.secrets` config. */
export type SecretsConfig = z.infer<typeof secretsConfigSchema>;

/** Options for `getSecret` and `getSecrets`. */
export type GetSecretOptions = {
  /**
   * The project directory, to read the config from.
   *
   * @default process.cwd()
   */
  cwd?: string;
  /** Whether to throw a `SecretNotFoundError` when a secret can't be resolved. */
  required?: boolean;
  /**
   * The name, in the registry, of the provider to try first. It's a preference: the other
   * providers are still tried after it, in the usual order, if it doesn't have the
   * secret. It has to be in the registry, and enabled.
   */
  provider?: string;
};

/** What a secret provider implements. */
export interface SecretProvider {
  /** The resolved config of the secrets. */
  readonly secretsConfig: SecretsConfig;
  /** The name of the provider in the registry. */
  name: string;
  /** The implementation of the provider. */
  type: SecretProviderType;
  /**
   * Resolves one secret.
   *
   * @param name The name of the secret.
   * @returns The value, or `undefined` if the provider doesn't have it.
   */
  getSecret(name: string): Promise<string | undefined>;
  /**
   * Resolves many secrets at once.
   *
   * @param names The names of the secrets.
   * @returns The values by name, `undefined` for the ones the provider doesn't have.
   */
  getSecrets(names: string[]): Promise<Record<string, string | undefined>>;
  /** Releases what the provider holds, like connections. */
  close?(): Promise<void>;
}

declare module '@homer0/pi-config' {
  interface ExtensionsConfig {
    secrets?: SecretsConfig;
  }
}
