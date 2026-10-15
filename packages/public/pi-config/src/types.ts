/* eslint-disable max-classes-per-file -- Config error types live together with the config public types. */
import type { z } from 'zod';

/** The fallback object shape for the config namespaces, before consumers augment them. */
export type ConfigNamespace = Record<string, unknown>;

/**
 * The settings that affect Pi itself (`pi`). Consumers extend it through module
 * augmentation.
 *
 * @example <caption>Typing a Pi setting</caption>
 *   declare module '@homer0/pi-config' {
 *     interface PiConfig {
 *       dummySetting?: boolean;
 *     }
 *   }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- It's empty on purpose: consumers fill it through module augmentation.
export interface PiConfig {}

/**
 * The settings of the skills (`skills.<name>`). Consumers extend it through module
 * augmentation.
 *
 * @example <caption>Typing a skill config</caption>
 *   declare module '@homer0/pi-config' {
 *     interface SkillsConfig {
 *       commit?: { runChecks?: boolean };
 *     }
 *   }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- It's empty on purpose: consumers fill it through module augmentation.
export interface SkillsConfig {}

/**
 * The settings of the tools (`tools.<name>`). Consumers extend it through module
 * augmentation.
 *
 * @example <caption>Typing a tool config</caption>
 *   declare module '@homer0/pi-config' {
 *     interface ToolsConfig {
 *       bash?: { timeout?: number };
 *     }
 *   }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- It's empty on purpose: consumers fill it through module augmentation.
export interface ToolsConfig {}

/**
 * The settings of the extensions (`extensions.<name>`). Consumers extend it through
 * module augmentation.
 *
 * @example <caption>Typing an extension config</caption>
 *   declare module '@homer0/pi-config' {
 *     interface ExtensionsConfig {
 *       myExtension?: { enabled?: boolean };
 *     }
 *   }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- It's empty on purpose: consumers fill it through module augmentation.
export interface ExtensionsConfig {}

/**
 * The fully resolved config. Each namespace can be extended through module augmentation
 * of its interface: {@link PiConfig}, {@link SkillsConfig}, {@link ToolsConfig}, and
 * {@link ExtensionsConfig}.
 */
export interface PiCoreConfig {
  /** The settings that affect Pi itself. */
  pi: PiConfig;
  /** The settings of the skills, by skill name. */
  skills: SkillsConfig;
  /** The settings of the tools, by tool name. */
  tools: ToolsConfig;
  /** The settings of the extensions, by extension name. */
  extensions: ExtensionsConfig;
}

/**
 * Extracts the string keys of a type, to generate dot-paths.
 *
 * @template TValue The type to get the keys from.
 */
type StringKey<TValue> = Extract<keyof TValue, string>;

/**
 * Builds the valid dot-path strings for a nested object type.
 *
 * @template TValue The object type to build the paths for.
 */
type DotPathFor<TValue> = TValue extends object
  ? {
      [TKey in StringKey<TValue>]: TValue[TKey] extends object
        ? TKey | `${TKey}.${DotPathFor<TValue[TKey]>}`
        : TKey;
    }[StringKey<TValue>]
  : never;

/** The typed config dot-paths, inferred from the declaration-merged config shape. */
export type ConfigPath = DotPathFor<PiCoreConfig>;

/**
 * Resolves the type of the value at a dot-path, against the declaration-merged config
 * shape. If the path can't be resolved, the type is `unknown`.
 *
 * @template TPath The dot-path to resolve, like `skills.commit.runChecks`.
 * @template TValue The type to resolve the path against.
 */
export type ConfigPathValue<
  TPath extends string,
  TValue = PiCoreConfig,
> = TPath extends `${infer THead}.${infer TRest}`
  ? THead extends keyof TValue
    ? ConfigPathValue<TRest, TValue[THead]>
    : unknown
  : TPath extends keyof TValue
    ? TValue[TPath]
    : unknown;

/** The information about one config file candidate in the resolution chain. */
export type ConfigSource = {
  /** The path of the config file. */
  path: string;
  /** Whether the file was found, and it could be read and parsed. */
  exists: boolean;
  /** Whether the file was used to build the resolved config. */
  used: boolean;
  /** Whether the file is in the global agent directory or in the project. */
  scope: 'global' | 'project';
  /** Whether it's a `config.local` file, meant for overrides that shouldn't be committed. */
  local: boolean;
};

/**
 * The runtime schema accepted by the Node API config readers.
 *
 * @template TValue The type of the value the schema produces.
 */
export type ConfigSchema<TValue> = z.ZodType<TValue>;

/**
 * The options shared by the Node API config readers that can validate with a schema.
 *
 * @template TValue The type of the value the schema produces.
 */
export type GetConfigOptions<TValue = PiCoreConfig> = {
  /**
   * The project directory, the one that has the `.pi` folder with the project config.
   *
   * @default process.cwd()
   */
  cwd?: string;
  /**
   * A Zod schema to validate and parse the resolved value. If the value exists and
   * doesn't match, the reader throws a {@link ConfigValidationError}.
   */
  schema?: ConfigSchema<TValue>;
};

/** The options for the model-facing config queries. */
export type QueryConfigOptions = {
  /**
   * The project directory, the one that has the `.pi` folder with the project config.
   *
   * @default process.cwd()
   */
  cwd?: string;
};

/** The result of loading the full resolved config, with the metadata of its sources. */
export type ReadConfigResult = {
  /** The resolved config: the files merged in order, without the session override. */
  config: PiCoreConfig;
  /** The config file candidates, in merge order, and what happened with each. */
  sources: ConfigSource[];
};

/**
 * The scopes a model-facing config query supports: `all` for everything; a whole
 * namespace (`pi`, `skills`, `tools`, `extensions`); or a single integration (`skill`,
 * `tool`, `extension`), which also needs a name.
 */
export type ConfigQueryScope =
  | 'all'
  | 'pi'
  | 'skills'
  | 'tools'
  | 'extensions'
  | 'skill'
  | 'tool'
  | 'extension';

/** The runtime query shape the `get_config` tool uses. */
export type ConfigQuery = {
  /**
   * A dot-path to read, like `skills.commit.runChecks`. It can't be used together with
   * `scope` or `name`.
   */
  path?: string;
  /** What to read. */
  scope?: ConfigQueryScope;
  /**
   * The name of the skill, tool, or extension. It's required by the `skill`, `tool`, and
   * `extension` scopes, and it's not valid with any other.
   */
  name?: string;
};

/** The structured result of a runtime config query. */
export type QueryConfigResult = {
  /**
   * `found` when there's a value, `not_found` when the path doesn't exist, and `error`
   * when the query is not valid.
   */
  status: 'found' | 'not_found' | 'error';
  /** The query that generated the result. */
  query: ConfigQuery;
  /** The value that was found. It's only there when the `status` is `found`. */
  value?: unknown;
  /**
   * Whether secret-looking values were redacted from the `value`. `queryConfig` never
   * redacts, so it's always `false`; the `get_config` tool is the one that redacts.
   */
  redacted: boolean;
  /** The config file candidates that were checked. It's empty if the query is not valid. */
  sources: ConfigSource[];
  /** A human-readable explanation, for the `not_found` and `error` statuses. */
  message?: string;
};

/** The error for the config files that couldn't be read or parsed. */
export class ConfigReadError extends Error {
  /**
   * @param message The description of what failed.
   * @param filePath The path of the config file that failed.
   * @param options The error options, to preserve the original `cause`.
   */
  constructor(
    message: string,
    /** The path of the config file that failed. */
    public readonly filePath: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'ConfigReadError';
  }
}

/** The error thrown when the resolved config doesn't match the schema that was provided. */
export class ConfigValidationError extends Error {
  /**
   * @param message The description of what failed.
   * @param issues The Zod issues that explain why the value didn't match the schema.
   */
  constructor(
    message: string,
    /** The Zod issues that explain why the value didn't match the schema. */
    public readonly issues: z.core.$ZodIssue[],
  ) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}
