/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ZodType } from 'zod';
import { isZodDto, type ZodDto } from './dto';
import { createZodValidationException, type ZodExceptionCreator } from './exception';

export function validate<TOutput = any, TInput = TOutput>(
  value: unknown,
  schemaOrDto: ZodType<TOutput, TInput> | ZodDto<TOutput, TInput>,
  createValidationException: ZodExceptionCreator = createZodValidationException,
) {
  const schema = isZodDto(schemaOrDto) ? schemaOrDto.schema : schemaOrDto;

  const result = schema.safeParse(value);

  if (!result.success) {
    throw createValidationException(result.error);
  }

  return result.data;
}
