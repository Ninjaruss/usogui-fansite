import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  NotFoundException,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CharactersService } from './characters.service';
import { Character } from '../../entities/character.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { CloudflareR2Service } from '../../services/cloudflare-r2.service';

import { User } from '../../entities/user.entity';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('characters')
@Controller('characters')
export class CharactersController {
  constructor(
    private readonly service: CharactersService,
    private readonly b2Service: CloudflareR2Service,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all characters',
    description:
      'Retrieve a paginated list of characters with optional filtering by name, arc, and description',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Filter by character name',
  })
  @ApiQuery({ name: 'arc', required: false, description: 'Filter by arc name' })
  @ApiQuery({ name: 'arcId', required: false, description: 'Filter by arc ID' })
  @ApiQuery({
    name: 'description',
    required: false,
    description: 'Filter by description content',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 20)',
  })
  @ApiQuery({ name: 'sort', required: false, description: 'Field to sort by' })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order (default: ASC)',
  })
  @ApiResponse({
    status: 200,
    description: 'Characters retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'Baku Madarame' },
              alternateNames: {
                type: 'array',
                items: { type: 'string' },
                example: ['The Emperor', 'Death God'],
              },
              description: {
                type: 'string',
                example:
                  'The main protagonist known for his extraordinary gambling skills',
              },
              firstAppearanceChapter: { type: 'number', example: 1 },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number', example: 50 },
        page: { type: 'number', example: 1 },
        totalPages: { type: 'number', example: 3 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAll(
    @Query('name') name?: string,
    @Query('arc') arc?: string,
    @Query('arcId') arcIdStr?: string,
    @Query('description') description?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('sort') sort?: string,
    @Query('order') order: 'ASC' | 'DESC' = 'ASC',
  ): Promise<{
    data: Character[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const arcId = arcIdStr ? parseInt(arcIdStr) : undefined;
    return this.service.findAll({
      name,
      arc,
      arcId,
      description,
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      order,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get character by ID',
    description: 'Retrieve a specific character by their unique identifier',
  })
  @ApiParam({ name: 'id', description: 'Character ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Character found',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Baku Madarame' },
        alternateNames: {
          type: 'array',
          items: { type: 'string' },
          example: ['The Emperor', 'Death God'],
        },
        description: {
          type: 'string',
          example:
            'The main protagonist known for his extraordinary gambling skills',
        },
        firstAppearanceChapter: { type: 'number', example: 1 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Character not found' })
  async getOne(@Param('id') id: number): Promise<Character> {
    const character = await this.service.findOne(id);
    if (!character) {
      throw new NotFoundException(`Character with id ${id} not found`);
    }
    return character;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new character',
    description: 'Create a new character (requires moderator or admin role)',
  })
  @ApiBody({
    description: 'Character data',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Souichi Kiruma' },
        alternateNames: {
          type: 'array',
          items: { type: 'string' },
          example: ['Zero', 'L-file'],
        },
        description: {
          type: 'string',
          example: 'A mysterious and intelligent gambler with a dark past',
        },
        firstAppearanceChapter: { type: 'number', example: 1 },
        // series removed
      },
      required: ['name'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Character created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 2 },
        name: { type: 'string', example: 'Souichi Kiruma' },
        alternateNames: {
          type: 'array',
          items: { type: 'string' },
          example: ['Zero', 'L-file'],
        },
        description: {
          type: 'string',
          example: 'A mysterious and intelligent gambler with a dark past',
        },
        firstAppearanceChapter: { type: 'number', example: 1 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires moderator or admin role',
  })
  @Roles(UserRole.MODERATOR, UserRole.ADMIN, UserRole.EDITOR)
  create(@Body() data: CreateCharacterDto, @CurrentUser() user: User) {
    return this.service.create(data, user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update character',
    description:
      'Update an existing character (requires moderator or admin role)',
  })
  @ApiParam({ name: 'id', description: 'Character ID', example: 1 })
  @ApiBody({
    description: 'Updated character data',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Baku Madarame' },
        alternateNames: {
          type: 'array',
          items: { type: 'string' },
          example: ['The Emperor', 'Death God'],
        },
        description: {
          type: 'string',
          example: 'Updated description of the main protagonist',
        },
        firstAppearanceChapter: { type: 'number', example: 1 },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Character updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Updated successfully' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires moderator or admin role',
  })
  @ApiResponse({ status: 404, description: 'Character not found' })
  @Roles(UserRole.MODERATOR, UserRole.ADMIN, UserRole.EDITOR)
  async update(@Param('id') id: number, @Body() data: UpdateCharacterDto, @CurrentUser() user: User) {
    const result = await this.service.update(id, data, user.id);
    if (!result) {
      throw new NotFoundException(`Character with id ${id} not found`);
    }
    return { message: 'Updated successfully' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete character',
    description: 'Delete a character (requires moderator or admin role)',
  })
  @ApiParam({ name: 'id', description: 'Character ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Character deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Deleted successfully' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires moderator or admin role',
  })
  @ApiResponse({ status: 404, description: 'Character not found' })
  @Roles(UserRole.MODERATOR, UserRole.ADMIN, UserRole.EDITOR)
  async remove(@Param('id') id: number, @CurrentUser() user: User) {
    const result = await this.service.remove(id, user.id);
    if (result.affected === 0) {
      throw new NotFoundException(`Character with id ${id} not found`);
    }
    return { message: 'Deleted successfully' };
  }

  @Get(':id/gambles')
  @ApiOperation({
    summary: 'Get gambles related to character',
    description: 'Retrieve gambles that mention or involve this character',
  })
  @ApiParam({ name: 'id', description: 'Character ID', example: 1 })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'Character gambles retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Character not found' })
  async getCharacterGambles(
    @Param('id') id: number,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const character = await this.service.findOne(id);
    if (!character) {
      throw new NotFoundException(`Character with id ${id} not found`);
    }
    return this.service.getCharacterGambles(id, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  @Get(':id/events')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Get events related to character',
    description:
      'Retrieve events that mention or involve this character, ordered chronologically. Spoiler content is hidden based on user reading progress.',
  })
  @ApiParam({ name: 'id', description: 'Character ID', example: 1 })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'Character events retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Character not found' })
  async getCharacterEvents(
    @Param('id') id: number,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @CurrentUser() user?: User,
  ) {
    const character = await this.service.findOne(id);
    if (!character) {
      throw new NotFoundException(`Character with id ${id} not found`);
    }
    return this.service.getCharacterEvents(
      id,
      {
        page: parseInt(page),
        limit: parseInt(limit),
      },
      user?.userProgress,
    );
  }

  @Get(':id/guides')
  @ApiOperation({
    summary: 'Get guides related to character',
    description: 'Retrieve guides that mention or involve this character',
  })
  @ApiParam({ name: 'id', description: 'Character ID', example: 1 })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'Character guides retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Character not found' })
  async getCharacterGuides(
    @Param('id') id: number,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const character = await this.service.findOne(id);
    if (!character) {
      throw new NotFoundException(`Character with id ${id} not found`);
    }
    return this.service.getCharacterGuides(id, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  @Get(':id/quotes')
  @ApiOperation({
    summary: 'Get quotes by character',
    description: 'Retrieve quotes said by a specific character with pagination',
  })
  @ApiParam({ name: 'id', description: 'Character ID', type: 'number' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    type: 'number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of quotes per page',
    type: 'number',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Character quotes retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/Quote' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Character not found',
  })
  async getCharacterQuotes(
    @Param('id', ParseIntPipe) id: number,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    return this.service.getCharacterQuotes(id, { page, limit });
  }

  @Get(':id/arcs')
  @ApiOperation({
    summary: 'Get arcs where character appears',
    description:
      'Retrieve arcs that feature this character, sorted by arc order',
  })
  @ApiParam({ name: 'id', description: 'Character ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Character arcs retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: '17 Steps Tournament Arc' },
              order: { type: 'number', example: 1 },
              description: {
                type: 'string',
                example: 'Description of the arc',
              },
            },
          },
        },
        total: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Character not found',
  })
  async getCharacterArcs(@Param('id', ParseIntPipe) id: number) {
    return this.service.getCharacterArcs(id);
  }

  @Get(':id/entity-display-media')
  @ApiOperation({
    summary: 'Get entity display media for character',
    description: 'Retrieve official display media for character thumbnails',
  })
  @ApiParam({
    name: 'id',
    description: 'Character ID',
    type: 'number',
  })
  @ApiQuery({
    name: 'userProgress',
    required: false,
    description: 'User progress (chapter number) for spoiler protection',
    type: 'number',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    type: 'number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    type: 'number',
  })
  async getCharacterEntityDisplayMedia(
    @Param('id', ParseIntPipe) id: number,
    @Query('userProgress') userProgress?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.getCharacterEntityDisplayMedia(id, userProgress, {
      page,
      limit,
    });
  }

  @Get(':id/gallery-media')
  @ApiOperation({
    summary: 'Get gallery media for character',
    description: 'Retrieve user-uploaded gallery media for character',
  })
  @ApiParam({
    name: 'id',
    description: 'Character ID',
    type: 'number',
  })
  @ApiQuery({
    name: 'userProgress',
    required: false,
    description: 'User progress (chapter number) for spoiler protection',
    type: 'number',
  })
  @ApiQuery({
    name: 'chapter',
    required: false,
    description: 'Chapter number filter',
    type: 'number',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    type: 'number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    type: 'number',
  })
  async getCharacterGalleryMedia(
    @Param('id', ParseIntPipe) id: number,
    @Query('userProgress') userProgress?: number,
    @Query('chapter') chapter?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.getCharacterGalleryMedia(id, userProgress, {
      chapter,
      page,
      limit,
    });
  }

  @Get(':id/current-thumbnail')
  @ApiOperation({
    summary: 'Get current thumbnail for character',
    description: 'Get the current entity display media for character thumbnail',
  })
  @ApiParam({
    name: 'id',
    description: 'Character ID',
    type: 'number',
  })
  @ApiQuery({
    name: 'userProgress',
    required: false,
    description: 'User progress (chapter number) for spoiler protection',
    type: 'number',
  })
  async getCharacterCurrentThumbnail(
    @Param('id', ParseIntPipe) id: number,
    @Query('userProgress') userProgress?: number,
  ) {
    return this.service.getCharacterCurrentThumbnail(id, userProgress);
  }
}
