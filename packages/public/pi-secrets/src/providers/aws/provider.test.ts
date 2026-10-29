import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import type { SecretsConfig } from '../../types.js';
import { AwsSecretProvider } from './provider.js';

vi.mock('@aws-sdk/client-secrets-manager', () => ({
  GetSecretValueCommand: vi.fn(),
  SecretsManagerClient: vi.fn(),
}));

describe('AwsSecretProvider', () => {
  const secretsConfig: SecretsConfig = {
    cacheTtl: 10_000,
    providers: { main: 'main', registry: {} },
  };
  const credentials = { region: 'us-east-1', profile: 'work' };
  let send: ReturnType<typeof vi.fn>;
  let destroy: ReturnType<typeof vi.fn>;

  /** Creates a provider, with the given credentials instead of the valid ones. */
  const createProvider = (
    options: { name?: string; credentials?: Record<string, unknown> } = {},
  ): AwsSecretProvider =>
    new AwsSecretProvider(
      {
        name: options.name ?? 'aws-main',
        type: 'aws',
        enabled: true,
        credentials: options.credentials ?? credentials,
      },
      secretsConfig,
    );

  /** Makes the client answer with the text of each secret, or "not found" for the rest. */
  const mockSecrets = (secrets: Record<string, string>): void => {
    send.mockImplementation(async (command: { input: { SecretId: string } }) => {
      const secretString = secrets[command.input.SecretId];
      if (typeof secretString === 'undefined') {
        throw Object.assign(new Error('Secrets Manager can not find the secret.'), {
          name: 'ResourceNotFoundException',
        });
      }

      return { SecretString: secretString };
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    send = vi.fn();
    destroy = vi.fn();
    // eslint-disable-next-line prefer-arrow-callback, func-names -- `new SecretsManagerClient()` needs a constructable function, which an arrow is not.
    vi.mocked(SecretsManagerClient).mockImplementation(function () {
      return { send, destroy } as never;
    });
    // eslint-disable-next-line prefer-arrow-callback, func-names -- `new GetSecretValueCommand()` needs a constructable function, which an arrow is not.
    vi.mocked(GetSecretValueCommand).mockImplementation(function (input: unknown) {
      return { input } as never;
    });
  });

  describe('constructor', () => {
    it('is named and typed as AWS', () => {
      const provider = createProvider({ name: 'my-provider' });

      expect(provider.name).toBe('my-provider');
      expect(provider.type).toBe('aws');
      expect(provider.secretsConfig).toBe(secretsConfig);
    });

    it.each([
      ['no credentials', {}],
      ['no region', { profile: 'work' }],
      ['an empty region', { region: '' }],
      ['an empty profile', { region: 'us-east-1', profile: '' }],
      ['a region that is not a string', { region: 1 }],
    ])('rejects %s', (_label, value) => {
      expect(() => createProvider({ credentials: value })).toThrow(ZodError);
    });

    it('requires the region', () => {
      expect(() => createProvider({ credentials: { profile: 'work' } })).toThrow(
        'region',
      );
    });

    it('does not need a profile', () => {
      expect(() =>
        createProvider({ credentials: { region: 'us-east-1' } }),
      ).not.toThrow();
    });

    it('does not create the client until it needs it', () => {
      createProvider();

      expect(SecretsManagerClient).not.toHaveBeenCalled();
    });
  });

  describe('client', () => {
    it('is created with the region and the profile', async () => {
      mockSecrets({ id: 'value' });

      await createProvider().getSecret('id');

      expect(SecretsManagerClient).toHaveBeenCalledExactlyOnceWith({
        region: 'us-east-1',
        profile: 'work',
      });
    });

    it('is created without a profile, to use the default credential chain', async () => {
      mockSecrets({ id: 'value' });

      await createProvider({ credentials: { region: 'eu-west-1' } }).getSecret('id');

      expect(SecretsManagerClient).toHaveBeenCalledExactlyOnceWith({
        region: 'eu-west-1',
        profile: undefined,
      });
    });

    it('is reused by every request of the provider', async () => {
      mockSecrets({ one: '1', two: '2' });
      const provider = createProvider();

      await provider.getSecret('one');
      await provider.getSecrets(['one', 'two']);

      expect(SecretsManagerClient).toHaveBeenCalledOnce();
    });

    it('is destroyed when the provider is closed, and created again if it is needed', async () => {
      mockSecrets({ id: 'value' });
      const provider = createProvider();
      await provider.getSecret('id');

      await provider.close();
      expect(destroy).toHaveBeenCalledOnce();

      await provider.getSecret('id');
      expect(SecretsManagerClient).toHaveBeenCalledTimes(2);
    });

    it('is not a problem to close a provider that never created it', async () => {
      await expect(createProvider().close()).resolves.toBeUndefined();

      expect(destroy).not.toHaveBeenCalled();
    });
  });

  describe('getSecret', () => {
    it('returns the whole text of a secret, with one request', async () => {
      mockSecrets({ 'production/acme/service': '{"a":1}' });

      await expect(createProvider().getSecret('production/acme/service')).resolves.toBe(
        '{"a":1}',
      );

      expect(GetSecretValueCommand).toHaveBeenCalledExactlyOnceWith({
        SecretId: 'production/acme/service',
      });
      expect(send).toHaveBeenCalledOnce();
    });

    it('returns a key of a JSON secret', async () => {
      mockSecrets({ 'production/acme/service': '{"api_key":"the-key","other":"x"}' });

      await expect(
        createProvider().getSecret('production/acme/service#api_key'),
      ).resolves.toBe('the-key');

      expect(GetSecretValueCommand).toHaveBeenCalledExactlyOnceWith({
        SecretId: 'production/acme/service',
      });
    });

    it('returns a nested key', async () => {
      mockSecrets({ id: '{"internal":{"api_key":"the-key"}}' });

      await expect(createProvider().getSecret('id#internal.api_key')).resolves.toBe(
        'the-key',
      );
    });

    it('returns a number as a string', async () => {
      mockSecrets({ id: '{"port":5432}' });

      await expect(createProvider().getSecret('id#port')).resolves.toBe('5432');
    });

    it('splits the name at the last #', async () => {
      mockSecrets({ 'a#b': '{"c":"value"}' });

      await expect(createProvider().getSecret('a#b#c')).resolves.toBe('value');
    });

    it('keeps the characters that AWS allows in the id', async () => {
      mockSecrets({ '/_+=.@-/name': '{"key":"value"}' });

      await expect(createProvider().getSecret('/_+=.@-/name#key')).resolves.toBe('value');
    });

    it('returns undefined when the secret does not exist', async () => {
      mockSecrets({});

      await expect(createProvider().getSecret('missing')).resolves.toBeUndefined();
      await expect(createProvider().getSecret('missing#key')).resolves.toBeUndefined();
    });

    it('returns undefined when the key is not in the secret', async () => {
      mockSecrets({ id: '{"internal":{"api_key":"the-key"}}' });
      const provider = createProvider();

      await expect(provider.getSecret('id#nope')).resolves.toBeUndefined();
      await expect(provider.getSecret('id#internal.nope')).resolves.toBeUndefined();
      await expect(provider.getSecret('id#nope.api_key')).resolves.toBeUndefined();
      await expect(provider.getSecret('id#internal..api_key')).resolves.toBeUndefined();
    });

    it('returns undefined when the path goes through something that has no such key', async () => {
      mockSecrets({ id: '{"a":"text","c":null}', text: '"x"', number: '5' });
      const provider = createProvider();

      await expect(provider.getSecret('id#a.b')).resolves.toBeUndefined();
      await expect(provider.getSecret('id#c.d')).resolves.toBeUndefined();
      await expect(provider.getSecret('text#length')).resolves.toBeUndefined();
      await expect(provider.getSecret('number#toFixed')).resolves.toBeUndefined();
    });

    it('returns an item of a list by its index', async () => {
      mockSecrets({ id: '{"keys":["first","second"]}', list: '["one"]' });
      const provider = createProvider();

      await expect(provider.getSecret('id#keys.1')).resolves.toBe('second');
      await expect(provider.getSecret('list#0')).resolves.toBe('one');
      await expect(provider.getSecret('id#keys.5')).resolves.toBeUndefined();
    });

    it('does not return what the prototype has', async () => {
      mockSecrets({ id: '{}' });

      await expect(createProvider().getSecret('id#constructor')).rejects.toThrow(
        "AWS secret 'id' has a key path 'constructor' that is not a string or a number.",
      );
    });

    it('returns undefined, without a request, for a name with no id or no key path', async () => {
      const provider = createProvider();

      await expect(provider.getSecret('#key')).resolves.toBeUndefined();
      await expect(provider.getSecret('id#')).resolves.toBeUndefined();

      expect(send).not.toHaveBeenCalled();
    });

    it('fails when a key path is used on a secret that is not valid JSON, without its content', async () => {
      mockSecrets({ id: 'not-json-super-secret-value' });

      const failure = createProvider().getSecret('id#key');

      await expect(failure).rejects.toThrow(
        "AWS secret 'id' is not valid JSON, so the key path 'key' can't be read.",
      );
      await expect(failure).rejects.not.toThrow('super-secret-value');
    });

    it('does not need valid JSON when there is no key path', async () => {
      mockSecrets({ id: 'not json' });

      await expect(createProvider().getSecret('id')).resolves.toBe('not json');
    });

    it('fails when the secret is binary', async () => {
      send.mockResolvedValue({ SecretBinary: new Uint8Array([1, 2, 3]) });

      await expect(createProvider().getSecret('id')).rejects.toThrow(
        "AWS secret 'id' has no text value, binary secrets are not supported.",
      );
      await expect(createProvider().getSecret('id#key')).rejects.toThrow(
        "AWS secret 'id' has no text value, binary secrets are not supported.",
      );
    });

    it.each([
      ['an object', '{"key":{"a":"super-secret-value"}}'],
      ['a list', '{"key":["super-secret-value"]}'],
      ['a boolean', '{"key":true}'],
      ['null', '{"key":null}'],
    ])(
      'fails when the key path ends in %s, without its content',
      async (_label, text) => {
        mockSecrets({ id: text });

        const failure = createProvider().getSecret('id#key');

        await expect(failure).rejects.toThrow(
          "AWS secret 'id' has a key path 'key' that is not a string or a number.",
        );
        await expect(failure).rejects.not.toThrow('super-secret-value');
      },
    );

    it('lets the other errors of the request through', async () => {
      const failure = Object.assign(new Error('not allowed'), {
        name: 'AccessDeniedException',
      });
      send.mockRejectedValue(failure);

      await expect(createProvider().getSecret('id')).rejects.toBe(failure);
    });
  });

  describe('getSecrets', () => {
    it('returns the value of each name, undefined for the ones AWS does not have', async () => {
      mockSecrets({ one: 'first', two: '{"key":"second"}' });

      await expect(
        createProvider().getSecrets(['one', 'two#key', 'ghost', 'two#nope']),
      ).resolves.toEqual({
        one: 'first',
        'two#key': 'second',
        ghost: undefined,
        'two#nope': undefined,
      });
    });

    it('asks once for each secret id, even when the names point to keys of the same secret', async () => {
      mockSecrets({ shared: '{"a":"1","b":"2"}', other: 'value' });

      await expect(
        createProvider().getSecrets(['shared#a', 'shared#b', 'shared', 'other', 'other']),
      ).resolves.toEqual({
        'shared#a': '1',
        'shared#b': '2',
        shared: '{"a":"1","b":"2"}',
        other: 'value',
      });

      expect(send).toHaveBeenCalledTimes(2);
      expect(GetSecretValueCommand).toHaveBeenCalledWith({ SecretId: 'shared' });
      expect(GetSecretValueCommand).toHaveBeenCalledWith({ SecretId: 'other' });
    });

    it('asks for all the secrets at the same time', async () => {
      mockSecrets({ one: '1', two: '2', three: '3' });

      const pending = createProvider().getSecrets(['one', 'two', 'three']);

      expect(send).toHaveBeenCalledTimes(3);
      await pending;
    });

    it('does not ask for the names that can not be parsed', async () => {
      mockSecrets({ one: '1' });

      await expect(createProvider().getSecrets(['one', 'id#', '#key'])).resolves.toEqual({
        one: '1',
        'id#': undefined,
        '#key': undefined,
      });

      expect(send).toHaveBeenCalledOnce();
    });

    it('does not ask for anything when there are no names', async () => {
      await expect(createProvider().getSecrets([])).resolves.toEqual({});

      expect(send).not.toHaveBeenCalled();
      expect(SecretsManagerClient).not.toHaveBeenCalled();
    });

    it('fails when a request fails', async () => {
      const failure = new Error('network down');
      send.mockImplementation(async (command: { input: { SecretId: string } }) => {
        if (command.input.SecretId === 'bad') throw failure;
        return { SecretString: 'value' };
      });

      await expect(createProvider().getSecrets(['good', 'bad'])).rejects.toBe(failure);
    });
  });
});
