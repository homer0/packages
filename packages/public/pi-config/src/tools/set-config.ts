import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { Text } from '@earendil-works/pi-tui';
import { z } from 'zod';
import { loadHandlers } from './load-handlers.js';

/** Model-facing schema for the set_config tool. */
const setConfigParamsSchema = z.object({
  path: z
    .string()
    .describe(
      'Dot-path to override for the rest of this session, for example extensions.notifyMe.priority.',
    ),
  value: z
    .unknown()
    .describe(
      'Value to set at path. Only this path changes; the rest of the config is unaffected.',
    ),
});

/** The JSON schema of the parameters of the tool, as Pi needs it to register it. */
const setConfigParams = z.toJSONSchema(setConfigParamsSchema);

/** The parameters the model sends to the `set_config` tool. */
export type SetConfigParams = z.infer<typeof setConfigParamsSchema>;

/** Structured result details for the set_config tool. */
export type SetConfigDetails = {
  /** Whether the override was applied, or the tool failed. */
  status: 'applied' | 'error';
  /** The path the tool tried to set. */
  path: string;
  /** The value that was set. It's only there when the `status` is `applied`. */
  value?: unknown;
  /** The explanation of what failed. It's only there when the `status` is `error`. */
  message?: string;
};

/** Tool definition for setting an in-memory session config override. */
export const setConfigTool: Parameters<ExtensionAPI['registerTool']>[0] = {
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
  parameters: setConfigParams,

  /**
   * Runs the tool: it lazy-loads the handler and delegates the work to it.
   *
   * @param _toolCallId The id of the tool call. It's not used.
   * @param rawParams The parameters the model sent.
   * @returns The result of the tool.
   */
  async execute(_toolCallId, rawParams) {
    const { handleSetConfig } = await loadHandlers();
    return handleSetConfig({ params: rawParams as SetConfigParams });
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
};
