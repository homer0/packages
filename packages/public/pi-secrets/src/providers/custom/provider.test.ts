import { describe, expect, it, vi } from 'vitest';
import type { NamedSecretProviderConfig, SecretsConfig } from '../../types.js';
import { CustomSecretProviderWrapper } from './provider.js';
import type { CustomSecretProvider, CustomSecretProviderContext } from './types.js';

describe('CustomSecretProviderWrapper', () => {
  type FakeCustom = {
    [K in keyof Required<CustomSecretProvider>]: ReturnType<typeof vi.fn>;
  };

  const secretsConfig: SecretsConfig = {
    cacheTtl: 10_000,
    providers: { main: 'main', registry: {} },
  };

  /**
   * Creates a wrapper over a fake class. The fake is returned too, to check the calls.
   * The class only has the methods that are given.
   */
  const createWrapper = (
    methods: Partial<FakeCustom>,
    config: Partial<NamedSecretProviderConfig<'custom'>> = {},
  ) => {
    const contexts: CustomSecretProviderContext[] = [];
    // eslint-disable-next-line @typescript-eslint/no-extraneous-class -- The methods are added to the prototype, like a real class has them.
    class Fake {
      constructor(context: CustomSecretProviderContext) {
        contexts.push(context);
      }
    }
    Object.assign(Fake.prototype, methods);

    const wrapper = new CustomSecretProviderWrapper({
      providerConfig: {
        name: 'keychain',
        type: 'custom',
        enabled: true,
        file: 'agent:secrets/keychain.ts',
        ...config,
      },
      secretsConfig,
      providerClass: Fake as never,
    });
    return { wrapper, contexts };
  };

  describe('constructor', () => {
    it('is named by the registry and typed as custom', () => {
      const { wrapper } = createWrapper({ getSecret: vi.fn() });

      expect(wrapper.name).toBe('keychain');
      expect(wrapper.type).toBe('custom');
      expect(wrapper.secretsConfig).toBe(secretsConfig);
    });

    it('creates the class with the name and the data as they are', () => {
      const data = { credentials: { username: 'homer0' } };
      const { contexts } = createWrapper({ getSecret: vi.fn() }, { data });

      expect(contexts).toHaveLength(1);
      expect(contexts[0]!.name).toBe('keychain');
      expect(contexts[0]!.data).toBe(data);
    });

    it('gives an empty object as the data when there is none', () => {
      const { contexts } = createWrapper({ getSecret: vi.fn() });

      expect(contexts[0]!.data).toEqual({});
    });
  });

  describe('getSecret', () => {
    it('delegates to the class', async () => {
      const getSecret = vi.fn().mockResolvedValue('the-value');
      const { wrapper } = createWrapper({ getSecret });

      await expect(wrapper.getSecret('TOKEN')).resolves.toBe('the-value');

      expect(getSecret).toHaveBeenCalledExactlyOnceWith('TOKEN');
    });

    it('does not catch the errors of the class', async () => {
      const { wrapper } = createWrapper({
        getSecret: vi.fn().mockRejectedValue(new Error('keychain locked')),
      });

      await expect(wrapper.getSecret('TOKEN')).rejects.toThrow('keychain locked');
    });
  });

  describe('getSecrets', () => {
    it('uses the getSecrets of the class when it has one', async () => {
      const getSecret = vi.fn();
      const getSecrets = vi.fn().mockResolvedValue({ A: 'one', B: undefined });
      const { wrapper } = createWrapper({ getSecret, getSecrets });

      await expect(wrapper.getSecrets(['A', 'B'])).resolves.toEqual({
        A: 'one',
        B: undefined,
      });

      expect(getSecrets).toHaveBeenCalledExactlyOnceWith(['A', 'B']);
      expect(getSecret).not.toHaveBeenCalled();
    });

    it('derives it from getSecret when the class does not have one', async () => {
      const values: Record<string, string> = { A: 'one', C: 'three' };
      const getSecret = vi.fn(async (name: string) => values[name]);
      const { wrapper } = createWrapper({ getSecret });

      await expect(wrapper.getSecrets(['A', 'B', 'C'])).resolves.toEqual({
        A: 'one',
        B: undefined,
        C: 'three',
      });

      expect(getSecret.mock.calls).toEqual([['A'], ['B'], ['C']]);
    });

    it('asks for all the names at once when it derives them', async () => {
      const resolvers: (() => void)[] = [];
      const getSecret = vi.fn(
        (name: string) =>
          new Promise<string>((resolve) => {
            resolvers.push(() => resolve(name));
          }),
      );
      const { wrapper } = createWrapper({ getSecret });

      const result = wrapper.getSecrets(['A', 'B']);
      await Promise.resolve();

      expect(getSecret).toHaveBeenCalledTimes(2);
      resolvers.forEach((resolve) => resolve());
      await expect(result).resolves.toEqual({ A: 'A', B: 'B' });
    });

    it('fails when the class fails for one of the derived names', async () => {
      const getSecret = vi.fn(async (name: string) => {
        if (name === 'B') throw new Error('keychain locked');
        return name;
      });
      const { wrapper } = createWrapper({ getSecret });

      await expect(wrapper.getSecrets(['A', 'B'])).rejects.toThrow('keychain locked');
    });
  });

  describe('close', () => {
    it('delegates to the class', async () => {
      const close = vi.fn().mockResolvedValue(undefined);
      const { wrapper } = createWrapper({ getSecret: vi.fn(), close });

      await wrapper.close();

      expect(close).toHaveBeenCalledOnce();
    });

    it('does nothing when the class has no close', async () => {
      const { wrapper } = createWrapper({ getSecret: vi.fn() });

      await expect(wrapper.close()).resolves.toBeUndefined();
    });
  });
});
