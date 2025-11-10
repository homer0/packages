import {
  isRouteStringDefinition,
  isRouteDetailDefinition,
  isRouteDefinition,
  ensureStringPath,
  prefixPath,
  prefixName,
  getParams,
  getPathWithParams,
  formatRouteDefinition,
  formatGroup,
  formatRoutes,
} from '@src/formatter.js';

describe('createRoute', () => {
  describe('isRouteStringDefinition', () => {
    it.each([
      [true, 'a path', '/string' as const],
      [false, 'an object', { path: '/string' } as const],
    ])('should return %s for %s', (expected, _, value) => {
      expect(isRouteStringDefinition(value)).toBe(expected);
    });
  });

  describe('isRouteDetailDefinition', () => {
    it.each([
      [true, 'a definition', { path: '/string' } as const],
      [false, 'a group', { root: '/string' } as const],
    ])(`should return %s for %s`, (expected, _, value) => {
      expect(isRouteDetailDefinition(value)).toBe(expected);
    });
  });

  describe('isRouteDefinition', () => {
    it.each([
      [true, 'a string', '/string' as const],
      [true, 'a definition', { path: '/string' } as const],
      [false, 'a group', { root: '/string' } as const],
    ])(`should return %s for %s`, (expected, _, value) => {
      expect(isRouteDefinition(value)).toBe(expected);
    });
  });

  describe('ensureStringPath', () => {
    it.each([
      ['the same string', '/string' as const],
      ['the path property', { path: '/string' } as const],
    ])(`should return %s`, (_, value) => {
      expect(ensureStringPath(value)).toBe('/string');
    });
  });

  describe('prefixPath', () => {
    it.each([
      ['1', '/root' as const, '/' as const, '/root'],
      ['2', { path: '/root' } as const, '/' as const, '/root'],
      ['3', '/root' as const, { path: '/' } as const, '/root'],
      ['4', { path: '/root' } as const, { path: '/' } as const, '/root'],
      ['5', '/settings' as const, '/root/account' as const, '/root/account/settings'],
      [
        '6',
        { path: '/settings' } as const,
        '/root/account' as const,
        '/root/account/settings',
      ],
      [
        '7',
        '/settings' as const,
        { path: '/root/account' } as const,
        '/root/account/settings',
      ],
      [
        '8',
        { path: '/settings' } as const,
        { path: '/root/account' } as const,
        '/root/account/settings',
      ],
    ])(`should return a valid result for case #%s`, (_, path, root, expected) => {
      expect(prefixPath(path, root)).toBe(expected);
    });
  });

  describe('prefixName', () => {
    it.each([
      ['1', 'name', '', 'name'],
      ['2', 'name', 'parent', 'parent.name'],
      ['3', 'name', 'parent.child', 'parent.child.name'],
    ])(`should return a valid result for case #%s`, (_, name, parent, expected) => {
      expect(prefixName(name, parent)).toBe(expected);
    });
  });

  describe('getParams', () => {
    it.each([
      ['1', '/path', []],
      ['2', '/path/:id', ['id']],
      ['3', '/path/:id/:name', ['id', 'name']],
      ['4', '/path/:id/hello/:age', ['id', 'age']],
    ])(`should return a valid result for case #%s`, (_, path, expected) => {
      expect(getParams(path)).toEqual(expected);
    });
  });

  describe('getPathWithParams', () => {
    it.each([
      ['1', '/path', { path: '/path' }],
      ['2', '/path/:id', { path: '/path/:id', params: ['id'] }],
      ['3', '/path/:id/:name', { path: '/path/:id/:name', params: ['id', 'name'] }],
      [
        '4',
        '/path/:id/hello/:age',
        { path: '/path/:id/hello/:age', params: ['id', 'age'] },
      ],
    ])('should return a valid result for case #%s', (_, path, expected) => {
      expect(getPathWithParams(path)).toEqual(expected);
    });
  });

  describe('formatRouteDefinition', () => {
    it.each([
      ['1', '/path' as const, '/' as const, { path: '/path' }],
      ['2', '/path/:id' as const, '/' as const, { path: '/path/:id', params: ['id'] }],
      [
        '3',
        '/path/:id/:name' as const,
        '/' as const,
        { path: '/path/:id/:name', params: ['id', 'name'] },
      ],
      ['4', '/path' as const, '/root' as const, { path: '/root/path' }],
      [
        '5',
        '/path/:id' as const,
        '/root' as const,
        { path: '/root/path/:id', params: ['id'] },
      ],
      [
        '6',
        '/path/:id/:name' as const,
        '/root' as const,
        { path: '/root/path/:id/:name', params: ['id', 'name'] },
      ],
      [
        '7',
        { path: '/path' as const, comments: 'something' },
        '/' as const,
        { path: '/path', comments: 'something' },
      ],
      [
        '8',
        { path: '/path/:id' } as const,
        '/' as const,
        { path: '/path/:id', params: ['id'] },
      ],
      [
        '9',
        { path: '/path/:id/:name' as const, queryParams: ['limit'] },
        '/' as const,
        {
          path: '/path/:id/:name',
          params: ['id', 'name'],
          queryParams: ['limit'],
        },
      ],
      [
        '10',
        { path: '/path' as const, optionalQueryParams: ['size'] },
        '/root' as const,
        { path: '/root/path', optionalQueryParams: ['size'] },
      ],
      [
        '11',
        {
          path: '/path/:id' as const,
          comments: 'something',
          queryParams: ['limit'],
          optionalQueryParams: ['size'],
        },
        '/root' as const,
        {
          path: '/root/path/:id',
          params: ['id'],
          comments: 'something',
          queryParams: ['limit'],
          optionalQueryParams: ['size'],
        },
      ],
    ])('should return a valid result for case #%s', (_, path, root, expected) => {
      expect(formatRouteDefinition(path, root)).toEqual(expected);
    });
  });

  describe('formatGroup', () => {
    it.each([
      [
        '1',
        {
          root: '/',
          home: '/',
        } as const,
        '',
        '/' as const,
        {
          home: { path: '/' },
        },
      ],
      [
        '2',
        {
          root: '/',
          home: '/',
          login: {
            path: '/login',
            optionalQueryParams: ['redirectTo'],
          },
          logout: '/sign-out',
        } as const,
        '',
        '/' as const,
        {
          home: { path: '/' },
          login: {
            path: '/login',
            optionalQueryParams: ['redirectTo'],
          },
          logout: { path: '/sign-out' },
        },
      ],
      [
        '3',
        {
          root: '/',
          home: '/',
          account: {
            root: '/user',
            login: {
              path: '/login',
              optionalQueryParams: ['redirectTo'],
            },
            logout: '/sign-out',
          },
        } as const,
        '',
        '/' as const,
        {
          home: { path: '/' },
          'account.login': {
            path: '/user/login',
            optionalQueryParams: ['redirectTo'],
          },
          'account.logout': { path: '/user/sign-out' },
        },
      ],
      [
        '4',
        {
          root: '/user',
          login: {
            path: '/login',
            optionalQueryParams: ['redirectTo'],
          },
          logout: '/sign-out',
          settings: {
            root: '/settings/:profile/user',
            connections: '/connections/:id',
            emails: {
              root: '/emails',
              inbox: '/inbox',
              sent: '/sent',
            },
            memberships: '/memberships',
            removeMe: '/remove-account',
          },
        } as const,
        'app',
        '/app' as const,
        {
          'app.login': {
            path: '/app/user/login',
            optionalQueryParams: ['redirectTo'],
          },
          'app.logout': { path: '/app/user/sign-out' },
          'app.settings.connections': {
            path: '/app/user/settings/:profile/user/connections/:id',
            params: ['profile', 'id'],
          },
          'app.settings.emails.inbox': {
            path: '/app/user/settings/:profile/user/emails/inbox',
            params: ['profile'],
          },
          'app.settings.emails.sent': {
            path: '/app/user/settings/:profile/user/emails/sent',
            params: ['profile'],
          },
          'app.settings.memberships': {
            path: '/app/user/settings/:profile/user/memberships',
            params: ['profile'],
          },
          'app.settings.removeMe': {
            path: '/app/user/settings/:profile/user/remove-account',
            params: ['profile'],
          },
        },
      ],
    ])(
      `should return a valid result for case #%s`,
      (_, group, parentName, parentRoot, expected) => {
        expect(formatGroup(group, parentName, parentRoot)).toEqual(expected);
      },
    );
  });

  describe('formatRoutes', () => {
    it.each([
      [
        '1',
        {
          root: '/',
          home: '/',
        } as const,
        {
          home: { path: '/' },
        },
      ],
      [
        '2',
        {
          root: '/',
          home: '/',
          login: {
            path: '/login',
            optionalQueryParams: ['redirectTo'],
          },
          logout: '/sign-out',
        } as const,
        {
          home: { path: '/' },
          login: {
            path: '/login',
            optionalQueryParams: ['redirectTo'],
          },
          logout: { path: '/sign-out' },
        },
      ],
      [
        '3',
        {
          root: '/',
          home: '/',
          account: {
            root: '/user',
            login: {
              path: '/login',
              optionalQueryParams: ['redirectTo'],
            },
            logout: '/sign-out',
          },
        } as const,
        {
          home: { path: '/' },
          'account.login': {
            path: '/user/login',
            optionalQueryParams: ['redirectTo'],
          },
          'account.logout': { path: '/user/sign-out' },
        },
      ],
      [
        '4',
        {
          root: '/sub-route',
          home: '/',
          account: {
            root: '/user',
            login: {
              path: '/login',
              optionalQueryParams: ['redirectTo'],
            },
            logout: '/sign-out',
          },
        } as const,
        {
          home: { path: '/sub-route/' },
          'account.login': {
            path: '/sub-route/user/login',
            optionalQueryParams: ['redirectTo'],
          },
          'account.logout': { path: '/sub-route/user/sign-out' },
        },
      ],
    ])(`should return a valid result for case #%s`, (_, group, expected) => {
      expect(formatRoutes(group)).toEqual(expected);
    });
  });
});
