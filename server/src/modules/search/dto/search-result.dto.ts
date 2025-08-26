import { ApiProperty } from '@nestjs/swagger';

export class SearchResultItemDto {
  @ApiProperty({
    description: 'Unique identifier of the result',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Type of content',
    example: 'chapter',
    enum: ['chapter', 'character', 'event', 'arc', 'guide'],
  })
  type: string;

  @ApiProperty({
    description: 'Title or name of the content',
    example: 'Chapter 1: The Beginning',
  })
  title: string;

  @ApiProperty({
    description: 'Brief description or summary',
    example: 'Introduction to the main character and setting',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Search relevance score',
    example: 0.95,
  })
  score: number;

  @ApiProperty({
    description: 'Contains spoiler content',
    example: false,
  })
  hasSpoilers: boolean;

  @ApiProperty({
    description: 'URL slug for the content',
    example: 'chapter-1-the-beginning',
    required: false,
  })
  slug?: string;

  @ApiProperty({
    description: 'Additional metadata specific to content type',
    example: { chapterNumber: 1, volume: 1 },
    required: false,
  })
  metadata?: Record<string, any>;
}

export class SearchSuggestionDto {
  @ApiProperty({
    description: 'Suggested search term',
    example: 'Baku Madarame',
  })
  text: string;

  @ApiProperty({
    description: 'Number of results for this suggestion',
    example: 42,
  })
  count: number;

  @ApiProperty({
    description: 'Type of content this suggestion relates to',
    example: 'character',
    required: false,
  })
  type?: string;
}

export class SearchResultDto {
  @ApiProperty({
    description: 'Search results',
    type: [SearchResultItemDto],
  })
  results: SearchResultItemDto[];

  @ApiProperty({
    description: 'Total number of results',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of results per page',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 8,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Search suggestions for typos or related terms',
    type: [SearchSuggestionDto],
    required: false,
  })
  suggestions?: SearchSuggestionDto[];
}
