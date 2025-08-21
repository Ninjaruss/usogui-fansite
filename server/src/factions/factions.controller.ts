import { Controller, Get, Param, Post, Body, Put, Delete } from '@nestjs/common';
import { FactionsService } from './factions.service';
import { Faction } from './faction.entity';

@Controller('factions')
export class FactionsController {
  constructor(private service: FactionsService) {}

  @Get()
  getAll(): Promise<Faction[]> {
    return this.service.findAll();
  }

  @Get(':id')
  getOne(@Param('id') id: number): Promise<Faction> {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<Faction>): Promise<Faction> {
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() data: Partial<Faction>) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.service.remove(id);
  }
}
