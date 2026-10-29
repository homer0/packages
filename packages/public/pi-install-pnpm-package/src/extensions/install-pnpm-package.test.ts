import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from '@earendil-works/pi-coding-agent';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleInstallPiPnpmPackage, handleUninstallPiPnpmPackage } from '../handlers.js';
import piInstallPnpmPackage from './install-pnpm-package.js';

vi.mock('../handlers.js', () => ({
  handleInstallPiPnpmPackage: vi.fn(),
  handleUninstallPiPnpmPackage: vi.fn(),
}));

type Command = { handler: (args: string, ctx: unknown) => Promise<void> };

describe('pi-install-pnpm-package extension', () => {
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

  it('registers the install and uninstall commands', () => {
    const { pi, commands } = createPi();

    piInstallPnpmPackage(pi);

    expect([...commands.keys()].toSorted()).toEqual([
      'install-pi-pnpm-package',
      'uninstall-pi-pnpm-package',
    ]);
  });

  it.each([
    ['install-pi-pnpm-package', handleInstallPiPnpmPackage],
    ['uninstall-pi-pnpm-package', handleUninstallPiPnpmPackage],
  ] as const)(
    'delegates /%s to its handler with the args and ctx',
    async (name, handler) => {
      const { pi, commands } = createPi();
      piInstallPnpmPackage(pi);
      const ctx = {} as ExtensionCommandContext;

      await commands.get(name)!.handler('some-package', ctx);

      expect(handler).toHaveBeenCalledWith({ args: 'some-package', ctx });
    },
  );

  it('loads the handlers once for calls that overlap', async () => {
    const { pi, commands } = createPi();
    piInstallPnpmPackage(pi);
    const ctx = {} as ExtensionCommandContext;

    await Promise.all([
      commands.get('install-pi-pnpm-package')!.handler('a', ctx),
      commands.get('uninstall-pi-pnpm-package')!.handler('b', ctx),
    ]);

    expect(handleInstallPiPnpmPackage).toHaveBeenCalledWith({ args: 'a', ctx });
    expect(handleUninstallPiPnpmPackage).toHaveBeenCalledWith({ args: 'b', ctx });
  });

  it('does not cache a failed load, so the next call retries', async () => {
    vi.resetModules();
    vi.doMock('../handlers.js', () => {
      throw new Error('load failed');
    });
    const { default: freshExtension } = await import('./install-pnpm-package.js');
    const { pi, commands } = createPi();
    freshExtension(pi);
    const ctx = {} as ExtensionCommandContext;

    await expect(
      commands.get('install-pi-pnpm-package')!.handler('a', ctx),
    ).rejects.toThrow('error when mocking a module');

    vi.doMock('../handlers.js', () => ({
      handleInstallPiPnpmPackage: vi.fn(),
      handleUninstallPiPnpmPackage: vi.fn(),
    }));
    await commands.get('install-pi-pnpm-package')!.handler('a', ctx);

    const handlers = await import('../handlers.js');
    expect(handlers.handleInstallPiPnpmPackage).toHaveBeenCalledWith({ args: 'a', ctx });
    vi.doUnmock('../handlers.js');
  });
});
