const base = require('./configurations/base');
const browser = require('./configurations/browser');
const jest = require('./configurations/jest');
const jsdoc = require('./configurations/jsdoc');
const node = require('./configurations/node');
const { addPrettier } = require('./utils');

module.exports = {
  configs: {
    base,
    browser,
    'browser-with-prettier': addPrettier(browser),
    jest,
    'jest-with-prettier': addPrettier(jest),
    jsdoc,
    node,
    'node-with-prettier': addPrettier(node),
  },
};
