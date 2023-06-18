# 🚀 API utils

A really basic client to work with an API endpoints requests.

## 🍿 Usage

> If you are wondering why I built this, go to the [Motivation](#motivation) section.

- ⚙️ [Examples](#%EF%B8%8F-examples)
- 🤘 [Development](#-development)

### ⚙️ Examples

Althought the utilities can be used in both the browser and Node, in these examples I'll be using [`node-fetch`](https://www.npmjs.com/package/node-fetch) as "assume a Node env".

Also, have in mind that, while the HTTP verbs' methods and the `endpoint` method are public, the idea would be to subclass the client and expose specific method that will translate to internal requests. Yes, there's an example for that.

#### Configuring the client and making a request

To initialize a client, you'll need the following things:

```ts
import { apiClient } from '@homer0/api-utils';
import fetchClient from 'node-fetch';

const client = apiClient({
  fetchClient,
  url: 'https://api.homer0.dev',
  endpoints: {
    login: 'auth/login',
  },
});
```

1. The `fetchClient` is the client that will actually make the requests. Having the fetch outside the API Client makes it so it can be used in both the browser and Node, as you can use `node-fetch`, or `window.fetch`.
2. The `url` is the base url, or entry point, of the API you'll work with.
3. The dictionary of endpoints the client can request to.

Now that you have the client, to make a request, you'll need to first generate the endpoint url, and then use it on the method for the HTTP verb you want to use:

```ts
type UserInfo = { id: number; name: string };
const info = await client.post<UserInfo>(client.endpoint('login'), {
  username: 'Rosario',
  password: 'pilar',
});
// The URL is: https://api.homer0.dev/auth/login
```

> You have methods for the following HTTP verbs: `get`, `post`, `put`, `patch`, `delete` and `head`.

#### Endpoints with parameters

In the previous example, the request was quite simple: `POST` to the `login` endpoint; but you can have endpoints that require specific parameters to be sent. In this example, the `profile` endpoint requires the user ID to be sent:

```ts
const client = apiClient({
  fetchClient,
  url: 'https://api.homer0.dev',
  endpoints: {
    profile: 'users/:id/profile',
  },
});
```

And we can send it in a dictionary, as the second parameter of the `endpoint` method:

```ts
type UserProfile = { id: number; name: string; email: string; url: string };
const profile = await client.get<UserProfile>(client.endpoint('profile', { id: 2509 }));
// The URL is: `https://api.homer0.dev/users/2509/profile`
```

The parameters' dictionary can be use to send any number of parameters to the endpoint, and if the client doesn't find a placeholder in the path definition, it will just add it as a query parameter:

```ts
const profile = await client.get<UserProfile>(
  client.endpoint('profile', {
    id: 2509,
    format: 'json',
  }),
);
// The URL is: `https://api.homer0.dev/users/2509/profile?format=json`
```

#### Changing the placeholders' format

By default, the placeholders start with colon (`:`) followed by the name of the parameter, but that can be changed by sending custom options to the "endpoints generator" the API client uses:

```ts
const client = apiClient({
  fetchClient,
  url: 'https://api.homer0.dev',
  endpoints: {
    profile: 'users/{{id}}/profile',
  },
  endpointsGenerator: {
    options: {
      paramsPlaceholder: '{{%name%}}',
    },
  },
});
```

The placeholders now follow a handlebar-like syntax; you just have to keep the `%name%` part, so the generator can replace it with the name of the parameter.

#### Endpoints generator

In the previous example, we used the `endpointsGenerator` options object to change the placeholders' format, but what we actually did was sending specific constructor options to the `EndpointsGenerator` service the client uses under the hood.

This service can be used stand alone, and it just takes care of generating endpoints:

```ts
import { endpointsGenerator } from '@homer0/api-utils';

const endpoints = endpointsGenerator({
  url: 'https://api.homer0.dev',
  endpoints: {
    profile: 'users/:id/profile',
  },
});

const url = endpoints.get('profile', { id: 2509 });
// It will return the URL: `https://api.homer0.dev/users/2509/profile`
```

And when working with the API Client, the constructor options has the following object:

```ts
{
  endpointsGenerator?: {
    Class?: typeof EndpointsGenerator;
    options?: Omit<EndpointsGeneratorOptions, 'url' | 'endpoints'>;
  };
}
```

You can use it to send any custom options to the `EndpointsGenerator` service that will be created, to the point that you can even send a custom subclass for the client to use.

```ts
import { EndpointsGenerator, apiClient } from '@homer0/api-utils';

class MyEndpointsGenerator extends EndpointsGenerator {
  get(key: string, parameters: Record<string, unknown> = {}): string {
    return super.get(key, {
      ...parameters,
      magic: true,
    });
  }
}

const client = apiClient({
  fetchClient,
  url: 'https://api.homer0.dev',
  endpoints: {
    profile: 'users/{{id}}/profile',
  },
  endpointsGenerator: {
    Class: MyEndpointsGenerator,
    options: {
      paramsPlaceholder: '{{%name%}}',
    },
  },
});
```

And now all your requests will include `magic` as a query parameter 🧙‍♀️!

#### Endpoints definitions

In all the previous examples, we've seen the endpoints dictionary being just a flat dictionary of strings, but you could also nest endpoints, and even add default query parameters:

```ts
const endpoints = {
  login: 'auth/login',
  users: {
    profile: 'users/:id/profile',
    list: {
      path: 'users',
      query: {
        count: 20,
      },
    },
  },
};
```

The first one is like the previous ones, you would call it with just `'login'`; but the rest are nested inside users, so, for example, you would have to do `'users.profile'` to get the profile endpoint.

The last one, `list`, is not only nested, but it also an object with a `path` and a `query`, and it uses that format to be able to define a default query parameter: `count`.

If the implementation doesn't send a different value for `count`, the generated endpoint will always include `count=20`.

#### Default headers

Back to the client.

Let's say you have a special header in your project that you need to be included on every request, well, you won't have to do it manually, nor overwrite `fetch`, as the client supports "default headers" from the constructor, or "on runtime":

```ts
const client = apiClient({
  fetchClient,
  url: 'https://api.homer0.dev',
  endpoints: {
    profile: 'users/{{id}}/profile',
  },
  defaultHeaders: {
    'x-development': true,
  },
});
```

With that, all the requests will include a `x-development` header from the get go.

But if you have specific logic to enable/disable the header, you can use the `setDefaultHeaders` method:

```ts
if (something()) {
  client.setDefaultHeaders({
    'x-development': true,
  });
}
```

#### Bearer token

If you are working with an API that requires authorization on every request, and that provides you with a bearer token when you authenticate, you could set it on the client in order to automatically include the `Authorization` header on every request:

```js
client.setAuthorizationToken('some-token');
```

Done, all the requests will include `Authorization: Bearer some-token`.

#### Creating a service

As mentioned above, the idea of the client is to extend it and expose specific methods to interact with the API:

```ts
import { APIClient } from '@homer0/api-utils';
import fetchClient from 'node-fetch';

type UserInfo = { id: number; name: string };
type UserProfile = { id: number; name: string; email: string; url: string };

class MyAPI extends APIClient {
  constructor() {
    super({
      fetchClient,
      url: 'https://api.homer0.dev',
      endpoints: {
        login: 'auth/login',
        users: {
          profile: 'users/:id/profile',
          list: {
            path: 'users',
            query: {
              count: 20,
            },
          },
        },
      },
    });
  }

  login(username: string, password: string): Promise<UserInfo> {
    return this.post<UserInfo>(this.endpoint('login'), { username, password });
  }

  getProfile(id: number): Promise<UserProfile> {
    return this.get<UserProfile>(this.endpoint('users.profile', { id }));
  }

  getUsers(count?: number): Promise<UserProfile[]> {
    return this.get<UserProfile[]>(this.endpoint('users.list', { count }));
  }
}
```

Then, your application can use `MyAPI` as a service.

### 🤘 Development

As this project is part of the `packages` monorepo, some of the tooling, like ESLint and Husky, are installed on the root's `package.json`.

#### Tasks

| Task    | Description          |
| ------- | -------------------- |
| `test`  | Runs the unit tests. |
| `build` | Bundles the project. |

## Motivation

This used to be part of the [`wootils`](https://www.npmjs.com/package/wootils) package, my personal lib of utilities, but I decided to extract them into individual packages, as part of the `packages` monorepo, and take the oportunity to migrate them to TypeScript.

Nowadays there's almost no app that doesn't make requests to one or more external APIs, that's why I built this service.
