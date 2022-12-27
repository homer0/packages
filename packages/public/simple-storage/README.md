# 📚 Simple storage

A service that allows you to build functionalities that relay on browser storage (session/local), and simplifies the way you work it.

You can specify the storage type you want to use, the format in which you want to handle the data, and even expiration time for it.

## 🍿 Usage

- ⚙️ [Examples](#%EF%B8%8F-examples)
- 🤘 [Development](#-development)

### ⚙️ Examples

#### Basic

Let's say you have an app with a form for writing blog posts (or any kind of articles), and it has two fields: title and content.

The basic functionality is ready, when the user hits the `Save` button, you send the post to an API in order to publish. We can imagine a service like this:

```ts
class Posts {
  save(title, content) {
    return fetch(...);
  }
}
```

But, what if we want to add a feature to save a draft of the post while the user is writing? in case something happens, we can prevent the user from losing what she/he wrote.

We can use `localStorage`! we need to write the functions to:

1. Save the draft, encoded as JSON.
2. Load the storage, check for the draft, decode it and restore.

And that's exactly what `SimpleStorage` can do for you:

```ts
import { simpleStorage } from '@homer0/simple-storage';

class Posts {
  constructor() {
    this._storage = simpleStorage({
      storage: {
        name: 'posts',
        key: 'myApp-posts',
      },
    });
  }

  saveDraft(title, content) {
    this._storage.setData({ title, content });
  }

  getDraft() {
    const draft = this._storage.getData();
    return draft.title ? draft : null;
  }

  async save(title, content) {
    const result = await fetch(...);
    this._storage.remove();
    return result;
  }
}
```

Let's go over all the changes:

We first bring the lib, then we initialize it in the constructor, with options to specify the name and key for the storage. The name is just a reference the service uses, and the key is the actual key that will be used on the storage to save the data.

> Since we wanted `localStorage`, we don't need to touch any other default option, but if you are interested on the default options, take a look at the technical documentation for the class.

We add `saveDraft` and `getDraft`: As you can imagine, `saveDraft` just tells the service to save an object, and based on the storage options, it already knows that the object should be encoded as a JSON before saving it, so no need to worry about that.

`getDraft` will just try to obtain the data and make sure there's a draft there; the whole process where the service checks the storage and loads its contents has been already taken care of.

The reason we check for `.title` is because the service will check if there's something on the storage using the key from the options, and if there's nothing, it will add an empty object in order to work with future data.

And the last modification is the call to `remove` on the `save` method: We finally saved the post, so it's ok to delete the draft from the storage: this is basically a _"clean up"_.

Now... there's a problem with this implementation: we are using `localStorage`, so if the user is writing different posts on different browser tabs, they'll overwrite each other (yeah, that seems like an odd scenario, but it may happen).

We should switch to `sessionStorage` and keep the draft limited to each tab:

```ts
import { simpleStorage } from '@homer0/simple-storage';

class Posts {
  constructor() {
    this._storage = simpleStorage({
      storage: {
        name: 'posts',
        key: 'myApp-posts',
        priority: ['session', 'local'],
      },
    });
  }

  // ...
}
```

We add the `storage.priority` option, tell the service to use `sessionStorage` if available, and switch to `localStorage` as a fallback.

#### Working with entries

On the example above we saw how to save, read and delete a simple object from the storage, but the lib allows you to also work with different objects: Entries.

When working with entries, instead of just sending an object to the storage, you can have something like a _"storage inside the storage"_, where you can assign different keys for different objects... and even and expiration time for them.

Let's illustrate this with an example: You have an app that, when a user navigates to _"its profile page"_, it makes some requests to load some "settings", like this:

```ts
class Users {
  // ...
  async getUserProfileSettings(userId) {
    const [
      userProfile,
      appSettings,
      uiSettings,
    ] = await Promise.all([
      this.getUserProfile(userId),
      this.getUserAppSettings(userId),
      this.getUserUISettings(userId),
    ]);
    this._turnOffThatCrazyAjaxLoadIndicator(): // :P
    return {
      userProfile,
      appSettings,
      uiSettings,
    };
  }

  async getUserProfile(userId) {
    const res = await fetch(`/user-profile/${userId}`);
    return res.json();
  }

  async getUserAppSettings(userId) {
    const res = await fetch(`/user-app-settings/${userId}`);
    return res.json();
  }

  async getUserUISettings(userId) {
    const res = await fetch(`/user-ui-settings/${userId}`);
    return res.json();
  }
}
```

But what if we know that it's hardly possible that those setting would change in the near future and that the app may need to do those requests for more than just the _"profile page"_?

We can do something like on the example above and store everything on the local storage, right? well... manipulating a single object in order to put the responses of all the different request will require some extra coding and it may seem like an overkill, so, that's why we have _entries_.

We can use the entries feature to store each request as a different _entry_, and even tell the service to just keep them for an 2 hours, after that, make the request again.

Let's start by adding `SimpleStorage` and enabling the feature:

```js
import { simpleStorage } from '@homer0/simple-storage';

class Users {
  constructor() {
    this._storage = simpleStorage({
      storage: {
        name: 'user-requests',
        key: 'myApp-user-requests',
      },
      entries: {
        enabled: true,
        expiration: 7200,
      },
    });
  }

  // ...
}
```

We use the options to:

1. Specify the name and key for the storage. The name is just a reference the service uses, and the key is the actual key that will be used on the storage to save the data.
2. Enable the feature, `entries.enabled`, and set the expiration time of each entry (2 hours, in seconds).

Now we need to add a method to cache the requests as entries:

```ts
cacheRequest(url) {
  const entry = this.getEntry(url);
  return entry ?
    Promise.resolve(entry.value) :
    this.saveEntry(fetch(url).then((resp) => resp.json()));
}
```

As you can see, the method first uses `getEntry`, to locate an entry for the received URL.

If an entry was found, it uses `Promise.resolve` to return the value. The reason for returning a `Promise` is so method will always return a promise even if the request doesn't fire.

But if there's no entry, it calls `saveEntry` with the result of the `fetch` request.

> You can send an object or a promise to `saveEntry` and `sendData`, the service will wait for it to be resolved and _then_ use the received value.

That's all for the method; like on the other example, the service will take care of writing and reading the entries and their values for the storage.

Time to refactor! We need to change the _"get methods"_ and make them use the new `cacheRequest`:

```ts
// ...
getUserProfile(userId) {
  return this.cacheRequest(`/user-profile/${userId}`);
}

getUserAppSettings(userId) {
  return this.cacheRequest(`/user-app-settings/${userId}`);
}

getUserUISettings(userId) {
  return this.cacheRequest(`/user-ui-settings/${userId}`);
}
// ...
```

Done! Now the request will only trigger if there's nothing on the storage (this includes entries that were deleted because they expired.

### 🤘 Development

As this project is part of the `packages` monorepo, some of the tooling, like ESLint and Husky, are installed on the root's `package.json`.

#### NPM tasks

| Task    | Description          |
| ------- | -------------------- |
| `test`  | Runs the unit tests. |
| `build` | Bundles the project. |

## Motivation

This used to be part of the [`wootils`](https://www.npmjs.com/package/wootils) package, my personal lib of utilities, but I decided to extract them into individual packages, as part of the `packages` monorepo, and take the oportunity to migrate them to TypeScript.

Nowadays there's almost no app that doesn't make requests to one or more external APIs, that's why I built this service.
