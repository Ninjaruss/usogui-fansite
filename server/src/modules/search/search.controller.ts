import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchQueryDto, SearchType } from './dto/search-query.dto';
import { SearchResultDto } from './dto/search-result.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, User } from '../../entities/user.entity';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({
    summary: 'Search across all content types',
    description:
      'Perform text search across chapters, characters, events, and arcs with spoiler filtering based on user reading progress',
  })
  @ApiQuery({
    name: 'query',
    description: 'Search term to look for',
    example: 'Baku Madarame',
    required: true,
  })
  @ApiQuery({
    name: 'type',
    enum: SearchType,
    description: 'Type of content to search (default: all)',
    required: false,
  })
  @ApiQuery({
    name: 'userProgress',
    description:
      "User's reading progress (highest chapter read) for spoiler filtering",
    example: 15,
    required: false,
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number (default: 1)',
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Items per page (default: 20, max: 50)',
    required: false,
  })
  @ApiOkResponse({
    description: 'Search results with pagination and metadata',
    schema: {
      type: 'object',
      properties: {
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              type: {
                type: 'string',
                example: 'character',
                enum: ['chapter', 'character', 'event', 'arc'],
              },
              title: { type: 'string', example: 'Baku Madarame' },
              description: {
                type: 'string',
                example:
                  'A professional gambler known for taking on dangerous bets.',
              },
              score: { type: 'number', example: 1.0 },
              hasSpoilers: { type: 'boolean', example: false },
              slug: { type: 'string', example: 'character-1' },
              metadata: {
                type: 'object',
                example: {
                  occupation: 'Professional Gambler',
                  firstAppearanceChapter: 1,
                },
              },
            },
          },
        },
        total: { type: 'number', example: 42 },
        page: { type: 'number', example: 1 },
        perPage: { type: 'number', example: 20 },
        totalPages: { type: 'number', example: 3 },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid search parameters',
    schema: {
      example: {
        statusCode: 400,
        message: ['query should not be empty'],
        error: 'Bad Request',
      },
    },
  })
  async search(@Query() searchQuery: SearchQueryDto): Promise<SearchResultDto> {
    return this.searchService.search(searchQuery);
  }

  @Get('suggestions')
  @ApiOperation({
    summary: 'Get search suggestions',
    description:
      'Get autocomplete suggestions based on partial search input (minimum 2 characters)',
  })
  @ApiQuery({
    name: 'q',
    description: 'Partial search query for suggestions',
    example: 'Baku',
    required: true,
  })
  @ApiOkResponse({
    description: 'List of search suggestions',
    schema: {
      type: 'array',
      items: { type: 'string' },
      example: ['Baku Madarame', 'Bakudan Game'],
    },
  })
  @ApiBadRequestResponse({
    description: 'Query too short (minimum 2 characters)',
    schema: {
      example: {
        statusCode: 400,
        message: 'Query must be at least 2 characters long',
        error: 'Bad Request',
      },
    },
  })
  async getSuggestions(@Query('q') query: string): Promise<string[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }
    return this.searchService.getSuggestions(query.trim());
  }

  @Get('viewable/:userProgress')
  @ApiOperation({
    summary: 'Search content safe for user',
    description:
      'Search for content that is safe for the user to view based on their reading progress',
  })
  @ApiQuery({
    name: 'q',
    description: 'Search term',
    example: 'tournament',
    required: true,
  })
  @ApiQuery({
    name: 'type',
    enum: SearchType,
    description: 'Type of content to search',
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of results (default: 20)',
    required: false,
  })
  @ApiOkResponse({
    description: 'Safe search results for user',
    type: SearchResultDto,
  })
  async searchViewable(
    @Query('q') query: string,
    @Query('userProgress', ParseIntPipe) userProgress: number,
    @Query('type') type?: SearchType,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<SearchResultDto> {
    const searchQuery: SearchQueryDto = {
      query,
      type: type || SearchType.ALL,
      userProgress,
      page: 1,
      limit: limit || 20,
    };
    return this.searchService.search(searchQuery);
  }

  @Get('content-types')
  @ApiOperation({
    summary: 'Get available content types with counts',
    description:
      'Get all searchable content types and their respective item counts',
  })
  @ApiOkResponse({
    description: 'Content types with counts',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', example: 'characters' },
          count: { type: 'number', example: 150 },
        },
      },
      example: [
        { type: 'chapters', count: 541 },
        { type: 'characters', count: 150 },
        { type: 'events', count: 89 },
        { type: 'arcs', count: 12 },
      ],
    },
  })
  async getContentTypes(): Promise<{ type: string; count: number }[]> {
    return this.searchService.getContentTypes();
  }

  @Get('my-safe-search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Search content safe for current user',
    description:
      "Search for content that is safe for the current user based on their reading progress (automatically uses user's progress)",
  })
  @ApiQuery({
    name: 'query',
    description: 'Search term',
    example: 'tournament',
    required: true,
  })
  @ApiQuery({
    name: 'type',
    enum: SearchType,
    description: 'Type of content to search (default: all)',
    required: false,
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number (default: 1)',
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Items per page (default: 20, max: 50)',
    required: false,
  })
  @ApiOkResponse({
    description: 'Safe search results for current user',
    type: SearchResultDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async searchSafeForUser(
    @Query('query') query: string,
    @CurrentUser() user: User,
    @Query('type') type?: SearchType,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<SearchResultDto> {
    const searchQuery: SearchQueryDto = {
      query,
      type: type || SearchType.ALL,
      userProgress: user.userProgress,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    };
    return this.searchService.search(searchQuery);
  }
}
