# 💉 jimple

An extended version of the [Jimple](https://www.npmjs.com/package/jimple) lib, with extra features.

## 🍿 Usage

> If you are wondering why I built this, go to the [Motivation](#motivation) section.

- ⚡️ [Features](#%EF%B8%8F-features)
- ⚙️ [Factories](#%EF%B8%8F-factories)
- 🤘 [Development](#-development)

### ⚡️ Features

#### TypeScript out-of-the-box

Unfourtunately, Jimple doesn't have type declarations, but someone (\*) took the time, and wrote a `.d.ts` for it. The issue is that shipping a custom `.d.ts` is not super straightforward, and there were a couple of references that I wanted to change (\*\*), so I worked some (ugly) magic, and you can now import the `Jimple` class from this package and it will already be typed:

```ts
import { Jimple } from '@homer0/jimple';

const container = new Jimple();
container.register({
  register: (c) => {
    // `c` is typed to be `Jimple` :D!
  },
});
```

> \*: For the life of me, I can't remember from where I copied the `.d.ts` file. It was like more than a year ago and I couldn't find it again, sorry!! If you are the author, please let know and I'll give you credit.
> \*\*: If you were to extend the `Jimple` class, all the references to the container type, inside the class, would point to the original class, not the extended one. That was the main thing I wanted to change.

#### `try` method

This method is a shortcut of `has` and `get`: if the resource exists in the container, it returns it, otherwise, it returns `undefined`:

```ts
const myService = container.try<MyService>('myService');
// myService is either `undefined` or `MyService`
if (myService) {
  // myService exists
}
```

#### Function shorthand

Not a lot of people are happy with OOP nowadays (not me :P), so, why not create a function alternative to create a container?

```ts
import { jimple } from '@homer0/jimple';

const container = jimple();
```

#### Provider shorthand

Yes, this exists on the original lib, I actually wrote it there, but the difference here is that it's a standalone function, instead of a static method, and it's created using the [resource factory](#resource-factory):

```ts
import { provider } from '@homer0/jimple';

export class MyService {
  // ...
}

export const myService = provider((c) => {
  c.set('myService', () => new MyService());
});
```

The generated object will look like this:

```ts
const myService = {
  provider: true,
  register: (c) => {
    c.set('myService', () => new MyService());
  },
};
```

Which means that you can go to the container and register it like this:

```ts
container.register(myService);
```

#### Provider creator

A provider creator is a both a provider, and a function that can create a provider.

Let's say you created a service that can be shared in multiple applications, or as multiple services in the same container, and you would want the implementation to be able to send some options/configuration to the provider, and maybe, also have a version that uses defaults:

```ts
import { provider } from '@homer0/jimple';

type Opts = {
  url?: string;
};

export class MyService {
  constructor({ url = 'http://localhost:3000' }: Opts) {
    // ...
  }
}

export const myServiceWithOptions = (options: Opts = {}) =>
  provider((c) => {
    c.set('myService', () => new MyService(options));
  });

export const myService = myServiceWithOptions();
```

But that looks kind of _hacky_, and whoever implements it, needs to be aware of the two providers and their differences.

Here's where the `providerCreator` comes in: this wrapper allows you to wrap the function that generates the provider, and its "default version" in a single provider:

```ts
import { providerCreator } from '@homer0/jimple';

type Opts = {
  url?: string;
};

export class MyService {
  constructor({ url = 'http://localhost:3000' }: Opts) {
    // ...
  }
}

export const myService = providerCreator((options: Opts = {}) => (c) => {
  c.set('myService', () => new MyService(options));
});
```

The _magic_ is that the return of `providerCreator` is not actually a provider, but a [`Proxy`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy). If the proxy's `register` function gets called, it will internally call the "creator function" without any arguments, and return the provider; but at the same time, you can also call the proxy as if it were the "creator function":

```ts
container.register(myService);
// or
container.register(myService({ url: 'http://localhost:9000' }));
```

The `providerCreator` is created using the [resource creator factory](#resource-creator-factory).

#### Providers collection

As you probably already guessed, the idea here is to group multiple providers in a single object, and then register it as a single provider:

```ts
import { providers } from '@homer0/jimple';
import { myServiceA } from './services/a';
import { myServiceB } from './services/b';

export const services = providers({
  myServiceA,
  myServiceB,
});
```

This will generate a provider that, when registered, it will register all the providers in the collection:

```ts
container.register(services);
```

The `providers` is created using the [resources collection factory](#resources-collection-factory).

#### Extending the container and keeping the types

Since `provider`, `providerCreator` and `providers` are standalone functions, if you were to extend the `Jimple` class, the type for the container you receive on registration would be the original class, not the extended one.

The way to get around this is by "creating your own functions":

```ts
import {
  Jimple,
  createProvider,
  createProviderCreator,
  createProviders,
} from '@homer0/jimple';

export class MyContainer {}

export const provider = createProvider<MyContainer>();
export const providerCreator = createProviderCreator<MyContainer>();
export const providers = createProviders<MyContainer>();
```

#### Inject helper

The inject helper is a resource you can use when creating reusable services, and it takes care of resolving instances and injections:

##### Ensuring you always get an instance

Let's say that your service has a dependency on another service, and you want to give the ability to the implementation to inject it, but at the same time, if the implementation doesn't send it, you need an instance of the dependency to work with.

You could do an `if` with the parameters, but after a few of them, it gets ugly, so that's why the helper has the `.get` method:

```ts
// Let's define our dependency dictionary.
type Dependencies = {
  dep: string;
};
// Create the helper with it.
const helper = new InjectHelper<Dependencies>();
// Define the options for the service, that can be used for the injection.
type MyServiceOptions = {
  inject?: Partial<Dependencies>;
};
const myService = ({ inject = {} }: MyServiceOptions) => {
  // Ensure `dep` is always a `string`
  const dep = helper.get(inject, 'dep', () => 'default');
  console.log('dep:', dep);
};
```

#### Resolving dependencies on the provider

Another use case when creating a reusable service, is to give the ability to the provider (creator) to specify the name of the services that should be injected from the container.

Keeping with the previous example, we could look for `dep` on the container, but if the implementation used a different name? This is why we have the `.resolve` method:

```ts
// Let's define our dependency dictionary.
type Dependencies = {
  dep: string;
};
// Create the helper with it.
const helper = new InjectHelper<Dependencies>();

// Define the options for the provider.
type MyProviderOptions = {
  services?: {
    [key in keyof Dependencies]?: string;
  };
};

const myProvider = providerCreator(
  ({ services = {} }: MyProviderOptions) =>
    (container) => {
      container.set('myService', () => {
        // Tell the helper to look for `dep` in the container.
        const inject = helper.resolve(['dep'], container, services);
        return myService({ inject });
      });
    },
);
```

For each dependency, the method will first check if a new name was specified (on `services`), and try to get it with that name, otherwise, it will try to get it with the default name (`dep`), and if it doesn't exist, it will just keep it as `undefined`.

### ⚙️ Factories

The factories are in charge of creating the functions for the providers, and can be used to create other types of _objects_.

#### Resource factory

A resource is small object, with a name and a function. For example, a provider:

```ts
const resource = {
  provider: true,
  register: () => {},
};
```

The way the factory works is that it takes the function type, and returns a function that can be used to create the resource:

```ts
import { resourceFactory, type Jimple } from '@homer0/jimple';

type ActionFn = (c: Jimple) => void;
const factory = resourceFactory<ActionFn>();

const myAction = factory('action', 'fn', (c) => {
  c.set('foo', 'bar');
});
```

And `action` will look like this:

```ts
const myAction = {
  action: true,
  fn: (c) => {
    c.set('foo', 'bar');
  },
};
```

As you may have noticed, the factory task is just to set the type of the function so it can be later validated when creating the resource.

Like I did for `provider`, you can create a function that wraps the result of the factory, and only takes the function:

```ts
import { resourceFactory, type Jimple } from '@homer0/jimple';

type ActionFn = (c: Jimple) => void;
const factory = resourceFactory<ActionFn>();
const action = (fn: ActionFn) => factory('action', 'fn', fn);

const myAction = action((c) => {
  c.set('foo', 'bar');
});
```

#### Resource creator factory

In case you missed the section about [provider creator](#provider-creator), a creator is a proxy that can be used both as a resource, and a function that can create a resource.

Now, this is basically the same as the resource factory: it takes the function type, and returns a function that can be used to create the resource creator.

```ts
import { resourceCreatorFactory, type Jimple } from '@homer0/jimple';

type ActionFn = (c: Jimple) => void;

const factory = resourceCreatorFactory<ActionFn>();

const myAction = factory('action', 'fn', (name = 'foo') => (c) => {
  c.set(name, 'bar');
});
```

Now, you can register with the default name, or with a custom one:

```ts
myAction.fn(container);
myAction('fooz')(container);
```

And like with `providerCreator`, you can wrap the creation in a function:

```ts
import { resourceCreatorFactory, type Jimple } from '@homer0/jimple';

type ActionFn = (c: Jimple) => void;
// it will be typed, but needs to extend from `any`.
type ActionCreatorFn = (...args: any[]) => ActionFn;

const factory = resourceCreatorFactory<ActionFn>();
const actionCreator = <CreatorFn extends ActionCreatorFn>(creator: CreatorFn) =>
  factory('action', 'fn', creator);

const myAction = actionCreator((name = 'foo') => (c) => {
  c.set(name, 'bar');
});
```

#### Resources collection factory

The collections are technically resources that contains other resources, and when their function gets called, it calls the function in every resource in the collection.

```ts
import { resourcesCollectionFactory, type Jimple } from '@homer0/jimple';
// let's assume we have some actions already.
import { myActionA, myActionB } from './actions';

type ActionFn = (c: Jimple) => void;
const factory = resourcesCollectionFactory<'action', ActionFn>();
const myActions = factory('action', 'fn')({ myActionA, myActionB });
```

Just like with the others, the creation of the factory adds type validations, and returns a function to actually create collections.

But in this case, to simplify the implementation, you don't need to create an extra wrapper, you can just create the function the specifies the name and key (`action` and `fn`), and use its returned function to create the collections:

```ts
// ...
export const actions = factory('action', 'fn');
// ...
const myActions = actions({ myActionA, myActionB });
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

I really like Jimple, I've used in countless projects, but there were customizations I wanted (like the ones in the features section) that didn't make a lot of sense in the original project, plus the _factories_, which I needed for my [`jimpex`](https://www.npmjs.com/package/jimpex) project (`jimple` + `express`).
