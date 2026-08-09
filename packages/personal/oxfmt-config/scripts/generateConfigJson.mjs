import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { format } from 'oxfmt';

import { createConfig } from '../dist/index.js';

const config = createConfig();
const outputPath = resolve(import.meta.dirname, '../dist/index.json');
const { code } = await format('index.json', JSON.stringify(config), config);

await writeFile(outputPath, code);
