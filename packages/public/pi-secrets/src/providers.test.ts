import { Agent, fetch } from 'undici';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InfisicalSecretProvider } from './providers.js';
import type { SecretsConfig } from './types.js';

vi.mock('undici', () => ({ Agent: vi.fn(), fetch: vi.fn() }));

describe('InfisicalSecretProvider', () => {
  const secretsConfig: SecretsConfig = {
    cacheTtl: 10_000,
    providers: { main: 'main', registry: {} },
  };
  const credentials = {
    clientId: 'client-id',
    clientSecret: 'client-secret',
    projectId: 'project',
    environment: 'dev',
  };
  let counter = 0;
  let close: ReturnType<typeof vi.fn>;

  /** The name of a provider that no other test uses, as the token cache is shared. */
  const nextName = (): string => {
    counter += 1;
    return `provider-${counter}`;
  };

  /** Creates a provider, with the given credentials on top of the valid ones. */
  const createProvider = (
    options: { name?: string; url?: string; credentials?: Record<string, unknown> } = {},
  ): InfisicalSecretProvider =>
    new InfisicalSecretProvider(
      {
        name: options.name ?? nextName(),
        type: 'infisical',
        url: options.url ?? 'https://infisical.test',
        enabled: true,
        credentials: { ...credentials, ...options.credentials },
      },
      secretsConfig,
    );

  /** The response `fetch` gives, with a JSON body. */
  const jsonResponse = (body: unknown, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });

  /** The response `fetch` gives when the body is not JSON. */
  const brokenResponse = () => ({
    ok: true,
    status: 200,
    json: async () => {
      throw new Error('Unexpected token');
    },
  });

  const login = (expiresIn = 3_600) =>
    jsonResponse({ accessToken: 'token', expiresIn, tokenType: 'Bearer' });

  const list = (secrets: Record<string, string>, imports?: Record<string, string>[]) =>
    jsonResponse({
      secrets: Object.entries(secrets).map(([secretKey, secretValue]) => ({
        secretKey,
        secretValue,
      })),
      imports: imports?.map((entry) => ({
        secrets: Object.entries(entry).map(([secretKey, secretValue]) => ({
          secretKey,
          secretValue,
        })),
      })),
    });

  /** Makes `fetch` answer with the login first and the list second. */
  const mockLoginAndList = (secrets: Record<string, string>): void => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(login() as never)
      .mockResolvedValueOnce(list(secrets) as never);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    close = vi.fn();
    // eslint-disable-next-line prefer-arrow-callback, func-names -- `new Agent()` needs a constructable function, which an arrow is not.
    vi.mocked(Agent).mockImplementation(function () {
      return { close } as never;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('is named and typed as Infisical', () => {
      const provider = createProvider({ name: 'my-provider' });

      expect(provider.name).toBe('my-provider');
      expect(provider.type).toBe('infisical');
      expect(provider.secretsConfig).toBe(secretsConfig);
    });

    it('rejects credentials that are not valid', () => {
      expect(() => createProvider({ credentials: { clientId: undefined } })).toThrow(
        'clientId',
      );
    });

    it('verifies the TLS certificates by default', () => {
      createProvider();

      expect(Agent).toHaveBeenCalledWith({ connect: { rejectUnauthorized: true } });
    });

    it('can skip the TLS verification', () => {
      createProvider({ credentials: { skipTLSVerify: true } });

      expect(Agent).toHaveBeenCalledWith({ connect: { rejectUnauthorized: false } });
    });
  });

  describe('close', () => {
    it('closes its connections', async () => {
      await createProvider().close();

      expect(close).toHaveBeenCalledOnce();
    });
  });

  describe('getSecret and getSecrets', () => {
    it('logs in with the Universal Auth credentials', async () => {
      mockLoginAndList({});

      await createProvider({
        url: 'https://infisical.test///',
        credentials: { organizationSlug: 'my-org' },
      }).getSecret('A');

      const [url, options] = vi.mocked(fetch).mock.calls[0]!;
      expect(url).toBe('https://infisical.test/api/v1/auth/universal-auth/login');
      expect(options).toMatchObject({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        dispatcher: { close },
      });
      expect(JSON.parse((options as { body: string }).body)).toEqual({
        clientId: 'client-id',
        clientSecret: 'client-secret',
        organizationSlug: 'my-org',
      });
    });

    it('lists the secrets of the project, with the token', async () => {
      mockLoginAndList({});

      await createProvider({
        credentials: { secretPath: '/app', environment: 'prod' },
      }).getSecret('A');

      const [url, options] = vi.mocked(fetch).mock.calls[1]!;
      const { pathname, searchParams } = url as URL;
      expect(pathname).toBe('/api/v4/secrets');
      expect(Object.fromEntries(searchParams)).toEqual({
        projectId: 'project',
        environment: 'prod',
        secretPath: '/app',
        viewSecretValue: 'true',
        includeImports: 'true',
      });
      expect(options).toMatchObject({ headers: { Authorization: 'Bearer token' } });
    });

    it('lists the root path when there is no secret path', async () => {
      mockLoginAndList({});

      await createProvider().getSecret('A');

      const [url] = vi.mocked(fetch).mock.calls[1]!;
      expect((url as URL).searchParams.get('secretPath')).toBe('/');
    });

    it('returns the value of a secret, or undefined if there is none', async () => {
      const provider = createProvider();
      mockLoginAndList({ A: 'value-a' });
      await expect(provider.getSecret('A')).resolves.toBe('value-a');

      vi.mocked(fetch).mockResolvedValueOnce(list({ A: 'value-a' }) as never);
      await expect(provider.getSecret('B')).resolves.toBeUndefined();
    });

    it('resolves many secrets with one list request', async () => {
      mockLoginAndList({ A: '1', B: '2' });

      const values = await createProvider().getSecrets(['A', 'B', 'C']);

      expect(values).toEqual({ A: '1', B: '2', C: undefined });
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('includes the secrets that are imported, and the local ones win', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce(login() as never)
        .mockResolvedValueOnce(
          list({ A: 'local' }, [
            { A: 'imported', B: 'from-import' },
            { C: 'other' },
          ]) as never,
        );

      const values = await createProvider().getSecrets(['A', 'B', 'C']);

      expect(values).toEqual({ A: 'local', B: 'from-import', C: 'other' });
    });

    it('fails when the login fails', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({}, 401) as never);

      await expect(createProvider().getSecret('A')).rejects.toThrow(
        'Infisical auth failed with status 401.',
      );
    });

    it('fails when the list request fails', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce(login() as never)
        .mockResolvedValueOnce(jsonResponse({}, 403) as never);

      await expect(createProvider().getSecret('A')).rejects.toThrow(
        'Infisical list secrets failed with status 403.',
      );
    });

    it('fails when a response is not JSON', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(brokenResponse() as never);

      await expect(createProvider().getSecret('A')).rejects.toBeInstanceOf(Error);
    });

    it('fails when a response does not have the expected shape', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce(login() as never)
        .mockResolvedValueOnce(jsonResponse({ secrets: 'nope' }) as never);

      await expect(createProvider().getSecret('A')).rejects.toBeInstanceOf(Error);
    });
  });

  describe('access token cache', () => {
    it('logs in once while the token lives, in seconds', async () => {
      vi.useFakeTimers();
      const provider = createProvider();
      vi.mocked(fetch)
        .mockResolvedValueOnce(login(60) as never)
        .mockResolvedValueOnce(list({}) as never)
        .mockResolvedValueOnce(list({}) as never)
        .mockResolvedValueOnce(login(60) as never)
        .mockResolvedValueOnce(list({}) as never);

      await provider.getSecret('A');
      vi.advanceTimersByTime(59_000);
      await provider.getSecret('A');
      const loginsBeforeExpiry = vi
        .mocked(fetch)
        .mock.calls.filter(([url]) => String(url).includes('/login')).length;
      vi.advanceTimersByTime(1_000);
      await provider.getSecret('A');

      expect(loginsBeforeExpiry).toBe(1);
      expect(
        vi.mocked(fetch).mock.calls.filter(([url]) => String(url).includes('/login')),
      ).toHaveLength(2);
    });

    it('keeps a token that lives longer than the limit of setTimeout', async () => {
      vi.useFakeTimers();
      const thirtyDays = 30 * 24 * 60 * 60;
      const provider = createProvider();
      vi.mocked(fetch)
        .mockResolvedValueOnce(login(thirtyDays) as never)
        .mockResolvedValueOnce(list({}) as never)
        .mockResolvedValueOnce(list({}) as never);

      await provider.getSecret('A');
      vi.advanceTimersByTime(1_000_000);
      await provider.getSecret('A');

      expect(
        vi.mocked(fetch).mock.calls.filter(([url]) => String(url).includes('/login')),
      ).toHaveLength(1);
    });

    it('does not share the token between providers that point to different projects', async () => {
      const name = nextName();
      vi.mocked(fetch)
        .mockResolvedValueOnce(login() as never)
        .mockResolvedValueOnce(list({}) as never)
        .mockResolvedValueOnce(login() as never)
        .mockResolvedValueOnce(list({}) as never);

      await createProvider({ name }).getSecret('A');
      await createProvider({ name, credentials: { projectId: 'other' } }).getSecret('A');

      expect(
        vi.mocked(fetch).mock.calls.filter(([url]) => String(url).includes('/login')),
      ).toHaveLength(2);
    });
  });
});
