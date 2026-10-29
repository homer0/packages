import {
  AuthExpiredError,
  createClient,
  DesktopAuth,
  DesktopSessionExpiredError,
  RateLimitExceededError,
} from '@1password/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import type { SecretsConfig } from '../../types.js';
import { OnePasswordSecretProvider } from './provider.js';

vi.mock('@1password/sdk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@1password/sdk')>()),
  createClient: vi.fn(),
}));

describe('OnePasswordSecretProvider', () => {
  const secretsConfig: SecretsConfig = {
    cacheTtl: 10_000,
    providers: { main: 'main', registry: {} },
  };
  let counter = 0;
  let resolveAll: ReturnType<typeof vi.fn>;

  /** A token that no other test uses, as the clients are shared by the credentials. */
  const nextToken = (): string => {
    counter += 1;
    return `token-${counter}`;
  };

  /** Creates a provider, with a token of its own unless it's given other credentials. */
  const createProvider = (
    options: { name?: string; credentials?: Record<string, unknown> } = {},
  ): OnePasswordSecretProvider =>
    new OnePasswordSecretProvider(
      {
        name: options.name ?? 'op-main',
        type: '1password',
        enabled: true,
        credentials: options.credentials ?? { serviceAccountToken: nextToken() },
      },
      secretsConfig,
    );

  /** The response of 1Password for a reference that it has. */
  const found = (secret: string) => ({
    content: { secret, itemId: 'item', vaultId: 'vault' },
  });

  /** The response of 1Password for a reference that it failed to resolve. */
  const failed = (type: string) => ({ error: { type } });

  /** Makes 1Password answer the references with the given responses. */
  const mockResponses = (individualResponses: Record<string, unknown>): void => {
    resolveAll.mockResolvedValue({ individualResponses });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resolveAll = vi.fn();
    vi.mocked(createClient).mockResolvedValue({ secrets: { resolveAll } } as never);
  });

  describe('constructor', () => {
    it('is named and typed as 1Password', () => {
      const provider = createProvider({ name: 'my-provider' });

      expect(provider.name).toBe('my-provider');
      expect(provider.type).toBe('1password');
      expect(provider.secretsConfig).toBe(secretsConfig);
    });

    it.each([
      ['a service account token', { serviceAccountToken: 'token' }],
      ['an account name', { accountName: 'my.1password.com' }],
    ])('accepts %s', (_label, credentials) => {
      expect(() => createProvider({ credentials })).not.toThrow();
    });

    it.each([
      ['both', { serviceAccountToken: 'token', accountName: 'account' }],
      ['neither', {}],
      ['an empty token', { serviceAccountToken: '' }],
      ['an empty account name', { accountName: '' }],
      ['both, empty', { serviceAccountToken: '', accountName: '' }],
      ['a token that is not a string', { serviceAccountToken: 1 }],
      ['a token and something else', { serviceAccountToken: 'token', other: true }],
    ])('rejects %s', (_label, credentials) => {
      expect(() => createProvider({ credentials })).toThrow(ZodError);
    });

    it('does not put the token in the error', () => {
      const credentials = { serviceAccountToken: 'ops_super-secret', accountName: 'a' };

      expect(() => createProvider({ credentials })).toThrow(
        'The credentials need a serviceAccountToken or an accountName',
      );
      expect(() => createProvider({ credentials })).not.toThrow('ops_super-secret');
    });

    it('does not create the client until it needs it', () => {
      createProvider();

      expect(createClient).not.toHaveBeenCalled();
    });
  });

  describe('getSecret and getSecrets', () => {
    it('returns the value of a reference, asking for it once', async () => {
      mockResponses({ 'op://vault/item/field': found('the-value') });

      await expect(createProvider().getSecret('op://vault/item/field')).resolves.toBe(
        'the-value',
      );

      expect(resolveAll).toHaveBeenCalledExactlyOnceWith(['op://vault/item/field']);
    });

    it('resolves many references with one request, undefined for the ones 1Password does not have', async () => {
      mockResponses({
        'op://vault/one/field': found('first'),
        'op://vault/missing/field': failed('itemNotFound'),
        'op://vault/two/field': found('second'),
      });

      await expect(
        createProvider().getSecrets([
          'op://vault/one/field',
          'op://vault/missing/field',
          'op://vault/two/field',
        ]),
      ).resolves.toEqual({
        'op://vault/one/field': 'first',
        'op://vault/missing/field': undefined,
        'op://vault/two/field': 'second',
      });

      expect(resolveAll).toHaveBeenCalledOnce();
    });

    it.each(['vaultNotFound', 'itemNotFound', 'fieldNotFound', 'noMatchingSections'])(
      'returns undefined when the error is %s',
      async (type) => {
        mockResponses({ 'op://vault/item/field': failed(type) });

        await expect(
          createProvider().getSecret('op://vault/item/field'),
        ).resolves.toBeUndefined();
      },
    );

    it.each([
      'parsing',
      'tooManyVaults',
      'tooManyItems',
      'tooManyMatchingFields',
      'unableToGenerateTotpCode',
      'other',
    ])('fails when the error is %s', async (type) => {
      mockResponses({ 'op://vault/item/field': failed(type) });

      await expect(createProvider().getSecret('op://vault/item/field')).rejects.toThrow(
        `1Password could not resolve 'op://vault/item/field': ${type}.`,
      );
    });

    it('fails for the whole call when one reference has an error that is not a not found', async () => {
      mockResponses({
        'op://vault/one/field': found('first'),
        'op://vault/two/field': failed('tooManyItems'),
      });

      await expect(
        createProvider().getSecrets(['op://vault/one/field', 'op://vault/two/field']),
      ).rejects.toThrow('tooManyItems');
    });

    it('does not put a value in the error', async () => {
      mockResponses({
        'op://vault/one/field': found('super-secret-value'),
        'op://vault/two/field': failed('tooManyItems'),
      });

      const failure = createProvider().getSecrets([
        'op://vault/one/field',
        'op://vault/two/field',
      ]);

      await expect(failure).rejects.not.toThrow('super-secret-value');
    });

    it('passes the reference as it is, with spaces and a query', async () => {
      const reference = 'op://Private/My Item/one-time password?attribute=otp';
      mockResponses({ [reference]: found('123456') });

      await expect(createProvider().getSecret(reference)).resolves.toBe('123456');

      expect(resolveAll).toHaveBeenCalledExactlyOnceWith([reference]);
    });

    it('returns undefined, without a request, for a name that is not a reference', async () => {
      const provider = createProvider();

      await expect(provider.getSecret('API_KEY')).resolves.toBeUndefined();
      await expect(provider.getSecret('op:/vault/item/field')).resolves.toBeUndefined();
      await expect(provider.getSecret('op://')).resolves.toBeUndefined();
      await expect(provider.getSecret('')).resolves.toBeUndefined();

      expect(createClient).not.toHaveBeenCalled();
      expect(resolveAll).not.toHaveBeenCalled();
    });

    it('only asks for the names that are references, and asks once for each', async () => {
      mockResponses({ 'op://vault/item/field': found('value') });

      await expect(
        createProvider().getSecrets([
          'API_KEY',
          'op://vault/item/field',
          'op://vault/item/field',
        ]),
      ).resolves.toEqual({ API_KEY: undefined, 'op://vault/item/field': 'value' });

      expect(resolveAll).toHaveBeenCalledExactlyOnceWith(['op://vault/item/field']);
    });

    it('returns undefined for a reference that 1Password did not answer', async () => {
      mockResponses({});

      await expect(
        createProvider().getSecret('op://vault/item/field'),
      ).resolves.toBeUndefined();
    });

    it('does not ask for anything when there are no names', async () => {
      await expect(createProvider().getSecrets([])).resolves.toEqual({});

      expect(createClient).not.toHaveBeenCalled();
    });

    it('lets the errors of the request through', async () => {
      const failure = new RateLimitExceededError('Too many requests');
      resolveAll.mockRejectedValue(failure);

      await expect(createProvider().getSecret('op://vault/item/field')).rejects.toBe(
        failure,
      );
    });
  });

  describe('client', () => {
    beforeEach(() => {
      mockResponses({ 'op://vault/item/field': found('value') });
    });

    it('logs in with the service account token, and says who is using the SDK', async () => {
      const serviceAccountToken = nextToken();

      await createProvider({ credentials: { serviceAccountToken } }).getSecret(
        'op://vault/item/field',
      );

      expect(createClient).toHaveBeenCalledExactlyOnceWith({
        auth: serviceAccountToken,
        integrationName: 'pi-secrets',
        integrationVersion: expect.stringMatching(/^\d+\.\d+\.\d+/u),
      });
    });

    it('logs in with the desktop app, for an account name', async () => {
      await createProvider({ credentials: { accountName: 'desktop-1' } }).getSecret(
        'op://vault/item/field',
      );

      const [config] = vi.mocked(createClient).mock.calls[0]!;
      expect(config.auth).toBeInstanceOf(DesktopAuth);
      expect(config.auth).toEqual(new DesktopAuth('desktop-1'));
    });

    it('is shared by the providers with the same credentials, and by every call', async () => {
      const credentials = { serviceAccountToken: nextToken() };

      await createProvider({ credentials }).getSecret('op://vault/item/field');
      await createProvider({ credentials, name: 'other' }).getSecrets([
        'op://vault/item/field',
      ]);
      await createProvider({ credentials }).getSecret('op://vault/item/field');

      expect(createClient).toHaveBeenCalledOnce();
    });

    it('is shared with another copy of the module, like the one of another extension', async () => {
      const credentials = { serviceAccountToken: nextToken() };
      await createProvider({ credentials }).getSecret('op://vault/item/field');

      vi.resetModules();
      const copy = await import('./provider.js');
      const copyProvider = new copy.OnePasswordSecretProvider(
        { name: 'op-copy', type: '1password', enabled: true, credentials },
        secretsConfig,
      );
      await copyProvider.getSecret('op://vault/item/field');

      expect(copy.OnePasswordSecretProvider).not.toBe(OnePasswordSecretProvider);
      expect(createClient).toHaveBeenCalledOnce();
    });

    it('is shared by the calls that are made while it is being created', async () => {
      const credentials = { serviceAccountToken: nextToken() };

      await Promise.all([
        createProvider({ credentials }).getSecret('op://vault/item/field'),
        createProvider({ credentials }).getSecret('op://vault/item/field'),
      ]);

      expect(createClient).toHaveBeenCalledOnce();
    });

    it('is shared by the providers of the same desktop account', async () => {
      const credentials = { accountName: 'desktop-shared' };

      await createProvider({ credentials }).getSecret('op://vault/item/field');
      await createProvider({ credentials }).getSecret('op://vault/item/field');

      expect(createClient).toHaveBeenCalledOnce();
    });

    it('is not shared by different credentials', async () => {
      const first = nextToken();
      const second = nextToken();

      await createProvider({ credentials: { serviceAccountToken: first } }).getSecret(
        'op://vault/item/field',
      );
      await createProvider({ credentials: { serviceAccountToken: second } }).getSecret(
        'op://vault/item/field',
      );
      await createProvider({ credentials: { accountName: 'desktop-other' } }).getSecret(
        'op://vault/item/field',
      );

      expect(createClient).toHaveBeenCalledTimes(3);
      expect(createClient).toHaveBeenCalledWith(expect.objectContaining({ auth: first }));
      expect(createClient).toHaveBeenCalledWith(
        expect.objectContaining({ auth: second }),
      );
    });

    it('is not kept when it could not be created', async () => {
      const credentials = { serviceAccountToken: nextToken() };
      const failure = new Error('login failed');
      vi.mocked(createClient).mockRejectedValueOnce(failure);

      await expect(
        createProvider({ credentials }).getSecret('op://vault/item/field'),
      ).rejects.toBe(failure);
      await expect(
        createProvider({ credentials }).getSecret('op://vault/item/field'),
      ).resolves.toBe('value');

      expect(createClient).toHaveBeenCalledTimes(2);
    });

    it.each([
      ['AuthExpiredError', new AuthExpiredError('The session is over')],
      ['DesktopSessionExpiredError', new DesktopSessionExpiredError('Approve again')],
    ])(
      'is forgotten after a %s, so the next call creates a new one',
      async (_label, failure) => {
        const credentials = { serviceAccountToken: nextToken() };
        resolveAll.mockRejectedValueOnce(failure);

        await expect(
          createProvider({ credentials }).getSecret('op://vault/item/field'),
        ).rejects.toBe(failure);
        await expect(
          createProvider({ credentials }).getSecret('op://vault/item/field'),
        ).resolves.toBe('value');

        expect(createClient).toHaveBeenCalledTimes(2);
      },
    );

    it('is kept after a rate limit error', async () => {
      const credentials = { serviceAccountToken: nextToken() };
      resolveAll.mockRejectedValueOnce(new RateLimitExceededError('Too many requests'));

      await expect(
        createProvider({ credentials }).getSecret('op://vault/item/field'),
      ).rejects.toThrow('Too many requests');
      await expect(
        createProvider({ credentials }).getSecret('op://vault/item/field'),
      ).resolves.toBe('value');

      expect(createClient).toHaveBeenCalledOnce();
    });
  });

  describe('close', () => {
    it('does nothing, and the client is still used afterwards', async () => {
      const credentials = { serviceAccountToken: nextToken() };
      mockResponses({ 'op://vault/item/field': found('value') });
      const provider = createProvider({ credentials });
      await provider.getSecret('op://vault/item/field');

      await expect(provider.close()).resolves.toBeUndefined();
      await createProvider({ credentials }).getSecret('op://vault/item/field');

      expect(createClient).toHaveBeenCalledOnce();
    });
  });
});
