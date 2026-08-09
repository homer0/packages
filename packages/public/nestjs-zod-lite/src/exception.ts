import { BadRequestException, HttpStatus } from '@nestjs/common';
import { ZodError } from 'zod';

export class ZodValidationException extends BadRequestException {
  constructor(private error: ZodError) {
    super({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Validation failed',
      errors: error.issues,
    });
  }

  public getZodError() {
    return this.error;
  }
}

export type ZodExceptionCreator = (error: ZodError) => Error;

export const createZodValidationException: ZodExceptionCreator = (error) =>
  new ZodValidationException(error);
