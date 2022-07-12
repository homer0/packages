const path = require('path');

/**
 * @type {import('ts-jest').InitialOptionsTsJest}
 */
module.exports = {
  preset: 'ts-jest',
  automock: false,
  collectCoverage: true,
  testPathIgnorePatterns: ['/node_modules/'],
  unmockedModulePathPatterns: ['/node_modules/', 'jimple', 'path-utils', 'mocks'],
  coveragePathIgnorePatterns: ['/node_modules/', '/mocks/'],
  testEnvironment: 'jsdom',
  globals: {
    'ts-jest': {
      tsconfig: path.join(__dirname, 'tests', 'tsconfig.json'),
    },
  },
};
