import { Controller, Get, Post, Put, Delete, Param, Query, ParseIntPipe, UseGuards, Body, NotFoundException } from '@nestjs/common';
import { ChapterSpoilersService } from './chapter-spoilers.service';
import { ChapterSpoiler, SpoilerLevel, SpoilerCategory } from '../../entities/chapter-spoiler.entity';
import { CreateChapterSpoilerDto } from './dto/create-chapter-spoiler.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@Controller('chapter-spoilers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChapterSpoilersController {
  constructor(private readonly service: ChapterSpoilersService) {}

  @Get()
  getAll(
    @Query('level') level?: SpoilerLevel,
    @Query('category') category?: SpoilerCategory,
    @Query('chapterId', ParseIntPipe) chapterId?: number,
    @Query('isVerified') isVerified?: boolean,
  ): Promise<ChapterSpoiler[]> {
    return this.service.findAll({ level, category, chapterId, isVerified });
  }

  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number): Promise<ChapterSpoiler> {
    return this.service.findOne(id);
  }

  @Post('check-viewable')
  async checkSpoilerViewable(
    @Body('spoilerId', ParseIntPipe) spoilerId: number,
    @Body('readChapterIds') readChapterIds: number[],
  ): Promise<{ viewable: boolean }> {
    const viewable = await this.service.canViewSpoiler(spoilerId, readChapterIds);
    return { viewable };
  }

  @Post()
  @Roles(UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN)
  create(@Body() data: CreateChapterSpoilerDto): Promise<ChapterSpoiler> {
    return this.service.create(data);
  }

  @Put(':id/verify')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async verify(@Param('id', ParseIntPipe) id: number): Promise<ChapterSpoiler> {
    return this.service.update(id, { isVerified: true });
  }

  @Put(':id')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() data: Partial<CreateChapterSpoilerDto>
  ): Promise<ChapterSpoiler> {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.service.remove(id);
  }
}
