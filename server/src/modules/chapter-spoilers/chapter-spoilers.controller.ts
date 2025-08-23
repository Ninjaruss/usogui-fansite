import { Controller, Get, Post, Put, Delete, Param, Query, ParseIntPipe, UseGuards, Body, NotFoundException } from '@nestjs/common';
import { ChapterSpoilersService } from './chapter-spoilers.service';
import { ChapterSpoiler, SpoilerLevel, SpoilerCategory } from '../../entities/chapter-spoiler.entity';
import { CreateChapterSpoilerDto } from './dto/create-chapter-spoiler.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiNotFoundResponse, ApiForbiddenResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('Chapter Spoilers')
@Controller('chapter-spoilers')
export class ChapterSpoilersController {
  constructor(private readonly service: ChapterSpoilersService) {}

  @ApiOperation({
    summary: 'Get all chapter spoilers with filtering',
    description: 'Retrieves chapter spoilers with optional filtering by spoiler level, category, chapter, and verification status.'
  })
  @ApiQuery({ name: 'level', required: false, enum: SpoilerLevel, description: 'Filter by spoiler level', example: 'MAJOR' })
  @ApiQuery({ name: 'category', required: false, enum: SpoilerCategory, description: 'Filter by spoiler category', example: 'CHARACTER_DEATH' })
  @ApiQuery({ name: 'chapterId', required: false, description: 'Filter by chapter ID', example: 1 })
  @ApiQuery({ name: 'isVerified', required: false, description: 'Filter by verification status', example: true })
  @ApiOkResponse({
    description: 'Spoilers retrieved successfully',
    schema: {
      example: [
        {
          id: 1,
          content: 'A major character revelation occurs in this chapter',
          level: 'MAJOR',
          category: 'CHARACTER_REVEAL',
          chapterId: 1,
          isVerified: true,
          canViewAfterChapter: 1,
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
          chapter: {
            id: 1,
            number: 1,
            title: 'The Beginning of Fate'
          }
        }
      ]
    }
  })
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

  @ApiOperation({
    summary: 'Check if user can view a spoiler',
    description: 'Determines if a user can view a specific spoiler based on their reading progress. Returns viewability status.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        spoilerId: { type: 'number', example: 1, description: 'ID of the spoiler to check' },
        readChapterIds: { 
          type: 'array', 
          items: { type: 'number' }, 
          example: [1, 2, 3, 4, 5], 
          description: 'Array of chapter IDs the user has read' 
        }
      },
      required: ['spoilerId', 'readChapterIds']
    }
  })
  @ApiOkResponse({
    description: 'Spoiler viewability determined',
    schema: {
      example: {
        viewable: true
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Invalid spoiler ID or chapter IDs',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid spoiler ID',
        error: 'Bad Request'
      }
    }
  })
  @Post('check-viewable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN)
  async checkSpoilerViewable(
    @Body('spoilerId', ParseIntPipe) spoilerId: number,
    @Body('readChapterIds') readChapterIds: number[],
  ): Promise<{ viewable: boolean }> {
    const viewable = await this.service.canViewSpoiler(spoilerId, readChapterIds);
    return { viewable };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN)
  create(@Body() data: CreateChapterSpoilerDto): Promise<ChapterSpoiler> {
    return this.service.create(data);
  }

  @Put(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async verify(@Param('id', ParseIntPipe) id: number): Promise<ChapterSpoiler> {
    return this.service.update(id, { isVerified: true });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() data: Partial<CreateChapterSpoilerDto>
  ): Promise<ChapterSpoiler> {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.service.remove(id);
  }
}
