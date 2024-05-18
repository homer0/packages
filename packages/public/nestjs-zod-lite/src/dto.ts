/* eslint-disable @typescript-eslint/no-explicit-any */
import { ZodSchema, ZodTypeDef } from 'zod';

export interface ZodDto<
  TOutput = any,
  TDef extends ZodTypeDef = ZodTypeDef,
  TInput = TOutput,
> {
  new (): TOutput;
  isZodDto: true;
  schema: ZodSchema<TOutput, TDef, TInput>;
  create(input: unknown): TOutput;
}

export function createZodDto<
  TOutput = any,
  TDef extends ZodTypeDef = ZodTypeDef,
  TInput = TOutput,
>(schema: ZodSchema<TOutput, TDef, TInput>): ZodDto<TOutput, TDef, TInput> {
  class AugmentedZodDto {
    public static isZodDto = true;
    public static schema = schema;

    public static create(input: unknown) {
      return this.schema.parse(input);
    }
  }

  return AugmentedZodDto as unknown as ZodDto<TOutput, TDef, TInput>;
}

export function isZodDto(metatype: any): metatype is ZodDto<unknown> {
  return metatype?.isZodDto;
}
