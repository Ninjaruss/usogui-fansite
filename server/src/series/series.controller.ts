import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException } from '@nestjs/common';
import { SeriesService } from './series.service';
import { Series } from './series.entity';

@Controller('series')
export class SeriesController {
  constructor(private readonly service: SeriesService) {}

  @Get()
  getAll(): Promise<Series[]> {
    return this.service.findAll();
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
  create(@Body() data: Partial<Series>) {
    return this.service.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() data: Partial<Series>) {
    const result = await this.service.update(id, data);
    if (result.affected === 0) {
      throw new NotFoundException(`Series with id ${id} not found`);
    }
    return { message: 'Updated successfully' };
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    const result = await this.service.remove(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Series with id ${id} not found`);
    }
    return { message: 'Deleted successfully' };
  }
}
