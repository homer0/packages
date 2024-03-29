# 🔮 React SSR config

A way to have dynamic config sent from SSR and accessible in the client.

Instead of bundling configuration settings in the client, this package will allow you generate the config on the server, send it to the client, load it, and use it on both contexts with the same API.

## 🍿 Usage

- ⚙️ [Setup](#%EF%B8%8F-setup)
- 🤘 [Development](#-development)

### ⚙️ Setup

First, you need to create your slices, just like in a Redux store:

```ts
// config.slices.ts

import { createConfigSlice } from '@homer0/react-ssr-config';

export const apiConfig = createConfigSlice('api', () => ({
  baseUrl: process.env.API_BASE_URL || 'http://localhost:2510',
}));

export type ApiConfig = ReturnType<typeof apiConfig>;

// ...

export const appConfig = createConfigSlice('app', () => ({
  env: process.env.NODE_ENV !== 'production' ? 'development' : 'production',
}));

export type AppConfig = ReturnType<typeof appConfig>;
```

Then, you have to create a config using the slices:

```ts
// config.ts

import { createConfig } from '@homer0/react-ssr-config';

const config = createConfig({
  api: apiConfig,
  app: appConfig,
});

export type Config = ReturnType<(typeof config)['getConfig']>;
```

Once you have your config, you have to use the `ConfigLoader` component to send it to the HTML, so it can be read in the client.

> If you are using a Next app with the pages router, this should happen on your `_app.tsx`. If you not are using Next, you can use the `ConfigLoader` component on your main component, just make sure that it's there when the HTML is rendered.

```tsx
// _app.tsx

import { ConfigLoader } from '@homer0/react-ssr-config';
import type { AppProps } from 'next/app';
import { config } from './config';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ConfigLoader config={config}>
      <Component {...pageProps} />
    </ConfigLoader>
  );
}
```

Now, since the whole example is in TypeScript, there's an extra step to actually have the right types when accessing the config: You need to create a custom `getConfig` with the type of your config:

```ts
import { createConfig, createGetConfig } from '@homer0/react-ssr-config';
// config.ts
// ... after creating your config

export const getConfig = createGetConfig<Config>();
```

> If you are not using TypeScript, you can import `getConfig` directly from `@homer0/react-ssr-config`.

Finally, you know have access to your config, on both contexts:

```tsx
// some-component.tsx
import { getConfig } from './config';

const { env } = getConfig('app');

export const SomeComponent: React.FC = () => <div>Environment: {env}</div>;
```

### 🤘 Development

As this project is part of the `packages` monorepo, some of the tooling, like `lint-staged` and `husky`, are installed on the root's `package.json`.

#### Tasks

| Task          | Description                         |
| ------------- | ----------------------------------- |
| `lint`        | Lints the package.                  |
| `test`        | Runs the unit tests.                |
| `build`       | Transpiles and bundles the project. |
| `types:check` | Validates the TypeScript types.     |

## Motivation

This was built initially for a Next.js app in which I was not ready to move the new app router, nor RSC, so I wanted a simple solution to compose a config, with a mix of Nest's `ConfigService` and Redux's `createSlice` APIs.
