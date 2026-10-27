import { getConfigValue } from '@homer0/pi-config';
import { getCached } from '@homer0/pi-in-memory-cache';
import { z } from 'zod';
import { AwsSecretProvider } from './providers/aws/provider.js';
import { InfisicalSecretProvider } from './providers/infisical/provider.js';
import { secretsConfigSchema } from './schemas.js';
import type {
  GetSecretOptions,
  NamedSecretProviderConfig,
  SecretProvider,
  SecretsConfig,
} from './types.js';
import {
  expandPlaceholders,
  readAuthKey,
  SecretNotFoundError,
  SecretsConfigError,
} from './utils.js';

/**
 * The key a resolved secret value is cached under, scoped per provider type, provider
 * name, and secret name. The placeholders are replaced at runtime.
 */
const SECRET_CACHE_KEY = 'pi-secrets:secret:<provider>:<providerName>:<secretName>';

/** The prefix of a value that is read from the process environment. */
const ENV_PREFIX = '$env:';

/** The prefix of a value that is read from the secret providers, without a provider. */
const SECRET_PREFIX = '$secret:';

/** The prefix of a value that is read from the config, and is resolved again. */
const CONFIG_PREFIX = '$config:';

/** The prefix of a value that is read from the `auth.json` of the agent directory. */
const AUTH_PREFIX = '$auth:';

/**
 * Finds the references in a value: `$env:NAME`, `$secret:NAME`, `$secret[provider]:NAME`,
 * `$config:PATH` and `$auth:NAME`, delimited by whitespace or by the start and the end of
 * the value. Anything that starts with `$secret[` is a reference, even if it's malformed,
 * so {@link parseSecretReference} can report it instead of leaving it as text. The
 * lookarounds keep the spaces out of the match, and it has no capture groups on purpose:
 * the prefixes are used to parse each reference.
 */
const INTERPOLATION_REGEX =
  /(?<=^|\s)\$(?:(?:env|secret|config|auth):\S+|secret\[\S*)(?=\s|$)/g;

/**
 * Parses a `$secret[provider]:NAME` reference. The provider is a key of the registry, so
 * it has no whitespace and no `]`; the name is everything up to the end of the
 * reference.
 */
const SECRET_WITH_PROVIDER_REGEX = /^\$secret\[([^\s\]]+)\]:(\S+)$/;

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

/** Options for {@link interpolate}. */
type InterpolateOptions = {
  /** The value to resolve. */
  value: string;
  /** The project directory to read the config from. */
  cwd?: string;
  /** Describes what's being resolved, for the error messages. */
  context: string;
  /**
   * The config paths that led to this value, from the first one to the last, to know when
   * a `$config:` reference goes back to one of them.
   */
  chain: string[];
};

/** Options for {@link readConfigPath}. */
type ReadConfigPathOptions = {
  /** The config path to read. */
  path: string;
  /** The project directory to read the config from. */
  cwd?: string;
  /** Describes what's being resolved, for the error messages. */
  context: string;
  /** The config paths that led to this one. */
  chain: string[];
};

/** Options for {@link resolveReference}. */
type ResolveReferenceOptions = {
  /** The reference to resolve, like `$env:NAME` or `$secret[provider]:NAME`. */
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
 * @throws {SecretsConfigError} When the type of the provider is not supported, or it has
 *   no implementation yet.
 */
const createProvider = (
  providerConfig: NamedSecretProviderConfig,
  secretsConfig: SecretsConfig,
): SecretProvider => {
  const { type } = providerConfig;
  switch (type) {
    case 'infisical':
      return new InfisicalSecretProvider(providerConfig, secretsConfig);
    case 'aws':
      return new AwsSecretProvider(providerConfig, secretsConfig);
    case '1password':
      throw new SecretsConfigError(
        `The secret provider type '${type}' is not implemented yet.`,
      );
    default:
      throw new SecretsConfigError(`Unsupported secret provider type: ${type}`);
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
 * Gets the configs of the providers to try, in order: the preferred one, if there is one,
 * then the main one, and then the enabled ones from `fallbackOrder` (or the whole
 * registry if there's none). A provider is only listed once.
 *
 * @param config The resolved config of the secrets.
 * @param preferred The name of the provider to try first.
 * @returns The configs of the providers.
 * @throws {SecretsConfigError} When the main provider doesn't exist or is disabled.
 * @throws {SecretsConfigError} When the preferred provider doesn't exist or is disabled.
 */
const getProviderConfigs = (
  config: SecretsConfig,
  preferred?: string,
): NamedSecretProviderConfig[] => {
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
  const providers = [mainProvider].concat(fallbackProviders);
  if (typeof preferred === 'undefined') return providers;

  const preferredProvider = getProviderConfig(config, preferred);
  if (!preferredProvider)
    throw new SecretsConfigError(`Preferred secret provider not found: ${preferred}`);
  if (!preferredProvider.enabled)
    throw new SecretsConfigError(`Preferred secret provider is disabled: ${preferred}`);

  return [preferredProvider].concat(
    providers.filter((provider) => provider.name !== preferred),
  );
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
 * Resolves a secret, trying each configured provider in order, the preferred one first.
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
  for (const providerConfig of getProviderConfigs(config, options.provider)) {
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
  for (const providerConfig of getProviderConfigs(config, options.provider)) {
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
 * @throws {SecretsConfigError} When the main provider, or the preferred one, doesn't
 *   exist or is disabled.
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
 * @throws {SecretsConfigError} When the main provider, or the preferred one, doesn't
 *   exist or is disabled.
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
 * @throws {SecretsConfigError} When the main provider, or the preferred one, doesn't
 *   exist or is disabled.
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
 * Reads the value of a `$config:` path, which has to be a string. What it holds is not
 * resolved here, because it can have references too.
 *
 * @param options The path, the project directory, what is being resolved, and the paths
 *   that led here.
 * @returns The string the path holds.
 * @throws {SecretsConfigError} When the path is already being resolved (it goes back to
 *   itself), it's not set, or it doesn't hold a string.
 */
const readConfigPath = async ({
  path,
  cwd,
  context,
  chain,
}: ReadConfigPathOptions): Promise<string> => {
  if (chain.includes(path)) {
    throw new SecretsConfigError(
      `${context} has a circular config reference: ${chain.concat(path).join(' -> ')}.`,
    );
  }

  const configValue: unknown = await getConfigValue(path, { cwd });
  if (typeof configValue === 'undefined') {
    throw new SecretsConfigError(`${context} references unset config path "${path}".`);
  }

  if (typeof configValue !== 'string') {
    throw new SecretsConfigError(
      `${context} references config path "${path}", which is not a string.`,
    );
  }

  return configValue;
};

/** What a `$secret:` or `$secret[provider]:` reference points to. */
type SecretReference = {
  /** The name of the secret. */
  name: string;
  /** The name, in the registry, of the provider to try first. */
  provider?: string;
};

/** Options for {@link parseSecretReference}. */
type ParseSecretReferenceOptions = {
  /** The reference to parse, like `$secret:NAME` or `$secret[provider]:NAME`. */
  reference: string;
  /** Describes what's being resolved, for the error messages. */
  context: string;
};

/**
 * Parses a `$secret:` or `$secret[provider]:` reference.
 *
 * @param options The reference, and what is being resolved.
 * @returns The name of the secret, and the provider if the reference has one.
 * @throws {SecretsConfigError} When a `$secret[provider]:` reference is malformed.
 */
const parseSecretReference = ({
  reference,
  context,
}: ParseSecretReferenceOptions): SecretReference => {
  if (reference.startsWith(SECRET_PREFIX)) {
    return { name: reference.slice(SECRET_PREFIX.length) };
  }

  const match = SECRET_WITH_PROVIDER_REGEX.exec(reference);
  if (!match) {
    throw new SecretsConfigError(
      `${context} has a malformed secret reference "${reference}", it should be $secret[provider]:NAME.`,
    );
  }

  const [, provider, name] = match;
  return { name: name!, provider: provider! };
};

/**
 * Resolves one reference: reads the environment variable of an `$env:` one, the key of an
 * `auth.json` entry of an `$auth:` one, or the secret of a `$secret:` or
 * `$secret[provider]:` one, where the provider is tried first. What it gets is used as it
 * is.
 *
 * @param options The reference, the project directory for the secrets, and what is being
 *   resolved.
 * @returns The value the reference points to.
 * @throws {Error} When an `$env:` variable is not set, or an `$auth:` key can't be read.
 * @throws {SecretNotFoundError} When a `$secret:` can't be resolved.
 * @throws {SecretsConfigError} When a `$secret[provider]:` is malformed, or its provider
 *   doesn't exist or is disabled.
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

  if (reference.startsWith(AUTH_PREFIX)) {
    return readAuthKey({ name: reference.slice(AUTH_PREFIX.length), context });
  }

  const { name, provider } = parseSecretReference({ reference, context });
  return getSecret(name, { cwd, required: true, provider });
};

/**
 * Replaces the references of a value with what they point to. What a `$config:` reference
 * finds is resolved again, with the path added to the chain, so a cycle is found; what a
 * secret or an environment variable gives is not.
 *
 * @param options The value, the project directory, what is being resolved, and the config
 *   paths that led to it.
 * @returns The value, with the references replaced.
 * @throws {Error} When an `$env:` variable is not set, or an `$auth:` key can't be read.
 * @throws {SecretNotFoundError} When a `$secret:` can't be resolved.
 * @throws {SecretsConfigError} When a `$config:` can't be resolved, or a
 *   `$secret[provider]:` is malformed or has a provider that doesn't exist or is
 *   disabled.
 */
const interpolate = async ({
  value,
  cwd,
  context,
  chain,
}: InterpolateOptions): Promise<string> => {
  let result = '';
  let position = 0;
  for (const match of value.matchAll(INTERPOLATION_REGEX)) {
    const [reference] = match;
    let resolved: string;
    // The references are resolved one by one, so the error is always about the first one
    // that fails, in the order they appear.
    if (reference.startsWith(CONFIG_PREFIX)) {
      const path = reference.slice(CONFIG_PREFIX.length);
      // oxlint-disable-next-line no-await-in-loop -- See above.
      const configValue = await readConfigPath({ path, cwd, context, chain });
      // oxlint-disable-next-line no-await-in-loop -- See above.
      resolved = await interpolate({
        value: configValue,
        cwd,
        context,
        chain: chain.concat(path),
      });
    } else {
      // oxlint-disable-next-line no-await-in-loop -- See above.
      resolved = await resolveReference({ reference, cwd, context });
    }
    // The value is built from the pieces instead of with `String.replace`, so a `$` in
    // what is resolved (like `$&`) is never read as a replacement pattern.
    result += value.slice(position, match.index) + resolved;
    position = match.index + reference.length;
  }

  return result + value.slice(position);
};

/**
 * Resolves a config value that can have references to the environment, to the secret
 * providers, or to another place of the config, shared by every place that lets a user
 * point to a credential instead of hardcoding it:
 *
 * - `$env:VAR_NAME` — reads from the process environment. Throws if unset.
 * - `$secret:SECRET_NAME` — reads from the configured secret providers. Throws if it can't
 *   be resolved.
 * - `$secret[provider]:SECRET_NAME` — the same, but tries that provider of the registry
 *   first. It doesn't have to be in the fallback order, and if it doesn't have the secret
 *   the others are tried. Throws if the provider doesn't exist or is disabled, or if the
 *   reference is malformed (no provider, an unclosed bracket, no name).
 * - `$config:some.config.path` — reads that path of the config, and resolves what it finds
 *   with these same rules, so it can be (or have) another reference. Throws if the path
 *   is not set, if it doesn't hold a string, or if the references go back to themselves.
 * - `$auth:NAME` — reads the `key` of that entry of the `auth.json` of the agent directory,
 *   resolved the way Pi does: it can be a literal, have `$VAR` references to environment
 *   variables, or be a shell command that starts with `!`. Throws if the file or the
 *   entry can't be read, or if the key can't be resolved.
 *
 * A reference can be the whole value or a part of it, like `Bearer $secret:API_KEY`. It
 * ends where the next whitespace begins, so the text around it is kept exactly as it is,
 * and a value can have many references. Each one is resolved where it appears, so a
 * reference that appears twice is resolved twice. A prefix that is not at the start of a
 * word, like in `KEY=$env:NAME`, is not a reference. A value without references is
 * returned unchanged.
 *
 * Only what comes from the config is resolved again: the value of a secret, of an
 * environment variable or of an auth key is used exactly as it is, even if it looks like
 * a reference.
 *
 * Fails closed rather than silently returning an empty/broken value: a blank credential
 * would otherwise surface as an opaque downstream failure (e.g. a 401/403 from an HTTP
 * server, or a process silently missing an env var it needs), hiding that interpolation
 * itself failed (e.g. a typo'd env var name or an unprovisioned secret).
 *
 * @param options The value, the project directory for the config and the secrets, and
 *   what is being resolved.
 * @returns The value, with the references replaced by what they point to.
 * @throws {Error} When an `$env:` variable is not set, or an `$auth:` key can't be read.
 * @throws {SecretNotFoundError} When a `$secret:` can't be resolved.
 * @throws {SecretsConfigError} When a `$config:` can't be resolved, or a
 *   `$secret[provider]:` is malformed or has a provider that doesn't exist or is
 *   disabled.
 */
const resolveInterpolatedValue = ({
  value,
  cwd,
  context,
}: ResolveInterpolatedValueOptions): Promise<string> =>
  interpolate({ value, cwd, context, chain: [] });

/**
 * Escapes the references of a value the way Pi reads its own config values (`$$` is a
 * literal `$`), so Pi gives the reference back as text (`$$auth:NAME` becomes
 * `$auth:NAME`) instead of trying to read it as an environment variable. It's for writing
 * a reference in a file that Pi reads, like the `headers` of `models.json`, and resolving
 * it later with {@link resolveInterpolatedValue}. It finds the references with the same
 * rules, and everything else is left as it is.
 *
 * @param value A value that can have references.
 * @returns The value, with a `$` added to each reference.
 */
const escapeReferences = (value: string): string =>
  value.replace(INTERPOLATION_REGEX, (reference) => `$${reference}`);

export { escapeReferences, getSecret, getSecrets, resolveInterpolatedValue };
