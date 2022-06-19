# 🚚 Events hub

A simple implementation of a pubsub service for handling events

It doesn't require any configuration or have customization options: You listen for an event with `on`, emit an event with `emit`, and, you could reduce a variable through an event with `reduce` (or `reduceSync`).

## 🍿 Usage

- ⚙️ [Examples](#%EF%B8%8F-examples)
- 🤘 [Development](#-development)

### ⚙️ Examples

First, let's create an instance of the hub:

```ts
import { eventsHub } from '@homer0/events-hub';
const events = eventsHub();
```

#### Listen and emit

```ts
// Add the listener
events.on('my-event', () => {
  console.log('The event listener was called!');
});
// Emit the event
events.emit('my-event');
```

Quite simple, right? You can also send any number of parameters to the events:

```ts
// Define the listener, to get the parameters' types.
type LoginListener = (username: string, password: string) => void | Promise<void>;
// Add the listener
events.on<LoginListener>('user-login', async (username, password) => {
  try {
    const userInfo = await someAuthService.login(username, password);
    events.emit('user-login-successfull', userInfo);
  } catch (error) {
    events.emit('user-login-failed', error);
  }
});

//...
// Emit the event.
events.emit('user-login', 'rosario', 'p4ssword');
```

#### Multiple events

All methods that support an event name also support an `Array` with a list of them, which means you can set the same listener for multiple events:

```ts
// Add the listener
events.on(['logout-route', 'unauthorized-request'], () => {
  someAuthService.signout();
});

//...
// This would trigger the listener.
events.emit('logout-route');
// and this too (if it fails :P).
someRequest()
.then(() => ... )
.catch((error) => {
  if (error.code === 401) {
    events.emit('unauthorized-request');
  }
});
```

#### Listening only once

You can use the `once` method to create a subscription that will be removed after being called one time. Following the previous examples, let's say that the `signout` method makes a redirection to a different URL (because of reasons); that means that there's no need to keep the listener around once executed:

```ts
events.once(['logout-route', 'unauthorized-request'], () => {
  someAuthService.signout();
});
```

After `.signout()` gets called, the listener will be removed.

> Yeah, technically, if `.signout()` does a redirection, it could stop the execution... but you get the point of the example.

#### Reducing a variable

The service has a `reduce` method that is basically the same as `emit`, but the first parameter may be modified by the listeners.

```js
events.on('filter-users-list', async (list) => {
  const fromAPI = await getUsersToFilterFromSomeAPI('...', { list });
  return list.filter((item) => !fromAPI.includes(item));
});

const usersList = ['Rosario', 'Pilar'];
const newUsersList = await events.reduce('filter-users-list', usersList);
// `newUsersList` would now be the users that weren't in the API.
```

> After the `target`, you can send any number of parameters for the listeners/reducers.

There's also a synchronous version of the `reduce` method: `reduceSync`.

```ts
events.on('filter-users-list', (list) => {
  list.slice(1, 3);
  return list;
});

const usersList = ['charito', 'Rosario', 'Pilar', 'pili'];
const newUsersList = events.reduceSync('filter-users-list', usersList);
console.log(newUsersList);
// Will log ['Rosario', 'Pilar']
```

### 🤘 Development

As this project is part of the `packages` monorepo, it requires Yarn, and some of the tooling, like ESLint and Husky, are installed on the root's `package.json`.

#### Yarn tasks

| Task    | Description          |
| ------- | -------------------- |
| `test`  | Runs the unit tests. |
| `build` | Bundles the project. |
