import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { GamblesService } from './gambles.service';
import { CreateGambleDto } from './dto/create-gamble.dto';
import { Gamble } from '../../entities/gamble.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('Gambles')
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
    description: 'Chapter not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Chapter with id 1 not found',
        error: 'Not Found'
      }
    }
  })
  create(@Body() createGambleDto: CreateGambleDto): Promise<Gamble> {
    return this.gamblesService.create(createGambleDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all gambles',
    description: 'Retrieve all gambles with their teams, rounds, and observers'
  })
  @ApiResponse({
    status: 200,
    description: 'List of all gambles',
    type: [Gamble]
  })
  findAll(): Promise<Gamble[]> {
    return this.gamblesService.findAll();
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
    description: 'ID of the chapter to find gambles for',
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
