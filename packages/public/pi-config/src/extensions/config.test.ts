import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from '@earendil-works/pi-coding-agent';
import type { Text } from '@earendil-works/pi-tui';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import config from './config.js';

const handlers = vi.hoisted(() => ({
  handleGetConfig: vi.fn(),
  handleSetConfig: vi.fn(),
  handleConfig: vi.fn(),
  handleConfigReset: vi.fn(),
}));

vi.mock('../handlers.js', () => handlers);

type Command = { handler: (args: string, ctx: unknown) => Promise<void> };
type Tool = Parameters<ExtensionAPI['registerTool']>[0];

const createPi = (): {
  pi: ExtensionAPI;
  commands: Map<string, Command>;
  registerTool: ReturnType<typeof vi.fn<ExtensionAPI['registerTool']>>;
} => {
  const commands = new Map<string, Command>();
  const registerTool = vi.fn<ExtensionAPI['registerTool']>();
  const pi = {
    registerTool,
    registerCommand: vi.fn((name: string, command: Command) =>
      commands.set(name, command),
    ),
  } as unknown as ExtensionAPI;
  return { pi, commands, registerTool };
};

describe('config extension', () => {
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
    ['config', handlers.handleConfig],
    ['config-reset', handlers.handleConfigReset],
  ] as const)('delegates /%s to its handler', async (name, handler) => {
    const { pi, commands } = createPi();
    config(pi);
    const ctx = {} as ExtensionCommandContext;

    await commands.get(name)!.handler('', ctx);

    expect(handler).toHaveBeenCalledWith({ ctx });
  });
});

describe('config tool definitions', () => {
  const { pi: toolsPi, registerTool } = createPi();
  config(toolsPi);
  const [getConfigTool, setConfigTool] = registerTool.mock.calls.map(
    ([tool]) => tool,
  ) as [Tool, Tool];

  const createTheme = () => ({
    fg: vi.fn((_color: string, text: string) => text),
    bold: vi.fn((text: string) => text),
  });

  /** Renders a `Text` component to a plain string. */
  const toPlainText = (component: unknown): string =>
    (component as Text)
      .render(300)
      .map((line) => line.trimEnd())
      .join('\n');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('get_config lazy-loads its handler with the params, signal and ctx', async () => {
    const { signal } = new AbortController();
    const ctx = { cwd: '/cwd' };
    const result = { content: [], details: {} };
    handlers.handleGetConfig.mockResolvedValue(result as never);

    const actual = await getConfigTool.execute(
      'id',
      { path: 'a.b' },
      signal,
      undefined,
      ctx as never,
    );

    expect(actual).toBe(result);
    expect(handlers.handleGetConfig).toHaveBeenCalledWith({
      params: { path: 'a.b' },
      signal,
      ctx,
    });
  });

  it('set_config lazy-loads its handler with the params', async () => {
    const result = { content: [], details: {} };
    handlers.handleSetConfig.mockReturnValue(result as never);

    const actual = await setConfigTool.execute(
      'id',
      { path: 'a', value: 1 },
      undefined,
      undefined,
      {} as never,
    );

    expect(actual).toBe(result);
    expect(handlers.handleSetConfig).toHaveBeenCalledWith({
      params: { path: 'a', value: 1 },
    });
  });

  describe('get_config rendering', () => {
    it.each([
      [{ path: 'skills.commit.runChecks' }, 'skills.commit.runChecks', 'path lookup'],
      [{ scope: 'skill', name: 'commit' }, 'skill:commit', 'skill scope'],
      [{ scope: 'pi' }, 'pi', 'pi namespace'],
      [{}, 'all', 'full config'],
    ])('renders the call for %j', (args, label, details) => {
      const theme = createTheme();

      const component = getConfigTool.renderCall!(
        args as never,
        theme as never,
        {} as never,
      );

      expect(toPlainText(component)).toBe(`get_config ${label}\n  ${details}`);
      expect(theme.fg).toHaveBeenCalledWith('accent', label);
    });

    it.each([
      [0, '0 sources'],
      [1, '1 source'],
      [3, '3 sources'],
    ])('renders a found value that came from %i files', (count, sourceText) => {
      const theme = createTheme();
      const sources = Array.from({ length: count }, () => ({ used: true }));

      const component = getConfigTool.renderResult!(
        { details: { status: 'found', value: { a: 1 }, sources } } as never,
        { isPartial: false } as never,
        theme as never,
        {} as never,
      );

      expect(toPlainText(component)).toBe(`✓ ${sourceText} {   "a": 1 }`);
      expect(theme.fg).toHaveBeenCalledWith('success', '✓');
    });

    it('marks partial results', () => {
      const component = getConfigTool.renderResult!(
        { details: { status: 'found', value: 'x', sources: [] } } as never,
        { isPartial: true } as never,
        createTheme() as never,
        {} as never,
      );

      expect(toPlainText(component)).toMatch(/^…\s+✓ 0 sources x$/);
    });

    it.each([
      ['not_found', 'No value', 'warning', 'No value'],
      ['error', 'Broken', 'error', 'Broken'],
      ['error', undefined, 'error', 'Config lookup failed'],
    ])('renders a %s result', (status, message, color, text) => {
      const theme = createTheme();

      const component = getConfigTool.renderResult!(
        { details: { status, message } } as never,
        { isPartial: false } as never,
        theme as never,
        {} as never,
      );

      expect(toPlainText(component)).toBe(text);
      expect(theme.fg).toHaveBeenCalledWith(color, text);
    });
  });

  describe('set_config rendering', () => {
    it('renders the call with the path', () => {
      const component = setConfigTool.renderCall!(
        { path: 'extensions.mine.enabled', value: true } as never,
        createTheme() as never,
        {} as never,
      );

      expect(toPlainText(component)).toBe('set_config extensions.mine.enabled');
    });

    it('renders the call without a path yet', () => {
      const component = setConfigTool.renderCall!(
        {} as never,
        createTheme() as never,
        {} as never,
      );

      expect(toPlainText(component)).toBe('set_config');
    });

    it('renders an applied override', () => {
      const component = setConfigTool.renderResult!(
        { details: { status: 'applied', path: 'a.b', value: { x: 1 } } } as never,
        { isPartial: false } as never,
        createTheme() as never,
        {} as never,
      );

      expect(toPlainText(component)).toBe('✓ a.b = {"x":1}');
    });

    it('marks partial results', () => {
      const component = setConfigTool.renderResult!(
        { details: { status: 'applied', path: 'a', value: 1 } } as never,
        { isPartial: true } as never,
        createTheme() as never,
        {} as never,
      );

      expect(toPlainText(component)).toMatch(/^…\s+✓ a = 1$/);
    });

    it.each([
      [
        'an error with a message',
        { status: 'error', message: 'Could not set' },
        'Could not set',
      ],
      ['an error without a message', { status: 'error' }, 'set_config failed'],
      ['no details', undefined, 'set_config failed'],
    ])('renders %s', (_label, details, text) => {
      const theme = createTheme();

      const component = setConfigTool.renderResult!(
        { details } as never,
        { isPartial: false } as never,
        theme as never,
        {} as never,
      );

      expect(toPlainText(component)).toBe(text);
      expect(theme.fg).toHaveBeenCalledWith('error', text);
    });
  });
});

describe('handlers loading', () => {
  const createHandlers = () => ({
    handleGetConfig: vi.fn(),
    handleSetConfig: vi.fn(),
    handleConfig: vi.fn(),
    handleConfigReset: vi.fn(() => 'reset'),
  });

  /** Loads a fresh copy of the entry, so its shared import starts empty. */
  const loadFreshEntry = async (factory: () => Record<string, unknown>) => {
    vi.resetModules();
    vi.doMock('../handlers.js', factory);
    const { default: freshConfig } = await import('./config.js');
    const { pi, commands } = createPi();
    freshConfig(pi);
    return commands;
  };

  it('shares one import between overlapping calls', async () => {
    const factory = vi.fn(createHandlers);
    const commands = await loadFreshEntry(factory);

    await Promise.all([
      commands.get('config')!.handler('', {}),
      commands.get('config-reset')!.handler('', {}),
    ]);

    expect(factory).toHaveBeenCalledOnce();
  });

  it('reuses the module once it has loaded', async () => {
    const factory = vi.fn(createHandlers);
    const commands = await loadFreshEntry(factory);

    await commands.get('config')!.handler('', {});
    await commands.get('config-reset')!.handler('', {});

    expect(factory).toHaveBeenCalledOnce();
  });

  it('does not cache a failed load, so the next call retries', async () => {
    let shouldFail = true;
    const commands = await loadFreshEntry(() => {
      if (shouldFail) throw new Error('boom');
      return createHandlers();
    });

    await expect(
      Promise.all([
        commands.get('config')!.handler('', {}),
        commands.get('config-reset')!.handler('', {}),
      ]),
    ).rejects.toBeInstanceOf(Error);

    shouldFail = false;
    await expect(commands.get('config')!.handler('', {})).resolves.toBeUndefined();
  });
});
