import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Patch,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UploadMediaDto } from './dto/upload-media.dto';
import {
  MediaOwnerType,
  MediaType,
  MediaStatus,
  MediaPurpose,
} from '../../entities/media.entity';
import { BackblazeB2Service } from '../../services/backblaze-b2.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../../entities/user.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly b2Service: BackblazeB2Service,
  ) {}

  // PUBLIC ENDPOINTS - No authentication required

  @Get('public')
  @ApiOperation({
    summary: 'Get approved media (public)',
    description:
      'Publicly accessible endpoint to view approved media items with optional filtering',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by media type',
    enum: MediaType,
  })
  @ApiQuery({
    name: 'ownerType',
    required: false,
    description: 'Filter by owner type',
    enum: MediaOwnerType,
  })
  @ApiQuery({
    name: 'ownerId',
    required: false,
    description: 'Filter by owner ID',
    type: 'number',
  })
  @ApiQuery({
    name: 'purpose',
    required: false,
    description: 'Filter by media purpose',
    enum: MediaPurpose,
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
  @ApiResponse({
    status: 200,
    description: 'Media retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              url: {
                type: 'string',
                example: 'https://www.youtube.com/watch?v=example',
              },
              type: { type: 'string', example: 'video' },
              description: {
                type: 'string',
                example: 'Character analysis video',
              },
              ownerType: { type: 'string', example: 'character' },
              ownerId: { type: 'number', example: 1 },
              chapterNumber: { type: 'number', example: 45, nullable: true },
              purpose: { type: 'string', example: 'gallery' },
              submittedBy: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  username: { type: 'string', example: 'fan123' },
                },
              },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number', example: 100 },
        page: { type: 'number', example: 1 },
        perPage: { type: 'number', example: 20 },
        totalPages: { type: 'number', example: 5 },
      },
    },
  })
  findAllPublic(
    @Query('type') type?: string,
    @Query('ownerType') ownerType?: MediaOwnerType,
    @Query('ownerId') ownerId?: number,
    @Query('purpose') purpose?: MediaPurpose,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    // Validate ownerId if provided to prevent NaN database errors
    let validOwnerId: number | undefined;
    if (ownerId !== undefined) {
      const parsedId = Number(ownerId);
      validOwnerId = !isNaN(parsedId) && parsedId > 0 ? parsedId : undefined;
    }

    return this.mediaService.findAllPublic({
      type,
      ownerType,
      ownerId: validOwnerId,
      purpose,
      page,
      limit,
    });
  }

  @Get('public/:id')
  @ApiOperation({
    summary: 'Get approved media by ID (public)',
    description:
      'Publicly accessible endpoint to view a specific approved media item',
  })
  @ApiParam({ name: 'id', description: 'Media ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Media found',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        url: {
          type: 'string',
          example: 'https://www.youtube.com/watch?v=example',
        },
        type: { type: 'string', example: 'video' },
        description: { type: 'string', example: 'Character analysis video' },
        character: {
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Baku Madarame' },
          },
        },
        submittedBy: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            username: { type: 'string', example: 'fan123' },
          },
        },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Media not found or not approved' })
  findOnePublic(@Param('id') id: string) {
    return this.mediaService.findOnePublic(+id);
  }

  // AUTHENTICATED ENDPOINTS - Require login

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create media submission',
    description: 'Submit a new media item for review (requires authentication)',
  })
  @ApiBody({
    type: CreateMediaDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Media created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        url: {
          type: 'string',
          example: 'https://www.youtube.com/watch?v=example',
        },
        type: { type: 'string', example: 'video' },
        description: { type: 'string', example: 'Character analysis video' },
        status: { type: 'string', example: 'pending' },
        submittedBy: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            username: { type: 'string', example: 'user123' },
          },
        },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createMediaDto: CreateMediaDto, @CurrentUser() user: User) {
    return this.mediaService.create(createMediaDto, user);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload media file',
    description:
      'Upload a media file directly to the server (requires authentication)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Media file to upload',
        },
        type: {
          type: 'string',
          enum: ['image', 'video', 'audio'],
          description: 'Type of media',
        },
        ownerType: {
          type: 'string',
          enum: Object.values(MediaOwnerType),
          description: 'Type of entity this media belongs to',
        },
        ownerId: {
          type: 'number',
          description: 'ID of the entity this media belongs to',
        },
        purpose: {
          type: 'string',
          enum: Object.values(MediaPurpose),
          description: 'Purpose of the media',
        },
        description: {
          type: 'string',
          description: 'Description of the media',
        },
        chapterNumber: {
          type: 'number',
          description: 'Chapter number (optional)',
        },
      },
      required: ['file', 'type', 'ownerType', 'ownerId'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Media uploaded successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid file or parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadMedia(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadData: UploadMediaDto,
    @CurrentUser() user: User,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Only allow image uploads for now
    if (uploadData.type !== 'image') {
      throw new BadRequestException('Only image uploads are supported');
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

    return this.mediaService.createUpload(
      uploadData,
      file.buffer,
      file.originalname,
      file.mimetype,
      user,
      this.b2Service,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get all media',
    description: 'Retrieve media with optional filtering and pagination',
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
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by description or author username',
    type: 'string',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
    type: 'string',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by media type',
    enum: MediaType,
  })
  @ApiQuery({
    name: 'ownerType',
    required: false,
    description: 'Filter by owner type',
    enum: MediaOwnerType,
  })
  @ApiQuery({
    name: 'ownerId',
    required: false,
    description: 'Filter by owner ID',
    type: 'string',
  })
  @ApiQuery({
    name: 'purpose',
    required: false,
    description: 'Filter by media purpose',
    enum: MediaPurpose,
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Field to sort by',
    type: 'string',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    description: 'Sort order (ASC or DESC)',
    type: 'string',
  })
  @ApiQuery({
    name: 'characterIds',
    required: false,
    description: 'Comma-separated list of character IDs to filter by',
    type: 'string',
  })
  @ApiQuery({
    name: 'arcIds',
    required: false,
    description: 'Comma-separated list of arc IDs to filter by',
    type: 'string',
  })
  @ApiQuery({
    name: 'eventIds',
    required: false,
    description: 'Comma-separated list of event IDs to filter by',
    type: 'string',
  })
  @ApiQuery({
    name: 'gambleIds',
    required: false,
    description: 'Comma-separated list of gamble IDs to filter by',
    type: 'string',
  })
  @ApiQuery({
    name: 'factionIds',
    required: false,
    description: 'Comma-separated list of faction IDs to filter by',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Media retrieved successfully',
  })
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('ownerType') ownerType?: MediaOwnerType,
    @Query('ownerId') ownerId?: string,
    @Query('purpose') purpose?: MediaPurpose,
    @Query('sort') sort?: string,
    @Query('order') order?: 'ASC' | 'DESC',
    @Query('characterIds') characterIds?: string,
    @Query('arcIds') arcIds?: string,
    @Query('eventIds') eventIds?: string,
    @Query('gambleIds') gambleIds?: string,
    @Query('factionIds') factionIds?: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;

    // Properly validate and parse ownerId to prevent NaN errors
    let ownerIdNum: number | undefined;
    if (ownerId) {
      const parsedId = parseInt(ownerId, 10);
      // Only use the parsed value if it's a valid positive integer
      ownerIdNum = !isNaN(parsedId) && parsedId > 0 ? parsedId : undefined;
    }

    const result = await this.mediaService.findAll({
      page: pageNum,
      limit: limitNum,
      search,
      status,
      type,
      ownerType,
      ownerId: ownerIdNum,
      purpose,
      sort,
      order,
      characterIds,
      arcIds,
      eventIds,
      gambleIds,
      factionIds,
    });

    // Return canonical top-level paginated shape used across the API
    return {
      data: result.data,
      total: result.total,
      page: result.page,
      perPage: limitNum,
      totalPages: result.totalPages,
    } as const;
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get pending media submissions',
    description:
      'Retrieve media submissions awaiting moderation (requires moderator or admin role)',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending submissions retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          url: {
            type: 'string',
            example: 'https://www.youtube.com/watch?v=example',
          },
          type: { type: 'string', example: 'video' },
          description: { type: 'string', example: 'Character analysis video' },
          status: { type: 'string', example: 'pending' },
          character: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'Baku Madarame' },
            },
          },
          submittedBy: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              username: { type: 'string', example: 'fan123' },
              email: { type: 'string', example: 'fan123@example.com' },
            },
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires moderator or admin role',
  })
  getPendingSubmissions() {
    return this.mediaService.findPending();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get media by ID (authenticated)',
    description:
      'Retrieve a specific media item by its ID with full details (requires authentication)',
  })
  @ApiParam({ name: 'id', description: 'Media ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Media found',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        url: {
          type: 'string',
          example: 'https://www.youtube.com/watch?v=example',
        },
        type: { type: 'string', example: 'video' },
        description: { type: 'string', example: 'Character analysis video' },
        status: { type: 'string', example: 'approved' },
        character: {
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Baku Madarame' },
          },
        },
        submittedBy: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            username: { type: 'string', example: 'fan123' },
          },
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Media not found' })
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(+id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update media',
    description: 'Update a media item (requires moderator or admin role)',
  })
  @ApiResponse({
    status: 200,
    description: 'Media updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        url: {
          type: 'string',
          example: 'https://www.youtube.com/watch?v=example',
        },
        type: { type: 'string', example: 'video' },
        description: { type: 'string', example: 'Updated description' },
        status: { type: 'string', example: 'approved' },
        character: {
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Baku Madarame' },
          },
        },
        submittedBy: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            username: { type: 'string', example: 'fan123' },
          },
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
  @ApiResponse({ status: 404, description: 'Media not found' })
  @ApiParam({ name: 'id', description: 'Media ID', example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          example: 'https://www.youtube.com/watch?v=updated',
        },
        type: { type: 'string', enum: ['image', 'video', 'audio'] },
        description: { type: 'string', example: 'Updated description' },
        ownerType: {
          type: 'string',
          enum: ['character', 'arc', 'event', 'gamble', 'faction', 'user'],
        },
        ownerId: { type: 'number', example: 1 },
        chapterNumber: { type: 'number', example: 45 },
        purpose: {
          type: 'string',
          enum: ['gallery', 'entity_display'],
          example: 'gallery',
        },
        status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
        rejectionReason: { type: 'string', example: 'Reason for rejection' },
      },
    },
  })
  update(@Param('id') id: string, @Body() updateData: any) {
    return this.mediaService.update(+id, updateData);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Partially update media',
    description:
      'Partially update a media item (requires moderator or admin role)',
  })
  @ApiResponse({
    status: 200,
    description: 'Media updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        url: {
          type: 'string',
          example: 'https://www.youtube.com/watch?v=example',
        },
        type: { type: 'string', example: 'video' },
        description: { type: 'string', example: 'Updated description' },
        status: { type: 'string', example: 'approved' },
        character: {
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Baku Madarame' },
          },
        },
        submittedBy: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            username: { type: 'string', example: 'fan123' },
          },
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
  @ApiResponse({ status: 404, description: 'Media not found' })
  @ApiParam({ name: 'id', description: 'Media ID', example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          example: 'https://www.youtube.com/watch?v=updated',
        },
        type: { type: 'string', enum: ['image', 'video', 'audio'] },
        description: { type: 'string', example: 'Updated description' },
        characterId: { type: 'number', example: 1 },
        status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
        rejectionReason: { type: 'string', example: 'Reason for rejection' },
      },
    },
  })
  patchUpdate(@Param('id') id: string, @Body() updateData: any) {
    return this.mediaService.update(+id, updateData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete media',
    description: 'Delete a media item (requires moderator or admin role)',
  })
  @ApiResponse({
    status: 200,
    description: 'Media deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Media deleted successfully' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires moderator or admin role',
  })
  @ApiResponse({ status: 404, description: 'Media not found' })
  @ApiParam({ name: 'id', description: 'Media ID', example: 1 })
  remove(@Param('id') id: string) {
    return this.mediaService.remove(+id, this.b2Service);
  }

  @Put(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Approve media submission',
    description:
      'Approve a pending media submission (requires moderator or admin role)',
  })
  @ApiResponse({
    status: 200,
    description: 'Media approved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        url: {
          type: 'string',
          example: 'https://www.youtube.com/watch?v=example',
        },
        type: { type: 'string', example: 'video' },
        description: { type: 'string', example: 'Character analysis video' },
        status: { type: 'string', example: 'approved' },
        character: {
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Baku Madarame' },
          },
        },
        submittedBy: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            username: { type: 'string', example: 'fan123' },
          },
        },
        approvedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires moderator or admin role',
  })
  @ApiResponse({ status: 404, description: 'Media not found' })
  @ApiResponse({
    status: 400,
    description: 'Media already processed or invalid status',
  })
  @ApiParam({ name: 'id', description: 'Media ID', example: 1 })
  approveSubmission(@Param('id') id: string) {
    return this.mediaService.approveSubmission(+id);
  }

  @Put(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Reject media submission',
    description:
      'Reject a pending media submission with optional reason (requires moderator or admin role)',
  })
  @ApiResponse({
    status: 200,
    description: 'Media rejected successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        url: {
          type: 'string',
          example: 'https://www.youtube.com/watch?v=example',
        },
        type: { type: 'string', example: 'video' },
        description: { type: 'string', example: 'Character analysis video' },
        status: { type: 'string', example: 'rejected' },
        rejectionReason: {
          type: 'string',
          example: 'Content does not meet quality standards',
        },
        character: {
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Baku Madarame' },
          },
        },
        submittedBy: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            username: { type: 'string', example: 'fan123' },
          },
        },
        rejectedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires moderator or admin role',
  })
  @ApiResponse({ status: 404, description: 'Media not found' })
  @ApiResponse({
    status: 400,
    description: 'Media already processed or invalid status',
  })
  @ApiParam({ name: 'id', description: 'Media ID', example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Reason for rejection',
          example: 'Content does not meet quality standards',
        },
      },
    },
  })
  rejectSubmission(@Param('id') id: string, @Body('reason') reason: string) {
    return this.mediaService.rejectSubmission(+id, reason);
  }

  @Post('bulk/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Bulk approve media submissions',
    description:
      'Approve multiple pending media submissions at once (requires moderator or admin role)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'number' },
          description: 'Array of media IDs to approve',
          example: [1, 2, 3],
        },
      },
      required: ['ids'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk approval completed',
    schema: {
      type: 'object',
      properties: {
        approved: { type: 'number', description: 'Number of items approved' },
        failed: {
          type: 'number',
          description: 'Number of items that failed to approve',
        },
        errors: {
          type: 'array',
          items: { type: 'string' },
          description: 'Error messages for failed approvals',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires moderator or admin role',
  })
  bulkApproveSubmissions(@Body('ids') ids: number[]) {
    return this.mediaService.bulkApproveSubmissions(ids);
  }

  @Post('bulk/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Bulk reject media submissions',
    description:
      'Reject multiple pending media submissions at once (requires moderator or admin role)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'number' },
          description: 'Array of media IDs to reject',
          example: [1, 2, 3],
        },
        reason: {
          type: 'string',
          description: 'Rejection reason to apply to all items',
          example: 'Content does not meet quality standards',
        },
      },
      required: ['ids', 'reason'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk rejection completed',
    schema: {
      type: 'object',
      properties: {
        rejected: { type: 'number', description: 'Number of items rejected' },
        failed: {
          type: 'number',
          description: 'Number of items that failed to reject',
        },
        errors: {
          type: 'array',
          items: { type: 'string' },
          description: 'Error messages for failed rejections',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires moderator or admin role',
  })
  bulkRejectSubmissions(@Body() body: { ids: number[]; reason: string }) {
    return this.mediaService.bulkRejectSubmissions(body.ids, body.reason);
  }

  // NEW POLYMORPHIC ENDPOINTS

  @Get('owner/:ownerType/:ownerId')
  @ApiOperation({
    summary: 'Get media for a specific owner',
    description: 'Retrieve media associated with a specific entity',
  })
  @ApiParam({
    name: 'ownerType',
    description: 'Type of entity',
    enum: MediaOwnerType,
  })
  @ApiParam({
    name: 'ownerId',
    description: 'ID of the entity',
    type: 'number',
  })
  @ApiQuery({
    name: 'chapter',
    required: false,
    description: 'Chapter number filter',
    type: 'number',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Media type filter',
    enum: MediaType,
  })
  @ApiQuery({
    name: 'purpose',
    required: false,
    description: 'Media purpose filter',
    enum: MediaPurpose,
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
  findForOwner(
    @Param('ownerType') ownerType: MediaOwnerType,
    @Param('ownerId', ParseIntPipe) ownerId: number,
    @Query('chapter') chapter?: string,
    @Query('type') type?: string,
    @Query('purpose') purpose?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    let chapterNum: number | undefined;
    if (chapter) {
      const parsedChapter = parseInt(chapter, 10);
      chapterNum =
        !isNaN(parsedChapter) && parsedChapter > 0 ? parsedChapter : undefined;
    }

    let pageNum: number | undefined;
    if (page) {
      const parsedPage = parseInt(page, 10);
      pageNum = !isNaN(parsedPage) && parsedPage > 0 ? parsedPage : undefined;
    }

    let limitNum: number | undefined;
    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      limitNum =
        !isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : undefined;
    }

    return this.mediaService.findForOwner(ownerType, ownerId, chapterNum, {
      type: type as any,
      purpose: purpose as MediaPurpose,
      page: pageNum,
      limit: limitNum,
    });
  }

  @Get('gallery/:ownerType/:ownerId')
  @ApiOperation({
    summary: 'Get gallery media only (for Related Media tab)',
    description:
      'Get only gallery media for related media sections - excludes entity display media',
  })
  @ApiParam({
    name: 'ownerType',
    description: 'Type of entity',
    enum: MediaOwnerType,
  })
  @ApiParam({
    name: 'ownerId',
    description: 'ID of the entity',
    type: 'number',
  })
  @ApiQuery({
    name: 'chapter',
    required: false,
    description: 'Chapter number filter',
    type: 'number',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Media type filter',
    enum: MediaType,
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
  async getGalleryMediaOnly(
    @Param('ownerType') ownerType: MediaOwnerType,
    @Param('ownerId', ParseIntPipe) ownerId: number,
    @Query('chapter') chapter?: number,
    @Query('type') type?: MediaType,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.mediaService.findForGallery(ownerType, ownerId, {
      chapter,
      type,
      page,
      limit,
    });
  }

  @Get('owner/:ownerType/:ownerId/default')
  @ApiOperation({
    summary: 'Get default entity display media for a specific owner',
    description:
      'Retrieve the default entity display media item for an entity (used for thumbnails)',
  })
  @ApiParam({
    name: 'ownerType',
    description: 'Type of entity',
    enum: MediaOwnerType,
  })
  @ApiParam({
    name: 'ownerId',
    description: 'ID of the entity',
    type: 'number',
  })
  getDefaultForOwner(
    @Param('ownerType') ownerType: MediaOwnerType,
    @Param('ownerId', ParseIntPipe) ownerId: number,
  ) {
    return this.mediaService.getDefaultForOwner(ownerType, ownerId);
  }

  @Get('entity-display/:ownerType/:ownerId')
  @ApiOperation({
    summary: 'Get entity display media for a specific owner',
    description: 'Retrieve official display media for an entity',
  })
  @ApiParam({
    name: 'ownerType',
    description: 'Type of entity',
    enum: MediaOwnerType,
  })
  @ApiParam({
    name: 'ownerId',
    description: 'ID of the entity',
    type: 'number',
  })
  @ApiQuery({
    name: 'chapter',
    required: false,
    description: 'Chapter number filter',
    type: 'number',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Media type filter',
    enum: MediaType,
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
  async findEntityDisplayMedia(
    @Param('ownerType') ownerType: MediaOwnerType,
    @Param('ownerId', ParseIntPipe) ownerId: number,
    @Query('chapter') chapter?: number,
    @Query('type') type?: MediaType,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.mediaService.findForEntityDisplay(ownerType, ownerId, chapter, {
      type,
      page,
      limit,
    });
  }

  @Get('thumbnail/:ownerType/:ownerId/:userProgress')
  @ApiOperation({
    summary: 'Get thumbnail closest to user progress',
    description:
      'Get entity display media thumbnail closest to user reading progress. Returns null if none available.',
  })
  @ApiParam({
    name: 'ownerType',
    description: 'Type of entity',
    enum: MediaOwnerType,
  })
  @ApiParam({
    name: 'ownerId',
    description: 'ID of the entity',
    type: 'number',
  })
  @ApiParam({
    name: 'userProgress',
    description: "User's current reading progress (chapter number)",
    type: 'number',
  })
  async getThumbnailForUserProgress(
    @Param('ownerType') ownerType: MediaOwnerType,
    @Param('ownerId', ParseIntPipe) ownerId: number,
    @Param('userProgress', ParseIntPipe) userProgress: number,
  ) {
    const result = await this.mediaService.getThumbnailForUserProgress(
      ownerType,
      ownerId,
      userProgress,
    );
    return result;
  }

  @Get('entity-display/:ownerType/:ownerId/cycling')
  @ApiOperation({
    summary: 'Get all entity display media for cycling on detail pages',
    description:
      'Get all entity display media for an entity, optionally filtered by user progress for spoiler protection.',
  })
  @ApiParam({
    name: 'ownerType',
    description: 'Type of entity',
    enum: MediaOwnerType,
  })
  @ApiParam({
    name: 'ownerId',
    description: 'ID of the entity',
    type: 'number',
  })
  @ApiQuery({
    name: 'userProgress',
    required: false,
    description: "User's reading progress to filter spoilers",
    type: 'number',
  })
  async getEntityDisplayMediaForCycling(
    @Param('ownerType') ownerType: MediaOwnerType,
    @Param('ownerId', ParseIntPipe) ownerId: number,
    @Query('userProgress') userProgress?: number,
  ) {
    return this.mediaService.getEntityDisplayMediaForCycling(
      ownerType,
      ownerId,
      userProgress,
    );
  }

  @Get('gallery/:ownerType/:ownerId')
  @ApiOperation({
    summary: 'Get gallery media for a specific owner',
    description: 'Retrieve user-uploaded gallery media for an entity',
  })
  @ApiParam({
    name: 'ownerType',
    description: 'Type of entity',
    enum: MediaOwnerType,
  })
  @ApiParam({
    name: 'ownerId',
    description: 'ID of the entity',
    type: 'number',
  })
  @ApiQuery({
    name: 'chapter',
    required: false,
    description: 'Chapter number filter',
    type: 'number',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Media type filter',
    enum: MediaType,
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
  async findGalleryMedia(
    @Param('ownerType') ownerType: MediaOwnerType,
    @Param('ownerId', ParseIntPipe) ownerId: number,
    @Query('chapter') chapter?: number,
    @Query('type') type?: MediaType,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.mediaService.findForGallery(ownerType, ownerId, {
      chapter,
      type,
      page,
      limit,
    });
  }

  @Patch(':id/promote-to-entity-display')
  @ApiOperation({
    summary: 'Promote gallery media to entity display',
    description: 'Convert gallery media to entity display media',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'curator')
  @ApiParam({
    name: 'id',
    description: 'Media ID',
    type: 'number',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['ownerType', 'ownerId'],
      properties: {
        ownerType: {
          type: 'string',
          enum: Object.values(MediaOwnerType),
          description: 'Type of entity to associate with',
        },
        ownerId: {
          type: 'number',
          description: 'ID of entity to associate with',
        },
      },
    },
  })
  async promoteToEntityDisplay(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { ownerType: MediaOwnerType; ownerId: number },
  ) {
    return this.mediaService.setAsEntityDisplay(
      id,
      body.ownerType,
      body.ownerId,
    );
  }

  @Put(':id/relations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update media relations',
    description:
      'Update the ownership and relationship details of a media item',
  })
  @ApiParam({
    name: 'id',
    description: 'Media ID',
    type: 'number',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['ownerType', 'ownerId'],
      properties: {
        ownerType: {
          type: 'string',
          enum: Object.values(MediaOwnerType),
          description: 'Type of entity to associate with',
        },
        ownerId: {
          type: 'number',
          description: 'ID of entity to associate with',
        },
        chapterNumber: {
          type: 'number',
          description: 'Chapter number (optional)',
        },
      },
    },
  })
  updateMediaRelations(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      ownerType: MediaOwnerType;
      ownerId: number;
      chapterNumber?: number;
    },
  ) {
    return this.mediaService.updateMediaRelations(
      id,
      body.ownerType,
      body.ownerId,
      body.chapterNumber,
    );
  }

  @Post('migrate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Migrate existing media to polymorphic system',
    description:
      'Convert all existing media from old relationship system to new polymorphic system (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Migration completed',
    schema: {
      type: 'object',
      properties: {
        migrated: { type: 'number', description: 'Number of items migrated' },
        failed: {
          type: 'number',
          description: 'Number of items that failed to migrate',
        },
        errors: {
          type: 'array',
          items: { type: 'string' },
          description: 'Error messages for failed migrations',
        },
      },
    },
  })
  migrateToPolymorphic() {
    return this.mediaService.migrateToPolymorphic();
  }
}
