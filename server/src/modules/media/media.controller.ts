import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Query } from '@nestjs/common';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../../entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  // PUBLIC ENDPOINTS - No authentication required

  @Get('public')
  @ApiOperation({
    summary: 'Get all approved media (public)',
    description: 'Publicly accessible endpoint to view all approved media content including fanart and videos'
  })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by media type (image, video, audio)' })
  @ApiQuery({ name: 'characterId', required: false, description: 'Filter by character ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
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
              url: { type: 'string', example: 'https://www.youtube.com/watch?v=example' },
              type: { type: 'string', example: 'video' },
              description: { type: 'string', example: 'Character analysis video' },
              character: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'number', example: 1 },
                  name: { type: 'string', example: 'Baku Madarame' }
                }
              },
              submittedBy: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  username: { type: 'string', example: 'fan123' }
                }
              },
              createdAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        total: { type: 'number', example: 50 },
        page: { type: 'number', example: 1 },
        totalPages: { type: 'number', example: 3 }
      }
    }
  })
  findAllPublic(
    @Query('type') type?: string,
    @Query('characterId') characterId?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.mediaService.findAllPublic({ type, characterId, page, limit });
  }

  @Get('public/:id')
  @ApiOperation({
    summary: 'Get approved media by ID (public)',
    description: 'Publicly accessible endpoint to view a specific approved media item'
  })
  @ApiParam({ name: 'id', description: 'Media ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Media found',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        url: { type: 'string', example: 'https://www.youtube.com/watch?v=example' },
        type: { type: 'string', example: 'video' },
        description: { type: 'string', example: 'Character analysis video' },
        character: {
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Baku Madarame' }
          }
        },
        submittedBy: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            username: { type: 'string', example: 'fan123' }
          }
        },
        createdAt: { type: 'string', format: 'date-time' }
      }
    }
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
    description: 'Submit video/fanart URL for approval. Content will be reviewed by moderators before being published.'
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
          characterId: 1
        }
      },
      video: {
        summary: 'Character analysis video',
        value: {
          url: 'https://www.youtube.com/watch?v=character-analysis',
          type: 'video',
          description: 'Deep dive into Baku\'s psychology and gambling techniques',
          characterId: 1
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Media submitted successfully for review',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        url: { type: 'string', example: 'https://www.youtube.com/watch?v=example' },
        type: { type: 'string', example: 'video' },
        description: { type: 'string', example: 'Character analysis video' },
        status: { type: 'string', example: 'pending' },
        character: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Baku Madarame' }
          }
        },
        submittedBy: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            username: { type: 'string', example: 'fan123' }
          }
        },
        createdAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid URL or unsupported platform' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createMediaDto: CreateMediaDto, @CurrentUser() user: User) {
    return this.mediaService.create(createMediaDto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all approved media (authenticated)',
    description: 'Retrieve all approved media content with full details (requires authentication)'
  })
  @ApiResponse({
      status: 200,
      description: 'Approved media retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { type: 'object', properties: { id: { type: 'number', example: 1 }, url: { type: 'string', example: 'https://www.youtube.com/watch?v=example' }, type: { type: 'string', example: 'video' }, description: { type: 'string', example: 'Character analysis video' }, status: { type: 'string', example: 'approved' }, character: { type: 'object', nullable: true, properties: { id: { type: 'number', example: 1 }, name: { type: 'string', example: 'Baku Madarame' } } }, submittedBy: { type: 'object', properties: { id: { type: 'number', example: 1 }, username: { type: 'string', example: 'fan123' } } }, createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' } } } },
          meta: { type: 'object', properties: { total: { type: 'number' }, page: { type: 'number' }, perPage: { type: 'number' }, totalPages: { type: 'number' } } }
        }
    }
  })
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('legacy') legacy?: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const result = await this.mediaService.findAll({ page: pageNum, limit: limitNum });
    const response = { data: result.data, meta: { total: result.total, page: result.page, perPage: limitNum, totalPages: result.totalPages } };
    if (legacy === 'true') return { media: result.data, ...response };
    return response;
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get pending media submissions', description: 'Retrieve media submissions awaiting moderation (requires moderator or admin role)' })
  @ApiResponse({
    status: 200,
    description: 'Pending submissions retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          url: { type: 'string', example: 'https://www.youtube.com/watch?v=example' },
          type: { type: 'string', example: 'video' },
          description: { type: 'string', example: 'Character analysis video' },
          status: { type: 'string', example: 'pending' },
          character: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'Baku Madarame' }
            }
          },
          submittedBy: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              username: { type: 'string', example: 'fan123' },
              email: { type: 'string', example: 'fan123@example.com' }
            }
          },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires moderator or admin role' })
  getPendingSubmissions() {
    return this.mediaService.findPending();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get media by ID (authenticated)',
    description: 'Retrieve a specific media item by its ID with full details (requires authentication)'
  })
  @ApiParam({ name: 'id', description: 'Media ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Media found',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        url: { type: 'string', example: 'https://www.youtube.com/watch?v=example' },
        type: { type: 'string', example: 'video' },
        description: { type: 'string', example: 'Character analysis video' },
        status: { type: 'string', example: 'approved' },
        character: {
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Baku Madarame' }
          }
        },
        submittedBy: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            username: { type: 'string', example: 'fan123' }
          }
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Media not found' })
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(+id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete media', description: 'Delete a media item (requires moderator or admin role)' })
  @ApiResponse({
    status: 200,
    description: 'Media deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Media deleted successfully' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires moderator or admin role' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  @ApiParam({ name: 'id', description: 'Media ID', example: 1 })
  remove(@Param('id') id: string) {
    return this.mediaService.remove(+id);
  }

  @Put(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve media submission', description: 'Approve a pending media submission (requires moderator or admin role)' })
  @ApiResponse({
    status: 200,
    description: 'Media approved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        url: { type: 'string', example: 'https://www.youtube.com/watch?v=example' },
        type: { type: 'string', example: 'video' },
        description: { type: 'string', example: 'Character analysis video' },
        status: { type: 'string', example: 'approved' },
        character: {
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Baku Madarame' }
          }
        },
        submittedBy: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            username: { type: 'string', example: 'fan123' }
          }
        },
        approvedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires moderator or admin role' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  @ApiResponse({ status: 400, description: 'Media already processed or invalid status' })
  @ApiParam({ name: 'id', description: 'Media ID', example: 1 })
  approveSubmission(@Param('id') id: string) {
    return this.mediaService.approveSubmission(+id);
  }

  @Put(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject media submission', description: 'Reject a pending media submission with optional reason (requires moderator or admin role)' })
  @ApiResponse({
    status: 200,
    description: 'Media rejected successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        url: { type: 'string', example: 'https://www.youtube.com/watch?v=example' },
        type: { type: 'string', example: 'video' },
        description: { type: 'string', example: 'Character analysis video' },
        status: { type: 'string', example: 'rejected' },
        rejectionReason: { type: 'string', example: 'Content does not meet quality standards' },
        character: {
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Baku Madarame' }
          }
        },
        submittedBy: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            username: { type: 'string', example: 'fan123' }
          }
        },
        rejectedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires moderator or admin role' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  @ApiResponse({ status: 400, description: 'Media already processed or invalid status' })
  @ApiParam({ name: 'id', description: 'Media ID', example: 1 })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        reason: { 
          type: 'string', 
          description: 'Reason for rejection',
          example: 'Content does not meet quality standards'
        } 
      } 
    } 
  })
  rejectSubmission(@Param('id') id: string, @Body('reason') reason: string) {
    return this.mediaService.rejectSubmission(+id, reason);
  }
}
