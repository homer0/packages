import { getAgentDir } from '@earendil-works/pi-coding-agent';
import { createJiti } from 'jiti';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { SecretsConfigError } from '../../utils.js';
import { loadCustomSecretProviderClass } from './loader.js';

vi.mock('node:os', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:os')>();
  const root = `${actual.tmpdir()}/pi-secrets-custom-loader`;
  return { ...actual, homedir: () => `${root}/home` };
});
vi.mock('@earendil-works/pi-coding-agent', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@earendil-works/pi-coding-agent')>();
  const { tmpdir } = await import('node:os');
  return {
    ...actual,
    getAgentDir: () => `${tmpdir()}/pi-secrets-custom-loader/agent`,
  };
});
vi.mock('jiti', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jiti')>();
  return { ...actual, createJiti: vi.fn(actual.createJiti) };
});

describe('loadCustomSecretProviderClass', () => {
  /** A class with only the required method. */
  const VALID = `
    export default class {
      async getSecret(name: string): Promise<string | undefined> {
        return 'value:' + name;
      }
    }
  `;

  /** Where `pi:` paths resolve, and where `agent:` paths resolve. */
  let piDir: string;
  let agentDir: string;

  /** Writes a fixture, creating its directories. */
  const writeFixture = async (path: string, content: string): Promise<void> => {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
  };

  beforeAll(async () => {
    piDir = join(homedir(), '.pi');
    agentDir = getAgentDir();
    await writeFixture(join(agentDir, 'valid.ts'), VALID);
    await writeFixture(join(piDir, 'valid.ts'), VALID);
    await writeFixture(join(agentDir, 'profiles', 'work', 'valid.ts'), VALID);
    await writeFixture(join(agentDir, 'sub', 'valid.ts'), VALID);
    await writeFixture(
      join(agentDir, 'full.ts'),
      `
        export default class {
          async getSecret(name: string) { return 'one:' + name; }
          async getSecrets(names: string[]) { return {}; }
          async close() {}
        }
      `,
    );
    await writeFixture(
      join(agentDir, 'typescript.ts'),
      `
        import { prefix } from './helper';

        enum Kind { Secret = 'secret' }

        export default class {
          async getSecret(name: string): Promise<string | undefined> {
            return prefix(Kind.Secret) + name;
          }
        }
      `,
    );
    await writeFixture(
      join(agentDir, 'helper.ts'),
      "export const prefix = (kind: string): string => kind + ':';",
    );
    await writeFixture(
      join(agentDir, 'no-class.ts'),
      'export default { getSecret() {} };',
    );
    await writeFixture(join(agentDir, 'no-default.ts'), 'export const other = 1;');
    await writeFixture(join(agentDir, 'arrow.ts'), 'export default () => {};');
    await writeFixture(join(agentDir, 'no-get-secret.ts'), 'export default class {}');
    await writeFixture(
      join(agentDir, 'property-get-secret.ts'),
      `
        export default class {
          getSecret = async (name: string) => name;
        }
      `,
    );
    await writeFixture(
      join(agentDir, 'bad-get-secrets.ts'),
      `
        class A { async getSecret() { return ''; } }
        Object.defineProperty(A.prototype, 'getSecrets', { value: 'nope' });
        export default A;
      `,
    );
    await writeFixture(
      join(agentDir, 'bad-close.ts'),
      `
        class A { async getSecret() { return ''; } }
        Object.defineProperty(A.prototype, 'close', { value: true });
        export default A;
      `,
    );
    await writeFixture(join(agentDir, 'throws.ts'), "throw new Error('boom');");
    await writeFixture(join(agentDir, 'syntax.ts'), 'export default class {');
  });

  afterAll(async () => {
    await rm(dirname(agentDir), { recursive: true });
  });

  beforeEach(() => {
    vi.mocked(createJiti).mockClear();
  });

  describe('the path', () => {
    it.each([
      ['agent:valid.ts', () => join(agentDir, 'valid.ts')],
      ['pi:valid.ts', () => join(piDir, 'valid.ts')],
      ['profile:work:valid.ts', () => join(agentDir, 'profiles', 'work', 'valid.ts')],
    ])('loads a file with the prefix of `%s`', async (file) => {
      const CustomProvider = await loadCustomSecretProviderClass(file);

      await expect(
        new CustomProvider({ name: 'x', data: {} }).getSecret('A'),
      ).resolves.toBe('value:A');
    });

    it.each([
      ['an absolute path', () => join(agentDir, 'valid.ts')],
      ['a relative path', () => './valid.ts'],
      ['a bare file name', () => 'valid.ts'],
      ['a path with a wrong prefix', () => 'Agent:valid.ts'],
    ])('rejects %s', async (_label, getFile) => {
      const file = getFile();

      await expect(loadCustomSecretProviderClass(file)).rejects.toThrow(
        SecretsConfigError,
      );
      await expect(loadCustomSecretProviderClass(file)).rejects.toThrow(
        `Invalid path "${file}": it must start with`,
      );
    });

    it.each([['agent:'], ['pi:'], ['profile:work:'], ['']])(
      'rejects an empty path in `%s`',
      async (file) => {
        await expect(loadCustomSecretProviderClass(file)).rejects.toThrow(
          SecretsConfigError,
        );
      },
    );

    it.each([
      ['agent:../../x.ts'],
      ['agent:../x.ts'],
      ['agent:sub/../../x.ts'],
      ['pi:../x.ts'],
      ['pi:../../x.ts'],
      ['pi:sub/../../x.ts'],
      ['profile:work:../../../x.ts'],
      ['profile:..:../../x.ts'],
      ['profile:../../..:x.ts'],
    ])('rejects `%s`, which is outside of the Pi and agent directories', async (file) => {
      const error = await loadCustomSecretProviderClass(file).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(SecretsConfigError);
      expect((error as Error).message).toContain(
        'has to be inside the Pi directory or the agent directory',
      );
      expect((error as Error).message).toContain(`"${file}"`);
      expect(createJiti).not.toHaveBeenCalled();
    });

    it('does not take a directory with the same start as the agent directory', async () => {
      await expect(
        loadCustomSecretProviderClass('agent:../agent-other/x.ts'),
      ).rejects.toThrow('has to be inside the Pi directory or the agent directory');
    });

    it.each([
      ['agent:sub/../valid.ts', () => join(agentDir, 'valid.ts')],
      ['pi:sub/../valid.ts', () => join(piDir, 'valid.ts')],
      [
        'profile:work:sub/../valid.ts',
        () => join(agentDir, 'profiles', 'work', 'valid.ts'),
      ],
    ])('accepts `%s`, a `..` that stays inside', async (file) => {
      await expect(loadCustomSecretProviderClass(file)).resolves.toBeTypeOf('function');
    });

    it('accepts a file name that starts with two dots', async () => {
      await expect(loadCustomSecretProviderClass('agent:..hidden.ts')).rejects.toThrow(
        'was not found',
      );
    });
  });

  describe('the file', () => {
    it('throws with the resolved path when the file does not exist', async () => {
      await expect(loadCustomSecretProviderClass('agent:missing.ts')).rejects.toThrow(
        new SecretsConfigError(
          `The custom provider file was not found: ${join(agentDir, 'missing.ts')}`,
        ),
      );
    });

    it('throws when the path is a directory', async () => {
      await expect(loadCustomSecretProviderClass('agent:sub')).rejects.toThrow(
        'was not found',
      );
    });

    it('loads TypeScript, with enums and imports without the extension', async () => {
      const CustomProvider = await loadCustomSecretProviderClass('agent:typescript.ts');

      await expect(
        new CustomProvider({ name: 'x', data: {} }).getSecret('A'),
      ).resolves.toBe('secret:A');
    });

    it('throws when the file can not be imported', async () => {
      await expect(loadCustomSecretProviderClass('agent:throws.ts')).rejects.toThrow(
        `The custom provider file ${join(agentDir, 'throws.ts')} could not be loaded: boom`,
      );
      await expect(loadCustomSecretProviderClass('agent:syntax.ts')).rejects.toThrow(
        SecretsConfigError,
      );
    });

    it('keeps the optional methods', async () => {
      const CustomProvider = await loadCustomSecretProviderClass('agent:full.ts');

      expect(typeof CustomProvider.prototype.getSecrets).toBe('function');
      expect(typeof CustomProvider.prototype.close).toBe('function');
    });
  });

  describe('the class', () => {
    it.each([
      ['a default export that is not a function', 'no-class.ts', 'has to export a class'],
      ['no default export', 'no-default.ts', 'has to export a class'],
      ['an arrow function as the default export', 'arrow.ts', 'needs a getSecret method'],
      ['no getSecret in the prototype', 'no-get-secret.ts', 'needs a getSecret method'],
      [
        'a getSecret that is a property of the instance',
        'property-get-secret.ts',
        'needs a getSecret method',
      ],
      ['a getSecrets that is not a function', 'bad-get-secrets.ts', 'The getSecrets'],
      ['a close that is not a function', 'bad-close.ts', 'The close'],
    ])('rejects %s', async (_label, name, message) => {
      const error = await loadCustomSecretProviderClass(`agent:${name}`).catch(
        (e: unknown) => e,
      );

      expect(error).toBeInstanceOf(SecretsConfigError);
      expect((error as Error).message).toContain(message);
      expect((error as Error).message).toContain(join(agentDir, name));
    });
  });

  describe('the cache', () => {
    it('imports and validates the file once for many calls', async () => {
      await writeFixture(join(agentDir, 'cache-calls.ts'), VALID);

      const first = await loadCustomSecretProviderClass('agent:cache-calls.ts');
      const second = await loadCustomSecretProviderClass('agent:cache-calls.ts');
      const third = await loadCustomSecretProviderClass('agent:sub/../cache-calls.ts');

      expect(second).toBe(first);
      expect(third).toBe(first);
      expect(createJiti).toHaveBeenCalledOnce();
    });

    it('shares the load between calls that come while it is loading', async () => {
      await writeFixture(join(agentDir, 'cache-concurrent.ts'), VALID);

      const classes = await Promise.all([
        loadCustomSecretProviderClass('agent:cache-concurrent.ts'),
        loadCustomSecretProviderClass('agent:cache-concurrent.ts'),
        loadCustomSecretProviderClass('agent:cache-concurrent.ts'),
      ]);

      expect(classes[1]).toBe(classes[0]);
      expect(classes[2]).toBe(classes[0]);
      expect(createJiti).toHaveBeenCalledOnce();
    });

    it('does not keep a file that was not found', async () => {
      await expect(loadCustomSecretProviderClass('agent:cache-late.ts')).rejects.toThrow(
        'was not found',
      );
      await writeFixture(join(agentDir, 'cache-late.ts'), VALID);

      await expect(
        loadCustomSecretProviderClass('agent:cache-late.ts'),
      ).resolves.toBeTypeOf('function');
    });

    it('does not keep a class that was not valid', async () => {
      await writeFixture(join(agentDir, 'cache-fixed.ts'), 'export default class {}');
      await expect(loadCustomSecretProviderClass('agent:cache-fixed.ts')).rejects.toThrow(
        'needs a getSecret method',
      );
      await writeFixture(join(agentDir, 'cache-fixed.ts'), VALID);

      await expect(
        loadCustomSecretProviderClass('agent:cache-fixed.ts'),
      ).resolves.toBeTypeOf('function');
      expect(createJiti).toHaveBeenCalledTimes(2);
    });

    it('is shared with another copy of the module, like the one of another extension', async () => {
      await writeFixture(join(agentDir, 'cache-copy.ts'), VALID);
      const first = await loadCustomSecretProviderClass('agent:cache-copy.ts');

      vi.resetModules();
      const copy = await import('./loader.js');
      const second = await copy.loadCustomSecretProviderClass('agent:cache-copy.ts');

      expect(copy.loadCustomSecretProviderClass).not.toBe(loadCustomSecretProviderClass);
      expect(second).toBe(first);
      expect(createJiti).toHaveBeenCalledOnce();
    });

    it('checks the path every time, even for a class that is loaded', async () => {
      await loadCustomSecretProviderClass('agent:valid.ts');

      await expect(loadCustomSecretProviderClass('/etc/valid.ts')).rejects.toThrow(
        SecretsConfigError,
      );
    });
  });
});
