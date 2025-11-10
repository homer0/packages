/* eslint-disable max-classes-per-file,no-restricted-syntax */
import { z } from 'zod';
import { ArgumentMetadata } from '@nestjs/common';
import { createZodDto } from '@src/dto.js';
import { ZodValidationException } from '@src/exception.js';
import { ZodValidationPipe } from '@src/pipe.js';

describe('ZodValidationPipe', () => {
  const UserSchema = z.object({
    username: z.string(),
    password: z.string(),
  });

  const UserDto = class Dto extends createZodDto(UserSchema) {};

  it('should use manually passed Schema / DTO for validation', () => {
    for (const schemaOrDto of [UserSchema, UserDto]) {
      const pipe = new ZodValidationPipe(schemaOrDto);

      const valid = {
        username: 'vasya',
        password: '123',
      };

      const invalid = {
        username: 'vasya',
        password: 123,
      };

      const metadata: ArgumentMetadata = {
        type: 'body',
      };

      expect(pipe.transform(valid, metadata)).toEqual(valid);
      expect(() => pipe.transform(invalid, metadata)).toThrow();
    }
  });

  it('should use contextual Dto for validation', () => {
    const pipe = new ZodValidationPipe();

    const valid = {
      username: 'vasya',
      password: '123',
    };

    const invalid = {
      username: 'vasya',
      password: 123,
    };

    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: class Dto extends createZodDto(UserSchema) {},
    };

    expect(pipe.transform(valid, metadata)).toEqual(valid);
    expect(() => pipe.transform(invalid, metadata)).toThrow(ZodValidationException);
  });

  it("should return the value when there's no Schema / DTO", () => {
    const pipe = new ZodValidationPipe();

    const valid = {
      username: 'vasya',
      password: '123',
    };

    const invalid = {
      username: 'vasya',
      password: 123,
    };

    const metadata: ArgumentMetadata = {
      type: 'body',
    };

    expect(pipe.transform(valid, metadata)).toEqual(valid);
    expect(pipe.transform(invalid, metadata)).toEqual(invalid);
  });
});
