import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Username for the new account',
    example: 'johndoe',
    minLength: 1
  })
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'Email address for the new account',
    example: 'john@example.com',
    format: 'email'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password for the new account',
    example: 'mySecurePassword123',
    minLength: 8
  })
  @MinLength(8)
  password: string;
}
