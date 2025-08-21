import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException } from '@nestjs/common';
import { ChapterSpoilersService } from './chapter_spoilers.service';
import { ChapterSpoiler } from './chapter_spoiler.entity';

@Controller('chapter-spoilers')
export class ChapterSpoilersController {
  constructor(private readonly service: ChapterSpoilersService) {}

  @Get()
  getAll(): Promise<ChapterSpoiler[]> {
    return this.service.findAll();
  }

  @Get(':id')
  async getOne(@Param('id') id: number): Promise<ChapterSpoiler> {
    const cs = await this.service.findOne(id);
    if (!cs) {
      throw new NotFoundException(`ChapterSpoiler with id ${id} not found`);
    }
    return cs;
  }

  @Post()
  create(@Body() data: Partial<ChapterSpoiler>) {
    return this.service.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() data: Partial<ChapterSpoiler>) {
    const result = await this.service.update(id, data);
    if (result.affected === 0) {
      throw new NotFoundException(`ChapterSpoiler with id ${id} not found`);
    }
    return { message: 'Updated successfully' };
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    const result = await this.service.remove(id);
    if (result.affected === 0) {
      throw new NotFoundException(`ChapterSpoiler with id ${id} not found`);
    }
    return { message: 'Deleted successfully' };
  }
}
