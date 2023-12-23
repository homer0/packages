module.exports.tsAsyncImport = (name, contextDir) => {
  const importPath = contextDir ? require.resolve(name, contextDir) : name;
  // eslint-disable-next-line node/no-unsupported-features/es-syntax
  return import(importPath);
};
