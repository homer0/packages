module.exports = {
  env: {
    jest: true,
  },
  extends: [
    './base.js',
    '../rules/jest.js',
  ],
  globals: {
    spyOn: true,
  },
};
