import type { ExtensionCommandContext } from '@earendil-works/pi-coding-agent';
import { set } from '@homer0/object-utils';
import { ConfigReadError } from './errors.js';
import { formatValue, getQueryLabel } from './format.js';
import type { GetConfigParams, SetConfigParams } from './schemas.js';
import type { ConfigQuery, PiCoreConfig, SetConfigDetails } from './types.js';
import {
  clearSessionConfigOverride,
  EMPTY_PI_CORE_CONFIG,
  getSessionConfigOverride,
  queryConfig,
  setSessionConfigOverride,
} from './utils.js';
import { showConfigWindow } from './window.js';

/** The text that replaces a value that looks like a secret. */
const REDACTED_VALUE = '[REDACTED]';
/** The pattern of the keys that look like they would contain secrets. */
const SENSITIVE_KEY_PATTERN =
  /(?:secret|password|passwd|token|apiKey|api[_-]?key|privateKey|private[_-]?key|accessKey|access[_-]?key|key$)/iu;

/**
 * Checks whether a config path segment is likely to contain secret material.
 *
 * @param key The segment of the path.
 * @returns Whether it looks like a secret.
 */
const isSensitiveKey = (key: string): boolean => SENSITIVE_KEY_PATTERN.test(key);

/**
 * Redacts model-facing config values while preserving raw access through the Node API.
 *
 * @param value The value to redact.
 * @param path The segments of the path the value is at. If any of them looks like a
 *   secret, the whole value is redacted.
 * @returns The value, and whether something was redacted.
 */
const redactValue = (
  value: unknown,
  path: string[],
): { value: unknown; redacted: boolean } => {
  if (path.some(isSensitiveKey)) return { value: REDACTED_VALUE, redacted: true };

  if (Array.isArray(value)) {
    let redacted = false;
    const items = value.map((item, index) => {
      const result = redactValue(item, path.concat(String(index)));
      redacted ||= result.redacted;
      return result.value;
    });
    return { value: items, redacted };
  }

  if (!value || typeof value !== 'object') return { value, redacted: false };

  let redacted = false;
  const entries = Object.entries(value).map(([key, childValue]) => {
    const result = redactValue(childValue, path.concat(key));
    redacted ||= result.redacted;
    return [key, result.value] as const;
  });

  return { value: Object.fromEntries(entries), redacted };
};

/**
 * Gets the segments of the query path, when the lookup targets a specific path.
 *
 * @param query The query of the lookup.
 * @returns The segments, or an empty list if the query doesn't have a path.
 */
const getQueryPathSegments = (query: ConfigQuery): string[] =>
  query.path ? query.path.split('.').filter(Boolean) : [];

/** Options for {@link handleGetConfig}. */
type HandleGetConfigOptions = {
  /** The parameters the model sent. */
  params: GetConfigParams;
  /** The signal to abort the lookup. */
  signal: AbortSignal | undefined;
  /** The context of the session, to know the project directory. */
  ctx: { cwd: string };
};

/**
 * Executes the `get_config` tool: reads, redacts and formats the requested config.
 *
 * @param options The parameters of the call and the context it was made in.
 * @returns The result of the tool, with the text for the model and the details for the
 *   TUI. Failures are reported in the result, they don't throw.
 */
export const handleGetConfig = async ({
  params,
  signal,
  ctx,
}: HandleGetConfigOptions) => {
  if (signal?.aborted) {
    return {
      content: [{ type: 'text' as const, text: 'Config lookup cancelled.' }],
      details: {
        status: 'error',
        query: params,
        redacted: false,
        sources: [],
        message: 'Config lookup cancelled.',
      },
    };
  }

  try {
    const result = await queryConfig(params, { cwd: ctx.cwd });
    const redacted =
      result.status === 'found'
        ? redactValue(result.value, getQueryPathSegments(params))
        : { value: result.value, redacted: false };
    const text =
      result.status === 'found'
        ? `Config value for ${getQueryLabel(params)}:\n${formatValue(redacted.value)}`
        : (result.message ?? result.status);

    return {
      content: [{ type: 'text' as const, text }],
      details: {
        ...result,
        value: redacted.value,
        redacted: redacted.redacted,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text' as const, text: message }],
      details: {
        status: 'error',
        query: params,
        redacted: false,
        sources: [],
        message,
        filePath: error instanceof ConfigReadError ? error.filePath : undefined,
      },
    };
  }
};

/** Options for {@link handleSetConfig}. */
type HandleSetConfigOptions = {
  /** The parameters the model sent. */
  params: SetConfigParams;
};

/**
 * Executes the `set_config` tool: applies an in-memory session config override.
 *
 * @param options The parameters of the call.
 * @returns The result of the tool, with the text for the model and the details for the
 *   TUI. Failures are reported in the result, they don't throw.
 */
export const handleSetConfig = ({ params }: HandleSetConfigOptions) => {
  const path = params.path.trim();

  if (!path) {
    const message = 'set_config requires a non-empty path.';
    return {
      content: [{ type: 'text' as const, text: message }],
      details: { status: 'error', path, message } satisfies SetConfigDetails,
    };
  }

  const current = structuredClone(getSessionConfigOverride() ?? EMPTY_PI_CORE_CONFIG);
  const updated = set<PiCoreConfig>({ target: current, path, value: params.value });

  if (typeof updated === 'undefined') {
    const message = `Could not set config path: ${path}`;
    return {
      content: [{ type: 'text' as const, text: message }],
      details: { status: 'error', path, message } satisfies SetConfigDetails,
    };
  }

  setSessionConfigOverride(updated);
  const text = `Session override set: ${path} = ${JSON.stringify(params.value)}`;
  return {
    content: [{ type: 'text' as const, text }],
    details: {
      status: 'applied',
      path,
      value: params.value,
    } satisfies SetConfigDetails,
  };
};

/** Options for {@link handleConfig}. */
type HandleConfigOptions = {
  /** The context of the command. */
  ctx: ExtensionCommandContext;
};

/**
 * Handles `/config`: opens the config window.
 *
 * @param options The context of the command.
 */
export const handleConfig = async ({ ctx }: HandleConfigOptions): Promise<void> => {
  await showConfigWindow(ctx);
};

/** Options for {@link handleConfigReset}. */
type HandleConfigResetOptions = {
  /** The context of the command. */
  ctx: ExtensionCommandContext;
};

/**
 * Handles `/config-reset`: clears the session config override, and tells the user if
 * there was one.
 *
 * @param options The context of the command.
 */
export const handleConfigReset = ({ ctx }: HandleConfigResetOptions): void => {
  const hadOverride = clearSessionConfigOverride();
  ctx.ui.notify(
    hadOverride ? 'Session config override cleared.' : 'No session override was set.',
    'info',
  );
};
