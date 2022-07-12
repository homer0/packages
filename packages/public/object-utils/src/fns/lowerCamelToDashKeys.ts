import { formatKeys, type FormatKeysExtensionOptions } from './formatKeys';

/**
 * A shorthand method for {@link formatKeys} that transforms the keys from
 * `lowerCamelCase` to `dash-case`.
 *
 * @param options  The options to use.
 * @template T  The type of the returned object.
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
