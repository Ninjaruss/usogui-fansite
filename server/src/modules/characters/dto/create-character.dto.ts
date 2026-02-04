import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Min,
  ArrayMaxSize,
  ArrayMinSize,
} from 'class-validator';

export class CreateCharacterDto {
  @ApiProperty({
    description: "Character's primary name",
    example: 'Baku Madarame',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Alternative names or aliases',
    example: ['The Emperor', 'Death God'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(10) // Reasonable limit for alternate names
  @MaxLength(100, { each: true })
  alternateNames?: string[];

  @ApiPropertyOptional({
    description: 'Character description',
    example: 'A professional gambler known for taking on dangerous bets.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(5000) // Reasonable limit for description
  description?: string;

  @ApiPropertyOptional({
    description: 'Character backstory - detailed history and background',
    example:
      'Born into a family of gamblers, Baku learned the art of deception at an early age...',
  })
  @IsString()
  @IsOptional()
  @MaxLength(15000) // Higher limit than description for detailed backstory
  backstory?: string;

  @ApiPropertyOptional({
    description: 'First chapter appearance number',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  firstAppearanceChapter?: number;

  @ApiPropertyOptional({
    description: 'IDs of organizations the character belongs to',
    type: [Number],
    example: [1, 3],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @ArrayMaxSize(10)
  organizationIds?: number[];
}
