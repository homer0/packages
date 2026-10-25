import { execSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  expandPlaceholders,
  getCachedValue,
  MAX_TIMEOUT,
  ms,
  readAuthKey,
  SecretNotFoundError,
  SecretsConfigError,
  setCachedValue,
} from './utils.js';

vi.mock('@earendil-works/pi-coding-agent', () => ({
  getAgentDir: vi.fn(() => '/agent'),
}));
vi.mock('node:child_process', () => ({ execSync: vi.fn() }));
vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }));

describe('utils', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('ms', () => {
    it('returns a number as it is', () => {
      expect(ms(1_500)).toBe(1_500);
    });

    it.each([
      ['10s', 10_000],
      ['5m', 300_000],
      ['2h', 7_200_000],
    ] as const)('converts %s to milliseconds', (value, expected) => {
      expect(ms(value)).toBe(expected);
    });
  });

  describe('expandPlaceholders', () => {
    it('replaces the placeholders with their values', () => {
      expect(expandPlaceholders('a:<one>:<two>', { one: '1', two: '2' })).toBe('a:1:2');
    });

    it('replaces a placeholder that has no value with its own name', () => {
      expect(expandPlaceholders('a:<missing>', {})).toBe('a:missing');
    });

    it('leaves what is not a single-word placeholder untouched', () => {
      expect(expandPlaceholders('<two words> and <>', { two: 'x' })).toBe(
        '<two words> and <>',
      );
    });
  });

  describe('in-process cache', () => {
    it('returns what was stored, and undefined for what was not', () => {
      setCachedValue({ key: 'cache:stored', value: 'value', ttl: 1_000 });

      expect(getCachedValue<string>('cache:stored')).toBe('value');
      expect(getCachedValue('cache:missing')).toBeUndefined();
    });

    it('removes a value after its ttl', () => {
      vi.useFakeTimers();
      setCachedValue({ key: 'cache:expires', value: 1, ttl: 1_000 });

      vi.advanceTimersByTime(999);
      expect(getCachedValue('cache:expires')).toBe(1);

      vi.advanceTimersByTime(1);
      expect(getCachedValue('cache:expires')).toBeUndefined();
    });

    it('restarts the countdown when a value is replaced', () => {
      vi.useFakeTimers();
      setCachedValue({ key: 'cache:replaced', value: 1, ttl: 1_000 });
      vi.advanceTimersByTime(600);
      setCachedValue({ key: 'cache:replaced', value: 2, ttl: 1_000 });

      vi.advanceTimersByTime(600);
      expect(getCachedValue('cache:replaced')).toBe(2);

      vi.advanceTimersByTime(400);
      expect(getCachedValue('cache:replaced')).toBeUndefined();
    });

    it('caps a ttl that is over the limit of setTimeout, instead of expiring it right away', () => {
      vi.useFakeTimers();
      setCachedValue({ key: 'cache:long', value: 1, ttl: 30 * 24 * 60 * 60 * 1_000 });

      vi.advanceTimersByTime(MAX_TIMEOUT - 1);
      expect(getCachedValue('cache:long')).toBe(1);

      vi.advanceTimersByTime(1);
      expect(getCachedValue('cache:long')).toBeUndefined();
    });
  });

  describe('errors', () => {
    describe('SecretNotFoundError', () => {
      it('says which secret was not found', () => {
        const error = new SecretNotFoundError('API_TOKEN');

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('SecretNotFoundError');
        expect(error.message).toBe('Secret not found: API_TOKEN');
        expect(error.secretName).toBe('API_TOKEN');
      });
    });

    describe('SecretsConfigError', () => {
      it('keeps the description of what is wrong', () => {
        const error = new SecretsConfigError('Main secret provider not found: a');

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('SecretsConfigError');
        expect(error.message).toBe('Main secret provider not found: a');
      });
    });
  });

  /* eslint-disable no-template-curly-in-string -- The keys of auth.json have ${NAME} on purpose: they are test data, not templates. */
  describe('readAuthKey', () => {
    let counter = 0;

    /** Creates a command that no other test uses, as the outputs of the commands are kept. */
    const nextCommand = (): string => {
      counter += 1;
      return `get-key --test ${counter}`;
    };

    const read = (name = 'anthropic') => readAuthKey({ name, context: 'ctx' });

    /** Makes the auth file have the given entries. */
    const mockAuthFile = (entries: unknown): void => {
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(entries) as never);
    };

    /** Makes the auth file have one entry, with the given key. */
    const mockKey = (key: unknown, extra: Record<string, unknown> = {}): void => {
      mockAuthFile({ anthropic: { type: 'api_key', key, ...extra } });
    };

    beforeEach(() => {
      vi.mocked(readFile).mockReset();
      vi.mocked(execSync).mockReset();
    });

    describe('the file', () => {
      it('reads auth.json from the agent directory', async () => {
        mockKey('sk-literal');

        await read();

        expect(readFile).toHaveBeenCalledExactlyOnceWith(
          join('/agent', 'auth.json'),
          'utf-8',
        );
      });

      it('returns a literal key as it is', async () => {
        mockKey('sk-literal-key');

        await expect(read()).resolves.toBe('sk-literal-key');
      });

      it('picks the entry by name', async () => {
        mockAuthFile({
          first: { type: 'api_key', key: 'one' },
          second: { type: 'api_key', key: 'two' },
        });

        await expect(read('second')).resolves.toBe('two');
      });

      it('fails with the reason when the file can not be read', async () => {
        vi.mocked(readFile).mockRejectedValue(new Error('ENOENT: no such file'));

        await expect(read()).rejects.toThrow(
          `ctx references auth entry "anthropic", but ${join('/agent', 'auth.json')} can't be read: ENOENT: no such file`,
        );
      });

      it('fails with what was thrown when it is not an error', async () => {
        vi.mocked(readFile).mockRejectedValue('denied');

        await expect(read()).rejects.toThrow("can't be read: denied");
      });

      it('fails when the file is not valid JSON', async () => {
        vi.mocked(readFile).mockResolvedValue('{ nope' as never);

        await expect(read()).rejects.toThrow(
          `ctx references auth entry "anthropic", but ${join('/agent', 'auth.json')} is not valid JSON.`,
        );
      });

      it.each([
        ['an entry that does not exist', { other: { type: 'api_key', key: 'x' } }],
        ['a name of the prototype', {}],
        ['an entry that is not an object', { anthropic: 'sk-literal' }],
        ['a file that is null', null],
        ['a file that is a list', []],
        ['a file that is a string', 'text'],
      ])('fails with %s', async (_label, entries) => {
        mockAuthFile(entries);

        await expect(
          read(_label === 'a name of the prototype' ? 'constructor' : 'anthropic'),
        ).rejects.toThrow(`ctx references auth entry`);
      });

      it.each([
        [
          'an OAuth credential, that has no key',
          { type: 'oauth', access: 'a', refresh: 'r' },
        ],
        ['an empty key', { type: 'api_key', key: '' }],
        ['a key that is not a string', { type: 'api_key', key: 123 }],
        [
          'an env that is not a record of strings',
          { type: 'api_key', key: 'x', env: { A: 1 } },
        ],
      ])('fails with %s', async (_label, entry) => {
        mockAuthFile({ anthropic: entry });

        await expect(read()).rejects.toThrow(
          `ctx references auth entry "anthropic", which is not in ${join('/agent', 'auth.json')} or has no "key".`,
        );
      });
    });

    describe('a key with environment variables', () => {
      it.each([
        ['$PI_AUTH_TEST_TOKEN', 'from-env'],
        ['${PI_AUTH_TEST_TOKEN}', 'from-env'],
        ['Bearer ${PI_AUTH_TEST_TOKEN}-v1', 'Bearer from-env-v1'],
        ['$PI_AUTH_TEST_TOKEN:$PI_AUTH_TEST_TOKEN', 'from-env:from-env'],
      ])('replaces the variables of %s', async (key, expected) => {
        vi.stubEnv('PI_AUTH_TEST_TOKEN', 'from-env');
        mockKey(key);

        await expect(read()).resolves.toBe(expected);
      });

      it('gives priority to the env of the entry over the process environment', async () => {
        vi.stubEnv('PI_AUTH_TEST_TOKEN', 'from-process');
        mockKey('$PI_AUTH_TEST_TOKEN', { env: { PI_AUTH_TEST_TOKEN: 'from-entry' } });

        await expect(read()).resolves.toBe('from-entry');
      });

      it('falls back to the process environment when the env of the entry has it empty', async () => {
        vi.stubEnv('PI_AUTH_TEST_TOKEN', 'from-process');
        mockKey('$PI_AUTH_TEST_TOKEN', { env: { PI_AUTH_TEST_TOKEN: '' } });

        await expect(read()).resolves.toBe('from-process');
      });

      it('takes an empty variable as not set', async () => {
        vi.stubEnv('PI_AUTH_TEST_TOKEN', '');
        mockKey('$PI_AUTH_TEST_TOKEN');

        await expect(read()).rejects.toThrow(
          'whose key needs the environment variable(s) that are not set: PI_AUTH_TEST_TOKEN.',
        );
      });

      it('lists each variable that is not set once', async () => {
        mockKey('$PI_AUTH_UNSET_ONE ${PI_AUTH_UNSET_TWO} $PI_AUTH_UNSET_ONE');

        await expect(read()).rejects.toThrow(
          'not set: PI_AUTH_UNSET_ONE, PI_AUTH_UNSET_TWO.',
        );
      });

      it.each([
        ['pa$$word', 'pa$word'],
        ['a$!b', 'a!b'],
        ['$$PI_AUTH_TEST_TOKEN', '$PI_AUTH_TEST_TOKEN'],
        ['costs $5', 'costs $5'],
        ['${not a name}', '${not a name}'],
        ['${}', '${}'],
        ['${unterminated', '${unterminated'],
        ['ends with $', 'ends with $'],
      ])('reads %s as the text %s', async (key, expected) => {
        vi.stubEnv('PI_AUTH_TEST_TOKEN', 'from-env');
        mockKey(key);

        await expect(read()).resolves.toBe(expected);
      });
    });

    describe('a key that is a command', () => {
      it('runs it, like Pi does, and returns its output without the spaces around it', async () => {
        const command = nextCommand();
        vi.mocked(execSync).mockReturnValue('  the-key\n' as never);
        mockKey(`!${command}`);

        await expect(read()).resolves.toBe('the-key');

        expect(execSync).toHaveBeenCalledExactlyOnceWith(command, {
          encoding: 'utf-8',
          timeout: 10_000,
          stdio: ['ignore', 'pipe', 'ignore'],
        });
      });

      it('does not read the escapes or the variables of a command', async () => {
        vi.stubEnv('PI_AUTH_TEST_TOKEN', 'from-env');
        vi.mocked(execSync).mockReturnValue('the-key' as never);
        mockKey('!echo $$ $PI_AUTH_TEST_TOKEN');

        await read();

        expect(execSync).toHaveBeenCalledWith(
          'echo $$ $PI_AUTH_TEST_TOKEN',
          expect.anything(),
        );
      });

      it('keeps the output, so the command does not run again', async () => {
        const command = nextCommand();
        vi.mocked(execSync).mockReturnValue('the-key' as never);
        mockKey(`!${command}`);

        await read();
        await read();

        expect(execSync).toHaveBeenCalledOnce();
      });

      it('fails when the command fails, without showing the command', async () => {
        const command = nextCommand();
        vi.mocked(execSync).mockImplementation(() => {
          throw new Error('exit 1');
        });
        mockKey(`!${command}`);

        const failure = read();

        await expect(failure).rejects.toThrow(
          'ctx references auth entry "anthropic", whose key is a command that failed or printed nothing.',
        );
        await expect(failure).rejects.not.toThrow(command);
      });

      it('fails when the command prints nothing', async () => {
        vi.mocked(execSync).mockReturnValue('  \n' as never);
        mockKey(`!${nextCommand()}`);

        await expect(read()).rejects.toThrow(
          'whose key is a command that failed or printed nothing.',
        );
      });

      it('runs a command that failed again the next time', async () => {
        const command = nextCommand();
        vi.mocked(execSync)
          .mockImplementationOnce(() => {
            throw new Error('keychain is locked');
          })
          .mockReturnValueOnce('the-key' as never);
        mockKey(`!${command}`);

        await expect(read()).rejects.toThrow('failed or printed nothing');
        await expect(read()).resolves.toBe('the-key');
      });
    });
  });
  /* eslint-enable no-template-curly-in-string */
});
