import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { Quote } from '../../entities/quote.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../../entities/user.entity';

@ApiTags('quotes')
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Create a new quote',
    description: 'Create a new quote. Requires authentication. Any authenticated user can submit quotes.'
  })
  @ApiBody({ type: CreateQuoteDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Quote created successfully',
    type: Quote
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input data' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - valid JWT token required' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Character not found' 
  })
  create(
    @Body(ValidationPipe) createQuoteDto: CreateQuoteDto,
    @CurrentUser() user: User
  ): Promise<Quote> {
    return this.quotesService.create(createQuoteDto, user);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all quotes with optional filtering',
    description: 'Retrieve quotes with various filtering options including character, chapter range, and text search.'
  })
  @ApiQuery({ name: 'characterId', required: false, description: 'Filter by character ID' })
  @ApiQuery({ name: 'chapterNumber', required: false, description: 'Filter by specific chapter number' })
  @ApiQuery({ name: 'chapterStart', required: false, description: 'Filter by chapter range start' })
  @ApiQuery({ name: 'chapterEnd', required: false, description: 'Filter by chapter range end' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in quote text and description' })
  @ApiQuery({ name: 'submittedById', required: false, description: 'Filter by submitter user ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results per page' })
  @ApiResponse({ 
    status: 200, 
    description: 'Quotes retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/Quote' }
        },
        total: { type: 'number' },
        page: { type: 'number' },
        perPage: { type: 'number' },
        totalPages: { type: 'number' }
      }
    }
  })
  async findAll(
    @Query('characterId', new ParseIntPipe({ optional: true })) characterId?: number,
    @Query('chapterNumber', new ParseIntPipe({ optional: true })) chapterNumber?: number,
    @Query('chapterStart', new ParseIntPipe({ optional: true })) chapterStart?: number,
    @Query('chapterEnd', new ParseIntPipe({ optional: true })) chapterEnd?: number,
    @Query('search') search?: string,
    @Query('submittedById', new ParseIntPipe({ optional: true })) submittedById?: number,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<{ data: Quote[]; total: number; page?: number; perPage?: number; totalPages?: number }> {
    const chapterRange = chapterStart && chapterEnd ? { start: chapterStart, end: chapterEnd } : undefined;
    
    return this.quotesService.findAll({
      characterId,
      chapterNumber,
      chapterRange,
      search,
      submittedById,
      page,
      limit,
    });
  }

  @Get('random')
  @ApiOperation({ 
    summary: 'Get a random quote',
    description: 'Retrieve a random quote with optional filtering by character or chapter range.'
  })
  @ApiQuery({ name: 'characterId', required: false, description: 'Filter by character ID' })
  @ApiQuery({ name: 'chapterStart', required: false, description: 'Filter by chapter range start' })
  @ApiQuery({ name: 'chapterEnd', required: false, description: 'Filter by chapter range end' })
  @ApiResponse({ 
    status: 200, 
    description: 'Random quote retrieved successfully',
    type: Quote
  })
  @ApiResponse({ 
    status: 404, 
    description: 'No quotes found matching the criteria' 
  })
  findRandom(
    @Query('characterId', new ParseIntPipe({ optional: true })) characterId?: number,
    @Query('chapterStart', new ParseIntPipe({ optional: true })) chapterStart?: number,
    @Query('chapterEnd', new ParseIntPipe({ optional: true })) chapterEnd?: number,
  ): Promise<Quote> {
    const chapterRange = chapterStart && chapterEnd ? { start: chapterStart, end: chapterEnd } : undefined;
    
    return this.quotesService.findRandom({
      characterId,
      chapterRange,
    });
  }

  @Get('search')
  @ApiOperation({ 
    summary: 'Search quotes by text',
    description: 'Search for quotes containing specific text in quote content or description.'
  })
  @ApiQuery({ name: 'q', required: true, description: 'Search term' })
  @ApiQuery({ name: 'characterId', required: false, description: 'Filter by character ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of results' })
  @ApiResponse({ 
    status: 200, 
    description: 'Search results retrieved successfully',
    type: [Quote]
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Search term is required' 
  })
  searchQuotes(
    @Query('q') searchTerm: string,
    @Query('characterId', new ParseIntPipe({ optional: true })) characterId?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<Quote[]> {
    return this.quotesService.searchQuotes(searchTerm, {
      characterId,
      limit,
    });
  }

  @Get('character/:characterId/stats')
  @ApiOperation({ 
    summary: 'Get character quote statistics',
    description: 'Retrieve statistics about quotes for a specific character.'
  })
  @ApiParam({ name: 'characterId', description: 'Character ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Character quote statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalQuotes: { type: 'number' },
        chaptersWithQuotes: { type: 'array', items: { type: 'number' } },
        firstQuoteChapter: { type: 'number' },
        lastQuoteChapter: { type: 'number' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Character not found' 
  })
  getCharacterStats(
    @Param('characterId', ParseIntPipe) characterId: number
  ): Promise<{
    totalQuotes: number;
    chaptersWithQuotes: number[];
    firstQuoteChapter: number;
    lastQuoteChapter: number;
  }> {
    return this.quotesService.getCharacterStats(characterId);
  }

  @Get('chapter/:chapterNumber')
  @ApiOperation({ 
    summary: 'Get quotes from a specific chapter',
    description: 'Retrieve all quotes from a specific chapter.'
  })
  @ApiParam({ name: 'chapterNumber', description: 'Chapter number' })
  @ApiResponse({ 
    status: 200, 
    description: 'Chapter quotes retrieved successfully',
    type: [Quote]
  })
  getQuotesByChapter(
    @Param('chapterNumber', ParseIntPipe) chapterNumber: number,
  ): Promise<Quote[]> {
    return this.quotesService.getQuotesByChapter(chapterNumber);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get a quote by ID',
    description: 'Retrieve a specific quote by its ID with related character and submitter information.'
  })
  @ApiParam({ name: 'id', description: 'Quote ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Quote retrieved successfully',
    type: Quote
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Quote not found' 
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Quote> {
    return this.quotesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Update a quote',
    description: 'Update a quote. Users can only update their own quotes. Moderators and administrators can update any quote.'
  })
  @ApiParam({ name: 'id', description: 'Quote ID' })
  @ApiBody({ type: UpdateQuoteDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Quote updated successfully',
    type: Quote
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input data' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - valid JWT token required' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - can only update own quotes unless moderator/admin' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Quote or Character not found' 
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateQuoteDto: UpdateQuoteDto,
    @CurrentUser() user: User
  ): Promise<Quote> {
    return this.quotesService.update(id, updateQuoteDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Delete a quote',
    description: 'Delete a quote. Users can only delete their own quotes. Moderators and administrators can delete any quote.'
  })
  @ApiParam({ name: 'id', description: 'Quote ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Quote deleted successfully' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - valid JWT token required' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - can only delete own quotes unless moderator/admin' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Quote not found' 
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User
  ): Promise<{ message: string }> {
    await this.quotesService.remove(id, user);
    return { message: 'Quote deleted successfully' };
  }

  @Delete('bulk/character/:characterId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Bulk delete quotes by character (Moderator/Admin only)',
    description: 'Delete all quotes for a specific character. Requires moderator or administrator role.'
  })
  @ApiParam({ name: 'characterId', description: 'Character ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Character quotes deleted successfully' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - valid JWT token required' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - requires moderator or administrator role' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Character not found' 
  })
  async bulkDeleteByCharacter(
    @Param('characterId', ParseIntPipe) characterId: number,
  ): Promise<{ message: string; deletedCount: number }> {
    const deletedCount = await this.quotesService.bulkDeleteByCharacter(characterId);
    
    return { 
      message: `All quotes for character ${characterId} deleted successfully`,
      deletedCount 
    };
  }
}
