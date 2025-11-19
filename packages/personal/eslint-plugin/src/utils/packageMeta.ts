import fs from 'node:fs';
import type { LinterPlugin } from '../commons/index.js';

const pkg = JSON.parse(
  fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
) as { name: string; version: string };

export const PACKAGE_META: LinterPlugin['meta'] = {
  name: pkg.name,
  version: pkg.version,
};
