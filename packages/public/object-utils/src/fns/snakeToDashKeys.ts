import { formatKeys, type FormatKeysExtensionOptions } from './formatKeys.js';

/**
 * A shorthand method for {@link formatKeys} that transforms the keys from `snake_case` to
 * `dash-case`.
 *
 * @param options  The options to use.
 * @template T  The type of the returned object.
 */
export const snakeToDashKeys = <T>(options: FormatKeysExtensionOptions): T =>
  formatKeys<T>({
    ...options,
    search: /([a-z])_([a-z])/g,
    replace: (_, firstLetter, secondLetter) => `${firstLetter}-${secondLetter}`,
  });
