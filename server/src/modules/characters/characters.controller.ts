import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException, Query, UseGuards } from '@nestjs/common';
import { CharactersService } from './characters.service';
import { Character } from '../../entities/character.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@Controller('characters')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CharactersController {
  constructor(private readonly service: CharactersService) {}

  /**
   * Pagination: page (default 1), limit (default 20)
   */
  @Get()
  async getAll(
    @Query('name') name?: string,
    @Query('arc') arc?: string,
    @Query('series') series?: string,
    @Query('description') description?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('sort') sort?: string,
    @Query('order') order: 'ASC' | 'DESC' = 'ASC',
  ): Promise<{ data: Character[]; total: number; page: number; totalPages: number }> {
    return this.service.findAll({ name, arc, series, description, page: parseInt(page), limit: parseInt(limit), sort, order });
  }

  @Get(':id')
  async getOne(@Param('id') id: number): Promise<Character> {
    const character = await this.service.findOne(id);
    if (!character) {
      throw new NotFoundException(`Character with id ${id} not found`);
    }
    return character;
  }

  @Post()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  create(@Body() data: Partial<Character>) {
    return this.service.create(data);
  }

  @Put(':id')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async update(@Param('id') id: number, @Body() data: Partial<Character>) {
    const result = await this.service.update(id, data);
    if (result.affected === 0) {
      throw new NotFoundException(`Character with id ${id} not found`);
    }
    return { message: 'Updated successfully' };
  }

  @Delete(':id')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async remove(@Param('id') id: number) {
    const result = await this.service.remove(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Character with id ${id} not found`);
    }
    return { message: 'Deleted successfully' };
  }
}
