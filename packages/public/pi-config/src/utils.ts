import { CONFIG_DIR_NAME, getAgentDir } from '@earendil-works/pi-coding-agent';
import { get, merge } from '@homer0/object-utils';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, extname, isAbsolute, join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import { ConfigReadError, ConfigValidationError } from './errors.js';
import type {
  ConfigPath,
  ConfigPathValue,
  ConfigQuery,
  ConfigSource,
  ConfigSchema,
  GetConfigOptions,
  PiCoreConfig,
  QueryConfigOptions,
  QueryConfigResult,
  ReadConfigResult,
} from './types.js';

/**
 * Resolves a path relative to the Pi agent directory.
 *
 * @param segments The segments of the path, relative to the agent directory.
 * @returns The absolute path.
 */
const getAgentPath = (...segments: string[]): string => join(getAgentDir(), ...segments);

/**
 * Returns the error message string from any thrown value. Prettifies zod validation
 * errors instead of surfacing their raw JSON `.message`.
 *
 * @param error The thrown value.
 * @returns The message of the error, or the value as a string if it's not an error.
 */
const ensureErrorMessage = (error: unknown): string => {
  if (error instanceof z.ZodError) {
    return error.issues.map((issue) => issue.message).join('; ');
  }
  return error instanceof Error ? error.message : String(error);
};

/** The Pi directory, in the home of the user. */
const PI_DIR = join(homedir(), CONFIG_DIR_NAME);
/** The absolute path of Pi's agent directory, where the global config files live. */
const AGENT_DIR = getAgentDir();
/** The directory where the profiles are. */
const PROFILES_DIR = getAgentPath('profiles');

/** The prefix of the paths relative to the Pi directory. */
const PI_PREFIX = 'pi:';
/** The prefix of the paths relative to the agent directory. */
const AGENT_PREFIX = 'agent:';
/** The pattern of the paths relative to a profile; it captures the name and the path. */
const PROFILE_PATTERN = /^profile:([^:]+):(.+)$/;

/**
 * Resolves a pi-style path reference to an absolute path.
 *
 * Supported formats:
 *
 * - `pi:<path>` — relative to the Pi directory (`~/.pi/`)
 * - `agent:<path>` — relative to the agent directory (`~/.pi/agent/`)
 * - `profile:<name>:<path>` — relative to a profile directory
 *   (`~/.pi/agent/profiles/<name>/`)
 * - Absolute path — used as-is
 * - Anything else — resolved relative to `baseDir`
 *
 * @example <caption>Relative to the agent directory</caption>
 *   resolvePiPath('agent:shared/base.yaml', '/project');
 *
 * @example <caption>Relative to the file that references it</caption>
 *   resolvePiPath('../base.yaml', '/project/.pi');
 *
 * @param value The path reference.
 * @param baseDir The directory to resolve the path from, when it doesn't have a prefix
 *   and it's not absolute.
 * @returns The absolute path.
 */
const resolvePiPath = (value: string, baseDir: string): string => {
  if (value.startsWith(PI_PREFIX)) return join(PI_DIR, value.slice(PI_PREFIX.length));
  if (value.startsWith(AGENT_PREFIX))
    return join(AGENT_DIR, value.slice(AGENT_PREFIX.length));
  if (isAbsolute(value)) return value;

  const profileMatch = PROFILE_PATTERN.exec(value);
  if (profileMatch) {
    const [, profileName, profilePath] = profileMatch;
    return join(PROFILES_DIR, profileName!, profilePath!);
  }
  return join(baseDir, value);
};

/**
 * The base config shape with all the top-level namespaces present, so consumers never see
 * missing keys.
 */
const EMPTY_PI_CORE_CONFIG: PiCoreConfig = {
  pi: {},
  skills: {},
  tools: {},
  extensions: {},
};

/**
 * Session-scoped config override, held on `globalThis` rather than as module state or
 * passed through `ExtensionAPI`/`ctx`: Pi loads each extension with its own copy of the
 * modules it imports, so module state would not be shared between extensions. One pi
 * process is assumed to correspond to one session.
 *
 * This is `globalThis` typed with the property that holds the override. The assertion is
 * the only place that needs to know about it.
 */
const sessionStore = globalThis as typeof globalThis & {
  __piConfigSessionOverride?: PiCoreConfig;
};

/**
 * Replaces the session-scoped config override wholesale, or clears it when `undefined`.
 *
 * @param value The new override, or `undefined` to clear it.
 */
const setSessionConfigOverride = (value: PiCoreConfig | undefined): void => {
  sessionStore.__piConfigSessionOverride = value;
};

/**
 * Gets the current session-scoped config override.
 *
 * @returns The override, or `undefined` if there's none.
 */
const getSessionConfigOverride = (): PiCoreConfig | undefined =>
  sessionStore.__piConfigSessionOverride;

/**
 * Clears the session-scoped config override.
 *
 * @returns Whether an override was actually set.
 */
const clearSessionConfigOverride = (): boolean => {
  const hadOverride = typeof sessionStore.__piConfigSessionOverride !== 'undefined';
  sessionStore.__piConfigSessionOverride = undefined;
  return hadOverride;
};

/**
 * The result of reading a config file: either its parsed value, or that it doesn't exist.
 * When the file couldn't be read or parsed, and it's not just missing, the result also
 * has the error.
 */
type ReadConfigFileResult =
  | { exists: true; value: unknown }
  | { exists: false; error?: ConfigReadError };

/** The formats a config file can have, used to describe errors. */
type ConfigFileFormat = 'JSON' | 'YAML';

/**
 * Creates a read error with the file path as context, preserving the original cause.
 *
 * @param message The description of what failed.
 * @param filePath The path of the config file that failed.
 * @param error The original error.
 * @returns The new error.
 */
const toReadError = (
  message: string,
  filePath: string,
  error: unknown,
): ConfigReadError => new ConfigReadError(message, filePath, { cause: error });

/**
 * Parses the content of a config file, based on the extension of the file.
 *
 * @param content The content of the file.
 * @param filePath The path of the file, to know its format.
 * @returns The parsed value.
 * @throws If the content is not valid for the format of the file.
 */
const parseConfigFile = (content: string, filePath: string): unknown => {
  const extension = extname(filePath);
  if (extension === '.json') return JSON.parse(content);
  return parseYaml(content);
};

/**
 * Gets the display label for the format of a config file.
 *
 * @param filePath The path of the config file.
 * @returns `JSON` for `.json` files, and `YAML` for everything else.
 */
const getConfigFileFormat = (filePath: string): ConfigFileFormat =>
  extname(filePath) === '.json' ? 'JSON' : 'YAML';

/**
 * Logs a non-fatal config read issue, without interrupting the resolution chain.
 *
 * @param error The error to log.
 */
const logConfigReadError = (error: ConfigReadError): void => {
  // eslint-disable-next-line no-console -- Non-fatal config read failures should be visible without breaking the config chain.
  console.warn(`[pi-core config] ${error.message}`);
};

/**
 * Reads and parses a config file, returning the missing or invalid files as non-fatal
 * results.
 *
 * @param filePath The path of the config file.
 * @returns The parsed value, or that the file doesn't exist; if it failed for another
 *   reason than being missing, the result has the error.
 */
const readConfigIfExists = async (filePath: string): Promise<ReadConfigFileResult> => {
  let content: string;

  try {
    content = await readFile(filePath, 'utf8');
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')
      return { exists: false };
    return {
      exists: false,
      error: toReadError(`Failed to read config file ${filePath}`, filePath, error),
    };
  }

  try {
    return { exists: true, value: parseConfigFile(content, filePath) };
  } catch (error) {
    const format = getConfigFileFormat(filePath);
    return {
      exists: false,
      error: toReadError(`Invalid ${format} in config file ${filePath}`, filePath, error),
    };
  }
};

/**
 * Reads a config file and recursively resolves its `extends` chain.
 *
 * The `extends` key is stripped from the returned value; the base config is deep-merged
 * first and the current file's own keys win. Circular references are detected via
 * `seen`.
 *
 * @param filePath The path of the config file.
 * @param seen The files that are already part of the chain, to detect circular
 *   references.
 * @returns The resolved value, or that the file doesn't exist. A base file that can't be
 *   read doesn't make the file fail: the error is logged and the file is used on its
 *   own.
 */
const readConfigResolvingExtends = async (
  filePath: string,
  seen = new Set<string>(),
): Promise<ReadConfigFileResult> => {
  if (seen.has(filePath)) {
    return {
      exists: false,
      error: toReadError(
        `Circular extends detected for config file ${filePath}`,
        filePath,
        undefined,
      ),
    };
  }

  const result = await readConfigIfExists(filePath);
  if (!result.exists) return result;

  const raw = result.value as Record<string, unknown>;
  const extendsValue = raw['extends'];
  if (typeof extendsValue !== 'string' || !extendsValue.trim()) {
    return result;
  }

  const nextSeen = new Set(seen);
  nextSeen.add(filePath);
  const extendsPath = resolvePiPath(extendsValue.trim(), dirname(filePath));
  const baseResult = await readConfigResolvingExtends(extendsPath, nextSeen);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- `extends` is stripped from the merged config; the value is intentionally discarded.
  const { extends: _, ...currentWithoutExtends } = raw;
  if (!baseResult.exists) {
    if (baseResult.error) logConfigReadError(baseResult.error);
    return { exists: true, value: currentWithoutExtends };
  }

  return {
    exists: true,
    value: merge({}, baseResult.value, currentWithoutExtends),
  };
};

/** The file extensions a config file can have. */
const CONFIG_EXTENSIONS = ['.json', '.yml', '.yaml'] as const;

/**
 * Expands the basename of a config file into all the supported file extensions.
 *
 * @param directory The directory where the file would be.
 * @param basename The name of the file, without the extension.
 * @param scope Whether the directory is global or from a project.
 * @param local Whether it's a `config.local` file.
 * @returns One candidate for each supported extension.
 */
const getConfigFileVariants = (
  directory: string,
  basename: string,
  scope: ConfigSource['scope'],
  local: boolean,
): ConfigSource[] =>
  CONFIG_EXTENSIONS.map((extension) => ({
    path: join(directory, `${basename}${extension}`),
    scope,
    local,
    exists: false,
    used: false,
  }));

/**
 * Gets the config file candidates, in merge order: global files first, then the project
 * ones, with the `config.local` files after their `config` counterparts.
 *
 * @param cwd The project directory.
 * @returns The candidates.
 */
const getConfigFilePaths = (cwd: string): ConfigSource[] => [
  ...getConfigFileVariants(AGENT_DIR, 'config', 'global', false),
  ...getConfigFileVariants(AGENT_DIR, 'config.local', 'global', true),
  ...getConfigFileVariants(join(cwd, CONFIG_DIR_NAME), 'config', 'project', false),
  ...getConfigFileVariants(join(cwd, CONFIG_DIR_NAME), 'config.local', 'project', true),
];

/**
 * Converts a query into a dot-path.
 *
 * @param query The query to convert. It has to be valid (see
 *   {@link validateConfigQuery}), which means that a `skill`, `tool`, or `extension`
 *   scope always has a name.
 * @returns The dot-path, or `undefined` if the query is for the whole config.
 */
const getConfigPath = (query: ConfigQuery): string | undefined => {
  if (query.path) return query.path;
  if (!query.scope || query.scope === 'all') return undefined;
  if (
    query.scope === 'pi' ||
    query.scope === 'skills' ||
    query.scope === 'tools' ||
    query.scope === 'extensions'
  )
    return query.scope;
  if (query.scope === 'skill') return `skills.${query.name}`;
  if (query.scope === 'tool') return `tools.${query.name}`;
  return `extensions.${query.name}`;
};

/**
 * Validates the combinations a model-facing config query can have.
 *
 * Returns a human-readable phrase because callers surface validation failures as tool
 * result messages. There is no recovery branch needed beyond "show this to the
 * model/user", so an Error object or machine-code enum would add handling noise without
 * improving current behavior.
 *
 * @param query The query to validate.
 * @returns The description of the problem, or `undefined` if the query is valid.
 */
const validateConfigQuery = (query: ConfigQuery): string | undefined => {
  if (query.path && (query.scope || query.name))
    return 'Use either path or scope/name, not both.';

  if (
    (query.scope === 'skill' || query.scope === 'tool' || query.scope === 'extension') &&
    !query.name
  )
    return `scope '${query.scope}' requires name.`;

  if (
    query.name &&
    query.scope !== 'skill' &&
    query.scope !== 'tool' &&
    query.scope !== 'extension'
  )
    return 'name is only valid with skill, tool, or extension scope.';

  return undefined;
};

/**
 * Validates a resolved config value with a Zod schema provided by the caller.
 *
 * @template TValue The type of the value the schema produces.
 * @param value The value to validate.
 * @param schema The schema to validate and parse the value with.
 * @returns The value, as parsed by the schema.
 * @throws If the value doesn't match the schema; the error is a
 *   {@link ConfigValidationError}.
 */
const validateConfigValue = <TValue>(
  value: unknown,
  schema: ConfigSchema<TValue>,
): TValue => {
  const result = schema.safeParse(value);
  if (result.success) return result.data;

  throw new ConfigValidationError(
    'Config value failed schema validation.',
    result.error.issues,
  );
};

/**
 * Reads the global and the project config files, and merges them in order.
 *
 * @param cwd The project directory.
 * @returns The resolved config, without the session override, and the status of each file
 *   that was checked.
 */
const readConfigFiles = async (cwd = process.cwd()): Promise<ReadConfigResult> => {
  const sources = [];
  const configs: unknown[] = [];

  for (const source of getConfigFilePaths(cwd)) {
    const result = await readConfigResolvingExtends(source.path);
    if (!result.exists && result.error) logConfigReadError(result.error);
    sources.push({ ...source, exists: result.exists, used: result.exists });
    if (result.exists) configs.push(result.value);
  }

  return {
    config: merge<PiCoreConfig>(EMPTY_PI_CORE_CONFIG, ...configs),
    sources,
  };
};

/**
 * Deep-merges the session override (if there's one) on top of a config resolved from
 * files.
 *
 * @param config The config resolved from files.
 * @returns The config with the override applied, or the same config if there's no
 *   override.
 */
const applySessionConfigOverride = (config: PiCoreConfig): PiCoreConfig => {
  const override = getSessionConfigOverride();
  return typeof override === 'undefined'
    ? config
    : merge<PiCoreConfig>({}, config, override);
};

/**
 * Loads and returns the full resolved config: the files, merged in order, plus the
 * session override.
 *
 * @example <caption>The full config</caption>
 *   const config = await getConfig();
 *
 * @example <caption>The config of another project</caption>
 *   const config = await getConfig({ cwd: '/path/to/project' });
 *
 * @template TValue The type of the value the schema produces; by default, the config
 *   itself.
 * @param options The options to read the config.
 * @returns The config, or the value the schema produced from it.
 * @throws If a schema was provided and the config doesn't match; the error is a
 *   {@link ConfigValidationError}.
 */
const getConfig = async <TValue = PiCoreConfig>(
  options: GetConfigOptions<TValue> = {},
): Promise<TValue> => {
  const result = await readConfigFiles(options.cwd);
  const config = applySessionConfigOverride(result.config);
  return options.schema
    ? validateConfigValue(config, options.schema)
    : (config as TValue);
};

/**
 * Loads config and returns a single typed dot-path value.
 *
 * Use this from Node code when the caller already knows the exact config path it needs
 * and wants declaration-merging based return type inference.
 *
 * @example <caption>A single value</caption>
 *   const runChecks = await getConfigValue('skills.commit.runChecks');
 *
 * @example <caption>Validating the value with a schema</caption>
 *   const commit = await getConfigValue('skills.commit', {
 *     schema: z.object({ runChecks: z.boolean().optional() }),
 *   });
 *
 * @template TPath The dot-path of the value.
 * @template TValue The type of the value; by default, the one inferred from the path.
 * @param path The dot-path of the value, like `skills.commit.runChecks`.
 * @param options The options to read the config.
 * @returns The value, or `undefined` if the path doesn't exist.
 * @throws If a schema was provided and the value doesn't match; the error is a
 *   {@link ConfigValidationError}.
 */
const getConfigValue = async <
  TPath extends ConfigPath | string,
  TValue = ConfigPathValue<TPath>,
>(
  path: TPath,
  options: GetConfigOptions<TValue> = {},
): Promise<TValue | undefined> => {
  const config = await getConfig({ cwd: options.cwd });
  const value = get<ConfigPathValue<TPath>>(config, path);
  if (value === undefined) return undefined;
  return options.schema ? validateConfigValue(value, options.schema) : (value as TValue);
};

/**
 * Loads config and applies the model-facing query format used by the get_config tool.
 *
 * This is intentionally less type-specific than getConfigValue because tool calls use
 * runtime scope/name/path parameters and need structured status, source metadata, and
 * validation messages.
 *
 * @example <caption>The config of a skill</caption>
 *   const result = await queryConfig({ scope: 'skill', name: 'commit' });
 *   if (result.status === 'found') {
 *     console.log(result.value);
 *   }
 *
 * @param query The query to run.
 * @param options The options to read the config.
 * @returns The result of the query. A query that is not valid, or a path that doesn't
 *   exist, are reported in the `status`, they don't throw.
 */
const queryConfig = async (
  query: ConfigQuery,
  options: QueryConfigOptions = {},
): Promise<QueryConfigResult> => {
  const validationError = validateConfigQuery(query);
  if (validationError) {
    return {
      status: 'error',
      query,
      redacted: false,
      sources: [],
      message: validationError,
    };
  }

  const { config: fileConfig, sources } = await readConfigFiles(options.cwd);
  const config = applySessionConfigOverride(fileConfig);
  const path = getConfigPath(query);
  const value = path ? get(config, path) : config;

  if (value === undefined) {
    return {
      status: 'not_found',
      query,
      redacted: false,
      sources,
      message: `Config path not found: ${path}`,
    };
  }

  return {
    status: 'found',
    query,
    value,
    redacted: false,
    sources,
  };
};

export {
  clearSessionConfigOverride,
  EMPTY_PI_CORE_CONFIG,
  ensureErrorMessage,
  getAgentPath,
  getConfig,
  getConfigValue,
  getSessionConfigOverride,
  queryConfig,
  readConfigFiles,
  resolvePiPath,
  setSessionConfigOverride,
};
