import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { Text } from '@earendil-works/pi-tui';
import { z } from 'zod';
import { SESSION_OVERRIDE_CHANGED_CHANNEL, type OnOverrideChange } from '../events.js';
import {
  formatValuePreview,
  getConfigParamsSchema,
  getQueryLabel,
  getUsedSourceCount,
  setConfigParamsSchema,
  type GetConfigParams,
  type SetConfigParams,
} from '../tools.js';
import type { ConfigQuery, SetConfigDetails } from '../types.js';

/** Module shape of the lazily loaded handlers. */
type HandlersModule = typeof import('../handlers.js');

/** The promise of the handlers module, shared by every call once it's been requested. */
let handlersModule: Promise<HandlersModule> | undefined;

/**
 * Lazy-loads all the handlers through a single shared `import()`. Tools can be called in
 * parallel by the model, and jiti evaluates lazily loaded modules asynchronously, handing
 * partial exports to any `import()` of a module (or of a dependency shared by several
 * handlers) that is still evaluating. Loading everything through one memoized promise
 * makes overlapping calls wait for the same evaluation. A failed load is not cached, so
 * the next call retries.
 *
 * @returns The module with all the handlers.
 */
const loadHandlers = (): Promise<HandlersModule> => {
  handlersModule ??= import('../handlers.js').catch((error: unknown) => {
    handlersModule = undefined;
    throw error;
  });
  return handlersModule;
};

/** The definition of a tool, as `registerTool` receives it. */
type ToolDefinition = Parameters<ExtensionAPI['registerTool']>[0];

/** Tool definition for reading resolved Pi Core config. */
const getConfigTool: ToolDefinition = {
  name: 'get_config',
  label: 'Get Config',
  description:
    'Read resolved Pi Core config from config.json and config.local.json for local extensions, tools, and skills that explicitly use this convention.',
  promptSnippet:
    'Use get_config only when a tool, skill, or extension explicitly calls for Pi Core config.',
  promptGuidelines: [
    'Call get_config only when a tool, skill, or extension explicitly calls for Pi Core config.',
    'Do not infer or guess config support from package names or behavior.',
    'Prefer the narrowest lookup: path first, then pi or named skill/tool/extension, then namespace, and full config only when necessary.',
    "Use scope: 'pi' for general Pi/session/agent settings, for example { scope: 'pi' }.",
    "Use scope: 'skill' with name for local skill preferences, for example { scope: 'skill', name: 'commit' }.",
    "Use scope: 'tool' with name for local tool defaults, for example { scope: 'tool', name: 'bash' }.",
    "Use scope: 'extension' with name for local extension settings, for example { scope: 'extension', name: 'config' }.",
    'Do not expose config values to the user unless necessary for the answer or requested by the user.',
    'Treat missing config as absence of preference, not as an error.',
    'Ask the user before relying on unclear or conflicting config.',
  ],
  parameters: z.toJSONSchema(getConfigParamsSchema),

  /**
   * Runs the tool: it lazy-loads the handler and delegates the work to it.
   *
   * @param _toolCallId The id of the tool call. It's not used.
   * @param rawParams The parameters the model sent.
   * @param signal The signal to abort the lookup.
   * @param _onUpdate The callback for partial results. It's not used.
   * @param ctx The context of the session, to know the project directory.
   * @returns The result of the tool.
   */
  async execute(_toolCallId, rawParams, signal, _onUpdate, ctx) {
    const { handleGetConfig } = await loadHandlers();
    return handleGetConfig({ params: rawParams as GetConfigParams, signal, ctx });
  },

  /**
   * Renders the call of the tool in the TUI.
   *
   * @param args The parameters of the call.
   * @param theme The theme to color the text with.
   * @returns The text to show: the label of the query and what kind of lookup it is.
   */
  renderCall(args, theme) {
    const query = args as ConfigQuery;
    const label = getQueryLabel(query);
    let details = 'full config';
    if (query.path) details = 'path lookup';
    else if (query.scope && query.name) details = `${query.scope} scope`;
    else if (query.scope) details = `${query.scope} namespace`;
    return new Text(
      `${theme.fg('toolTitle', theme.bold('get_config '))}${theme.fg(
        'accent',
        label,
      )}\n${theme.fg('dim', `  ${details}`)}`,
      0,
      0,
    );
  },

  /**
   * Renders the result of the tool in the TUI.
   *
   * @param result The result of the tool.
   * @param options The render options, to know if the result is partial.
   * @param theme The theme to color the text with.
   * @returns The text to show: a preview of the value and how many files it came from, or
   *   the reason why there's no value.
   */
  renderResult(result, options, theme) {
    const details = result.details as {
      status?: string;
      value?: unknown;
      message?: string;
      sources?: unknown;
    };
    const prefix = options.isPartial ? `${theme.fg('muted', '… ')} ` : '';
    if (details.status === 'found') {
      const usedSourceCount = getUsedSourceCount(details.sources);
      const sourceText =
        usedSourceCount === 1 ? '1 source' : `${usedSourceCount} sources`;
      return new Text(
        `${prefix}${theme.fg('success', '✓')} ${theme.fg(
          'muted',
          sourceText,
        )} ${formatValuePreview(details.value)}`,
        0,
        0,
      );
    }
    return new Text(
      `${prefix}${theme.fg(
        details.status === 'not_found' ? 'warning' : 'error',
        details.message ?? 'Config lookup failed',
      )}`,
      0,
      0,
    );
  },
};

/**
 * Creates the definition of the tool that sets an in-memory session config override.
 *
 * @param onOverrideChange Called after the tool changes the override.
 * @returns The tool definition.
 */
const createSetConfigTool = (onOverrideChange: OnOverrideChange): ToolDefinition => ({
  name: 'set_config',
  label: 'Set Config',
  description:
    'Override one Pi Core config value for the rest of this session. In-memory only: never written to config.json/config.local.json/config.yaml/config.local.yaml, and lost when the session ends.',
  promptSnippet:
    'Only call set_config when the user explicitly asks to override a config value for this session.',
  promptGuidelines: [
    'Only call set_config when the user explicitly asks to override a specific config value for this session.',
    'Never call set_config speculatively, to work around an error, or to "fix" a config problem the user did not ask you to change.',
    'set_config only affects this session/process and is never persisted to any config file.',
    'set_config can only set a value; it cannot remove a file-based value or restore file-only behavior for one path. Tell the user to use /config to clear the whole session override.',
  ],
  parameters: z.toJSONSchema(setConfigParamsSchema),

  /**
   * Runs the tool: it lazy-loads the handler and delegates the work to it.
   *
   * @param _toolCallId The id of the tool call. It's not used.
   * @param rawParams The parameters the model sent.
   * @returns The result of the tool.
   */
  async execute(_toolCallId, rawParams) {
    const { handleSetConfig } = await loadHandlers();
    return handleSetConfig({ params: rawParams as SetConfigParams, onOverrideChange });
  },

  /**
   * Renders the call of the tool in the TUI.
   *
   * @param args The parameters of the call.
   * @param theme The theme to color the text with.
   * @returns The text to show: the path that is being set.
   */
  renderCall(args, theme) {
    const params = args as Partial<SetConfigParams>;
    return new Text(
      `${theme.fg('toolTitle', theme.bold('set_config '))}${theme.fg('accent', params.path ?? '')}`,
      0,
      0,
    );
  },

  /**
   * Renders the result of the tool in the TUI.
   *
   * @param result The result of the tool.
   * @param options The render options, to know if the result is partial.
   * @param theme The theme to color the text with.
   * @returns The text to show: the path and the value that were set, or the reason why it
   *   failed.
   */
  renderResult(result, options, theme) {
    const details = result.details as SetConfigDetails | undefined;
    const prefix = options.isPartial ? `${theme.fg('muted', '… ')} ` : '';
    if (!details || details.status !== 'applied') {
      return new Text(
        `${prefix}${theme.fg('error', details?.message ?? 'set_config failed')}`,
        0,
        0,
      );
    }
    return new Text(
      `${prefix}${theme.fg('success', '✓ ')}${theme.fg('accent', details.path)} = ${JSON.stringify(details.value)}`,
      0,
      0,
    );
  },
});

/**
 * Registers config extension tools and the `/config`/`/config-reset` commands with Pi.
 * The definitions are light; the tools' `execute` and the commands lazy-load their
 * implementation, through the shared handlers loader. Whenever the session override
 * changes, it's announced on `pi.events`.
 *
 * @param pi The Pi extension API.
 */
const config = (pi: ExtensionAPI): void => {
  const onOverrideChange: OnOverrideChange = (change) => {
    pi.events.emit(SESSION_OVERRIDE_CHANGED_CHANNEL, change);
  };

  pi.registerTool(getConfigTool);
  pi.registerTool(createSetConfigTool(onOverrideChange));

  pi.registerCommand('config', {
    description: 'View the effective Pi Core config and edit the session override',
    handler: async (_args, ctx) => {
      const { handleConfig } = await loadHandlers();
      await handleConfig({ ctx, onOverrideChange });
    },
  });

  pi.registerCommand('config-reset', {
    description: 'Clear the session config override',
    handler: async (_args, ctx) => {
      const { handleConfigReset } = await loadHandlers();
      handleConfigReset({ ctx, onOverrideChange });
    },
  });
};

export default config;
