jest.unmock('@src/fns/formatKeys.js');

import { formatKeys } from '@src/fns/formatKeys.js';

describe('formatKeys', () => {
  it('should make all keys first letters into upper case', () => {
    // Given
    const name = 'Rosario';
    const nickname = 'Charito';
    const age = 3;
    const target = {
      name,
      nickname,
      age,
    };
    type ExpectedType = { Name: string; Nickname: string; Age: number };
    // When
    const result: ExpectedType = formatKeys<ExpectedType>({
      target,
      search: /^\w/,
      replace: (letter) => letter.toUpperCase(),
    });
    // Then
    expect(result).toEqual({
      Name: name,
      Nickname: nickname,
      Age: age,
    });
  });

  it('should make all keys first letters into upper case (null and undefined)', () => {
    // Given
    const name = 'Rosario';
    const nickname = 'Charito';
    const age = 3;
    const likes = null;
    const hates = undefined;
    const target = {
      name,
      nickname,
      age,
      likes,
      hates,
    };
    type ExpectedType = {
      Name: string;
      Nickname: string;
      Age: number;
      likes: null;
      hates: undefined;
    };
    // When
    const result: ExpectedType = formatKeys<ExpectedType>({
      target,
      search: /^\w/,
      replace: (letter) => letter.toUpperCase(),
    });
    // Then
    expect(result).toEqual({
      Name: name,
      Nickname: nickname,
      Age: age,
      Likes: likes,
      Hates: hates,
    });
  });

  it('should make specific keys first letters into upper case', () => {
    // Given
    const first = 'Rosario';
    const nickname = 'Charito';
    const age = 3;
    const likes = 'ice-cream';
    const target = {
      name: {
        first,
        nickname,
      },
      age,
      likes,
    };
    type ExpectedType = {
      name: {
        First: string;
        nickname: string;
      };
      age: number;
      Likes: string;
    };
    // When
    const result: ExpectedType = formatKeys<ExpectedType>({
      target,
      search: /^\w/,
      replace: (letter) => letter.toUpperCase(),
      include: ['name.first', 'likes'],
    });
    // Then
    expect(result).toEqual({
      name: {
        First: first,
        nickname,
      },
      age,
      Likes: likes,
    });
  });

  it('should make specific keys first letters into upper case (incomplete paths)', () => {
    // Given
    const first = 'Rosario';
    const nickname = 'Charito';
    const age = 3;
    const likes = 'ice-cream';
    const target = {
      name: {
        first,
        nickname,
      },
      age,
      likes,
    };
    type ExpectedType = {
      name: {
        First: string;
        Nickname: string;
      };
      age: number;
      Likes: string;
    };
    // When
    const result: ExpectedType = formatKeys<ExpectedType>({
      target,
      search: /^\w/,
      replace: (letter) => letter.toUpperCase(),
      include: ['name.first.', '.name.nickname.', 'likes'],
    });
    // Then
    expect(result).toEqual({
      name: {
        First: first,
        Nickname: nickname,
      },
      age,
      Likes: likes,
    });
  });

  it('should exclude some keys when transforming them', () => {
    // Given
    const first = 'Rosario';
    const nickname = 'Charito';
    const age = 3;
    const likes = 'ice-cream';
    const target = {
      name: {
        first,
        nickname,
      },
      age,
      likes,
    };
    type ExpectedType = {
      Name: {
        first: string;
        Nickname: string;
      };
      Age: number;
      likes: string;
    };
    // When
    const result: ExpectedType = formatKeys<ExpectedType>({
      target,
      search: /^\w/,
      replace: (letter) => letter.toUpperCase(),
      include: [],
      exclude: ['name.first', 'likes'],
    });
    // Then
    expect(result).toEqual({
      Name: {
        first,
        Nickname: nickname,
      },
      Age: age,
      likes,
    });
  });

  it('should exclude some keys when transforming them (incomplete paths)', () => {
    // Given
    const first = 'Rosario';
    const nickname = 'Charito';
    const age = 3;
    const likes = 'ice-cream';
    const target = {
      name: {
        first,
        nickname,
      },
      age,
      likes,
    };
    type ExpectedType = {
      Name: {
        first: string;
        nickname: string;
      };
      Age: number;
      likes: string;
    };
    // When
    const result: ExpectedType = formatKeys<ExpectedType>({
      target,
      search: /^\w/,
      replace: (letter) => letter.toUpperCase(),
      exclude: ['name.first.', '.name.nickname.', '.likes'],
    });
    // Then
    expect(result).toEqual({
      Name: {
        first,
        nickname,
      },
      Age: age,
      likes,
    });
  });
});
