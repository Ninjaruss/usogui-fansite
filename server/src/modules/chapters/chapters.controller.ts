import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException, Query, UseGuards } from '@nestjs/common';
import { ChaptersService } from './chapters.service';
import { Chapter } from '../../entities/chapter.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@Controller('chapters')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChaptersController {
  constructor(private readonly service: ChaptersService) {}

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
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  create(@Body() data: Partial<Chapter>) {
    return this.service.create(data);
  }

  @Put(':id')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async update(@Param('id') id: number, @Body() data: Partial<Chapter>) {
    const result = await this.service.update(id, data);
    if (result.affected === 0) {
      throw new NotFoundException(`Chapter with id ${id} not found`);
    }
    return { message: 'Updated successfully' };
  }

  @Delete(':id')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async remove(@Param('id') id: number) {
    const result = await this.service.remove(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Chapter with id ${id} not found`);
    }
    return { message: 'Deleted successfully' };
  }
}
