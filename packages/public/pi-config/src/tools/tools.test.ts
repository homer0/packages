import type { Text } from '@earendil-works/pi-tui';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getConfigTool } from './get-config.js';
import { handleGetConfig } from './handlers/get-config.js';
import { handleSetConfig } from './handlers/set-config.js';
import { setConfigTool } from './set-config.js';

vi.mock('./handlers/get-config.js', () => ({ handleGetConfig: vi.fn() }));
vi.mock('./handlers/set-config.js', () => ({ handleSetConfig: vi.fn() }));

describe('config tool definitions', () => {
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
    vi.mocked(handleGetConfig).mockResolvedValue(result as never);

    const actual = await getConfigTool.execute(
      'id',
      { path: 'a.b' },
      signal,
      undefined,
      ctx as never,
    );

    expect(actual).toBe(result);
    expect(handleGetConfig).toHaveBeenCalledWith({
      params: { path: 'a.b' },
      signal,
      ctx,
    });
  });

  it('set_config lazy-loads its handler with the params', async () => {
    const result = { content: [], details: {} };
    vi.mocked(handleSetConfig).mockReturnValue(result as never);

    const actual = await setConfigTool.execute(
      'id',
      { path: 'a', value: 1 },
      undefined,
      undefined,
      {} as never,
    );

    expect(actual).toBe(result);
    expect(handleSetConfig).toHaveBeenCalledWith({ params: { path: 'a', value: 1 } });
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
