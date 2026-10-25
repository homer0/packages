import { getConfigValue } from '@homer0/pi-config';
import { getCached } from '@homer0/pi-in-memory-cache';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
  type MockInstance,
} from 'vitest';
import { InfisicalSecretProvider } from './providers.js';
import { getSecret, getSecrets, resolveInterpolatedValue } from './secrets.js';
import type { NamedSecretProviderConfig, SecretsConfig } from './types.js';
import { readAuthKey, SecretNotFoundError, SecretsConfigError } from './utils.js';

vi.mock('@homer0/pi-config', () => ({ getConfigValue: vi.fn() }));
vi.mock('@homer0/pi-in-memory-cache', () => ({ getCached: vi.fn() }));
vi.mock('./providers.js', () => ({ InfisicalSecretProvider: vi.fn() }));
vi.mock('./utils.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./utils.js')>()),
  readAuthKey: vi.fn(),
}));

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

    it('is typed as a string when the secret is required, and as optional otherwise', () => {
      providers['a'] = fakeProvider('a', { TOKEN: 'from-a' });

      expectTypeOf(getSecret('TOKEN', { required: true })).toEqualTypeOf<
        Promise<string>
      >();
      expectTypeOf(getSecret('TOKEN')).toEqualTypeOf<Promise<string | undefined>>();
      expectTypeOf(getSecret('TOKEN', { required: false })).toEqualTypeOf<
        Promise<string | undefined>
      >();
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

  describe('resolveInterpolatedValue', () => {
    it('leaves a bare string unchanged, without touching the providers', async () => {
      await expect(
        resolveInterpolatedValue({ value: 'plain-value', context: 'ctx' }),
      ).resolves.toBe('plain-value');

      expect(getConfigValue).not.toHaveBeenCalled();
    });

    it('resolves an $env: variable that is set', async () => {
      vi.stubEnv('PI_SECRETS_INTERPOLATION_TEST_VAR', 'env-value');

      await expect(
        resolveInterpolatedValue({
          value: '$env:PI_SECRETS_INTERPOLATION_TEST_VAR',
          context: 'ctx',
        }),
      ).resolves.toBe('env-value');
    });

    it('fails with the given context when the $env: variable is not set', async () => {
      await expect(
        resolveInterpolatedValue({
          value: '$env:PI_SECRETS_INTERPOLATION_UNSET_VAR',
          context: 'MCP server "notion"',
        }),
      ).rejects.toThrow(
        'MCP server "notion" references unset environment variable "PI_SECRETS_INTERPOLATION_UNSET_VAR".',
      );
    });

    it('resolves a $secret: value from the providers, for the project it is given', async () => {
      providers['a'] = fakeProvider('a', { API_KEY: 'secret-value' });

      await expect(
        resolveInterpolatedValue({
          value: '$secret:API_KEY',
          cwd: '/cwd',
          context: 'ctx',
        }),
      ).resolves.toBe('secret-value');

      expect(getConfigValue).toHaveBeenCalledWith('extensions.secrets', {
        cwd: '/cwd',
        schema: expect.anything(),
      });
    });

    it('fails when a $secret: can not be resolved', async () => {
      await expect(
        resolveInterpolatedValue({ value: '$secret:API_KEY', context: 'ctx' }),
      ).rejects.toThrow(new SecretNotFoundError('API_KEY'));
    });

    describe('references inside a value', () => {
      it('keeps the text around a reference exactly as it is', async () => {
        providers['a'] = fakeProvider('a', { API_KEY: 'secret-value' });
        vi.stubEnv('PI_SECRETS_INTERPOLATION_TEST_VAR', 'env-value');

        await expect(
          resolveInterpolatedValue({ value: 'Bearer $secret:API_KEY', context: 'ctx' }),
        ).resolves.toBe('Bearer secret-value');
        await expect(
          resolveInterpolatedValue({
            value: 'before  $env:PI_SECRETS_INTERPOLATION_TEST_VAR   after',
            context: 'ctx',
          }),
        ).resolves.toBe('before  env-value   after');
      });

      it('keeps tabs and line breaks around a reference', async () => {
        vi.stubEnv('PI_SECRETS_INTERPOLATION_TEST_VAR', 'env-value');

        await expect(
          resolveInterpolatedValue({
            value: 'a\t$env:PI_SECRETS_INTERPOLATION_TEST_VAR\nb',
            context: 'ctx',
          }),
        ).resolves.toBe('a\tenv-value\nb');
      });

      it('resolves every reference, including the ones that are next to each other', async () => {
        providers['a'] = fakeProvider('a', { ONE: '1', TWO: '2' });
        vi.stubEnv('PI_SECRETS_INTERPOLATION_TEST_VAR', 'env-value');

        await expect(
          resolveInterpolatedValue({
            value: '$secret:ONE $secret:TWO $env:PI_SECRETS_INTERPOLATION_TEST_VAR',
            context: 'ctx',
          }),
        ).resolves.toBe('1 2 env-value');
      });

      it('replaces a reference that is repeated everywhere it appears', async () => {
        providers['a'] = fakeProvider('a', { ONE: '1' });

        await expect(
          resolveInterpolatedValue({
            value: '$secret:ONE and $secret:ONE',
            context: 'ctx',
          }),
        ).resolves.toBe('1 and 1');
      });

      it.each([
        ['$', 'pa$word'],
        ['$$', 'pa$$word'],
        ['$&', 'a$&b'],
        ['$`', 'a$`b'],
        ["$'", "a$'b"],
        ['$1', 'a$1b'],
      ])(
        'never reads a "%s" in what it resolves as a replacement pattern',
        async (_label, secret) => {
          providers['a'] = fakeProvider('a', { API_KEY: secret });

          await expect(
            resolveInterpolatedValue({
              value: 'Bearer $secret:API_KEY done',
              context: 'ctx',
            }),
          ).resolves.toBe(`Bearer ${secret} done`);
        },
      );

      it.each([
        ['a prefix in the middle of a word', 'x$env:PI_SECRETS_INTERPOLATION_TEST_VAR'],
        ['an assignment', 'KEY=$env:PI_SECRETS_INTERPOLATION_TEST_VAR'],
        ['a prefix with no name', 'cost: $env: and $secret: '],
        ['a dollar sign that is not a prefix', 'it costs $5 or $envelope'],
        ['a prefix of something else', '$other:NAME'],
      ])('does not take %s as a reference', async (_label, value) => {
        vi.stubEnv('PI_SECRETS_INTERPOLATION_TEST_VAR', 'env-value');

        await expect(resolveInterpolatedValue({ value, context: 'ctx' })).resolves.toBe(
          value,
        );

        expect(getConfigValue).not.toHaveBeenCalled();
      });

      it('keeps the punctuation that is stuck to a reference as part of its name', async () => {
        await expect(
          resolveInterpolatedValue({
            value: 'Bearer $env:PI_SECRETS_INTERPOLATION_UNSET_VAR,',
            context: 'ctx',
          }),
        ).rejects.toThrow(
          'references unset environment variable "PI_SECRETS_INTERPOLATION_UNSET_VAR,".',
        );
      });

      it('takes everything up to the next whitespace as the name, even another prefix', async () => {
        await expect(
          resolveInterpolatedValue({
            value: '$env:PI_SECRETS_ONE:$env:PI_SECRETS_TWO',
            context: 'ctx',
          }),
        ).rejects.toThrow(
          'unset environment variable "PI_SECRETS_ONE:$env:PI_SECRETS_TWO"',
        );
      });

      it('fails with the first reference that can not be resolved, in order', async () => {
        vi.stubEnv('PI_SECRETS_INTERPOLATION_TEST_VAR', 'env-value');

        await expect(
          resolveInterpolatedValue({
            value:
              '$env:PI_SECRETS_INTERPOLATION_TEST_VAR $env:PI_SECRETS_UNSET_ONE $env:PI_SECRETS_UNSET_TWO',
            context: 'ctx',
          }),
        ).rejects.toThrow('unset environment variable "PI_SECRETS_UNSET_ONE"');
      });

      it('fails with a secret that can not be resolved, even when it is in the middle of a text', async () => {
        await expect(
          resolveInterpolatedValue({
            value: 'Bearer $secret:API_KEY done',
            context: 'ctx',
          }),
        ).rejects.toThrow(new SecretNotFoundError('API_KEY'));
      });
    });

    describe('$auth: references', () => {
      beforeEach(() => {
        vi.mocked(readAuthKey).mockReset();
      });

      it('resolves the key of an entry of auth.json, describing what is resolved', async () => {
        vi.mocked(readAuthKey).mockResolvedValue('sk-the-key');

        await expect(
          resolveInterpolatedValue({
            value: '$auth:anthropic',
            context: 'MCP header "X"',
          }),
        ).resolves.toBe('sk-the-key');

        expect(readAuthKey).toHaveBeenCalledExactlyOnceWith({
          name: 'anthropic',
          context: 'MCP header "X"',
        });
        expect(getConfigValue).not.toHaveBeenCalled();
      });

      it('keeps the text around it, and mixes with the other references', async () => {
        vi.mocked(readAuthKey).mockResolvedValue('sk-the-key');
        providers['a'] = fakeProvider('a', { API_KEY: 'secret-value' });

        await expect(
          resolveInterpolatedValue({
            value: 'Bearer $auth:anthropic and $secret:API_KEY',
            context: 'ctx',
          }),
        ).resolves.toBe('Bearer sk-the-key and secret-value');
      });

      it('uses the key as it is, even if it looks like a reference', async () => {
        vi.stubEnv('PI_SECRETS_INTERPOLATION_TEST_VAR', 'env-value');
        vi.mocked(readAuthKey).mockResolvedValue(
          '$env:PI_SECRETS_INTERPOLATION_TEST_VAR',
        );

        await expect(
          resolveInterpolatedValue({ value: '$auth:anthropic', context: 'ctx' }),
        ).resolves.toBe('$env:PI_SECRETS_INTERPOLATION_TEST_VAR');
      });

      it('can be what a $config: path points to', async () => {
        vi.mocked(readAuthKey).mockResolvedValue('sk-the-key');
        vi.mocked(getConfigValue).mockImplementation((async (path: string) =>
          path === 'a.b' ? 'Bearer $auth:anthropic' : undefined) as never);

        await expect(
          resolveInterpolatedValue({ value: '$config:a.b', context: 'ctx' }),
        ).resolves.toBe('Bearer sk-the-key');
      });

      it('lets the error of the key through', async () => {
        vi.mocked(readAuthKey).mockRejectedValue(
          new Error(
            'ctx references auth entry "anthropic", but the file is not valid JSON.',
          ),
        );

        await expect(
          resolveInterpolatedValue({ value: 'x $auth:anthropic', context: 'ctx' }),
        ).rejects.toThrow('references auth entry "anthropic"');
      });

      it('does not take it as a reference in the middle of a word', async () => {
        await expect(
          resolveInterpolatedValue({ value: 'key=$auth:anthropic', context: 'ctx' }),
        ).resolves.toBe('key=$auth:anthropic');

        expect(readAuthKey).not.toHaveBeenCalled();
      });
    });

    describe('$config: references', () => {
      /** Makes the config have the secrets config, and the given values on their paths. */
      const mockConfigPaths = (values: Record<string, unknown>): void => {
        vi.mocked(getConfigValue).mockImplementation((async (path: string) =>
          path === 'extensions.secrets' ? createConfig() : values[path]) as never);
      };

      it('resolves a path that points to a secret', async () => {
        providers['a'] = fakeProvider('a', { someName: 'the-secret' });
        mockConfigPaths({ 'pi.custom.someKey': '$secret:someName' });

        await expect(
          resolveInterpolatedValue({
            value: '$config:pi.custom.someKey',
            context: 'ctx',
          }),
        ).resolves.toBe('the-secret');
      });

      it('resolves a path that points to an environment variable', async () => {
        vi.stubEnv('PI_SECRETS_INTERPOLATION_TEST_VAR', 'env-value');
        mockConfigPaths({ 'a.b': '$env:PI_SECRETS_INTERPOLATION_TEST_VAR' });

        await expect(
          resolveInterpolatedValue({ value: '$config:a.b', context: 'ctx' }),
        ).resolves.toBe('env-value');
      });

      it('returns the string of a path that has no references', async () => {
        mockConfigPaths({ 'a.b': 'plain text' });

        await expect(
          resolveInterpolatedValue({ value: '$config:a.b', context: 'ctx' }),
        ).resolves.toBe('plain text');
      });

      it('resolves the references that are inside what the path holds', async () => {
        providers['a'] = fakeProvider('a', { API_KEY: 'the-key' });
        mockConfigPaths({ 'auth.header': 'Bearer $secret:API_KEY (v1)' });

        await expect(
          resolveInterpolatedValue({
            value: 'Authorization: $config:auth.header',
            context: 'ctx',
          }),
        ).resolves.toBe('Authorization: Bearer the-key (v1)');
      });

      it('follows a path that points to another path', async () => {
        providers['a'] = fakeProvider('a', { someName: 'the-secret' });
        mockConfigPaths({
          first: '$config:second',
          second: '$config:third',
          third: '$secret:someName',
        });

        await expect(
          resolveInterpolatedValue({ value: '$config:first', context: 'ctx' }),
        ).resolves.toBe('the-secret');
      });

      it('reads the config of the project it is given', async () => {
        mockConfigPaths({ 'a.b': 'value' });

        await resolveInterpolatedValue({
          value: '$config:a.b',
          cwd: '/cwd',
          context: 'ctx',
        });

        expect(getConfigValue).toHaveBeenCalledWith('a.b', { cwd: '/cwd' });
      });

      it('resolves the same path many times without taking it as a cycle', async () => {
        mockConfigPaths({ shared: 'value', wrapper: '$config:shared $config:shared' });

        await expect(
          resolveInterpolatedValue({
            value: '$config:shared $config:wrapper',
            context: 'ctx',
          }),
        ).resolves.toBe('value value value');
      });

      it('resolves only what comes from the config, not a secret or a variable', async () => {
        providers['a'] = fakeProvider('a', {
          LITERAL: '$env:PI_SECRETS_INTERPOLATION_TEST_VAR',
        });
        vi.stubEnv('PI_SECRETS_INTERPOLATION_TEST_VAR', 'env-value');
        vi.stubEnv('PI_SECRETS_INTERPOLATION_LOOKALIKE', '$secret:LITERAL');
        mockConfigPaths({
          'a.b': '$secret:LITERAL',
          'c.d': '$env:PI_SECRETS_INTERPOLATION_LOOKALIKE',
        });

        await expect(
          resolveInterpolatedValue({ value: '$config:a.b', context: 'ctx' }),
        ).resolves.toBe('$env:PI_SECRETS_INTERPOLATION_TEST_VAR');
        await expect(
          resolveInterpolatedValue({ value: '$config:c.d', context: 'ctx' }),
        ).resolves.toBe('$secret:LITERAL');
      });

      it('does not take a path in the middle of a word as a reference', async () => {
        mockConfigPaths({ 'a.b': 'value' });

        await expect(
          resolveInterpolatedValue({ value: 'path=$config:a.b', context: 'ctx' }),
        ).resolves.toBe('path=$config:a.b');
      });

      it('fails with the context when the path is not set', async () => {
        mockConfigPaths({});

        await expect(
          resolveInterpolatedValue({ value: '$config:a.b', context: 'MCP header "X"' }),
        ).rejects.toThrow(
          new SecretsConfigError('MCP header "X" references unset config path "a.b".'),
        );
      });

      it.each([
        ['a number', 8080],
        ['a boolean', true],
        ['null', null],
        ['an object', { nested: 'value' }],
        ['a list', ['one', 'two']],
      ])('fails when the path holds %s', async (_label, value) => {
        mockConfigPaths({ 'a.b': value });

        await expect(
          resolveInterpolatedValue({ value: '$config:a.b', context: 'ctx' }),
        ).rejects.toThrow(
          new SecretsConfigError(
            'ctx references config path "a.b", which is not a string.',
          ),
        );
      });

      it('fails with the chain of paths when they go back to themselves', async () => {
        mockConfigPaths({ a: '$config:b', b: '$config:c', c: 'text $config:a' });

        await expect(
          resolveInterpolatedValue({ value: '$config:a', context: 'ctx' }),
        ).rejects.toThrow(
          new SecretsConfigError(
            'ctx has a circular config reference: a -> b -> c -> a.',
          ),
        );
      });

      it('fails when a path points to itself', async () => {
        mockConfigPaths({ a: '$config:a' });

        await expect(
          resolveInterpolatedValue({ value: '$config:a', context: 'ctx' }),
        ).rejects.toThrow(
          new SecretsConfigError('ctx has a circular config reference: a -> a.'),
        );
      });

      it('fails when what the path points to can not be resolved', async () => {
        mockConfigPaths({
          'a.b': '$secret:MISSING',
          'c.d': '$env:PI_SECRETS_INTERPOLATION_UNSET_VAR',
        });

        await expect(
          resolveInterpolatedValue({ value: '$config:a.b', context: 'ctx' }),
        ).rejects.toThrow(new SecretNotFoundError('MISSING'));
        await expect(
          resolveInterpolatedValue({ value: 'x $config:c.d', context: 'MCP header "X"' }),
        ).rejects.toThrow(
          'MCP header "X" references unset environment variable "PI_SECRETS_INTERPOLATION_UNSET_VAR".',
        );
      });
    });
  });
});
