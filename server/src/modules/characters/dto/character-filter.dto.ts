import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CharacterFilterDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by character name or alternate names',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by faction IDs',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  factionIds?: number[];

  @ApiPropertyOptional({
    description: 'Filter by latest chapter read to hide spoilers',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  lastReadChapter?: number;
}
