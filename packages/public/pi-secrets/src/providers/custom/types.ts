/** What the class of a custom provider receives when it's created. */
export type CustomSecretProviderContext = {
  /** The name of the provider in the registry. */
  name: string;
  /** The `data` of the provider in the config, as it is. An empty object if it has none. */
  data: Record<string, unknown>;
};

/**
 * What the class of a custom provider implements. The methods have to be defined in the
 * class, not as properties of the instance (like arrow functions), because they are
 * checked in its prototype.
 */
export interface CustomSecretProvider {
  /**
   * Resolves one secret.
   *
   * @param name The name of the secret.
   * @returns The value, or `undefined` if the provider doesn't have it.
   */
  getSecret(name: string): Promise<string | undefined>;
  /**
   * Resolves many secrets at once. When the class doesn't have it, one `getSecret` call
   * is made for each name, in parallel.
   *
   * @param names The names of the secrets.
   * @returns The values by name, `undefined` for the ones the provider doesn't have.
   */
  getSecrets?(names: string[]): Promise<Record<string, string | undefined>>;
  /** Releases what the provider holds, like connections. */
  close?(): Promise<void>;
}

/** The class a custom provider file has as its default export. */
export type CustomSecretProviderClass = new (
  context: CustomSecretProviderContext,
) => CustomSecretProvider;
