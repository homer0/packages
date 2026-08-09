import { createConfig } from './createConfig.js';

export { createConfig } from './createConfig.js';
export type { CreateConfigOptions, GeneratedConfig } from './types.js';

const config = createConfig();

// oxlint-disable-next-line no-restricted-exports -- The package root intentionally default-exports its default configuration.
export default config;
