import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsPositive,
  MaxLength,
} from 'class-validator';

export class CreateQuoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  @ApiProperty({
    description: 'The actual quote text',
    example:
      "The essence of gambling is not about winning or losing... it's about the thrill of the unknown.",
    maxLength: 2000,
  })
  text: string;

  @IsNumber()
  @IsPositive()
  @ApiProperty({
    description: 'Chapter number where this quote appears',
    example: 1,
  })
  chapterNumber: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @ApiPropertyOptional({
    description: 'Additional context or description about the quote',
    example: 'Said during the first gambling match with Kaji',
    maxLength: 1000,
  })
  description?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @ApiPropertyOptional({
    description: 'Page number where the quote appears in the chapter',
    example: 15,
  })
  pageNumber?: number;

  @IsNumber()
  @IsPositive()
  @ApiProperty({
    description: 'ID of the character who said this quote',
    example: 1,
  })
  characterId: number;
}
