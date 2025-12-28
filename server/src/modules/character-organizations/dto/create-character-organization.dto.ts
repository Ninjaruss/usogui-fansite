import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCharacterOrganizationDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @ApiProperty({
    description: 'ID of the character',
    example: 1,
  })
  characterId: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @ApiProperty({
    description: 'ID of the organization',
    example: 1,
  })
  organizationId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @ApiProperty({
    description: 'The role/position of the character in the organization',
    example: 'Leader',
    maxLength: 100,
  })
  role: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @ApiProperty({
    description: 'Chapter where this membership/role begins',
    example: 50,
  })
  startChapter: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @ApiPropertyOptional({
    description: 'Chapter where this membership/role ends (null if ongoing)',
    example: 200,
  })
  endChapter?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @ApiPropertyOptional({
    description:
      'Chapter the user should have read before seeing this (defaults to startChapter)',
    example: 50,
  })
  spoilerChapter?: number;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  @ApiPropertyOptional({
    description: 'Additional notes about this membership',
    example: 'Joined after winning the entrance gamble',
    maxLength: 1000,
  })
  notes?: string;
}
