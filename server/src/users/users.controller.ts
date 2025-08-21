import { Controller, Get, Param, Post, Body, Put, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';

@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}

  @Get()
  getAll(): Promise<User[]> {
    return this.service.findAll();
  }

  @Get(':id')
  getOne(@Param('id') id: number): Promise<User> {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<User>): Promise<User> {
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() data: Partial<User>) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.service.remove(id);
  }
}
