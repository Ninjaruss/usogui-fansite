import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException, Query, UseGuards } from '@nestjs/common';
import { SeriesService } from './series.service';
import { Series } from '../../entities/series.entity';
import { CreateSeriesDto } from './dto/create-series.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@Controller('series')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SeriesController {
  constructor(private readonly service: SeriesService) {}

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

  @Get(':id')
  async getOne(@Param('id') id: number): Promise<Series> {
    const series = await this.service.findOne(id);
    if (!series) {
      throw new NotFoundException(`Series with id ${id} not found`);
    }
    return series;
  }

  @Post()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  create(@Body() createSeriesDto: CreateSeriesDto) {
    return this.service.create(createSeriesDto);
  }

  @Put(':id')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async update(@Param('id') id: number, @Body() data: Partial<Series>) {
    const result = await this.service.update(id, data);
    if (result.affected === 0) {
      throw new NotFoundException(`Series with id ${id} not found`);
    }
    return { message: 'Updated successfully' };
  }

  @Delete(':id')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async remove(@Param('id') id: number) {
    const result = await this.service.remove(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Series with id ${id} not found`);
    }
    return { message: 'Deleted successfully' };
  }
}
