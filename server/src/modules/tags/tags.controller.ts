import { Controller, Get, Param, Post, Body, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { Tag } from '../../entities/tag.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('tags')
@Controller('tags')
export class TagsController {
  constructor(private service: TagsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all tags',
    description: 'Retrieve all tags with optional sorting'
  })
  @ApiQuery({ name: 'sort', required: false, description: 'Field to sort by (id, name)' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'], description: 'Sort order (default: ASC)' })
  @ApiResponse({
    status: 200,
    description: 'Tags retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Gambling' },
          description: { type: 'string', example: 'Content related to gambling activities' },
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
  ): Promise<Tag[]> {
    return this.service.findAll({ sort, order });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get tag by ID',
    description: 'Retrieve a specific tag by its unique identifier'
  })
  @ApiParam({ name: 'id', description: 'Tag ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Tag found',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Gambling' },
        description: { type: 'string', example: 'Content related to gambling activities' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  getOne(@Param('id') id: number): Promise<Tag> {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new tag',
    description: 'Create a new tag (requires moderator or admin role)'
  })
  @ApiBody({
    description: 'Tag data',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Psychology' },
        description: { type: 'string', example: 'Content involving psychological elements' }
      },
      required: ['name']
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Tag created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 2 },
        name: { type: 'string', example: 'Psychology' },
        description: { type: 'string', example: 'Content involving psychological elements' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires moderator or admin role' })
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  create(@Body() data: Partial<Tag>): Promise<Tag> {
    return this.service.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update tag',
    description: 'Update an existing tag (requires moderator or admin role)'
  })
  @ApiParam({ name: 'id', description: 'Tag ID', example: 1 })
  @ApiBody({
    description: 'Updated tag data',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Gambling' },
        description: { type: 'string', example: 'Updated description for gambling content' }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Tag updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Gambling' },
        description: { type: 'string', example: 'Updated description for gambling content' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires moderator or admin role' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  update(@Param('id') id: number, @Body() data: Partial<Tag>) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete tag',
    description: 'Delete a tag (requires moderator or admin role)'
  })
  @ApiParam({ name: 'id', description: 'Tag ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Tag deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Tag deleted successfully' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires moderator or admin role' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  remove(@Param('id') id: number) {
    return this.service.remove(id);
  }
}
