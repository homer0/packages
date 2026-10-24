/* eslint-disable max-classes-per-file -- The secrets errors live together. */

/** Error thrown when a required secret cannot be resolved from any provider. */
export class SecretNotFoundError extends Error {
  /** The name of the secret that was not found. */
  readonly secretName: string;

  /** @param secretName The name of the secret that was not found. */
  constructor(secretName: string) {
    super(`Secret not found: ${secretName}`);
    this.secretName = secretName;
    this.name = 'SecretNotFoundError';
  }
}

/** Error thrown when secrets configuration is structurally valid but inconsistent. */
export class SecretsConfigError extends Error {
  /** @param message The description of what is wrong with the config. */
  constructor(message: string) {
    super(message);
    this.name = 'SecretsConfigError';
  }
}
