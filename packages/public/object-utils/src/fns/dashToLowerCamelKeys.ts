import { formatKeys, type FormatKeysExtensionOptions } from './formatKeys';

export const dashToLowerCamelKeys = <T>(options: FormatKeysExtensionOptions): T =>
  formatKeys<T>({
    ...options,
    search: /([a-z])-([a-z])/g,
    replace: (_, firstLetter, secondLetter) => {
      const newSecondLetter = secondLetter.toUpperCase();
      return `${firstLetter}${newSecondLetter}`;
    },
  });
