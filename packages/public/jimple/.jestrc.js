const path = require('path');

/**
 * @type {import('ts-jest').InitialOptionsTsJest}
 */
module.exports = {
  preset: 'ts-jest',
  automock: false,
  collectCoverage: true,
  testPathIgnorePatterns: ['/node_modules/'],
  unmockedModulePathPatterns: ['/node_modules/'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsconfig: path.join(__dirname, 'tests', 'tsconfig.json'),
    },
  },
};
