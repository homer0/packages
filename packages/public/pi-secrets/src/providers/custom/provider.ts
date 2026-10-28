import type {
  NamedSecretProviderConfig,
  SecretProvider,
  SecretsConfig,
} from '../../types.js';
import type { CustomSecretProvider, CustomSecretProviderClass } from './types.js';

/** Options for {@link CustomSecretProviderWrapper}. */
type CustomSecretProviderWrapperOptions = {
  /** The config of the provider, with its name. */
  providerConfig: NamedSecretProviderConfig<'custom'>;
  /** The resolved config of the secrets. */
  secretsConfig: SecretsConfig;
  /** The class of the provider, already loaded and validated. */
  providerClass: CustomSecretProviderClass;
};

/**
 * A provider that wraps an instance of a class that the user wrote. It gives the custom
 * class what the other providers have, like a `getSecrets` that is made from `getSecret`
 * when the class doesn't have one.
 */
export class CustomSecretProviderWrapper implements SecretProvider {
  readonly name: string;

  readonly type = 'custom' as const;

  readonly secretsConfig: SecretsConfig;

  private readonly custom: CustomSecretProvider;

  /**
   * @param options The config of the provider, the config of the secrets, and the class.
   * @throws {Error} When the constructor of the class throws.
   */
  constructor({
    providerConfig,
    secretsConfig,
    providerClass: CustomProvider,
  }: CustomSecretProviderWrapperOptions) {
    this.secretsConfig = secretsConfig;
    this.name = providerConfig.name;
    this.custom = new CustomProvider({
      name: providerConfig.name,
      data: providerConfig.data ?? {},
    });
  }

  /**
   * Resolves one secret.
   *
   * @param name The name of the secret.
   * @returns The value, or `undefined` if the provider doesn't have it.
   * @throws {Error} When the class throws.
   */
  getSecret(name: string): Promise<string | undefined> {
    return this.custom.getSecret(name);
  }

  /**
   * Resolves many secrets. It uses the `getSecrets` of the class, and without one it asks
   * for each name with `getSecret`, in parallel.
   *
   * @param names The names of the secrets.
   * @returns The values by name, `undefined` for the ones the provider doesn't have.
   * @throws {Error} When the class throws.
   */
  async getSecrets(names: string[]): Promise<Record<string, string | undefined>> {
    if (this.custom.getSecrets) return this.custom.getSecrets(names);

    const entries = await Promise.all(
      names.map(async (name): Promise<[string, string | undefined]> => [
        name,
        await this.custom.getSecret(name),
      ]),
    );
    return Object.fromEntries(entries);
  }

  /**
   * Releases what the class holds, if it has a `close`.
   *
   * @throws {Error} When the class throws.
   */
  async close(): Promise<void> {
    await this.custom.close?.();
  }
}
