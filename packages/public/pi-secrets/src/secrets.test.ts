import { getConfigValue } from '@homer0/pi-config';
import { getCached } from '@homer0/pi-in-memory-cache';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';
import { SecretNotFoundError, SecretsConfigError } from './errors.js';
import { InfisicalSecretProvider } from './providers.js';
import { getSecret, getSecrets } from './secrets.js';
import type { NamedSecretProviderConfig, SecretsConfig } from './types.js';

vi.mock('@homer0/pi-config', () => ({ getConfigValue: vi.fn() }));
vi.mock('@homer0/pi-in-memory-cache', () => ({ getCached: vi.fn() }));
vi.mock('./providers.js', () => ({ InfisicalSecretProvider: vi.fn() }));

describe('secrets', () => {
  type FakeProvider = {
    name: string;
    type: 'infisical';
    getSecret: ReturnType<typeof vi.fn>;
    getSecrets: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
  };

  let providers: Record<string, FakeProvider>;
  let warn: MockInstance<typeof console.warn>;

  /** Creates a fake provider that resolves the values it's given. */
  const fakeProvider = (
    name: string,
    values: Record<string, string> = {},
  ): FakeProvider => ({
    name,
    type: 'infisical',
    getSecret: vi.fn(async (secret: string) => values[secret]),
    getSecrets: vi.fn(async (names: string[]) =>
      Object.fromEntries(names.map((secret) => [secret, values[secret]])),
    ),
    close: vi.fn(async () => {}),
  });

  /** Creates the config, with the providers `a` and `b`, and `a` as the main one. */
  const createConfig = (
    overrides: Partial<SecretsConfig['providers']> = {},
  ): SecretsConfig => {
    const entry = { type: 'infisical', url: 'https://x.test', credentials: {} } as const;
    return {
      cacheTtl: 10_000,
      providers: {
        main: 'a',
        registry: {
          a: { ...entry, enabled: true },
          b: { ...entry, enabled: true },
        },
        ...overrides,
      },
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    providers = { a: fakeProvider('a'), b: fakeProvider('b') };
    vi.mocked(getConfigValue).mockResolvedValue(createConfig() as never);
    vi.mocked(getCached).mockImplementation(async ({ fetchFn }) => fetchFn());
    // eslint-disable-next-line prefer-arrow-callback, func-names -- `new InfisicalSecretProvider()` needs a constructable function, which an arrow is not.
    vi.mocked(InfisicalSecretProvider).mockImplementation(function (
      config: NamedSecretProviderConfig,
    ) {
      return providers[config.name] as never;
    });
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  describe('getSecret', () => {
    it('returns the value from the main provider, and closes it', async () => {
      providers['a'] = fakeProvider('a', { TOKEN: 'from-a' });

      await expect(getSecret('TOKEN')).resolves.toBe('from-a');

      expect(providers['a']!.close).toHaveBeenCalledOnce();
      expect(providers['b']!.getSecret).not.toHaveBeenCalled();
      expect(warn).not.toHaveBeenCalled();
    });

    it('reads the config of the project it is given, validated', async () => {
      await getSecret('TOKEN', { cwd: '/project' });

      expect(getConfigValue).toHaveBeenCalledWith('extensions.secrets', {
        cwd: '/project',
        schema: expect.anything(),
      });
    });

    it('caches the value per provider and secret, for the configured time', async () => {
      providers['a'] = fakeProvider('a', { TOKEN: 'from-a' });

      await getSecret('TOKEN');

      expect(getCached).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'pi-secrets:secret:infisical:a:TOKEN',
          ttl: 10_000,
        }),
      );
    });

    it('falls back to the next provider when the main one does not have it', async () => {
      providers['b'] = fakeProvider('b', { TOKEN: 'from-b' });

      await expect(getSecret('TOKEN')).resolves.toBe('from-b');

      expect(providers['a']!.close).toHaveBeenCalledOnce();
      expect(providers['b']!.close).toHaveBeenCalledOnce();
      expect(warn).not.toHaveBeenCalled();
    });

    it('reports a provider that fails, and goes on with the next one', async () => {
      const failure = new Error('network down');
      providers['a']!.getSecret.mockRejectedValue(failure);
      providers['b'] = fakeProvider('b', { TOKEN: 'from-b' });

      await expect(getSecret('TOKEN')).resolves.toBe('from-b');

      expect(warn).toHaveBeenCalledExactlyOnceWith(
        "[pi-secrets] Provider 'a' failed to resolve a secret.",
        failure,
      );
      expect(providers['a']!.close).toHaveBeenCalledOnce();
    });

    it('follows the fallback order, and never tries the main provider twice', async () => {
      const entry = {
        type: 'infisical',
        url: 'https://x.test',
        credentials: {},
      } as const;
      providers['c'] = fakeProvider('c', { TOKEN: 'from-c' });
      vi.mocked(getConfigValue).mockResolvedValue(
        createConfig({
          registry: {
            a: { ...entry, enabled: true },
            b: { ...entry, enabled: true },
            c: { ...entry, enabled: true },
          },
          fallbackOrder: ['c', 'a', 'b'],
        }) as never,
      );

      await expect(getSecret('TOKEN')).resolves.toBe('from-c');

      expect(providers['b']!.getSecret).not.toHaveBeenCalled();
      expect(vi.mocked(InfisicalSecretProvider)).toHaveBeenCalledTimes(2);
    });

    it('skips the fallback providers that are disabled or not in the registry', async () => {
      const entry = {
        type: 'infisical',
        url: 'https://x.test',
        credentials: {},
      } as const;
      vi.mocked(getConfigValue).mockResolvedValue(
        createConfig({
          registry: {
            a: { ...entry, enabled: true },
            b: { ...entry, enabled: false },
          },
          fallbackOrder: ['b', 'ghost'],
        }) as never,
      );

      await expect(getSecret('TOKEN')).resolves.toBeUndefined();

      expect(providers['b']!.getSecret).not.toHaveBeenCalled();
      expect(vi.mocked(InfisicalSecretProvider)).toHaveBeenCalledOnce();
    });

    it('warns and returns undefined when no provider has the secret', async () => {
      await expect(getSecret('TOKEN')).resolves.toBeUndefined();

      expect(warn).toHaveBeenCalledExactlyOnceWith(
        "[pi-secrets] Secret 'TOKEN' could not be resolved.",
      );
    });

    it('throws when the secret is required and no provider has it', async () => {
      await expect(getSecret('TOKEN', { required: true })).rejects.toThrow(
        new SecretNotFoundError('TOKEN'),
      );
    });

    it('returns undefined when there is no secrets config', async () => {
      vi.mocked(getConfigValue).mockResolvedValue(undefined);

      await expect(getSecret('TOKEN')).resolves.toBeUndefined();

      expect(InfisicalSecretProvider).not.toHaveBeenCalled();
    });

    it('throws when the main provider is not in the registry', async () => {
      vi.mocked(getConfigValue).mockResolvedValue(
        createConfig({ main: 'ghost' }) as never,
      );

      await expect(getSecret('TOKEN')).rejects.toThrow(
        new SecretsConfigError('Main secret provider not found: ghost'),
      );
    });

    it('throws when the main provider is disabled', async () => {
      const entry = {
        type: 'infisical',
        url: 'https://x.test',
        credentials: {},
      } as const;
      vi.mocked(getConfigValue).mockResolvedValue(
        createConfig({ registry: { a: { ...entry, enabled: false } } }) as never,
      );

      await expect(getSecret('TOKEN')).rejects.toThrow(
        new SecretsConfigError('Main secret provider is disabled: a'),
      );
    });

    it('throws when the type of the provider is not supported', async () => {
      const entry = { url: 'https://x.test', credentials: {}, enabled: true };
      vi.mocked(getConfigValue).mockResolvedValue(
        createConfig({ registry: { a: { ...entry, type: 'vault' } } } as never) as never,
      );

      await expect(getSecret('TOKEN')).rejects.toThrow(
        new SecretsConfigError('Unsupported secret provider type: vault'),
      );
    });
  });

  describe('getSecrets', () => {
    it('resolves every name from one bulk call to the provider', async () => {
      providers['a'] = fakeProvider('a', { ONE: '1', TWO: '2' });

      const values = await getSecrets(['ONE', 'TWO'] as const);

      expect(values).toEqual({ ONE: '1', TWO: '2' });
      expect(providers['a']!.getSecrets).toHaveBeenCalledExactlyOnceWith(['ONE', 'TWO']);
      expect(providers['a']!.close).toHaveBeenCalledOnce();
    });

    it('only asks the next provider for the names that are still pending', async () => {
      providers['a'] = fakeProvider('a', { ONE: '1' });
      providers['b'] = fakeProvider('b', { TWO: '2' });

      const values = await getSecrets(['ONE', 'TWO'] as const);

      expect(values).toEqual({ ONE: '1', TWO: '2' });
      expect(providers['b']!.getSecrets).toHaveBeenCalledExactlyOnceWith(['TWO']);
    });

    it('does not ask the next provider when everything is resolved', async () => {
      providers['a'] = fakeProvider('a', { ONE: '1' });

      await getSecrets(['ONE'] as const);

      expect(InfisicalSecretProvider).toHaveBeenCalledOnce();
    });

    it('caches each value under its own key', async () => {
      providers['a'] = fakeProvider('a', { ONE: '1', TWO: '2' });

      await getSecrets(['ONE', 'TWO'] as const);

      expect(vi.mocked(getCached).mock.calls.map(([options]) => options.key)).toEqual([
        'pi-secrets:secret:infisical:a:ONE',
        'pi-secrets:secret:infisical:a:TWO',
      ]);
    });

    it('reports a provider that fails, and leaves its names pending', async () => {
      const failure = new Error('network down');
      providers['a']!.getSecrets.mockRejectedValue(failure);
      providers['b'] = fakeProvider('b', { ONE: '1' });

      const values = await getSecrets(['ONE'] as const);

      expect(values).toEqual({ ONE: '1' });
      expect(warn).toHaveBeenCalledWith(
        "[pi-secrets] Provider 'a' failed to resolve a secret.",
        failure,
      );
    });

    it('warns about each name that could not be resolved', async () => {
      providers['a'] = fakeProvider('a', { ONE: '1' });

      const values = await getSecrets(['ONE', 'TWO', 'THREE'] as const);

      expect(values).toEqual({ ONE: '1', TWO: undefined, THREE: undefined });
      expect(warn).toHaveBeenCalledWith(
        "[pi-secrets] Secret 'TWO' could not be resolved.",
      );
      expect(warn).toHaveBeenCalledWith(
        "[pi-secrets] Secret 'THREE' could not be resolved.",
      );
    });

    it('throws for the first name that could not be resolved when they are required', async () => {
      providers['a'] = fakeProvider('a', { ONE: '1' });

      await expect(
        getSecrets(['ONE', 'TWO', 'THREE'] as const, { required: true }),
      ).rejects.toThrow(new SecretNotFoundError('TWO'));
    });

    it('returns every name as undefined when there is no secrets config', async () => {
      vi.mocked(getConfigValue).mockResolvedValue(undefined);

      await expect(getSecrets(['ONE', 'TWO'] as const)).resolves.toEqual({
        ONE: undefined,
        TWO: undefined,
      });
    });

    it('reads the config of the project it is given', async () => {
      await getSecrets(['ONE'] as const, { cwd: '/project' });

      expect(getConfigValue).toHaveBeenCalledWith('extensions.secrets', {
        cwd: '/project',
        schema: expect.anything(),
      });
    });
  });
});
