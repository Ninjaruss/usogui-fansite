import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException } from '@nestjs/common';
import { ChaptersService } from './chapters.service';
import { Chapter } from './chapter.entity';

@Controller('chapters')
export class ChaptersController {
  constructor(private readonly service: ChaptersService) {}

  @Get()
  getAll(): Promise<Chapter[]> {
    return this.service.findAll();
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
  create(@Body() data: Partial<Chapter>) {
    return this.service.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() data: Partial<Chapter>) {
    const result = await this.service.update(id, data);
    if (result.affected === 0) {
      throw new NotFoundException(`Chapter with id ${id} not found`);
    }
    return { message: 'Updated successfully' };
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    const result = await this.service.remove(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Chapter with id ${id} not found`);
    }
    return { message: 'Deleted successfully' };
  }
}
