const path = require('path');
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tests/tsconfig');

/**
 * @type {import('ts-jest').JestConfigWithTsJest}
 */
module.exports = {
  preset: 'ts-jest',
  collectCoverage: true,
  testPathIgnorePatterns: ['/node_modules/'],
  unmockedModulePathPatterns: ['/node_modules/', 'object-utils'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: path.join(__dirname, 'tests', 'tsconfig.json'),
      },
    ],
  },
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/tests',
  }),
};
