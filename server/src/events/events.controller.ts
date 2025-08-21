import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException } from '@nestjs/common';
import { EventsService } from './events.service';
import { Event } from './event.entity';

@Controller('events')
export class EventsController {
  constructor(private readonly service: EventsService) {}

  @Get()
  getAll(): Promise<Event[]> {
    return this.service.findAll();
  }

  @Get(':id')
  async getOne(@Param('id') id: number): Promise<Event> {
    const event = await this.service.findOne(id);
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
    return event;
  }

  @Post()
  create(@Body() data: Partial<Event>) {
    return this.service.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() data: Partial<Event>) {
    const result = await this.service.update(id, data);
    if (result.affected === 0) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
    return { message: 'Updated successfully' };
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    const result = await this.service.remove(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
    return { message: 'Deleted successfully' };
  }
}
