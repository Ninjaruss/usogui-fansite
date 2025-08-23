import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException, Query, UseGuards } from '@nestjs/common';
import { SeriesService } from './series.service';
import { Series } from '../../entities/series.entity';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse } from '@nestjs/swagger';

@ApiTags('Series')
@Controller('series')
export class SeriesController {
  constructor(private readonly service: SeriesService) {}

  @ApiOperation({
    summary: 'Get all series with pagination',
    description: 'Retrieves a paginated list of all manga series. Supports sorting and filtering options.'
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20, max: 100)', example: 20 })
  @ApiQuery({ name: 'sort', required: false, description: 'Sort field (id, name, order)', example: 'name' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'], description: 'Sort order', example: 'ASC' })
  @ApiOkResponse({
    description: 'Series list retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 1,
            name: 'Usogui',
            order: 0,
            description: 'In a world where gambling is life...',
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z'
          }
        ],
        total: 1,
        page: 1,
        totalPages: 1
      }
    }
  })
  /**
   * Pagination and sorting: page (default 1), limit (default 20), sort (id, name, order), order (ASC/DESC)
   */
  @Get()
  async getAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('sort') sort?: string,
    @Query('order') order: 'ASC' | 'DESC' = 'ASC',
  ): Promise<{ data: Series[]; total: number; page: number; totalPages: number }> {
    return this.service.findAll({ page: parseInt(page), limit: parseInt(limit), sort, order });
  }

  @ApiOperation({
    summary: 'Get a single series by ID',
    description: 'Retrieves detailed information about a specific manga series including all related data.'
  })
  @ApiParam({ name: 'id', description: 'Series ID', example: 1 })
  @ApiOkResponse({
    description: 'Series retrieved successfully',
    schema: {
      example: {
        id: 1,
        name: 'Usogui',
        order: 0,
        description: 'In a world where gambling is life...',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Series not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Series with id 1 not found',
        error: 'Not Found'
      }
    }
  })
  @Get(':id')
  async getOne(@Param('id') id: number): Promise<Series> {
    const series = await this.service.findOne(id);
    if (!series) {
      throw new NotFoundException(`Series with id ${id} not found`);
    }
    return series;
  }

  @ApiOperation({
    summary: 'Create a new series',
    description: 'Creates a new manga series. Requires moderator or admin privileges.'
  })
  @ApiCreatedResponse({
    description: 'Series created successfully',
    schema: {
      example: {
        id: 1,
        title: 'Usogui',
        description: 'A manga about high-stakes gambling and psychological warfare',
        author: 'Toshio Sako',
        status: 'ongoing',
        startDate: '2006-05-19',
        totalChapters: 0,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: ['Title must be at least 1 character long', 'Author is required'],
        error: 'Bad Request'
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions - requires moderator or admin role',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
        error: 'Forbidden'
      }
    }
  })
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  create(@Body() createSeriesDto: CreateSeriesDto) {
    return this.service.create(createSeriesDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async update(@Param('id') id: number, @Body() data: UpdateSeriesDto) {
    const result = await this.service.update(id, data);
    if (result.affected === 0) {
      throw new NotFoundException(`Series with id ${id} not found`);
    }
    return { message: 'Updated successfully' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async remove(@Param('id') id: number) {
    const result = await this.service.remove(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Series with id ${id} not found`);
    }
    return { message: 'Deleted successfully' };
  }
}
