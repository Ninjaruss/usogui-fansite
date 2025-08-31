import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateQuoteDto } from './create-quote.dto';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
  MaxLength,
} from 'class-validator';

export class UpdateQuoteDto extends PartialType(CreateQuoteDto) {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @ApiPropertyOptional({
    description: 'The actual quote text',
    example:
      "The essence of gambling is not about winning or losing... it's about the thrill of the unknown.",
    maxLength: 2000,
  })
  text?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @ApiPropertyOptional({
    description: 'Chapter number where this quote appears',
    example: 1,
  })
  chapterNumber?: number;

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

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @ApiPropertyOptional({
    description: 'ID of the character who said this quote',
    example: 1,
  })
  characterId?: number;
}
