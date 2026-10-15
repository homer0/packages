import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from '@earendil-works/pi-coding-agent';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleConfigReset } from '../commands/config-reset.js';
import { handleConfig } from '../commands/config.js';
import config from './config.js';

vi.mock('../commands/config.js', () => ({ handleConfig: vi.fn() }));
vi.mock('../commands/config-reset.js', () => ({ handleConfigReset: vi.fn() }));

type Command = { handler: (args: string, ctx: unknown) => Promise<void> };

describe('config extension', () => {
  const createPi = (): {
    pi: ExtensionAPI;
    commands: Map<string, Command>;
    registerTool: ReturnType<typeof vi.fn>;
  } => {
    const commands = new Map<string, Command>();
    const registerTool = vi.fn();
    const pi = {
      registerTool,
      registerCommand: vi.fn((name: string, command: Command) =>
        commands.set(name, command),
      ),
    } as unknown as ExtensionAPI;
    return { pi, commands, registerTool };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers the get_config and set_config tools and both commands', () => {
    const { pi, commands, registerTool } = createPi();

    config(pi);

    expect(registerTool.mock.calls.map(([tool]) => tool.name)).toEqual([
      'get_config',
      'set_config',
    ]);
    expect([...commands.keys()].toSorted()).toEqual(['config', 'config-reset']);
  });

  it.each([
    ['config', handleConfig],
    ['config-reset', handleConfigReset],
  ] as const)('delegates /%s to its handler', async (name, handler) => {
    const { pi, commands } = createPi();
    config(pi);
    const ctx = {} as ExtensionCommandContext;

    await commands.get(name)!.handler('', ctx);

    expect(handler).toHaveBeenCalledWith({ ctx });
  });
});
