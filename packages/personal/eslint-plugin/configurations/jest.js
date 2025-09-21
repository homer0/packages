module.exports = {
  env: {
    jest: true,
  },
  extends: ['./base.js', '../rules/testing.js'].map(require.resolve),
  globals: {
    spyOn: true,
    module: true,
    process: true,
  },
};
