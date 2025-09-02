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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { CharactersService } from './characters.service';
import { Character } from '../../entities/character.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { UpdateCharacterImageDto } from './dto/update-character-image.dto';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { BackblazeB2Service } from '../../services/backblaze-b2.service';

import { User } from '../../entities/user.entity';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('characters')
@Controller('characters')
export class CharactersController {
  constructor(
    private readonly service: CharactersService,
    private readonly b2Service: BackblazeB2Service,
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
              notableRoles: {
                type: 'array',
                items: { type: 'string' },
                example: ['Kakerou Company CEO', 'Professional Gambler'],
              },
              notableGames: {
                type: 'array',
                items: { type: 'string' },
                example: ['17 Steps', 'One-Card Poker'],
              },
              occupation: { type: 'string', example: 'Professional Gambler' },
              affiliations: {
                type: 'array',
                items: { type: 'string' },
                example: ['Kakerou Company', 'Tournament Committee'],
              },
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
        notableRoles: {
          type: 'array',
          items: { type: 'string' },
          example: ['Kakerou Company CEO', 'Professional Gambler'],
        },
        notableGames: {
          type: 'array',
          items: { type: 'string' },
          example: ['17 Steps', 'One-Card Poker'],
        },
        occupation: { type: 'string', example: 'Professional Gambler' },
        affiliations: {
          type: 'array',
          items: { type: 'string' },
          example: ['Kakerou Company', 'Tournament Committee'],
        },
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
        notableRoles: {
          type: 'array',
          items: { type: 'string' },
          example: ['Kakerou Referee', 'L-file Leader'],
        },
        notableGames: {
          type: 'array',
          items: { type: 'string' },
          example: ['Doubt', 'Ban'],
        },
        occupation: { type: 'string', example: 'Referee' },
        affiliations: {
          type: 'array',
          items: { type: 'string' },
          example: ['Kakerou Company', 'L-file'],
        },
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
        notableRoles: {
          type: 'array',
          items: { type: 'string' },
          example: ['Kakerou Referee', 'L-file Leader'],
        },
        notableGames: {
          type: 'array',
          items: { type: 'string' },
          example: ['Doubt', 'Ban'],
        },
        occupation: { type: 'string', example: 'Referee' },
        affiliations: {
          type: 'array',
          items: { type: 'string' },
          example: ['Kakerou Company', 'L-file'],
        },
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
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  create(@Body() data: CreateCharacterDto) {
    return this.service.create(data);
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
        notableRoles: {
          type: 'array',
          items: { type: 'string' },
          example: ['Kakerou Company CEO', 'Professional Gambler'],
        },
        notableGames: {
          type: 'array',
          items: { type: 'string' },
          example: ['17 Steps', 'One-Card Poker'],
        },
        occupation: { type: 'string', example: 'Professional Gambler' },
        affiliations: {
          type: 'array',
          items: { type: 'string' },
          example: ['Kakerou Company', 'Tournament Committee'],
        },
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
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async update(@Param('id') id: number, @Body() data: UpdateCharacterDto) {
    const result = await this.service.update(id, data);
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
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async remove(@Param('id') id: number) {
    const result = await this.service.remove(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Character with id ${id} not found`);
    }
    return { message: 'Deleted successfully' };
  }

  @Put(':id/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update character image',
    description:
      'Update character image (moderators/admins only, automatically approved)',
  })
  @ApiParam({ name: 'id', description: 'Character ID', example: 1 })
  @ApiBody({
    description: 'Character image data',
    type: UpdateCharacterImageDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Character image updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - moderator/admin role required',
  })
  @ApiResponse({ status: 404, description: 'Character not found' })
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  updateImage(
    @Param('id') id: number,
    @Body() imageData: UpdateCharacterImageDto,
  ) {
    return this.service.updateImage(id, imageData);
  }

  @Post(':id/upload-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Upload character image',
    description:
      'Upload image file for character (moderators/admins only, automatically approved)',
  })
  @ApiParam({ name: 'id', description: 'Character ID', example: 1 })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Character image file and optional display name',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, WebP, GIF)',
        },
        imageDisplayName: {
          type: 'string',
          description: 'Optional display name for the image',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Character image uploaded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid file or missing file',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - moderator/admin role required',
  })
  @ApiResponse({ status: 404, description: 'Character not found' })
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async uploadCharacterImage(
    @Param('id') id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() data: { imageDisplayName?: string },
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only image files (JPEG, PNG, WebP, GIF) are allowed',
      );
    }

    // Get existing character to check for old image
    const existingCharacter = await this.service.findOne(id);
    if (!existingCharacter) {
      throw new NotFoundException(`Character with id ${id} not found`);
    }

    // Generate unique filename with character prefix
    const timestamp = Date.now();
    const fileExtension = file.originalname.split('.').pop();
    const uniqueFileName = `character_${id}_${timestamp}.${fileExtension}`;

    // Upload new file to B2
    const uploadResult = await this.b2Service.uploadFile(
      file.buffer,
      uniqueFileName,
      file.mimetype,
      'characters',
    );

    // Delete old image if it exists
    if (existingCharacter.imageFileName) {
      try {
        // Extract filename from URL if it's a full URL, otherwise use as-is
        let oldFileName = existingCharacter.imageFileName;
        if (oldFileName.includes('/')) {
          const urlParts = oldFileName.split('/');
          oldFileName = urlParts[urlParts.length - 1];
          // If it includes the folder path, keep it
          if (
            urlParts.length > 1 &&
            urlParts[urlParts.length - 2] === 'characters'
          ) {
            oldFileName = `characters/${oldFileName}`;
          }
        }
        await this.b2Service.deleteFile(oldFileName);
      } catch (error) {
        // Log the error but don't fail the upload
        console.error('Failed to delete old character image:', error);
      }
    }

    // Update character with the full image URL
    const imageData = {
      imageFileName: uploadResult.url, // Store the full URL
      imageDisplayName: data.imageDisplayName,
    };

    return this.service.updateImage(id, imageData);
  }

  @Delete(':id/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Remove character image',
    description: 'Remove image from character (moderators/admins only)',
  })
  @ApiParam({ name: 'id', description: 'Character ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Character image removed successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - moderator/admin role required',
  })
  @ApiResponse({ status: 404, description: 'Character not found' })
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async removeImage(@Param('id') id: number) {
    // Get existing character to check for image
    const existingCharacter = await this.service.findOne(id);
    if (!existingCharacter) {
      throw new NotFoundException(`Character with id ${id} not found`);
    }

    // Delete the image file from B2 if it exists
    if (existingCharacter.imageFileName) {
      try {
        // Extract filename from URL if it's a full URL, otherwise use as-is
        let fileName = existingCharacter.imageFileName;
        if (fileName.includes('/')) {
          const urlParts = fileName.split('/');
          fileName = urlParts[urlParts.length - 1];
          // If it includes the folder path, keep it
          if (
            urlParts.length > 1 &&
            urlParts[urlParts.length - 2] === 'characters'
          ) {
            fileName = `characters/${fileName}`;
          }
        }
        await this.b2Service.deleteFile(fileName);
      } catch (error) {
        // Log the error but don't fail the removal
        console.error('Failed to delete character image file:', error);
      }
    }

    return this.service.removeImage(id);
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
}
