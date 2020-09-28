const base = require('./configurations/base');
const browser = require('./configurations/browser');
const jest = require('./configurations/jest');
const jsdoc = require('./configurations/jsdoc');
const node = require('./configurations/node');

module.exports = {
  configs: {
    base,
    browser,
    jest,
    jsdoc,
    node,
  },
};
