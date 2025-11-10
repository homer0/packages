import { formatKeys, type FormatKeysExtensionOptions } from './formatKeys.js';

/**
 * A shorthand method for {@link formatKeys} that transforms the keys from `snake_case` to
 * `lowerCamelCase`.
 *
 * @param options  The options to use.
 * @template T  The type of the returned object.
 */
export const snakeToLowerCamelKeys = <T>(options: FormatKeysExtensionOptions): T =>
  formatKeys<T>({
    ...options,
    search: /([a-z])_([a-z])/g,
    replace: (_, firstLetter, secondLetter) => {
      const newSecondLetter = secondLetter.toUpperCase();
      return `${firstLetter}${newSecondLetter}`;
    },
  });
