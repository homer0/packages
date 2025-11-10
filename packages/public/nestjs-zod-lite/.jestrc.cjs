const path = require('path');
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tests/tsconfig');

/**
 * @type {import('ts-jest').JestConfigWithTsJest}
 */
module.exports = {
  preset: 'ts-jest',
  collectCoverage: true,
  testPathIgnorePatterns: ['/utils/scripts/', 'tests/mocks'],
  unmockedModulePathPatterns: ['/node_modules/', 'tests/mocks'],
  coveragePathIgnorePatterns: ['/utils/scripts/', 'tests/mocks'],
  testEnvironment: 'node',
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
    useESM: true,
  }),
};
