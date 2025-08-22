import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9\s-]+$/, {
    message: 'Tag name can only contain letters, numbers, spaces, and hyphens'
  })
  @ApiProperty({ 
    description: 'Name of the tag',
    example: 'High Stakes',
    minLength: 2,
    maxLength: 50,
    pattern: '^[a-zA-Z0-9\\s-]+$'
  })
  name: string;
}
