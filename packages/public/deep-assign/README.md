# 🧬 Deep assign

Deep merge (and copy) of objects and Arrays using native spread syntax.

## 🍿 Usage

> If you are wondering why I built this, go to the [Motivation](#motivation) section.

- ⚙️ [Examples](#%EF%B8%8F-examples)
- 🤘 [Development](#-development)

### ⚙️ Examples

- [Simple merge](#simple-merge)
- [Symbols as keys](#symbols-as-keys)
- [Arrays concatenation](#array-concatenation)
- [Arrays overwrite](#array-overwrite)
- [Arrays shallow merge](#array-shallow-merge)

#### Simple merge

```js
import { deepAssign } from '@homer0/deep-assign';

const generateOptions = (options = {}) => deepAssign(
  {
    title: 'myApp',
    sections: [{ title: 'about', enabled: true }],
    enabled: false,
    features: {
      accounts: true,
      blog: false,
    },
  },
  options,
);

console.log(generateOptions({
  title: 'my AWESOME app',
  sections: [{ title: 'ME', url: '/me' }, 'projects'],
  enabled: true,
  features: {
    blog: true,
    projects: true,
  },
  extras: null,
}));
/**
 * {
 *   title: 'my AWESOME app',
 *   sections: [
 *     { title: 'ME', enabled: true, url: '/me' },
 *     'projects',
 *   ],
 *   enabled: true,
 *   features: {
 *     accounts: true,
 *     blog: true,
 *     projects: true,
 *   },
 *   extras: null,
 * }
```

#### Symbols as keys

```js
import { deepAssign } from '@homer0/deep-assign';

const FEATURES_KEY = Symbol('features');

const generateOptions = (options = {}) => deepAssign(
  {
    title: 'myApp',
    [FEATURES_KEY]: {
      accounts: true,
      blog: false,
    },
  },
  options,
);

console.log(generateOptions({
  title: 'my AWESOME app',
  [FEATURES_KEY]: {
    blog: true,
    projects: true,
  },
}));
/**
 * {
 *   title: 'my AWESOME app',
 *   [Symbol(features)]: {
 *     accounts: true,
 *     blog: true,
 *     projects: true,
 *   },
 * }
```

#### Arrays concatenation

This feature allows for Arrays found inside properties to be concatenated instead of merging them.

```js
import { deepAssignWithConcat } from '@homer0/deep-assign';

const generateOptions = (options = {}) => deepAssignWithConcat(
  {
    title: 'myApp',
    sections: [{ title: 'about', enabled: true }],
  },
  options,
);

console.log(generateOptions({
  title: 'my AWESOME app',
  sections: [{ title: 'ME', url: '/me' }, 'projects'],
}));
/**
 * {
 *   title: 'my AWESOME app',
 *   sections: [
 *     { title: 'about', enabled: true },
 *     { title: 'ME', url: '/me' },
 *     'projects',
 *   ],
 * }
```

#### Arrays overwrite

This allows you to, instead of merging Arrays inside object properties, to overwrite them entirely.

```js
import { deepAssignWithOverwrite } from '@homer0/deep-assign';

const generateOptions = (options = {}) => deepAssignWithOverwrite(
  {
    title: 'myApp',
    sections: [{ title: 'about', enabled: true }],
  },
  options,
);

console.log(generateOptions({
  title: 'my AWESOME app',
  sections: [{ title: 'ME', url: '/me' }, 'projects'],
}));
/**
 * {
 *   title: 'my AWESOME app',
 *   sections: [
 *     { title: 'ME', url: '/me' },
 *     'projects',
 *   ],
 * }
```

#### Arrays shallow merge

If you want to merge the Arrays, but don't want it to go as deep as the objects inside, you can use do a "shallow merge".

```js
import { deepAssignWithShallowMerge } from '@homer0/deep-assign';

const generateOptions = (options = {}) => deepAssignWithShallowMerge(
  {
    title: 'myApp',
    sections: [{ title: 'about', enabled: true }],
  },
  options,
);

console.log(generateOptions({
  title: 'my AWESOME app',
  sections: [{ title: 'ME', url: '/me' }, 'projects'],
}));
/**
 * {
 *   title: 'my AWESOME app',
 *   sections: [
 *     { title: 'ME', url: '/me' },
 *     'projects',
 *   ],
 * }
```

### 🤘 Development

As this project is part of the `packages` monorepo, some of the tooling, like ESLint and Husky, are installed on the root's `package.json`.

#### Tasks

| Task    | Description          |
| ------- | -------------------- |
| `test`  | Runs the unit tests. |
| `build` | Bundles the project. |

## Motivation

This used to be part of the [`wootils`](https://www.npmjs.com/package/wootils) package, my personal lib of utilities, but I decided to extract them into individual packages, as part of the `packages` monorepo, and take the oportunity to migrate them to TypeScript.

Now, the reason I created this, rather than use `merge` from my own `object-utils` lib, it's because `extend` doesn't support symbols as keys, they don't want to support for it, and since merging with spread syntax already does... "how hard could it be to use spread syntax recursively?".
