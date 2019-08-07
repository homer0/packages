module.exports = {
  env: {
    jest: true,
  },
  extends: [
    './defaults.js',
    './rules/jest.js',
  ],
  globals: {
    spyOn: true,
  },
};
