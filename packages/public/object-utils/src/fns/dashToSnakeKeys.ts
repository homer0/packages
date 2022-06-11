import { formatKeys, type FormatKeysExtensionOptions } from './formatKeys';

export const dashToSnakeKeys = <T>(options: FormatKeysExtensionOptions): T =>
  formatKeys<T>({
    ...options,
    search: /([a-z])-([a-z])/g,
    replace: (_, firstLetter, secondLetter) => `${firstLetter}_${secondLetter}`,
  });
