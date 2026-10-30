import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from '@earendil-works/pi-coding-agent';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleSessionAssessment } from '../handlers.js';
import piAssessment from './pi-assessment.js';

vi.mock('../handlers.js', () => ({ handleSessionAssessment: vi.fn() }));

type Command = { handler: (args: string, ctx: unknown) => Promise<void> };

describe('pi-assessment extension', () => {
  const createPi = (): { pi: ExtensionAPI; commands: Map<string, Command> } => {
    const commands = new Map<string, Command>();
    const pi = {
      registerCommand: vi.fn((name: string, command: Command) =>
        commands.set(name, command),
      ),
    } as unknown as ExtensionAPI;
    return { pi, commands };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers /session-assessment', () => {
    const { pi, commands } = createPi();

    piAssessment(pi);

    expect([...commands.keys()]).toEqual(['session-assessment']);
  });

  it('delegates /session-assessment to its handler', async () => {
    const { pi, commands } = createPi();
    piAssessment(pi);
    const ctx = {} as ExtensionCommandContext;

    await commands.get('session-assessment')!.handler('', ctx);

    expect(handleSessionAssessment).toHaveBeenCalledWith({ ctx, pi });
  });

  it('does not cache a failed load, so the next call retries', async () => {
    vi.resetModules();
    vi.doMock('../handlers.js', () => {
      throw new Error('load failed');
    });
    const { default: freshExtension } = await import('./pi-assessment.js');
    const { pi, commands } = createPi();
    freshExtension(pi);
    const ctx = {} as ExtensionCommandContext;

    await expect(commands.get('session-assessment')!.handler('', ctx)).rejects.toThrow(
      'error when mocking a module',
    );

    vi.doMock('../handlers.js', () => ({ handleSessionAssessment: vi.fn() }));
    await commands.get('session-assessment')!.handler('', ctx);

    const handlers = await import('../handlers.js');
    expect(handlers.handleSessionAssessment).toHaveBeenCalledWith({ ctx, pi });
    vi.doUnmock('../handlers.js');
  });
});
