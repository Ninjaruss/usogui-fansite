import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CharactersService } from './characters.service';
import { Character } from '../../entities/character.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('characters')
@Controller('characters')
export class CharactersController {
  constructor(private readonly service: CharactersService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all characters',
  description: 'Retrieve a paginated list of characters with optional filtering by name, arc, and description'
  })
  @ApiQuery({ name: 'name', required: false, description: 'Filter by character name' })
  @ApiQuery({ name: 'arc', required: false, description: 'Filter by arc name' })
  // series removed
  @ApiQuery({ name: 'description', required: false, description: 'Filter by description content' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'sort', required: false, description: 'Field to sort by' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'], description: 'Sort order (default: ASC)' })
  @ApiResponse({
    status: 200,
    description: 'Characters retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'Baku Madarame' },
              alternateNames: { type: 'array', items: { type: 'string' }, example: ['The Emperor', 'Death God'] },
              description: { type: 'string', example: 'The main protagonist known for his extraordinary gambling skills' },
              firstAppearanceChapter: { type: 'number', example: 1 },
              notableRoles: { type: 'array', items: { type: 'string' }, example: ['Kakerou Company CEO', 'Professional Gambler'] },
              notableGames: { type: 'array', items: { type: 'string' }, example: ['17 Steps', 'One-Card Poker'] },
              occupation: { type: 'string', example: 'Professional Gambler' },
              affiliations: { type: 'array', items: { type: 'string' }, example: ['Kakerou Company', 'Tournament Committee'] },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        total: { type: 'number', example: 50 },
        page: { type: 'number', example: 1 },
        totalPages: { type: 'number', example: 3 }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAll(
  @Query('name') name?: string,
  @Query('arc') arc?: string,
    @Query('description') description?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('sort') sort?: string,
    @Query('order') order: 'ASC' | 'DESC' = 'ASC',
  ): Promise<{ data: Character[]; total: number; page: number; totalPages: number }> {
  return this.service.findAll({ name, arc, description, page: parseInt(page), limit: parseInt(limit), sort, order });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get character by ID',
    description: 'Retrieve a specific character by their unique identifier'
  })
  @ApiParam({ name: 'id', description: 'Character ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Character found',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Baku Madarame' },
        alternateNames: { type: 'array', items: { type: 'string' }, example: ['The Emperor', 'Death God'] },
        description: { type: 'string', example: 'The main protagonist known for his extraordinary gambling skills' },
        firstAppearanceChapter: { type: 'number', example: 1 },
        notableRoles: { type: 'array', items: { type: 'string' }, example: ['Kakerou Company CEO', 'Professional Gambler'] },
        notableGames: { type: 'array', items: { type: 'string' }, example: ['17 Steps', 'One-Card Poker'] },
        occupation: { type: 'string', example: 'Professional Gambler' },
        affiliations: { type: 'array', items: { type: 'string' }, example: ['Kakerou Company', 'Tournament Committee'] },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Character not found' })
  async getOne(@Param('id') id: number): Promise<Character> {
    const character = await this.service.findOne(id);
    if (!character) {
      throw new NotFoundException(`Character with id ${id} not found`);
    }
    return character;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new character',
    description: 'Create a new character (requires moderator or admin role)'
  })
  @ApiBody({
    description: 'Character data',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Souichi Kiruma' },
        alternateNames: { type: 'array', items: { type: 'string' }, example: ['Zero', 'L-file'] },
        description: { type: 'string', example: 'A mysterious and intelligent gambler with a dark past' },
        firstAppearanceChapter: { type: 'number', example: 1 },
        notableRoles: { type: 'array', items: { type: 'string' }, example: ['Kakerou Referee', 'L-file Leader'] },
        notableGames: { type: 'array', items: { type: 'string' }, example: ['Doubt', 'Ban'] },
        occupation: { type: 'string', example: 'Referee' },
        affiliations: { type: 'array', items: { type: 'string' }, example: ['Kakerou Company', 'L-file'] },
        // series removed
      },
      required: ['name']
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Character created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 2 },
        name: { type: 'string', example: 'Souichi Kiruma' },
        alternateNames: { type: 'array', items: { type: 'string' }, example: ['Zero', 'L-file'] },
        description: { type: 'string', example: 'A mysterious and intelligent gambler with a dark past' },
        firstAppearanceChapter: { type: 'number', example: 1 },
        notableRoles: { type: 'array', items: { type: 'string' }, example: ['Kakerou Referee', 'L-file Leader'] },
        notableGames: { type: 'array', items: { type: 'string' }, example: ['Doubt', 'Ban'] },
        occupation: { type: 'string', example: 'Referee' },
        affiliations: { type: 'array', items: { type: 'string' }, example: ['Kakerou Company', 'L-file'] },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires moderator or admin role' })
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  create(@Body() data: Partial<Character>) {
    return this.service.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update character',
    description: 'Update an existing character (requires moderator or admin role)'
  })
  @ApiParam({ name: 'id', description: 'Character ID', example: 1 })
  @ApiBody({
    description: 'Updated character data',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Baku Madarame' },
        alternateNames: { type: 'array', items: { type: 'string' }, example: ['The Emperor', 'Death God'] },
        description: { type: 'string', example: 'Updated description of the main protagonist' },
        firstAppearanceChapter: { type: 'number', example: 1 },
        notableRoles: { type: 'array', items: { type: 'string' }, example: ['Kakerou Company CEO', 'Professional Gambler'] },
        notableGames: { type: 'array', items: { type: 'string' }, example: ['17 Steps', 'One-Card Poker'] },
        occupation: { type: 'string', example: 'Professional Gambler' },
        affiliations: { type: 'array', items: { type: 'string' }, example: ['Kakerou Company', 'Tournament Committee'] }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Character updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Updated successfully' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires moderator or admin role' })
  @ApiResponse({ status: 404, description: 'Character not found' })
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async update(@Param('id') id: number, @Body() data: Partial<Character>) {
    const result = await this.service.update(id, data);
    if (result.affected === 0) {
      throw new NotFoundException(`Character with id ${id} not found`);
    }
    return { message: 'Updated successfully' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete character',
    description: 'Delete a character (requires moderator or admin role)'
  })
  @ApiParam({ name: 'id', description: 'Character ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Character deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Deleted successfully' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires moderator or admin role' })
  @ApiResponse({ status: 404, description: 'Character not found' })
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async remove(@Param('id') id: number) {
    const result = await this.service.remove(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Character with id ${id} not found`);
    }
    return { message: 'Deleted successfully' };
  }
}
