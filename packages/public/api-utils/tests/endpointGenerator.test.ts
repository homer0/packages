jest.unmock('../src/endpointsGenerator');

import { EndpointsGenerator, endpointsGenerator } from '../src/endpointsGenerator.js';
import type { EndpointsDict } from '../src/types.js';

describe('EndpointsGenertor', () => {
  it('should be correctly initialized', () => {
    // Given
    const url = 'http://homer0.dev';
    const endpoints: EndpointsDict = {};
    // When
    const sut = new EndpointsGenerator({
      url,
      endpoints,
    });
    // Then
    expect(sut).toBeInstanceOf(EndpointsGenerator);
    expect(sut.getUrl()).toBe(url);
  });

  it('should format a list of endpoints', () => {
    // Given
    const endpoints = {
      one: 'one',
      two: {
        three: {
          path: 'two/three',
        },
        four: {
          five: 'two/four/five',
        },
        six: 'two/six',
      },
    };
    // When
    const sut = new EndpointsGenerator({
      url: '',
      endpoints,
    });
    const result = sut.getEndpoints();
    // Then
    expect(result).toEqual({
      one: endpoints.one,
      'two.three': endpoints.two.three,
      'two.four.five': endpoints.two.four.five,
      'two.six': endpoints.two.six,
    });
  });

  it('should generate a simple endpoint URL', () => {
    // Given
    const url = 'https://homer0.dev/';
    const endpoints = {
      two: {
        four: {
          five: '/two/four/five',
        },
      },
    };
    // - The 1 is for the leading `/`, to validate it gets removed.
    const expected = `${url}${endpoints.two.four.five.substring(1)}`;
    // When
    const sut = new EndpointsGenerator({
      url,
      endpoints,
    });
    const result = sut.get('two.four.five');
    // Then
    expect(result).toBe(expected);
  });

  it('should generate a simple endpoint URL (dict format)', () => {
    // Given
    const url = 'https://homer0.dev/';
    const endpoints = {
      two: {
        four: {
          five: {
            path: '/two/four/five',
          },
        },
      },
    };
    // - The 1 is for the leading `/`, to validate it gets removed.
    const expected = `${url}${endpoints.two.four.five.path.substring(1)}`;
    // When
    const sut = new EndpointsGenerator({
      url,
      endpoints,
    });
    const result = sut.get('two.four.five');
    // Then
    expect(result).toBe(expected);
  });

  it('should generate an endpoint URL with params', () => {
    // Given
    const url = 'https://homer0.dev';
    const endpoints = {
      users: {
        byName: 'users/:name',
      },
    };
    const param = 'charito';
    const expected = `${url}/users/${param}`;
    // When
    const sut = new EndpointsGenerator({
      url,
      endpoints,
    });
    const result = sut.get('users.byName', { name: param });
    // Then
    expect(result).toBe(expected);
  });

  it('should generate an endpoint URL with params and custom placeholder format', () => {
    // Given
    const url = 'https://homer0.dev';
    const endpoints = {
      users: {
        byName: 'users/{{name}}/{{format}}',
      },
    };
    const nameParam = 'charito';
    const formatParam = 'json';
    const expected = `${url}/users/${nameParam}/${formatParam}`;
    // When
    const sut = new EndpointsGenerator({
      url,
      endpoints,
      paramsPlaceholder: '{{%name%}}',
    });
    const result = sut.get('users.byName', { name: nameParam, format: formatParam });
    // Then
    expect(result).toBe(expected);
  });

  it('should generate an endpoint URL with unknown params as query string', () => {
    // Given
    const url = 'https://homer0.dev';
    const endpoints = {
      users: {
        byName: 'users/:name',
      },
    };
    const nameParam = 'charito';
    const formatParam = 'json';
    const expected = `${url}/users/${nameParam}?format=${formatParam}`;
    // When
    const sut = new EndpointsGenerator({
      url,
      endpoints,
    });
    const result = sut.get('users.byName', { name: nameParam, format: formatParam });
    // Then
    expect(result).toBe(expected);
  });

  it('should generate an endpoint URL with default query string', () => {
    // Given
    const url = 'https://homer0.dev';
    const endpoints = {
      users: {
        byName: {
          path: 'users/:name',
          query: {
            format: 'json',
            unused: null,
          },
        },
      },
    };
    const nameParam = 'pili';
    const expected = `${url}/users/${nameParam}?format=${endpoints.users.byName.query.format}`;
    // When
    const sut = new EndpointsGenerator({
      url,
      endpoints,
    });
    const result = sut.get('users.byName', { name: nameParam });
    // Then
    expect(result).toBe(expected);
  });

  it('should generate an endpoint URL overwriting default query string', () => {
    // Given
    const url = 'https://homer0.dev';
    const endpoints = {
      users: {
        byName: {
          path: 'users/:name',
          query: {
            format: 'json',
          },
        },
      },
    };
    const nameParam = 'pili';
    const formatParam = 'xml';
    const expected = `${url}/users/${nameParam}?format=${formatParam}`;
    // When
    const sut = new EndpointsGenerator({
      url,
      endpoints,
    });
    const result = sut.get('users.byName', { name: nameParam, format: formatParam });
    // Then
    expect(result).toBe(expected);
  });

  it('should throw an error when trying to access an unknown endpoint', () => {
    // Given/When/Then
    const sut = new EndpointsGenerator({
      url: '',
      endpoints: {},
    });
    expect(() => sut.get('invalid')).toThrow(
      /trying to access unknown endpoint: invalid/i,
    );
  });

  it('should have a shorthand function', () => {
    // Given/When
    const sut = endpointsGenerator({
      url: '',
      endpoints: {},
    });
    // Then
    expect(sut).toBeInstanceOf(EndpointsGenerator);
  });
});
