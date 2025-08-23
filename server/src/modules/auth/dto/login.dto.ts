import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Username or email address',
    example: 'johndoe'
  })
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'User password',
    example: 'mySecurePassword123'
  })
  @IsNotEmpty()
  password: string;
}
