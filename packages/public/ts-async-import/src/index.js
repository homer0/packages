import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export function tsAsyncImport(name, contextDir) {
  const importPath = contextDir ? require.resolve(name, { paths: [contextDir] }) : name;
  return import(importPath);
}
