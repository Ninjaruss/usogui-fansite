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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UploadMediaDto } from './dto/upload-media.dto';
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
    summary: 'Get all approved media (public)',
    description:
      'Publicly accessible endpoint to view all approved media content including fanart and videos',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by media type (image, video, audio)',
  })
  @ApiQuery({
    name: 'characterId',
    required: false,
    description: 'Filter by character ID',
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
  @ApiResponse({
    status: 200,
    description: 'Approved media retrieved successfully',
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
        },
        total: { type: 'number', example: 50 },
        page: { type: 'number', example: 1 },
        perPage: { type: 'number', example: 20 },
        totalPages: { type: 'number', example: 3 },
      },
    },
  })
  findAllPublic(
    @Query('type') type?: string,
    @Query('characterId') characterId?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.mediaService.findAllPublic({ type, characterId, page, limit });
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Submit media content',
    description:
      'Submit video/fanart URL for approval. Content will be reviewed by moderators before being published.',
  })
  @ApiBody({
    type: CreateMediaDto,
    description: 'Media submission data',
    examples: {
      fanart: {
        summary: 'Character fanart submission',
        value: {
          url: 'https://www.deviantart.com/artist/usogui-baku-fanart',
          type: 'image',
          description: 'Amazing fanart of Baku Madarame from Chapter 45',
          characterId: 1,
        },
      },
      video: {
        summary: 'Character analysis video',
        value: {
          url: 'https://www.youtube.com/watch?v=character-analysis',
          type: 'video',
          description:
            "Deep dive into Baku's psychology and gambling techniques",
          characterId: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Media submitted successfully for review',
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
        character: {
          type: 'object',
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
  @ApiResponse({
    status: 400,
    description: 'Invalid URL or unsupported platform',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createMediaDto: CreateMediaDto, @CurrentUser() user: User) {
    return this.mediaService.create(createMediaDto, user);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Upload media file (moderators/admins only)',
    description:
      'Upload image files directly to Backblaze B2 storage. Automatically approved for moderators and admins. Only image files are allowed.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file to upload (JPEG, PNG, WebP, GIF)',
        },
        type: {
          type: 'string',
          enum: ['image', 'video', 'audio'],
          description: 'Type of media content (currently only image supported for uploads)',
        },
        description: {
          type: 'string',
          description: 'Description of the media content',
          maxLength: 500,
        },
        characterId: {
          type: 'number',
          description: 'ID of the character this media belongs to',
        },
        arcId: {
          type: 'number',
          description: 'ID of the arc this media belongs to',
        },
        eventId: {
          type: 'number',
          description: 'ID of the event this media belongs to',
        },
      },
      required: ['file', 'type'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Media uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        url: { type: 'string', example: 'https://your-custom-domain.com/media/123456_character.jpg' },
        fileName: { type: 'string', example: 'media/123456_character.jpg' },
        isUploaded: { type: 'boolean', example: true },
        type: { type: 'string', example: 'image' },
        description: { type: 'string', example: 'Character portrait' },
        status: { type: 'string', example: 'approved' },
        createdAt: { type: 'string', format: 'date-time' },
        submittedBy: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            username: { type: 'string', example: 'moderator' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file or data' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires moderator or admin role' })
  @ApiResponse({ status: 413, description: 'File too large - max 10MB' })
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
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only image files (JPEG, PNG, WebP, GIF) are allowed');
    }

    return this.mediaService.createUpload(
      {
        type: uploadData.type,
        description: uploadData.description,
        characterId: uploadData.characterId,
        arcId: uploadData.arcId,
        eventId: uploadData.eventId,
      },
      file.buffer,
      file.originalname,
      file.mimetype,
      user,
      this.b2Service,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all media with filtering (authenticated)',
    description:
      'Retrieve media content with optional filtering by status, type, and character (requires authentication)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status (pending, approved, rejected)',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by media type (image, video, audio)',
  })
  @ApiQuery({
    name: 'characterId',
    required: false,
    description: 'Filter by character ID',
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
        },
        total: { type: 'number', example: 50 },
        page: { type: 'number', example: 1 },
        perPage: { type: 'number', example: 20 },
        totalPages: { type: 'number', example: 3 },
      },
    },
  })
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('characterId') characterId?: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const characterIdNum = characterId ? parseInt(characterId) : undefined;

    const result = await this.mediaService.findAll({
      page: pageNum,
      limit: limitNum,
      status,
      type,
      characterId: characterIdNum,
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
        characterId: { type: 'number', example: 1 },
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
}
