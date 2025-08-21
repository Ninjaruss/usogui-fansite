import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException } from '@nestjs/common';
import { ArcsService } from './arcs.service';
import { Arc } from './arc.entity';

@Controller('arcs')
export class ArcsController {
  constructor(private readonly service: ArcsService) {}

  @Get()
  getAll(): Promise<Arc[]> {
    return this.service.findAll();
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
  create(@Body() data: Partial<Arc>) {
    return this.service.create(data);
  }

  @Put(':id')
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
