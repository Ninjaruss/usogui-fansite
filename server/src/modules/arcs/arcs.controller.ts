import { Controller, Get, Post, Put, Delete, Body, Param, Query, NotFoundException, UseGuards, ValidationPipe, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ArcsService } from './arcs.service';
import { Arc } from '../../entities/arc.entity';
import { Chapter } from '../../entities/chapter.entity';
import { CreateArcDto } from './dto/create-arc.dto';
import { UpdateArcDto } from './dto/update-arc.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('arcs')
@Controller('arcs')
export class ArcsController {
  constructor(private readonly service: ArcsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all arcs',
  description: 'Retrieve a paginated list of arcs with optional filtering by name and description'
  })
  @ApiQuery({ name: 'name', required: false, description: 'Filter by arc name' })
  // series removed
  @ApiQuery({ name: 'description', required: false, description: 'Filter by description content' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'sort', required: false, description: 'Field to sort by' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'], description: 'Sort order (default: ASC)' })
  @ApiResponse({
    status: 200,
    description: 'Arcs retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'Tower of Karma Arc' },
              description: { type: 'string', example: 'A deadly tournament held in a mysterious tower' },
              startChapter: { type: 'number', example: 150 },
              endChapter: { type: 'number', example: 210 },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        total: { type: 'number', example: 15 },
        page: { type: 'number', example: 1 },
        totalPages: { type: 'number', example: 1 }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAll(
  @Query('name') name?: string,
  @Query('description') description?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('sort') sort?: string,
    @Query('order') order: 'ASC' | 'DESC' = 'ASC',
  ): Promise<{ data: Arc[]; total: number; page: number; totalPages: number }> {
  return this.service.findAll({ name, description, page: parseInt(page), limit: parseInt(limit), sort, order });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get arc by ID',
    description: 'Retrieve a specific arc by its unique identifier'
  })
  @ApiParam({ name: 'id', description: 'Arc ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Arc found',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Tower of Karma Arc' },
        description: { type: 'string', example: 'A deadly tournament held in a mysterious tower' },
        startChapter: { type: 'number', example: 150 },
        endChapter: { type: 'number', example: 210 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Arc not found' })
  async getOne(@Param('id') id: number): Promise<Arc> {
    const arc = await this.service.findOne(id);
    if (!arc) {
      throw new NotFoundException(`Arc with id ${id} not found`);
    }
    return arc;
  }

  @Get(':id/chapters')
  @ApiOperation({
    summary: 'Get chapters in arc',
    description: 'Retrieve all chapters within the arc\'s chapter range (startChapter to endChapter)'
  })
  @ApiParam({ name: 'id', description: 'Arc ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Chapters in arc retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 150 },
          number: { type: 'number', example: 150 },
          title: { type: 'string', example: 'The Tower Begins' },
          summary: { type: 'string', example: 'Introduction to the Tower of Karma tournament' },
          // series removed from chapter response
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Arc not found' })
  async getChapters(@Param('id') id: number): Promise<Chapter[]> {
    return this.service.getChaptersInArc(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new arc',
    description: 'Create a new arc (requires moderator or admin role)'
  })
  @ApiBody({ type: CreateArcDto })
  @ApiResponse({
    status: 201,
    description: 'Arc created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 2 },
        name: { type: 'string', example: 'Air Poker Arc' },
        description: { type: 'string', example: 'High-stakes poker games with deadly consequences' },
        startChapter: { type: 'number', example: 75 },
        endChapter: { type: 'number', example: 85 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires moderator or admin role' })
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  create(@Body() createArcDto: CreateArcDto) {
    return this.service.create(createArcDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update arc',
    description: 'Update an existing arc (requires moderator or admin role)'
  })
  @ApiParam({ name: 'id', description: 'Arc ID', example: 1 })
  @ApiBody({
    description: 'Updated arc data',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Tower of Karma Arc' },
        description: { type: 'string', example: 'Updated description of the tower tournament' },
        startChapter: { type: 'number', example: 150 },
        endChapter: { type: 'number', example: 215 }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Arc updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Updated successfully' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires moderator or admin role' })
  @ApiResponse({ status: 404, description: 'Arc not found' })
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async update(@Param('id') id: number, @Body() data: UpdateArcDto) {
    const result = await this.service.update(id, data);
    if (result.affected === 0) {
      throw new NotFoundException(`Arc with id ${id} not found`);
    }
    return { message: 'Updated successfully' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete arc',
    description: 'Delete an arc (requires moderator or admin role)'
  })
  @ApiParam({ name: 'id', description: 'Arc ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Arc deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Deleted successfully' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires moderator or admin role' })
  @ApiResponse({ status: 404, description: 'Arc not found' })
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async remove(@Param('id') id: number) {
    const result = await this.service.remove(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Arc with id ${id} not found`);
    }
    return { message: 'Deleted successfully' };
  }
}
