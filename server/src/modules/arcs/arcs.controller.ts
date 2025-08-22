import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ArcsService } from './arcs.service';
import { Arc } from '../../entities/arc.entity';
import { CreateArcDto } from './dto/create-arc.dto';

@Controller('arcs')
export class ArcsController {
  constructor(private readonly service: ArcsService) {}

  /**
   * Pagination: page (default 1), limit (default 20)
   */
  @Get()
  async getAll(
    @Query('name') name?: string,
    @Query('series') series?: string,
    @Query('description') description?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('sort') sort?: string,
    @Query('order') order: 'ASC' | 'DESC' = 'ASC',
  ): Promise<{ data: Arc[]; total: number; page: number; totalPages: number }> {
    return this.service.findAll({ name, series, description, page: parseInt(page), limit: parseInt(limit), sort, order });
  }

  @Get(':id')
  async getOne(@Param('id') id: number): Promise<Arc> {
    const arc = await this.service.findOne(id);
    if (!arc) {
      throw new NotFoundException(`Arc with id ${id} not found`);
    }
    return arc;
  }

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  create(@Body() createArcDto: CreateArcDto) {
    return this.service.create(createArcDto);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async update(@Param('id') id: number, @Body() data: Partial<Arc>) {
    const result = await this.service.update(id, data);
    if (result.affected === 0) {
      throw new NotFoundException(`Arc with id ${id} not found`);
    }
    return { message: 'Updated successfully' };
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    const result = await this.service.remove(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Arc with id ${id} not found`);
    }
    return { message: 'Deleted successfully' };
  }
}
