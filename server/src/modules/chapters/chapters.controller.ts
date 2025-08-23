import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException, Query, UseGuards } from '@nestjs/common';
import { ChaptersService } from './chapters.service';
import { Chapter } from '../../entities/chapter.entity';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiNotFoundResponse, ApiForbiddenResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Chapters')
@Controller('chapters')
export class ChaptersController {
  constructor(private readonly service: ChaptersService) {}

  @ApiOperation({
    summary: 'Get all chapters with filtering and pagination',
    description: 'Retrieves a paginated list of chapters with optional filtering by title, number, arc, or series.'
  })
  @ApiQuery({ name: 'title', required: false, description: 'Filter by chapter title', example: 'The Beginning' })
  @ApiQuery({ name: 'number', required: false, description: 'Filter by chapter number', example: '1' })
  @ApiQuery({ name: 'arc', required: false, description: 'Filter by arc ID', example: '1' })
  @ApiQuery({ name: 'series', required: false, description: 'Filter by series ID', example: '1' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)', example: 20 })
  @ApiQuery({ name: 'sort', required: false, description: 'Sort field (number, title)', example: 'number' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'], description: 'Sort order', example: 'ASC' })
  @ApiOkResponse({
    description: 'Chapters retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 1,
            number: 1,
            title: 'The Beginning of Fate',
            summary: 'Baku Madarame enters the world of high-stakes gambling.',
            series: { id: 1, title: 'Usogui' },
            arc: { id: 1, title: 'Protoporos Arc' },
            spoilers: [],
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z'
          }
        ],
        total: 541,
        page: 1,
        totalPages: 28
      }
    }
  })
  /**
   * Pagination: page (default 1), limit (default 20)
   */
  @Get()
  async getAll(
    @Query('title') title?: string,
    @Query('number') number?: string,
    @Query('arc') arc?: string,
    @Query('series') series?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('sort') sort?: string,
    @Query('order') order: 'ASC' | 'DESC' = 'ASC',
  ): Promise<{ data: Chapter[]; total: number; page: number; totalPages: number }> {
    return this.service.findAll({ title, number, arc, series, page: parseInt(page), limit: parseInt(limit), sort, order });
  }

  @Get(':id')
  async getOne(@Param('id') id: number): Promise<Chapter> {
    const chapter = await this.service.findOne(id);
    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${id} not found`);
    }
    return chapter;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  create(@Body() createChapterDto: CreateChapterDto) {
    return this.service.create(createChapterDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async update(@Param('id') id: number, @Body() data: UpdateChapterDto) {
    const result = await this.service.update(id, data);
    if (result.affected === 0) {
      throw new NotFoundException(`Chapter with id ${id} not found`);
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
      throw new NotFoundException(`Chapter with id ${id} not found`);
    }
    return { message: 'Deleted successfully' };
  }
}
