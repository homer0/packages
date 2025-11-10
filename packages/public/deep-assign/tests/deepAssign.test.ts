jest.unmock('../src/deepAssign.js');

import { DeepAssign } from '../src/deepAssign.js';

describe('DeepAssign', () => {
  it('should throw an error when instantiated with an invalid `arrayMode` option', () => {
    // @ts-expect-error - We're testing the error.
    expect(() => new DeepAssign({ arrayMode: 'invalid' })).toThrow(/Invalid array mode/i);
  });

  it('should throw an error when assign is called without targets', () => {
    expect(() => new DeepAssign().assign()).toThrow(/No targets received/i);
  });

  it('should merge two objects', () => {
    // Given
    const targetA = {
      a: 'A',
      b: 'B',
      d: null,
    };
    const targetB = {
      b: 'X',
      c: 'C',
      e: null,
    };
    const expected = {
      ...targetA,
      ...targetB,
    };
    type ExpectedType = typeof expected;
    // When
    const sut = new DeepAssign();
    const result: ExpectedType = sut.assign<ExpectedType>(targetA, targetB);
    // Then
    expect(result).toEqual(expected);
  });

  it('should have a static method to construct the class and get the assign fn', () => {
    // Given
    const targetA = {
      a: 'A',
      b: 'B',
      d: null,
    };
    const targetB = {
      b: 'X',
      c: 'C',
      e: null,
    };
    const expected = {
      ...targetA,
      ...targetB,
    };
    type ExpectedType = typeof expected;
    // When
    const sut = DeepAssign.fn();
    const result: ExpectedType = sut<ExpectedType>(targetA, targetB);
    // Then
    expect(result).toEqual(expected);
  });

  it('should merge on top of an object with an undefined property', () => {
    // Given
    let undefinedOnA: undefined;
    const targetA = {
      a: 'A',
      b: 'B',
      d: null,
      undefinedOnA,
    };
    const targetB = {
      b: 'X',
      c: 'C',
      e: null,
    };
    const expected = {
      ...targetA,
      ...targetB,
    };
    type ExpectedType = typeof expected;
    // When
    const sut = new DeepAssign();
    const result: ExpectedType = sut.assign<ExpectedType>(targetA, targetB);
    // Then
    expect(result).toEqual(expected);
  });

  it('should merge an object with an undefined property', () => {
    // Given
    const targetA = {
      a: 'A',
      b: 'B',
      d: null,
    };
    let undefinedOnB: undefined;
    const targetB = {
      b: 'X',
      c: 'C',
      e: null,
      undefinedOnB,
    };
    const expected = {
      ...targetA,
      ...targetB,
    };
    type ExpectedType = typeof expected;
    // When
    const sut = new DeepAssign();
    const result: ExpectedType = sut.assign<ExpectedType>(targetA, targetB);
    // Then
    expect(result).toEqual(expected);
  });

  it('should merge two objects with symbols as keys', () => {
    // Given
    const keyOne = Symbol('key 1');
    const keyTwo = Symbol('key 2');
    const targetA = {
      a: 'A',
      b: 'B',
      [keyOne]: {
        d: 'D',
        [keyTwo]: {
          f: 'F',
        },
      },
      [keyTwo]: 'E',
    };
    const targetB = {
      b: 'X',
      c: 'C',
      [keyOne]: {
        dd: 'DD',
      },
    };
    // When
    const sut = new DeepAssign();
    const result = sut.assign(targetA, targetB);
    // Then
    expect(result).toEqual({
      a: 'A',
      b: 'X',
      c: 'C',
      [keyOne]: {
        d: 'D',
        dd: 'DD',
        [keyTwo]: {
          f: 'F',
        },
      },
      [keyTwo]: 'E',
    });
  });

  it('should remove the reference from the base objects', () => {
    // Given
    const targetA = {
      a: 'A',
      b: 'B',
    };
    const targetB = {
      b: 'X',
      c: 'C',
    };
    const changes: Record<string, string> = {
      a: 'A1',
      b: 'B1',
      c: 'C1',
    };
    // When
    const sut = new DeepAssign();
    const result = sut.assign<Record<string, unknown>>(targetA, targetB);
    Object.keys(changes).forEach((key) => {
      result[key] = changes[key];
    });
    // Then
    expect(result).toEqual(changes);
    expect(targetA).toEqual({
      a: 'A',
      b: 'B',
    });
    expect(targetB).toEqual({
      b: 'X',
      c: 'C',
    });
  });

  it('should merge a sub object from the second target without leaving references', () => {
    // Given
    const targetA = {
      a: 'A',
      b: 'B',
    };
    const targetB = {
      b: 'X',
      c: 'C',
      d: {
        e: 'E',
      },
    };
    // When
    const sut = new DeepAssign();
    const result = sut.assign<typeof targetA & typeof targetB>(targetA, targetB);
    result.d.e = 'X';
    // Then
    expect(result).toEqual({
      a: 'A',
      b: 'X',
      c: 'C',
      d: {
        e: 'X',
      },
    });
    expect(targetA).toEqual({
      a: 'A',
      b: 'B',
    });
    expect(targetB).toEqual({
      b: 'X',
      c: 'C',
      d: {
        e: 'E',
      },
    });
  });

  it('should merge sub objects without leaving references', () => {
    // Given
    const targetA = {
      a: 'A',
      b: 'B',
      d: {
        e: {
          f: 'F',
          g: {
            h: 'H',
          },
        },
      },
      j: {
        k: 'K',
      },
    };
    const targetB = {
      b: 'X',
      c: 'C',
      d: {
        e: {
          f: 'X',
          i: 'I',
        },
      },
    };
    // When
    const sut = new DeepAssign();
    const result = sut.assign<typeof targetA & typeof targetB>(targetA, targetB);
    result.a = 'X';
    result.d.e.f = 'X';
    result.j.k = 'X';
    // Then
    expect(result).toEqual({
      a: 'X',
      b: 'X',
      c: 'C',
      d: {
        e: {
          f: 'X',
          g: {
            h: 'H',
          },
          i: 'I',
        },
      },
      j: {
        k: 'X',
      },
    });
    expect(targetA).toEqual({
      a: 'A',
      b: 'B',
      d: {
        e: {
          f: 'F',
          g: {
            h: 'H',
          },
        },
      },
      j: {
        k: 'K',
      },
    });
    expect(targetB).toEqual({
      b: 'X',
      c: 'C',
      d: {
        e: {
          f: 'X',
          i: 'I',
        },
      },
    });
  });

  it('should ignore a non-object and non-array item', () => {
    // Given
    const targetA = {
      a: 'A',
      b: 'B',
    };
    const targetB = {
      b: 'X',
      c: 'C',
    };
    const targetC = 'Batman';
    const expected = {
      ...targetA,
      ...targetB,
    };
    // When
    const sut = new DeepAssign();
    const result = sut.assign(targetA, targetB, targetC);
    // Then
    expect(result).toEqual(expected);
  });

  it('should merge arrays inside an object without concatenation', () => {
    // Given
    const targetA = {
      a: 'A',
      b: 'B',
      d: ['D', 'E', 'F'],
    };
    const targetB = {
      b: 'X',
      c: 'C',
      d: ['D', 'XE'],
    };
    const expected = {
      ...targetA,
      ...targetB,
      d: ['D', 'XE', 'F'],
    };
    // When
    const sut = new DeepAssign();
    const result = sut.assign(targetA, targetB);
    // Then
    expect(result).toEqual(expected);
  });

  it('should merge two arrays', () => {
    // Given
    const targetA = [{ A: 'A' }, 'E', 'F'];
    const targetB = [{ B: 'B' }, 'XE'];
    const expected = [{ A: 'A', B: 'B' }, 'XE', 'F'];
    // When
    const sut = new DeepAssign();
    const result = sut.assign(targetA, targetB);
    // Then
    expect(result).toEqual(expected);
  });

  it('should do a shallow merge of two arrays', () => {
    // Given
    const targetA = [{ A: 'A' }, 'E', 'F'];
    const targetB = [{ B: 'B' }, 'XE'];
    const expected = [{ B: 'B' }, 'XE', 'F'];
    // When
    const sut = new DeepAssign({
      arrayMode: 'shallowMerge',
    });
    const result = sut.assign(targetA, targetB);
    // Then
    expect(result).toEqual(expected);
  });

  it('should merge two arrays with the `merge` mode even if other one is specified', () => {
    // Given
    const targetA = ['D', 'E', 'F'];
    const targetB = ['D', 'XE'];
    const expected = ['D', 'XE', 'F'];
    // When
    const sut = new DeepAssign({ arrayMode: 'concat' });
    const result = sut.assign(targetA, targetB);
    // Then
    expect(result).toEqual(expected);
  });

  it('should merge arrays inside an object by concatenating them', () => {
    // Given
    const targetA = {
      a: 'A',
      b: 'B',
      d: ['D', 'E', 'F'],
    };
    const targetB = {
      b: 'X',
      c: 'C',
      d: ['D', 'XE'],
    };
    const expected = {
      ...targetA,
      ...targetB,
      d: [...targetA.d, ...targetB.d],
    };
    // When
    const sut = new DeepAssign({
      arrayMode: 'concat',
    });
    const result = sut.assign(targetA, targetB);
    // Then
    expect(sut.options).toEqual({
      arrayMode: 'concat',
    });
    expect(result).toEqual(expected);
  });

  it('should overwrite an array inside an object', () => {
    // Given
    const targetA = {
      a: 'A',
      b: 'B',
      d: ['D', 'E', 'F'],
    };
    const targetB = {
      b: 'X',
      c: 'C',
      d: ['D', 'XE'],
    };
    const expected = {
      ...targetA,
      ...targetB,
    };
    // When
    const sut = new DeepAssign({
      arrayMode: 'overwrite',
    });
    const result = sut.assign(targetA, targetB);
    // Then
    expect(sut.options).toEqual({
      arrayMode: 'overwrite',
    });
    expect(result).toEqual(expected);
  });

  it('should merge arrays with objects inside', () => {
    // Given
    type TargetA = {
      a: string;
      b: string;
      d: [
        { d: string } & Record<string, string>,
        { e: string; eee: string },
        string,
        [
          {
            g: string;
            h: string[];
            taI?: string;
          },
          string?,
        ],
      ];
    };
    const targetA: TargetA = {
      a: 'A',
      b: 'B',
      d: [
        { d: 'D' },
        { e: 'E', eee: 'EEE' },
        'F',
        [
          {
            g: 'G',
            h: ['i'],
          },
        ],
      ],
    };
    type TargetB = {
      b: string;
      c: string;
      d: [
        string,
        {
          e: string;
          ee: string;
        },
      ];
    };
    const targetB: TargetB = {
      b: 'X',
      c: 'C',
      d: ['D', { e: 'X', ee: 'XX' }],
    };
    type ExpectedType = {
      a: string;
      b: string;
      c: string;
      d: [
        ({ d: string } & Record<string, string>) | string,
        { e: string; ee: string; eee: string },
        string,
        [
          {
            g: string;
            h: string[];
            taI?: string;
          },
          string?,
        ],
      ];
    };
    // When
    const sut = new DeepAssign();
    const result = sut.assign<ExpectedType>(targetA, targetB);
    targetA.d.push('taE');
    // eslint-disable-next-line dot-notation
    targetA.d[0]['tE'] = 'taE';
    targetA.d[3].push('taG');
    targetA.d[3][0].taI = 'taI';
    targetA.d[3][0].h.push('taI');
    result.d[0] = 'DD';
    result.d[3].push('gg');
    result.d[3][0].h.push('ii');
    // Then
    expect(result).toEqual({
      a: 'A',
      b: 'X',
      c: 'C',
      d: [
        'DD',
        {
          e: 'X',
          ee: 'XX',
          eee: 'EEE',
        },
        'F',
        [
          {
            g: 'G',
            h: ['i', 'ii'],
          },
          'gg',
        ],
      ],
    });
    expect(targetA).toEqual({
      a: 'A',
      b: 'B',
      d: [
        { d: 'D', tE: 'taE' },
        { e: 'E', eee: 'EEE' },
        'F',
        [
          {
            g: 'G',
            h: ['i', 'taI'],
            taI: 'taI',
          },
          'taG',
        ],
        'taE',
      ],
    });
  });
});
