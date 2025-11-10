const path = require('path');

/**
 * @type {import('ts-jest').JestConfigWithTsJest}
 */
module.exports = {
  preset: 'ts-jest',
  automock: true,
  collectCoverage: true,
  testPathIgnorePatterns: ['/node_modules/'],
  unmockedModulePathPatterns: ['/node_modules/', 'jimple', 'path-utils', 'mocks'],
  coveragePathIgnorePatterns: ['/node_modules/', '/mocks/'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: path.join(__dirname, 'tests', 'tsconfig.json'),
      },
    ],
  },
};
