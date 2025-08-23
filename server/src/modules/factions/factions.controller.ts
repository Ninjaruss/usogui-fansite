import { Controller, Get, Param, Post, Body, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { FactionsService } from './factions.service';
import { Faction } from '../../entities/faction.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { CreateFactionDto } from './dto/create-faction.dto';
import { UpdateFactionDto } from './dto/update-faction.dto';

@ApiTags('factions')
@Controller('factions')
export class FactionsController {
  constructor(private service: FactionsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all factions',
    description: 'Retrieve all factions with optional sorting'
  })
  @ApiQuery({ name: 'sort', required: false, description: 'Field to sort by (id, name)' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'], description: 'Sort order (default: ASC)' })
  @ApiResponse({
    status: 200,
    description: 'Factions retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Kakerou' },
          description: { type: 'string', example: 'The underground gambling organization that governs illegal gambling' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAll(
    @Query('sort') sort?: string,
    @Query('order') order: 'ASC' | 'DESC' = 'ASC',
  ): Promise<Faction[]> {
    return this.service.findAll({ sort, order });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get faction by ID',
    description: 'Retrieve a specific faction by its unique identifier'
  })
  @ApiParam({ name: 'id', description: 'Faction ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Faction found',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Kakerou' },
        description: { type: 'string', example: 'The underground gambling organization that governs illegal gambling' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Faction not found' })
  getOne(@Param('id') id: number): Promise<Faction> {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new faction',
    description: 'Create a new faction (requires moderator or admin role)'
  })
  @ApiBody({ type: CreateFactionDto })
  @ApiResponse({
    status: 201,
    description: 'Faction created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 2 },
        name: { type: 'string', example: 'Ideal' },
        description: { type: 'string', example: 'A rival organization seeking to overthrow Kakerou' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires moderator or admin role' })
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  create(@Body() data: CreateFactionDto): Promise<Faction> {
    return this.service.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update faction',
    description: 'Update an existing faction (requires moderator or admin role)'
  })
  @ApiParam({ name: 'id', description: 'Faction ID', example: 1 })
  @ApiBody({ type: UpdateFactionDto })
  @ApiResponse({
    status: 200,
    description: 'Faction updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Kakerou' },
        description: { type: 'string', example: 'Updated description of the underground gambling organization' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires moderator or admin role' })
  @ApiResponse({ status: 404, description: 'Faction not found' })
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  update(@Param('id') id: number, @Body() data: UpdateFactionDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete faction',
    description: 'Delete a faction (requires moderator or admin role)'
  })
  @ApiParam({ name: 'id', description: 'Faction ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Faction deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Faction deleted successfully' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires moderator or admin role' })
  @ApiResponse({ status: 404, description: 'Faction not found' })
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  remove(@Param('id') id: number) {
    return this.service.remove(id);
  }
}
