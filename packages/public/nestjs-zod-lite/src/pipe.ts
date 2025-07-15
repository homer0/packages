import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';
import { isZodDto, type ZodDto } from './dto';
import type { ZodExceptionCreator } from './exception';
import { validate } from './validate';

interface ZodValidationPipeOptions {
  createValidationException?: ZodExceptionCreator;
}

type ZodValidationPipeClass = new (schemaOrDto?: ZodType | ZodDto) => PipeTransform;

export function createZodValidationPipe({
  createValidationException,
}: ZodValidationPipeOptions = {}): ZodValidationPipeClass {
  @Injectable()
  class ZodValidationPipe implements PipeTransform {
    constructor(private schemaOrDto?: ZodType | ZodDto) {}

    public transform(value: unknown, metadata: ArgumentMetadata) {
      if (this.schemaOrDto) {
        return validate(value, this.schemaOrDto, createValidationException);
      }

      const { metatype } = metadata;

      if (!isZodDto(metatype)) {
        return value;
      }

      return validate(value, metatype.schema, createValidationException);
    }
  }

  return ZodValidationPipe;
}

export const ZodValidationPipe = createZodValidationPipe();
