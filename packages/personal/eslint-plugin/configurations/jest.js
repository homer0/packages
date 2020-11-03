module.exports = {
  env: {
    jest: true,
  },
  extends: ['./base.js', '../rules/jest.js'].map(require.resolve),
  globals: {
    spyOn: true,
  },
};
