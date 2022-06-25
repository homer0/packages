const path = require('path');

/**
 * @type {import('ts-jest').InitialOptionsTsJest}
 */
module.exports = {
  preset: 'ts-jest',
  automock: true,
  collectCoverage: true,
  testPathIgnorePatterns: ['/node_modules/'],
  unmockedModulePathPatterns: [
    '/node_modules/',
    'jimple',
    'path-utils',
    'package-info',
    'mocks',
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/mocks/'],
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsconfig: path.join(__dirname, 'tests', 'tsconfig.json'),
    },
  },
};
