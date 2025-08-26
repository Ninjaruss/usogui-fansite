import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export enum SearchType {
  ALL = 'all',
  CHAPTERS = 'chapters',
  CHARACTERS = 'characters',
  EVENTS = 'events',
  ARCS = 'arcs',
}

export class SearchQueryDto {
  @ApiProperty({
    description: 'Search query string',
    example: 'Baku Madarame',
    required: true,
  })
  @IsString()
  query: string;

  @ApiProperty({
    description: 'Type of content to search',
    enum: SearchType,
    example: SearchType.ALL,
    required: false,
    default: SearchType.ALL,
  })
  @IsOptional()
  @IsEnum(SearchType)
  type?: SearchType = SearchType.ALL;

  @ApiProperty({
    description: 'User\'s reading progress (highest chapter read) for spoiler filtering',
    example: 15,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => parseInt(value))
  userProgress?: number;

  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiProperty({
    description: 'Number of results per page',
    example: 20,
    minimum: 1,
    maximum: 50,
    required: false,
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;
}
