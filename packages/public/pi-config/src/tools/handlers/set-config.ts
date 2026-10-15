import { set } from '@homer0/object-utils';
import {
  EMPTY_PI_CORE_CONFIG,
  getSessionConfigOverride,
  setSessionConfigOverride,
} from '../../fns.js';
import type { PiCoreConfig } from '../../types.js';
import type { SetConfigDetails, SetConfigParams } from '../set-config.js';

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
