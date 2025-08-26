import { Controller, Get, Post, Body, Param, UseGuards, ParseIntPipe, ValidationPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { GamblesService } from './gambles.service';
import { CreateGambleDto } from './dto/create-gamble.dto';
import { Gamble } from '../../entities/gamble.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('gambles')
@Controller('gambles')
export class GamblesController {
  constructor(private readonly gamblesService: GamblesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a new gamble',
    description: 'Create a new gamble with teams, rounds, and observers. Represents high-stakes gambling events from the Usogui manga.'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires moderator or admin role' })
  @ApiResponse({
    status: 201,
    description: 'The gamble has been successfully created',
    schema: {
      example: {
        id: 1,
        name: 'Protoporos',
        rules: 'A deadly gambling game involving stones...',
        winCondition: 'The player who removes the last stone loses',
        chapterId: 1,
        teams: [],
        rounds: [],
        observers: [],
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input (e.g., less than 2 teams)',
    schema: {
      example: {
        statusCode: 400,
        message: 'At least 2 teams are required for a gamble',
        error: 'Bad Request'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Not Found',
        error: 'Not Found'
      }
    }
  })
  create(@Body() createGambleDto: CreateGambleDto): Promise<Gamble> {
    return this.gamblesService.create(createGambleDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all gambles with optional filtering',
    description: 'Retrieve all gambles with optional filtering by name, participant, team, chapter, or character. Supports pagination.'
  })
  @ApiQuery({
    name: 'gambleName',
    required: false,
    description: 'Filter by gamble name (case-insensitive partial match)',
    example: 'protoporos'
  })
  @ApiQuery({
    name: 'participantName',
    required: false,
    description: 'Filter by participant name (searches team members and observers)',
    example: 'baku'
  })
  @ApiQuery({
    name: 'teamName',
    required: false,
    description: 'Filter by team name (case-insensitive partial match)',
    example: 'team'
  })
  @ApiQuery({
  name: 'chapterId',
  required: false,
  type: 'number',
  description: 'Filter by chapter number (will match chapters with this number across series)',
  example: 1
  })
  @ApiQuery({
    name: 'characterId',
    required: false,
    type: 'number',
    description: 'Filter by character ID (searches team members and observers)',
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Limit the number of results',
    example: 10
  })
  @ApiResponse({
    status: 200,
    description: 'List of gambles (filtered if parameters provided)',
    type: [Gamble],
    examples: {
      'all-gambles': {
        summary: 'All gambles',
        value: [
          {
            id: 1,
            name: 'Protoporos',
            rules: 'A deadly gambling game involving stones...',
            winCondition: 'The player who removes the last stone loses',
            chapterId: 1,
            teams: [],
            rounds: [],
            observers: [],
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z'
          }
        ]
      },
      'filtered-by-name': {
        summary: 'Filtered by gamble name',
        value: [
          {
            id: 1,
            name: 'Protoporos',
            rules: 'A deadly gambling game involving stones...',
            winCondition: 'The player who removes the last stone loses',
            chapterId: 1,
            teams: [],
            rounds: [],
            observers: [],
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z'
          }
        ]
      }
    }
  })
  async findAll(
    @Query('gambleName') gambleName?: string,
    @Query('participantName') participantName?: string,
    @Query('teamName') teamName?: string,
    @Query('chapterId', new ParseIntPipe({ optional: true })) chapterId?: number,
    @Query('characterId', new ParseIntPipe({ optional: true })) characterId?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('page') page = '1',
    @Query('legacy') legacy?: string,
  ) {
    // If any filters are provided, use the search functionality
    if (gambleName || participantName || teamName || chapterId || characterId || limit) {
      return this.gamblesService.search({
        gambleName,
        participantName,
        teamName,
        chapterId,
        characterId,
        limit,
      });
    }
    
    // Otherwise return paginated gambles
    const pageNum = parseInt(page) || 1;
    const result = await this.gamblesService.findAll({ page: pageNum, limit: 100 });
    const response = { data: result.data, meta: { total: result.total, page: result.page, perPage: 100, totalPages: result.totalPages } };
    if (legacy === 'true') return { gambles: result.data, ...response };
    return response;
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a specific gamble',
    description: 'Retrieve a gamble by ID with its teams, rounds, and observers'
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the gamble to retrieve',
    type: Number
  })
  @ApiResponse({
    status: 200,
    description: 'The gamble details',
    schema: {
      example: {
        id: 1,
        name: 'Protoporos',
        rules: 'A deadly gambling game involving stones...',
        winCondition: 'The player who removes the last stone loses',
        chapterId: 1,
        teams: [
          {
            id: 1,
            name: 'Baku Team',
            members: ['Baku Madarame'],
            isWinner: false
          },
          {
            id: 2,
            name: 'Lalo Team',
            members: ['Lalo'],
            isWinner: true
          }
        ],
        rounds: [
          {
            id: 1,
            roundNumber: 1,
            description: 'First round of Protoporos',
            outcome: 'Lalo wins'
          }
        ],
        observers: ['Referee Madarame'],
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Gamble not found'
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Gamble> {
    return this.gamblesService.findOne(id);
  }

  @Get('chapter/:chapterId')
  @ApiOperation({
    summary: 'Get gambles by chapter',
    description: 'Retrieve all gambles that occurred in a specific chapter'
  })
  @ApiParam({
  name: 'chapterId',
  description: 'Chapter number to find gambles for (matches chapters by number across series)',
  type: Number
  })
  @ApiResponse({
    status: 200,
    description: 'List of gambles in the chapter',
    type: [Gamble]
  })
  findByChapter(@Param('chapterId', ParseIntPipe) chapterId: number): Promise<Gamble[]> {
    return this.gamblesService.findByChapter(chapterId);
  }

  @Get('character/:characterId')
  @ApiOperation({
    summary: 'Get gambles by character',
    description: 'Retrieve all gambles where a character participated or observed'
  })
  @ApiParam({
    name: 'characterId',
    description: 'ID of the character to find gambles for',
    type: Number
  })
  @ApiResponse({
    status: 200,
    description: 'List of gambles involving the character',
    type: [Gamble]
  })
  findByCharacter(@Param('characterId', ParseIntPipe) characterId: number): Promise<Gamble[]> {
    return this.gamblesService.findByCharacter(characterId);
  }
}
