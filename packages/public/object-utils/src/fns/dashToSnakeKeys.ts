import { formatKeys, type FormatKeysExtensionOptions } from './formatKeys';

/**
 * A shorthand method for {@link formatKeys} that transforms the keys from `dash-case`
 * to `snake_case`.
 *
 * @param options  The options to use.
 * @template T  The type of the returned object.
 */
export const dashToSnakeKeys = <T>(options: FormatKeysExtensionOptions): T =>
  formatKeys<T>({
    ...options,
    search: /([a-z])-([a-z])/g,
    replace: (_, firstLetter, secondLetter) => `${firstLetter}_${secondLetter}`,
  });
