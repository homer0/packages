const base = require('./configurations/base');
const browser = require('./configurations/browser');
const jest = require('./configurations/jest');
const node = require('./configurations/node');

module.exports = {
  configs: {
    base,
    browser,
    jest,
    node,
  },
};
