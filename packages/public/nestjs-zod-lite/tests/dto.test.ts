import { z } from 'zod';
import { createZodDto } from '@src/dto';

describe('createZodDto', () => {
  it('should correctly create DTO', () => {
    const UserSchema = z.object({
      username: z.string(),
      password: z.string(),
    });

    class UserDto extends createZodDto(UserSchema) {}

    expect(UserDto.isZodDto).toBe(true);
    expect(UserDto.schema).toBe(UserSchema);

    const user = UserDto.create({
      username: 'vasya',
      password: 'strong',
    });

    expect(user).toEqual({
      username: 'vasya',
      password: 'strong',
    });
  });
});
