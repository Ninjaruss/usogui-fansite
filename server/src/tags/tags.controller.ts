import { Controller, Get, Param, Post, Body, Put, Delete } from '@nestjs/common';
import { TagsService } from './tags.service';
import { Tag } from './tag.entity';

@Controller('tags')
export class TagsController {
  constructor(private service: TagsService) {}

  @Get()
  getAll(): Promise<Tag[]> {
    return this.service.findAll();
  }

  @Get(':id')
  getOne(@Param('id') id: number): Promise<Tag> {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<Tag>): Promise<Tag> {
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() data: Partial<Tag>) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.service.remove(id);
  }
}
