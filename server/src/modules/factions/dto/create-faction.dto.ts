import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateFactionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @ApiProperty({
    description: 'Name of the faction',
    example: 'Kakerou',
  })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  @ApiPropertyOptional({
    description: 'Description of the faction',
    example:
      'The underground gambling organization that governs illegal gambling',
  })
  description?: string;
}
