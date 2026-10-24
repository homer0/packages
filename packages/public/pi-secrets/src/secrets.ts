import { getConfigValue } from '@homer0/pi-config';
import { getCached } from '@homer0/pi-in-memory-cache';
import { z } from 'zod';
import { InfisicalSecretProvider } from './providers.js';
import { secretsConfigSchema } from './schemas.js';
import type {
  GetSecretOptions,
  NamedSecretProviderConfig,
  SecretProvider,
  SecretsConfig,
} from './types.js';
import { expandPlaceholders, SecretNotFoundError, SecretsConfigError } from './utils.js';

/**
 * The key a resolved secret value is cached under, scoped per provider type, provider
 * name, and secret name. The placeholders are replaced at runtime.
 */
const SECRET_CACHE_KEY = 'pi-secrets:secret:<provider>:<providerName>:<secretName>';

/** The prefix of a value that is read from the process environment. */
const ENV_PREFIX = '$env:';

/** The prefix of a value that is read from the secret providers. */
const SECRET_PREFIX = '$secret:';

/**
 * Finds the references in a value: `$env:NAME` and `$secret:NAME`, delimited by
 * whitespace or by the start and the end of the value. The lookarounds keep the spaces
 * out of the match, and it has no capture groups on purpose: the prefixes are used to
 * parse each reference.
 */
const INTERPOLATION_REGEX = /(?<=^|\s)\$(?:env|secret):\S+(?=\s|$)/g;

/** Options for {@link resolveInterpolatedValue}. */
type ResolveInterpolatedValueOptions = {
  /** The value to resolve. */
  value: string;
  /** The project directory to read the secrets config from. */
  cwd?: string;
  /**
   * Describes what's being resolved, used only in the thrown error message (e.g. `MCP
   * header "Authorization"`).
   */
  context: string;
};

/** Options for {@link resolveReference}. */
type ResolveReferenceOptions = {
  /** The reference to resolve, like `$env:NAME` or `$secret:NAME`. */
  reference: string;
  /** The project directory to read the secrets config from. */
  cwd?: string;
  /** Describes what's being resolved, for the error messages. */
  context: string;
};

/** The values of some secrets, by name. */
type SecretValues = Record<string, string | undefined>;

/** Options for {@link tryProvider}. */
type TryProviderOptions = {
  /** The provider to ask. */
  provider: SecretProvider;
  /** The name of the secret. */
  name: string;
  /** How long the value is cached for, in milliseconds. */
  cacheTtlMs: number;
};

/** Options for {@link tryProviderBulk}. */
type TryProviderBulkOptions = {
  /** The provider to ask. */
  provider: SecretProvider;
  /** The names of the secrets. */
  names: string[];
  /** How long the values are cached for, in milliseconds. */
  cacheTtlMs: number;
};

/**
 * Creates the provider of a config.
 *
 * @param providerConfig The config of the provider, with its name.
 * @param secretsConfig The resolved config of the secrets.
 * @returns The provider.
 * @throws {SecretsConfigError} When the type of the provider is not supported.
 */
const createProvider = (
  providerConfig: NamedSecretProviderConfig,
  secretsConfig: SecretsConfig,
): SecretProvider => {
  switch (providerConfig.type) {
    case 'infisical':
      return new InfisicalSecretProvider(providerConfig, secretsConfig);
    default:
      throw new SecretsConfigError(
        `Unsupported secret provider type: ${providerConfig.type}`,
      );
  }
};

/**
 * Gets the config of a provider, with its name.
 *
 * @param config The resolved config of the secrets.
 * @param name The name of the provider in the registry.
 * @returns The config, or `undefined` if the registry doesn't have it.
 */
const getProviderConfig = (
  config: SecretsConfig,
  name: string,
): NamedSecretProviderConfig | undefined => {
  const provider = config.providers.registry[name];
  if (!provider) return undefined;
  return { ...provider, name };
};

/**
 * Gets the configs of the providers to try, in order: the main one, and then the enabled
 * ones from `fallbackOrder` (or the whole registry if there's none).
 *
 * @param config The resolved config of the secrets.
 * @returns The configs of the providers.
 * @throws {SecretsConfigError} When the main provider doesn't exist or is disabled.
 */
const getProviderConfigs = (config: SecretsConfig): NamedSecretProviderConfig[] => {
  const { fallbackOrder, main, registry } = config.providers;
  const mainProvider = getProviderConfig(config, main);
  if (!mainProvider)
    throw new SecretsConfigError(`Main secret provider not found: ${main}`);
  if (!mainProvider.enabled)
    throw new SecretsConfigError(`Main secret provider is disabled: ${main}`);

  const fallbackNames = fallbackOrder ?? Object.keys(registry);
  const fallbackProviders = fallbackNames.flatMap((providerName) => {
    if (providerName === main) return [];

    const provider = getProviderConfig(config, providerName);
    if (!provider || !provider.enabled) return [];

    return [provider];
  });

  return [mainProvider].concat(fallbackProviders);
};

/**
 * Reports a secret resolution issue, which should be visible without exposing the values.
 *
 * @param message The description of the issue.
 * @param error The error behind the issue, if there is one.
 */
const warnSecretsIssue = (message: string, error?: unknown): void => {
  if (typeof error === 'undefined') {
    // eslint-disable-next-line no-console -- Secret resolution issues should be visible without exposing secret values.
    console.warn(`[pi-secrets] ${message}`);
  } else {
    // eslint-disable-next-line no-console -- Secret resolution issues should be visible without exposing secret values.
    console.warn(`[pi-secrets] ${message}`, error);
  }
};

/**
 * Creates the key a secret of a provider is cached under.
 *
 * @param provider The provider of the secret.
 * @param name The name of the secret.
 * @returns The cache key.
 */
const makeSecretCacheKey = (provider: SecretProvider, name: string): string =>
  expandPlaceholders(SECRET_CACHE_KEY, {
    provider: provider.type,
    providerName: provider.name,
    secretName: name,
  });

/**
 * Resolves one secret from one provider, through the cache. A secret the provider doesn't
 * have is not cached, and a provider that fails is reported and counts as not having it.
 *
 * @param options The provider, the name of the secret, and how long to cache it.
 * @returns The value, or `undefined`.
 */
const tryProvider = async ({
  provider,
  name,
  cacheTtlMs,
}: TryProviderOptions): Promise<string | undefined> => {
  try {
    return await getCached({
      key: makeSecretCacheKey(provider, name),
      schema: z.string(),
      ttl: cacheTtlMs,
      fetchFn: async () => {
        const value = await provider.getSecret(name);
        if (typeof value === 'undefined') throw new SecretNotFoundError(name);
        return value;
      },
    });
  } catch (error) {
    // SecretNotFoundError is thrown by fetchFn when the provider returns undefined,
    // to prevent the daemon from caching a "not found" result. It is expected and
    // should not produce a warning — only real provider errors should.
    if (error instanceof SecretNotFoundError) return undefined;
    warnSecretsIssue(`Provider '${provider.name}' failed to resolve a secret.`, error);
    return undefined;
  }
};

/**
 * Resolves multiple secrets from one provider in a single bulk call. The provider's
 * `getSecrets` fetch is memoized so that, on a cache miss, all pending names share one
 * underlying network call instead of one per name.
 *
 * @param options The provider, the names of the secrets, and how long to cache them.
 * @returns The values by name, `undefined` for the ones the provider doesn't have.
 */
const tryProviderBulk = async ({
  provider,
  names,
  cacheTtlMs,
}: TryProviderBulkOptions): Promise<SecretValues> => {
  let batchPromise: Promise<SecretValues> | undefined;
  const fetchBatch = (): Promise<SecretValues> => {
    batchPromise ??= provider.getSecrets(names);
    return batchPromise;
  };

  const entries = await Promise.all(
    names.map(async (name): Promise<[string, string | undefined]> => {
      try {
        const value = await getCached({
          key: makeSecretCacheKey(provider, name),
          schema: z.string(),
          ttl: cacheTtlMs,
          fetchFn: async () => {
            const batch = await fetchBatch();
            const batchValue = batch[name];
            if (typeof batchValue === 'undefined') throw new SecretNotFoundError(name);
            return batchValue;
          },
        });
        return [name, value];
      } catch (error) {
        if (error instanceof SecretNotFoundError) return [name, undefined];
        warnSecretsIssue(
          `Provider '${provider.name}' failed to resolve a secret.`,
          error,
        );
        return [name, undefined];
      }
    }),
  );

  return Object.fromEntries(entries);
};

/**
 * Resolves a secret, trying each configured provider in order.
 *
 * @param name The name of the secret.
 * @param options The options of the lookup.
 * @returns The value, or `undefined` if no provider has it.
 */
const resolveSecret = async (
  name: string,
  options: GetSecretOptions,
): Promise<string | undefined> => {
  const config = await getConfigValue('extensions.secrets', {
    cwd: options.cwd,
    schema: secretsConfigSchema,
  });

  if (!config) return undefined;

  // oxlint-disable-next-line no-unreachable-loop -- An unresolved provider falls through its finally block to try the next provider.
  for (const providerConfig of getProviderConfigs(config)) {
    const provider = createProvider(providerConfig, config);
    try {
      const value = await tryProvider({ provider, name, cacheTtlMs: config.cacheTtl });
      if (typeof value !== 'undefined') return value;
    } finally {
      await provider.close?.();
    }
  }

  return undefined;
};

/**
 * Resolves multiple secrets, trying each configured provider in fallback order and only
 * asking a provider to resolve the names still pending.
 *
 * @param names The names of the secrets.
 * @param options The options of the lookup.
 * @returns The values by name, `undefined` for the ones no provider has.
 */
const resolveSecrets = async (
  names: string[],
  options: GetSecretOptions,
): Promise<SecretValues> => {
  const result: SecretValues = {};
  for (const name of names) result[name] = undefined;

  const config = await getConfigValue('extensions.secrets', {
    cwd: options.cwd,
    schema: secretsConfigSchema,
  });

  if (!config) return result;

  let pending = names.slice();

  // oxlint-disable-next-line no-unreachable-loop -- Pending names fall through the finally block to try the next provider.
  for (const providerConfig of getProviderConfigs(config)) {
    if (pending.length === 0) break;

    const provider = createProvider(providerConfig, config);
    try {
      const resolved = await tryProviderBulk({
        provider,
        names: pending,
        cacheTtlMs: config.cacheTtl,
      });
      for (const name of pending) {
        const value = resolved[name];
        if (typeof value !== 'undefined') result[name] = value;
      }
      pending = pending.filter((name) => typeof result[name] === 'undefined');
    } finally {
      await provider.close?.();
    }
  }

  return result;
};

/**
 * Retrieves a secret from the configured providers.
 *
 * @param name The name of the secret.
 * @param options The project directory, and that the secret is required.
 * @returns The value.
 * @throws {SecretNotFoundError} When no provider has the secret.
 * @throws {SecretsConfigError} When the main provider doesn't exist or is disabled.
 */
function getSecret(
  name: string,
  options: GetSecretOptions & { required: true },
): Promise<string>;
/**
 * Retrieves a secret from the configured providers.
 *
 * @param name The name of the secret.
 * @param options The project directory, and whether the secret is required.
 * @returns The value, or `undefined` if no provider has it and it's not required.
 * @throws {SecretNotFoundError} When the secret is required and no provider has it.
 * @throws {SecretsConfigError} When the main provider doesn't exist or is disabled.
 */
function getSecret(name: string, options?: GetSecretOptions): Promise<string | undefined>;
async function getSecret(
  name: string,
  options: GetSecretOptions = {},
): Promise<string | undefined> {
  const value = await resolveSecret(name, options);
  if (typeof value !== 'undefined') return value;

  warnSecretsIssue(`Secret '${name}' could not be resolved.`);
  if (options.required) throw new SecretNotFoundError(name);
  return undefined;
}

/**
 * Retrieves multiple secrets from the configured providers in one bulk lookup. The return
 * type preserves the requested names as literal keys, so callers get typed access per
 * name (e.g. `result.API_KEY`) instead of an untyped `Record<string, ...>`.
 *
 * @template TNames The names of the secrets, as literals.
 * @param names The names of the secrets.
 * @param options The project directory, and whether the secrets are required.
 * @returns The values by name, `undefined` for the ones no provider has.
 * @throws {SecretNotFoundError} When the secrets are required and one is missing.
 * @throws {SecretsConfigError} When the main provider doesn't exist or is disabled.
 */
const getSecrets = async <const TNames extends readonly string[]>(
  names: TNames,
  options: GetSecretOptions = {},
): Promise<Record<TNames[number], string | undefined>> => {
  const values = await resolveSecrets(names.slice(), options);

  const missingNames = names.filter((name) => typeof values[name] === 'undefined');
  for (const name of missingNames) {
    warnSecretsIssue(`Secret '${name}' could not be resolved.`);
    if (options.required) throw new SecretNotFoundError(name);
  }

  // Safe: `resolveSecrets` seeds every name in `names` as a key up front,
  // so every `TNames[number]` key is guaranteed present here.
  return values as Record<TNames[number], string | undefined>;
};

/**
 * Resolves one reference: reads the environment variable of an `$env:` one, or the secret
 * of a `$secret:` one.
 *
 * @param options The reference, the project directory for the secrets, and what is being
 *   resolved.
 * @returns The value the reference points to.
 * @throws {Error} When an `$env:` variable is not set.
 * @throws {SecretNotFoundError} When a `$secret:` can't be resolved.
 */
const resolveReference = async ({
  reference,
  cwd,
  context,
}: ResolveReferenceOptions): Promise<string> => {
  if (reference.startsWith(ENV_PREFIX)) {
    const varName = reference.slice(ENV_PREFIX.length);
    // eslint-disable-next-line n/no-process-env -- $env: prefix is an explicit opt-in for env var interpolation.
    const resolved = process.env[varName];
    if (typeof resolved === 'undefined') {
      throw new Error(`${context} references unset environment variable "${varName}".`);
    }
    return resolved;
  }

  return getSecret(reference.slice(SECRET_PREFIX.length), { cwd, required: true });
};

/**
 * Resolves a config value that can have references to the environment or to the secret
 * providers, shared by every place that lets a user point to a credential instead of
 * hardcoding it:
 *
 * - `$env:VAR_NAME` — reads from the process environment. Throws if unset.
 * - `$secret:SECRET_NAME` — reads from the configured secret providers. Throws if it can't
 *   be resolved.
 *
 * A reference can be the whole value or a part of it, like `Bearer $secret:API_KEY`. It
 * ends where the next whitespace begins, so the text around it is kept exactly as it is,
 * and a value can have many references. Each one is resolved where it appears, so a
 * reference that appears twice is resolved twice. A prefix that is not at the start of a
 * word, like in `KEY=$env:NAME`, is not a reference. A value without references is
 * returned unchanged.
 *
 * Fails closed rather than silently returning an empty/broken value: a blank credential
 * would otherwise surface as an opaque downstream failure (e.g. a 401/403 from an HTTP
 * server, or a process silently missing an env var it needs), hiding that interpolation
 * itself failed (e.g. a typo'd env var name or an unprovisioned secret).
 *
 * @param options The value, the project directory for the secrets, and what is being
 *   resolved.
 * @returns The value, with the references replaced by what they point to.
 * @throws {Error} When an `$env:` variable is not set.
 * @throws {SecretNotFoundError} When a `$secret:` can't be resolved.
 */
const resolveInterpolatedValue = async ({
  value,
  cwd,
  context,
}: ResolveInterpolatedValueOptions): Promise<string> => {
  let result = '';
  let position = 0;
  for (const match of value.matchAll(INTERPOLATION_REGEX)) {
    const [reference] = match;
    // The references are resolved one by one, so the error is always about the first one
    // that fails, in the order they appear.
    // oxlint-disable-next-line no-await-in-loop -- See above.
    const resolved = await resolveReference({ reference, cwd, context });
    // The value is built from the pieces instead of with `String.replace`, so a `$` in
    // what is resolved (like `$&`) is never read as a replacement pattern.
    result += value.slice(position, match.index) + resolved;
    position = match.index + reference.length;
  }

  return result + value.slice(position);
};

export { getSecret, getSecrets, resolveInterpolatedValue };
