import { formatKeys, type FormatKeysExtensionOptions } from './formatKeys.js';

/**
 * A shorthand method for {@link formatKeys} that transforms the keys from `lowerCamelCase`
 * to `dash-case`.
 *
 * @template T The type of the returned object.
 * @param options The options to use.
 */
export const lowerCamelToDashKeys = <T>(options: FormatKeysExtensionOptions): T =>
  formatKeys<T>({
    ...options,
    search: /([a-z])([A-Z])/g,
    replace: (_, firstLetter, secondLetter) => {
      const newSecondLetter = secondLetter.toLowerCase();
      return `${firstLetter}-${newSecondLetter}`;
    },
  });
