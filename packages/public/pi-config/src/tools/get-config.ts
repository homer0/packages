import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { Text } from '@earendil-works/pi-tui';
import { z } from 'zod';
import { formatValuePreview, getQueryLabel, getUsedSourceCount } from '../format.js';
import type { ConfigQuery } from '../types.js';
import { loadHandlers } from './load-handlers.js';

/** Model-facing schema for the get_config tool. */
const getConfigParamsSchema = z.object({
  path: z
    .string()
    .optional()
    .describe('Dot-path to read, for example skills.commit.runChecks.'),
  scope: z
    .enum(['all', 'pi', 'skills', 'tools', 'extensions', 'skill', 'tool', 'extension'])
    .optional()
    .describe(
      'Config scope to read. Use pi for general Pi settings, or skill/tool/extension with name.',
    ),
  name: z
    .string()
    .optional()
    .describe('Name for skill, tool, or extension scoped lookups.'),
});

/** The JSON schema of the parameters of the tool, as Pi needs it to register it. */
const getConfigParams = z.toJSONSchema(getConfigParamsSchema);

/** The parameters the model sends to the `get_config` tool. */
export type GetConfigParams = z.infer<typeof getConfigParamsSchema>;

/** Tool definition for reading resolved Pi Core config. */
export const getConfigTool: Parameters<ExtensionAPI['registerTool']>[0] = {
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
  parameters: getConfigParams,

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
