# 🧰 Object utils

A small collection of utility methods to work with objects. It relies on [`extend`](https://www.npmjs.com/package/extend) for deep merge and copy.

## 🍿 Usage

> If you are wondering why I built this, go to the [Motivation](#motivation) section.

- ⚙️ [Functions](#%EF%B8%8F-functions)
- 🤘 [Development](#-development)

### ⚙️ Functions

- [`merge`](#merge)
- [`copy`](#copy)
- [`get`](#get)
- [`set`](#set)
- [`extract`](#extract)
- [`remove`](#remove)
- [`flat`](#flat)
- [`unflat`](#unflat)
- [`formatKeys`](#formatKeys)

#### `merge`

Makes a deep merge of a list of objects.

```js
import { merge } from '@homer0/object-utils';

const objA = { a: 'first' };
const objB = { b: 'second' };

console.log(merge(objA, objB));
// Will output { a: 'first', b: 'second' }
```

#### `copy`

Makes a deep copy of an object.

```js
import { copy } from '@homer0/object-utils';

const objA = { a: 'first' };
const objB = copy(objA);
objA.b = 'second';

console.log(objB);
// Will output { a: 'first' }
```

### `get`

Reads a property from an object using a path:

```js
import { get } from '@homer0/object-utils';

const obj = {
  propOne: {
    propOneSub: 'Charito!',
  },
  propTwo: '!!!',
};

console.log(get(obj, 'propOne.propOneSub'));
// Will output 'Charito!'
```

You can also use an options object to specify things like the `pathDelimiter`:

```ts
console.log(
  get({
    target: obj,
    path: 'propOne.propOneSub',
    pathDelimiter: '.',
  }),
);
// Will also output 'Charito!'
```

#### `set`

Sets a property on an object using a path. If the path doesn't exist, it will be created.

```js
import { set } from '@homer0/object-utils';

const target = {};

console.log(set(target, 'some.prop.path', 'some-value'));
// Will output { some: { prop: { path: 'some-value' } } }
```

And just like `get`, you can also use an options object:

```ts
console.log(
  set({
    target,
    path: 'some.prop.path',
    value: 'some-value',
    pathDelimiter: '.',
  }),
);
// Will also output { some: { prop: { path: 'some-value' } } }
```

#### `extract`

Extracts a property or properties from an object in order to create a new one.

```js
import { extract } from '@homer0/object-utils';

const target = {
  name: {
    first: 'Pilar',
  },
  age: 2,
  address: {
    planet: 'earth',
    something: 'else',
  },
};

console.log(
  set({
    target: obj,
    paths: [{ name: 'name.first' }, 'age', 'address.planet'],
  }),
);
// Will output { name: 'Pilar', age: 2, address: { planet: 'earth' } }
```

#### `remove`

Deletes a property of an object using a path. If by removing a property of a sub object, the object has no more keys, it also removes it.

```js
import { remove } from '@homer0/object-utils';

const target = {
  propOne: {
    propOneSub: 'Charito!',
  },
  propTwo: '!!!',
};

console.log(remove(target, 'propOne.propOneSub'));
// Will output { propTwo: '!!!' }
```

You can also use an options object instead of the target and the path:

```ts
console.log(
  remove({
    target,
    path: 'propOne.propOneSub',
  }),
);
// Will also output { propTwo: '!!!' }
```

#### `flat`

Flattens an object properties into a single level dictionary.

```js
import { flat } from '@homer0/object-utils';

const target = {
  propOne: {
    propOneSub: 'Charito!',
  },
  propTwo: '!!!',
};

console.log(flat({ target }));
// Will output { 'propOne.propOneSub': 'Charito!', propTwo: '!!!' }
```

#### `unflat`

This method does the exact opposite from `flat`: It takes an already flatten object and restores its structure.

```js
import { unflat } from '@homer0/object-utils';

const target = {
  'propOne.propOneSub': 'Charito!
  propTwo: '!!!',
};

console.log(unflat({ target }));
// Will output { propOne: { propOneSub: 'Charito!' }, 'propTwo': '!!!' }
```

#### `formatKeys`

Formats all the keys on an object using a way similar to `.replace(regexp, ...)` but that also works recursively and with _"object paths"_.

```js
import { formatKeys } from '@homer0/object-utils';

const target = {
  prop_one: 'Charito!',
};

console.log(
  formatKeys({
    target,
    // Find all the keys with snake case.
    search: /([a-z])_([a-z])/g,
    // Using the same .replace style callback, replace it with lower camel case.
    replace: (_, firstLetter, secondLetter) => {
      const newSecondLetter = secondLetter.toUpperCase();
      return `${firstLetter}${newSecondLetter}`;
    },
  }),
);
```

There are also a few "shorthand implementations" of `formatKeys`:

- `lowerCamelToSnakeKeys(...)`
- `lowerCamelToDashKeys(...)`
- `snakeToLowerCamelKeys(...)`
- `snakeToDashKeys(...)`
- `dashToLowerCamelKeys(...)`
- `dashToSnakeKeys(...)`

### 🤘 Development

As this project is part of the `packages` monorepo, some of the tooling, like `lint-staged` and `husky`, are installed on the root's `package.json`.

#### Tasks

| Task          | Description                     |
| ------------- | ------------------------------- |
| `lint`        | Lints the package.              |
| `test`        | Runs the unit tests.            |
| `build`       | Transpiles the project.         |
| `types:check` | Validates the TypeScript types. |

## Motivation

This used to be part of the [`wootils`](https://www.npmjs.com/package/wootils) package, my personal lib of utilities, but I decided to extract them into individual packages, as part of the `packages` monorepo, and take the oportunity to migrate them to TypeScript.

What I like most about this library is that it's VERY small, and it only has one single dependency.
