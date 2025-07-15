/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ZodType } from 'zod';

export interface ZodDto<TOutput = any, TInput = TOutput> {
  new (): TOutput;
  isZodDto: true;
  schema: ZodType<TOutput, TInput>;
  create(input: unknown): TOutput;
}

export function createZodDto<TOutput = any, TInput = TOutput>(
  schema: ZodType<TOutput, TInput>,
): ZodDto<TOutput, TInput> {
  class AugmentedZodDto {
    public static isZodDto = true;
    public static schema = schema;

    public static create(input: unknown) {
      return this.schema.parse(input);
    }
  }

  return AugmentedZodDto as unknown as ZodDto<TOutput, TInput>;
}

export function isZodDto(metatype: any): metatype is ZodDto<unknown> {
  return metatype?.isZodDto;
}
