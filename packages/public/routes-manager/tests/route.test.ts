import { Route } from '@src/route';

describe('Route', () => {
  describe('constructor', () => {
    it('should create an instance', () => {
      // Given
      const def = {
        path: '/home',
      } as const;
      // When
      const sut = new Route(def);
      // Then
      expect(sut).toBeInstanceOf(Route);
      expect(sut.definition).toBe(def);
      expect(sut.format).toEqual(expect.any(Function));
    });

    it('should throw an error when the path has a param not defined', () => {
      // Given/When/Then
      expect(() => new Route({ path: '/:id' })).toThrow(
        "Route param 'id' is not defined in the params array",
      );
    });

    it('should throw an error if a defined param is not in the path', () => {
      // Given/When/Then
      expect(() => new Route({ path: '/home', params: ['id'] })).toThrow(
        "Route param 'id' is defined in the params array but not in the path",
      );
    });

    it('should be constructed with defined params', () => {
      // Given
      const def = {
        path: '/users/:id',
        params: ['id'],
      } as const;
      // When
      const sut = new Route(def);
      // Then
      expect(sut).toBeInstanceOf(Route);
    });
  });

  describe('format', () => {
    it('should throw an error when params are required', () => {
      // Given
      const sut = new Route({ path: '/home/:id', params: ['id'] });
      // When/Then
      // @ts-expect-error Testing invalid params
      expect(() => sut.format()).toThrow('Route params are required');
      // @ts-expect-error Testing invalid params
      expect(() => sut.format(undefined)).toThrow('Route params are required');
    });

    it.each([
      ['1', '/home/1'] as const,
      ['2', '/home/subpath'] as const,
      ['3', '/home/subpath/subpath'] as const,
    ])('should format the path without params for case #%s', (_, path) => {
      // Given
      const sut = new Route({ path });
      // When
      const result = sut.format();
      // Then
      expect(result).toBe(path);
    });

    it('should throw an error when a required param is missing', () => {
      // Given
      const sut = new Route({ path: '/home/:id', params: ['id'] });
      // When/Then
      expect(() => sut.format({})).toThrow('Missing required param: id');
    });

    it('should throw an error when a required query param is missing', () => {
      // Given
      const sut = new Route({ path: '/home', queryParams: ['id'] });
      // When/Then
      expect(() => sut.format({})).toThrow('Missing required query param: id');
    });

    it.each([
      [
        '1',
        { path: '/home/users/:id', params: ['id'] },
        { id: '1' },
        '/home/users/1',
      ] as const,
      [
        '2',
        { path: '/sections/:name/:id', params: ['name', 'id'] },
        { name: 'section', id: '2' },
        '/sections/section/2',
      ] as const,
      [
        '3',
        { path: '/home/users/:id', params: ['id'], queryParams: ['profile'] },
        { id: '3', profile: 'true' },
        '/home/users/3?profile=true',
      ] as const,
      [
        '4',
        { path: '/home/users/:id', params: ['id'] },
        { id: '4', extra: 'extra', profile: 'true' },
        '/home/users/4?extra=extra&profile=true',
      ] as const,
    ])(`should format the path with params for case #%s`, (_, def, params, expected) => {
      // Given
      const sut = new Route(def);
      // When
      const result = sut.format(params);
      // Then
      expect(result).toBe(expected);
    });
  });
});
