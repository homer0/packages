const path = require('path');

/**
 * @type {import('ts-jest').JestConfigWithTsJest}
 */
module.exports = {
  preset: 'ts-jest',
  automock: false,
  collectCoverage: true,
  testPathIgnorePatterns: ['/node_modules/'],
  unmockedModulePathPatterns: ['/node_modules/'],
  coveragePathIgnorePatterns: ['/node_modules/', 'src/jimplemod/jimple.type'],
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
