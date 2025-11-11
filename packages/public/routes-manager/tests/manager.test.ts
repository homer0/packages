import { describe, expect, it } from 'vitest';
import type { IsEqual } from 'type-fest';
import { Route } from '@src/route.js';
import { RoutesManager, createRoutesManager } from '@src/manager.js';

describe('RoutsManager', () => {
  const dummyRoutes = {
    root: '/',
    home: '/',
    login: {
      path: '/login',
      optionalQueryParams: ['redirectTo'],
    },
    logout: '/sign-out',
    account: {
      root: '/account',
      settings: {
        root: '/settings',
        connections: '/connections',
        emails: '/emails',
        memberships: '/memberships',
        removeMe: {
          path: '/remove-account',
          queryParams: ['confirm'],
        },
      },
    },
    dashboard: {
      root: '/dashboard',
      hubOverview: '/:hubSlug/overview',
      createHub: '/create',
      sponsors: {
        root: '/:hubSlug/sponsors',
        create: '/create',
      },
    },
  } as const;
  const formattedDummyRoutes = {
    home: {
      path: '/',
    },
    login: {
      path: '/login',
      optionalQueryParams: ['redirectTo'],
    },
    logout: {
      path: '/sign-out',
    },
    'account.settings.connections': {
      path: '/account/settings/connections',
    },
    'account.settings.emails': {
      path: '/account/settings/emails',
    },
    'account.settings.memberships': {
      path: '/account/settings/memberships',
    },
    'account.settings.removeMe': {
      path: '/account/settings/remove-account',
      queryParams: ['confirm'],
    },
    'dashboard.hubOverview': {
      path: '/dashboard/:hubSlug/overview',
      params: ['hubSlug'],
    },
    'dashboard.createHub': {
      path: '/dashboard/create',
    },
    'dashboard.sponsors.create': {
      path: '/dashboard/:hubSlug/sponsors/create',
      params: ['hubSlug'],
    },
  } as const;

  type FormattedDummyRoutes = typeof formattedDummyRoutes;

  describe('constructor', () => {
    it('should create an instance', () => {
      // Given/When
      const sut = new RoutesManager(dummyRoutes);
      const definitions = sut.getDefinitions();
      // Then
      expect(sut).toBeInstanceOf(RoutesManager);
      expect(definitions).toEqual(formattedDummyRoutes);
      expect(sut.getDefinition).toEqual(expect.any(Function));
      expect(sut.getDefinitions).toEqual(expect.any(Function));
      expect(sut.getPath).toEqual(expect.any(Function));
      expect(sut.getRoute).toEqual(expect.any(Function));
      expect(sut.getRoutes).toEqual(expect.any(Function));
    });

    it('should be instantiated from the shorthand function', () => {
      // Given/When
      const sut = createRoutesManager(dummyRoutes);
      const definitions = sut.getDefinitions();
      // Then
      expect(sut).toBeInstanceOf(RoutesManager);
      expect(definitions).toEqual(formattedDummyRoutes);
    });
  });

  it('should return all formatted definitions', () => {
    // Given/When
    const sut = new RoutesManager(dummyRoutes);
    const definitions = sut.getDefinitions();
    type FormattedDefinitions = typeof definitions;
    type DefinitionsMatch = IsEqual<FormattedDefinitions, FormattedDummyRoutes>;
    const match: DefinitionsMatch = true;
    // Then
    expect(definitions).toEqual(formattedDummyRoutes);
    expect(match).toBe(true);
  });

  it('should get all routes', () => {
    // Given
    const expectedRoutes = Object.keys(formattedDummyRoutes).reduce<
      Record<string, unknown>
    >((acc, key) => {
      acc[key] = expect.any(Route);
      return acc;
    }, {});
    // When
    const sut = new RoutesManager(dummyRoutes);
    const routes = sut.getRoutes();
    // Then
    expect(routes).toEqual(expectedRoutes);
  });

  describe('getDefinition', () => {
    it('should throw an error when the definition is not found', () => {
      // Given
      const manager = new RoutesManager(dummyRoutes);
      // When/Then
      // @ts-expect-error Testing invalid key
      expect(() => manager.getDefinition('notFound')).toThrow(
        "Definition not found for key 'notFound'",
      );
    });

    it('should get a definition', () => {
      // Given
      const manager = new RoutesManager(dummyRoutes);
      // When/Then
      Object.entries(formattedDummyRoutes).forEach(([key, value]) => {
        expect(manager.getDefinition(key as keyof FormattedDummyRoutes)).toEqual(value);
      });
    });
  });

  describe('getRoute', () => {
    it('should throw an error when the route is not found', () => {
      // Given
      const manager = new RoutesManager(dummyRoutes);
      // When/Then
      // @ts-expect-error Testing invalid key
      expect(() => manager.getRoute('notFound')).toThrow(
        "Route not found for key 'notFound'",
      );
    });

    it('should get a route', () => {
      // Given
      const manager = new RoutesManager(dummyRoutes);
      // When/Then
      Object.entries(formattedDummyRoutes).forEach(([key, value]) => {
        const route = manager.getRoute(key as keyof FormattedDummyRoutes);
        expect(route).toBeInstanceOf(Route);
        expect(route.definition).toEqual(value);
      });
    });
  });

  describe('getPath', () => {
    it('should format a simple path', () => {
      // Given
      const manager = new RoutesManager(dummyRoutes);
      // When
      const sut = manager.getPath('home');
      // Then
      expect(sut).toBe('/');
    });

    it('should format a path with a param', () => {
      // Given
      const manager = new RoutesManager(dummyRoutes);
      // When
      const sut = manager.getPath('dashboard.hubOverview', { hubSlug: 'test' });
      // Then
      expect(sut).toBe('/dashboard/test/overview');
    });

    it('should format a path and add an unknown query param', () => {
      // Given
      const manager = new RoutesManager(dummyRoutes);
      // When
      const sut = manager.getPath('login', { unknown: 'test' });
      // Then
      expect(sut).toBe('/login?unknown=test');
    });

    it('should format a path and add an optional query param', () => {
      // Given
      const manager = new RoutesManager(dummyRoutes);
      // When
      const sut = manager.getPath('login', { redirectTo: 'test' });
      // Then
      expect(sut).toBe('/login?redirectTo=test');
    });

    it('should format a path and add a required query param', () => {
      // Given
      const manager = new RoutesManager(dummyRoutes);
      // When
      const sut = manager.getPath('account.settings.removeMe', { confirm: 'true' });
      // Then
      expect(sut).toBe('/account/settings/remove-account?confirm=true');
    });
  });
});
