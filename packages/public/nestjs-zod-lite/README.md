# NestJS Zod Lite

A smaller version of the [deprecated nestjs-zod](https://github.com/risen228/nestjs-zod) package to validate DTOs.

---

<p align="center">
  <img src="nestjs-zod.svg" width="560px" align="center" alt="NestJS + Zod logo" style="max-width: 100%;" />
  <h1></h1>
  <p align="center">
    ✨ A superior validation solution for your NestJS application ✨
  </p>
</p>

## Core library features

- `createZodDto` - create DTO classes from Zod schemas
- `ZodValidationPipe` - validate `body` / `query` / `params` using Zod DTOs

## Installation

```bash
npm install nestjs-zod zod --save
```

Peer dependencies:

- `zod`
- `@nestjs/common`

## Navigation

- [Creating DTO from Zod schema](#creating-dto-from-zod-schema)
  - [Using DTO](#using-dto)
- [Using ZodValidationPipe](#using-zodvalidationpipe)
  - [Globally](#globally-recommended)
  - [Locally](#locally)
  - [Creating custom validation pipe](#creating-custom-validation-pipe)
- [Validation Exceptions](#validation-exceptions)

## Creating DTO from Zod schema

```ts
import { createZodDto } from '@homer0/nestjs-zod-lite';
import { z } from 'zod';

const CredentialsSchema = z.object({
  username: z.string(),
  password: z.string(),
});

// class is required for using DTO as a type
class CredentialsDto extends createZodDto(CredentialsSchema) {}
```

### Using DTO

DTO does two things:

- Provides a schema for `ZodValidationPipe`
- Provides a type from Zod schema for you

```ts
@Controller('auth')
class AuthController {
  // with global ZodValidationPipe (recommended)
  async signIn(@Body() credentials: CredentialsDto) {}
  async signIn(@Param() signInParams: SignInParamsDto) {}
  async signIn(@Query() signInQuery: SignInQueryDto) {}

  // with route-level ZodValidationPipe
  @UsePipes(ZodValidationPipe)
  async signIn(@Body() credentials: CredentialsDto) {}
}

// with controller-level ZodValidationPipe
@UsePipes(ZodValidationPipe)
@Controller('auth')
class AuthController {
  async signIn(@Body() credentials: CredentialsDto) {}
}
```

## Using ZodValidationPipe

The validation pipe uses your Zod schema to parse data from parameter decorator.

When the data is invalid - it throws [ZodValidationException](#validation-exceptions).

### Globally (recommended)

```ts
import { ZodValidationPipe } from '@homer0/nestjs-zod-lite';
import { APP_PIPE } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
```

### Locally

```ts
import { ZodValidationPipe } from '@homer0/nestjs-zod-lite';

// controller-level
@UsePipes(ZodValidationPipe)
class AuthController {}

class AuthController {
  // route-level
  @UsePipes(ZodValidationPipe)
  async signIn() {}
}
```

Also, you can instantly pass a Schema or DTO:

```ts
import { ZodValidationPipe } from '@homer0/nestjs-zod-lite';
import { UserDto, UserSchema } from './auth.contracts';

// using schema
@UsePipes(new ZodValidationPipe(UserSchema))
// using DTO
@UsePipes(new ZodValidationPipe(UserDto))
class AuthController {}

class AuthController {
  // the same applies to route-level
  async signIn() {}
}
```

### Creating custom validation pipe

```ts
import { createZodValidationPipe } from '@homer0/nestjs-zod-lite';

const MyZodValidationPipe = createZodValidationPipe({
  // provide custom validation exception factory
  createValidationException: (error: ZodError) => new BadRequestException('Ooops'),
});
```

## Validation Exceptions

The default server response on validation error looks like that:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "code": "too_small",
      "minimum": 8,
      "type": "string",
      "inclusive": true,
      "message": "String must contain at least 8 character(s)",
      "path": ["password"]
    }
  ]
}
```

The reason of this structure is default `ZodValidationException`.

You can customize the exception by creating custom `nestjs-zod` entities using the factories:

- [Validation Pipe](#creating-custom-validation-pipe)

You can create `ZodValidationException` manually by providing `ZodError`:

```ts
const exception = new ZodValidationException(error);
```

Also, `ZodValidationException` has an additional API for better usage in NestJS Exception Filters:

```ts
@Catch(ZodValidationException)
export class ZodValidationExceptionFilter implements ExceptionFilter {
  catch(exception: ZodValidationException) {
    exception.getZodError(); // -> ZodError
  }
}
```

## Credits

- [nestjs-zod](https://github.com/risen228/nestjs-zod)
  The original library, deprecated now.

- [zod-dto](https://github.com/kbkk/abitia/tree/master/packages/zod-dto)
  `nestjs-zod` includes a lot of refactored code from `zod-dto`.

- [zod-nestjs](https://github.com/anatine/zod-plugins/tree/main/libs/zod-nestjs) and [zod-openapi](https://github.com/anatine/zod-plugins/tree/main/libs/zod-openapi)
  These libraries bring some new features compared to `zod-dto`.
  `nestjs-zod` has used them too.
