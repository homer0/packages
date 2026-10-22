import type { ExtensionCommandContext } from '@earendil-works/pi-coding-agent';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigReadError } from './errors.js';

const {
  queryConfig,
  getSessionConfigOverride,
  setSessionConfigOverride,
  clearSessionConfigOverride,
  showConfigWindow,
} = vi.hoisted(() => ({
  queryConfig: vi.fn(),
  getSessionConfigOverride: vi.fn(),
  setSessionConfigOverride: vi.fn(),
  clearSessionConfigOverride: vi.fn(),
  showConfigWindow: vi.fn(),
}));

vi.mock('./utils.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./utils.js')>()),
  queryConfig,
  getSessionConfigOverride,
  setSessionConfigOverride,
  clearSessionConfigOverride,
  EMPTY_PI_CORE_CONFIG: {},
}));
vi.mock('./window.js', () => ({ showConfigWindow }));

vi.mock('@homer0/object-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@homer0/object-utils')>();
  return { ...actual, set: vi.fn(actual.set) };
});

const { set } = await import('@homer0/object-utils');
const { handleConfig, handleConfigReset, handleGetConfig, handleSetConfig } =
  await import('./handlers.js');

describe('handleGetConfig', () => {
  const ctx = { cwd: '/cwd' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a cancelled result when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    const result = await handleGetConfig({ params: {}, signal: controller.signal, ctx });

    expect(result.content[0]!.text).toBe('Config lookup cancelled.');
    expect(queryConfig).not.toHaveBeenCalled();
  });

  it('returns the found value', async () => {
    queryConfig.mockResolvedValue({
      status: 'found',
      value: { enabled: true },
      sources: [],
    });

    const result = await handleGetConfig({
      params: { path: 'extensions.x' },
      signal: undefined,
      ctx,
    });

    expect(queryConfig).toHaveBeenCalledWith({ path: 'extensions.x' }, { cwd: '/cwd' });
    expect(result.content[0]!.text).toContain('Config value for extensions.x');
    expect(result.details).toMatchObject({ redacted: false });
  });

  it('redacts values under sensitive keys', async () => {
    queryConfig.mockResolvedValue({
      status: 'found',
      value: { apiKey: 'secret-1', name: 'ok' },
      sources: [],
    });

    const result = await handleGetConfig({ params: {}, signal: undefined, ctx });

    expect(result.content[0]!.text).not.toContain('secret-1');
    expect(result.content[0]!.text).toContain('[REDACTED]');
    expect(result.content[0]!.text).toContain('ok');
    expect(result.details).toMatchObject({ redacted: true });
  });

  it('does not redact anything when no value looks like a secret', async () => {
    queryConfig.mockResolvedValue({
      status: 'found',
      value: { name: 'ok', enabled: false, count: 0, empty: null },
      sources: [],
    });

    const result = await handleGetConfig({ params: {}, signal: undefined, ctx });

    expect(result.details).toMatchObject({ redacted: false });
    expect(result.content[0]!.text).toContain('"count": 0');
    expect(result.content[0]!.text).toContain('"empty": null');
  });

  it('redacts secrets nested in objects and arrays', async () => {
    queryConfig.mockResolvedValue({
      status: 'found',
      value: {
        providers: [{ name: 'a', token: 'secret-token' }, 'plain', 5],
        nested: { deep: { password: 'secret-password' } },
        list: ['one', 'two'],
      },
      sources: [],
    });

    const result = await handleGetConfig({ params: {}, signal: undefined, ctx });

    const { text } = result.content[0]!;
    expect(text).not.toContain('secret-token');
    expect(text).not.toContain('secret-password');
    expect(text).toContain('plain');
    expect(text).toContain('"one"');
    expect(result.details).toMatchObject({
      redacted: true,
      value: {
        providers: [{ name: 'a', token: '[REDACTED]' }, 'plain', 5],
        nested: { deep: { password: '[REDACTED]' } },
        list: ['one', 'two'],
      },
    });
  });

  it('redacts the whole value when the queried path looks like a secret', async () => {
    queryConfig.mockResolvedValue({
      status: 'found',
      value: { anything: 'secret-value' },
      sources: [],
    });

    const result = await handleGetConfig({
      params: { path: 'extensions.mine.apiKey' },
      signal: undefined,
      ctx,
    });

    expect(result.content[0]!.text).toContain('[REDACTED]');
    expect(result.content[0]!.text).not.toContain('secret-value');
    expect(result.details).toMatchObject({ redacted: true, value: '[REDACTED]' });
  });

  it.each([
    'secret',
    'password',
    'passwd',
    'token',
    'privateKey',
    'access_key',
    'name_key',
  ])('treats `%s` as a sensitive key', async (key) => {
    queryConfig.mockResolvedValue({
      status: 'found',
      value: { [key]: 'hidden' },
      sources: [],
    });

    const result = await handleGetConfig({ params: {}, signal: undefined, ctx });

    expect(result.details).toMatchObject({ redacted: true });
  });

  it('returns the status when nothing was found and there is no message', async () => {
    queryConfig.mockResolvedValue({ status: 'not_found', sources: [] });

    const result = await handleGetConfig({ params: {}, signal: undefined, ctx });

    expect(result.content[0]!.text).toBe('not_found');
  });

  it('returns the status message when nothing was found', async () => {
    queryConfig.mockResolvedValue({
      status: 'not_found',
      message: 'No value',
      sources: [],
    });

    const result = await handleGetConfig({ params: {}, signal: undefined, ctx });

    expect(result.content[0]!.text).toBe('No value');
  });

  it('reports an error that is not a read error, without a file path', async () => {
    queryConfig.mockRejectedValue(new Error('unexpected'));

    const result = await handleGetConfig({ params: {}, signal: undefined, ctx });

    expect(result.content[0]!.text).toBe('unexpected');
    expect(result.details).toMatchObject({ status: 'error', filePath: undefined });
  });

  it('reports a failure that is not an error object', async () => {
    queryConfig.mockRejectedValue('plain failure');

    const result = await handleGetConfig({ params: {}, signal: undefined, ctx });

    expect(result.content[0]!.text).toBe('plain failure');
  });

  it('reports a read error with its file path', async () => {
    queryConfig.mockRejectedValue(new ConfigReadError('bad file', '/x/config.json'));

    const result = await handleGetConfig({ params: {}, signal: undefined, ctx });

    expect(result.content[0]!.text).toBe('bad file');
    expect(result.details).toMatchObject({ status: 'error', filePath: '/x/config.json' });
  });
});

describe('handleSetConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionConfigOverride.mockReturnValue(undefined);
  });

  it('rejects an empty path', () => {
    const result = handleSetConfig({
      params: { path: '  ', value: 1 },
      onOverrideChange: vi.fn(),
    });

    expect(result.details.status).toBe('error');
    expect(setSessionConfigOverride).not.toHaveBeenCalled();
  });

  it('reports a path that could not be set', () => {
    vi.mocked(set).mockReturnValueOnce(undefined as never);

    const result = handleSetConfig({
      params: { path: 'extensions.x', value: 1 },
      onOverrideChange: vi.fn(),
    });

    expect(result.details).toEqual({
      status: 'error',
      path: 'extensions.x',
      message: 'Could not set config path: extensions.x',
    });
    expect(result.content[0]!.text).toBe('Could not set config path: extensions.x');
    expect(setSessionConfigOverride).not.toHaveBeenCalled();
  });

  it('applies the override at the path', () => {
    const onOverrideChange = vi.fn();

    const result = handleSetConfig({
      params: { path: 'extensions.x.y', value: 2 },
      onOverrideChange,
    });

    expect(setSessionConfigOverride).toHaveBeenCalledWith(
      { extensions: { x: { y: 2 } } },
      onOverrideChange,
    );
    expect(result.details).toMatchObject({ status: 'applied', path: 'extensions.x.y' });
    expect(result.content[0]!.text).toBe('Session override set: extensions.x.y = 2');
  });

  it('keeps an existing override when adding another path', () => {
    getSessionConfigOverride.mockReturnValue({ extensions: { x: { a: 1 } } });

    const onOverrideChange = vi.fn();

    handleSetConfig({
      params: { path: 'extensions.x.b', value: 2 },
      onOverrideChange,
    });

    expect(setSessionConfigOverride).toHaveBeenCalledWith(
      { extensions: { x: { a: 1, b: 2 } } },
      onOverrideChange,
    );
  });
});

describe('config commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('/config opens the config window', async () => {
    const ctx = {} as unknown as ExtensionCommandContext;

    const onOverrideChange = vi.fn();

    await handleConfig({ ctx, onOverrideChange });

    expect(showConfigWindow).toHaveBeenCalledWith(ctx, onOverrideChange);
  });

  it.each([
    [true, 'Session config override cleared.'],
    [false, 'No session override was set.'],
  ])('/config-reset notifies the outcome (had override: %s)', (had, message) => {
    clearSessionConfigOverride.mockReturnValue(had);
    const notify = vi.fn();
    const onOverrideChange = vi.fn();

    handleConfigReset({
      ctx: { ui: { notify } } as unknown as ExtensionCommandContext,
      onOverrideChange,
    });

    expect(notify).toHaveBeenCalledWith(message, 'info');
    expect(clearSessionConfigOverride).toHaveBeenCalledWith(onOverrideChange);
  });
});
