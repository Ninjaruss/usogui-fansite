import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { GuidesService } from './guides.service';
import { CreateGuideDto } from './dto/create-guide.dto';
import { UpdateGuideDto } from './dto/update-guide.dto';
import { GuideQueryDto } from './dto/guide-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../../entities/user.entity';
import { Guide } from '../../entities/guide.entity';

@ApiTags('guides')
@Controller('guides')
export class GuidesController {
  constructor(private readonly guidesService: GuidesService) {}

  // PUBLIC ENDPOINTS

  @Get('public')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Get published guides (public)',
    description:
      'Retrieves a paginated list of all published guides accessible to everyone. Supports searching, filtering, and sorting options. If authenticated, includes user-specific data like like status.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search guides by title or description',
    example: 'poker strategy',
  })
  @ApiQuery({
    name: 'authorId',
    required: false,
    description: 'Filter by author ID',
    example: 1,
  })
  @ApiQuery({
    name: 'tag',
    required: false,
    description: 'Filter by tag name',
    example: 'strategy',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description:
      'Sort by field (createdAt, updatedAt, viewCount, likeCount, title)',
    example: 'viewCount',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order (default: DESC)',
    example: 'DESC',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 20, max: 100)',
    example: 20,
  })
  @ApiOkResponse({
    description: 'Published guides retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              title: {
                type: 'string',
                example: 'Mastering Poker Psychology in Usogui',
              },
              description: {
                type: 'string',
                example:
                  'A comprehensive guide to understanding the psychological warfare...',
              },
              status: {
                type: 'string',
                enum: ['published'],
                example: 'published',
              },
              viewCount: { type: 'number', example: 190 },
              likeCount: { type: 'number', example: 5 },
              userHasLiked: {
                type: 'boolean',
                example: true,
                description:
                  'Whether the current user has liked this guide (only present if authenticated)',
              },
              author: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  username: { type: 'string', example: 'admin' },
                },
              },
              tags: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', example: 1 },
                    name: { type: 'string', example: 'strategy' },
                  },
                },
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                example: '2025-08-25T16:15:47.123Z',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                example: '2025-08-25T16:15:47.123Z',
              },
            },
          },
        },
        total: { type: 'number', example: 4 },
        page: { type: 'number', example: 1 },
        totalPages: { type: 'number', example: 1 },
      },
    },
  })
  findPublicGuides(@Query() query: GuideQueryDto, @CurrentUser() user?: User) {
    return this.guidesService.findPublished(query, user);
  }

  @Get('public/:id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Get published guide by ID (public)',
    description:
      'Retrieves a specific published guide by its ID and automatically increments the view count. Only published guides are accessible through this endpoint. If authenticated, includes user-specific data like like status.',
  })
  @ApiParam({
    name: 'id',
    description: 'Guide ID',
    example: 1,
    type: 'integer',
  })
  @ApiOkResponse({
    description: 'Guide retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        title: {
          type: 'string',
          example: 'Mastering Poker Psychology in Usogui',
        },
        description: {
          type: 'string',
          example:
            'A comprehensive guide to understanding the psychological warfare...',
        },
        content: {
          type: 'string',
          example:
            '# Mastering Poker Psychology in Usogui\\n\\n## Introduction...',
        },
        status: { type: 'string', enum: ['published'], example: 'published' },
        viewCount: { type: 'number', example: 191 },
        likeCount: { type: 'number', example: 5 },
        userHasLiked: {
          type: 'boolean',
          example: true,
          description:
            'Whether the current user has liked this guide (only present if authenticated)',
        },
        author: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            username: { type: 'string', example: 'admin' },
          },
        },
        tags: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'strategy' },
            },
          },
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-08-25T16:15:47.123Z',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-08-25T16:15:47.123Z',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Guide not found or not published',
    schema: {
      example: {
        statusCode: 404,
        message: 'Guide not found',
        error: 'Not Found',
      },
    },
  })
  async findOnePublic(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
    @CurrentUser() user?: User,
  ) {
    // Record page view when someone views the guide
    const ipAddress = request.ip;
    const userAgent = request.get('User-Agent');
    await this.guidesService.recordView(id, ipAddress, userAgent);
    return this.guidesService.findOnePublic(id, user);
  }

  // AUTHENTICATED ENDPOINTS

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new guide',
    description:
      'Creates a new guide with the provided content. Any authenticated user can create guides. The guide will be created as a draft by default.',
  })
  @ApiBody({
    type: CreateGuideDto,
    description: 'Guide creation data',
    examples: {
      example1: {
        summary: 'Basic guide creation',
        value: {
          title: 'Advanced Bluffing Techniques',
          description:
            'Master the art of bluffing in high-stakes gambling scenarios',
          content:
            '# Advanced Bluffing Techniques\n\n## Introduction\n\nBluffing is an essential skill...',
          status: 'draft',
          tagNames: ['strategy', 'advanced', 'psychology'],
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Guide created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 6 },
        title: { type: 'string', example: 'Advanced Bluffing Techniques' },
        description: {
          type: 'string',
          example:
            'Master the art of bluffing in high-stakes gambling scenarios',
        },
        content: {
          type: 'string',
          example: '# Advanced Bluffing Techniques\n\n## Introduction...',
        },
        status: {
          type: 'string',
          enum: ['draft', 'published'],
          example: 'draft',
        },
        viewCount: { type: 'number', example: 0 },
        likeCount: { type: 'number', example: 0 },
        authorId: { type: 'number', example: 1 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: ['title should not be empty', 'content should not be empty'],
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  create(@Body() createGuideDto: CreateGuideDto, @CurrentUser() user: User) {
    return this.guidesService.create(createGuideDto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all guides (authenticated)',
    description:
      'Retrieves all guides with access control. Users can see their own drafts and all published guides. Supports comprehensive filtering and sorting options.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search guides by title or description',
    example: 'poker',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['draft', 'published'],
    description: 'Filter by status (draft, published)',
    example: 'published',
  })
  @ApiQuery({
    name: 'authorId',
    required: false,
    description: 'Filter by author ID',
    example: 1,
  })
  @ApiQuery({
    name: 'tag',
    required: false,
    description: 'Filter by tag name',
    example: 'strategy',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description:
      'Sort by field (createdAt, updatedAt, viewCount, likeCount, title)',
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order (default: DESC)',
    example: 'DESC',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 20, max: 100)',
    example: 20,
  })
  @ApiOkResponse({
    description: 'Guides retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              title: {
                type: 'string',
                example: 'Mastering Poker Psychology in Usogui',
              },
              description: {
                type: 'string',
                example:
                  'A comprehensive guide to understanding the psychological warfare...',
              },
              status: {
                type: 'string',
                enum: ['draft', 'published'],
                example: 'published',
              },
              viewCount: { type: 'number', example: 190 },
              likeCount: { type: 'number', example: 5 },
              author: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  username: { type: 'string', example: 'admin' },
                },
              },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number', example: 5 },
        page: { type: 'number', example: 1 },
        totalPages: { type: 'number', example: 1 },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  findAll(@Query() query: GuideQueryDto) {
    return this.guidesService.findAll(query);
  }

  @Get('my-guides')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get current user's guides",
    description:
      'Retrieves all guides created by the currently authenticated user, including both drafts and published guides.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['draft', 'published'],
    description: 'Filter by status (draft, published)',
    example: 'draft',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 20)',
    example: 20,
  })
  @ApiOkResponse({
    description: 'User guides retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 5 },
              title: {
                type: 'string',
                example: 'Draft: Advanced Bluffing Techniques',
              },
              description: {
                type: 'string',
                example:
                  'Work in progress - exploring advanced bluffing strategies...',
              },
              status: {
                type: 'string',
                enum: ['draft', 'published'],
                example: 'draft',
              },
              viewCount: { type: 'number', example: 42 },
              likeCount: { type: 'number', example: 0 },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number', example: 3 },
        page: { type: 'number', example: 1 },
        totalPages: { type: 'number', example: 1 },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  getMyGuides(@Query() query: GuideQueryDto, @CurrentUser() user: User) {
    return this.guidesService.findAll({ ...query, authorId: user.id });
  }

  @Get('liked')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get user's liked guides",
    description:
      'Retrieves all guides that the currently authenticated user has liked. Only returns published guides.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 20)',
    example: 20,
  })
  @ApiOkResponse({
    description: 'Liked guides retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              title: {
                type: 'string',
                example: 'Mastering Poker Psychology in Usogui',
              },
              description: {
                type: 'string',
                example:
                  'A comprehensive guide to understanding the psychological warfare...',
              },
              status: {
                type: 'string',
                enum: ['published'],
                example: 'published',
              },
              viewCount: { type: 'number', example: 190 },
              likeCount: { type: 'number', example: 5 },
              author: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  username: { type: 'string', example: 'admin' },
                },
              },
              likedAt: {
                type: 'string',
                format: 'date-time',
                description: 'When the user liked this guide',
              },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number', example: 2 },
        page: { type: 'number', example: 1 },
        totalPages: { type: 'number', example: 1 },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  getLikedGuides(@Query() query: GuideQueryDto, @CurrentUser() user: User) {
    return this.guidesService.getUserLikedGuides(user.id, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get guide by ID (authenticated)',
    description:
      'Get a specific guide by its ID. Can access own drafts and all published guides.',
  })
  @ApiParam({ name: 'id', description: 'Guide ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Guide found',
    type: Guide,
  })
  @ApiResponse({ status: 404, description: 'Guide not found' })
  @ApiResponse({ status: 403, description: 'Access denied to this guide' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.guidesService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a guide',
    description:
      'Updates an existing guide. Only the author of the guide can update it. Automatically recalculates reading time when content is modified.',
  })
  @ApiParam({ name: 'id', description: 'Guide ID', example: 1 })
  @ApiOkResponse({
    description: 'Guide updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        title: {
          type: 'string',
          example: 'Mastering Poker Psychology in Usogui (Updated)',
        },
        description: {
          type: 'string',
          example:
            'An updated comprehensive guide to understanding the psychological warfare...',
        },
        content: {
          type: 'string',
          example:
            '# Mastering Poker Psychology in Usogui\\n\\nUpdated content here...',
        },
        status: {
          type: 'string',
          enum: ['draft', 'published'],
          example: 'published',
        },
        viewCount: { type: 'number', example: 195 },
        likeCount: { type: 'number', example: 5 },
        tags: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'Strategy' },
            },
          },
        },
        author: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            username: { type: 'string', example: 'admin' },
          },
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: ['title should not be empty', 'content should not be empty'],
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Not authorized to update this guide',
    schema: {
      example: {
        statusCode: 403,
        message: 'You can only update your own guides',
        error: 'Forbidden',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Guide not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Guide not found',
        error: 'Not Found',
      },
    },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGuideDto: UpdateGuideDto,
    @CurrentUser() user: User,
  ) {
    console.log('=== GUIDE CONTROLLER UPDATE DEBUG ===');
    console.log('Guide ID:', id);
    console.log('Raw body received:', JSON.stringify(updateGuideDto, null, 2));
    console.log('User:', user.id, user.username, user.role);
    console.log('=== END CONTROLLER DEBUG ===');
    
    return this.guidesService.update(id, updateGuideDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a guide',
    description:
      'Deletes an existing guide. Only the author of the guide can delete it. This action cannot be undone.',
  })
  @ApiParam({ name: 'id', description: 'Guide ID', example: 1 })
  @ApiNoContentResponse({
    description: 'Guide deleted successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Not authorized to delete this guide',
    schema: {
      example: {
        statusCode: 403,
        message: 'You can only delete your own guides',
        error: 'Forbidden',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Guide not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Guide not found',
        error: 'Not Found',
      },
    },
  })
  async delete(@Param('id') id: number, @CurrentUser() user: User) {
    return this.guidesService.remove(id, user);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Like or unlike a guide',
    description:
      'Toggles like status for a guide. If the user has already liked the guide, it will be unliked. If not liked, it will be liked. Only published guides can be liked.',
  })
  @ApiParam({ name: 'id', description: 'Guide ID', example: 1 })
  @ApiOkResponse({
    description: 'Like status updated successfully',
    schema: {
      type: 'object',
      properties: {
        liked: {
          type: 'boolean',
          description: 'Whether the guide is now liked by the user',
          example: true,
        },
        likeCount: {
          type: 'number',
          description: 'Total number of likes for this guide',
          example: 6,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Guide not found or not published',
    schema: {
      example: {
        statusCode: 404,
        message: 'Guide not found or not published',
        error: 'Not Found',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Cannot like unpublished guides',
    schema: {
      example: {
        statusCode: 400,
        message: 'Cannot like unpublished guides',
        error: 'Bad Request',
      },
    },
  })
  async toggleLike(@Param('id') id: number, @CurrentUser() user: User) {
    return this.guidesService.toggleLike(id, user);
  }

  // MODERATOR/ADMIN ENDPOINTS

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get pending guides for moderation',
    description:
      'Retrieves guides awaiting approval. Only accessible to moderators and admins.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 20)',
    example: 20,
  })
  @ApiOkResponse({
    description: 'Pending guides retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 5 },
              title: { type: 'string', example: 'New Guide Awaiting Approval' },
              description: {
                type: 'string',
                example: 'This guide needs review...',
              },
              status: { type: 'string', enum: ['pending'], example: 'pending' },
              author: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 2 },
                  username: { type: 'string', example: 'user123' },
                },
              },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number', example: 3 },
        page: { type: 'number', example: 1 },
        totalPages: { type: 'number', example: 1 },
      },
    },
  })
  getPendingGuides(@Query() query: GuideQueryDto) {
    return this.guidesService.getPendingGuides(query);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Approve a pending guide',
    description:
      'Approves a guide and makes it publicly visible. Only accessible to moderators and admins.',
  })
  @ApiParam({ name: 'id', description: 'Guide ID', example: 1 })
  @ApiOkResponse({
    description: 'Guide approved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        title: { type: 'string', example: 'Approved Guide Title' },
        status: { type: 'string', enum: ['published'], example: 'published' },
        rejectionReason: { type: 'null', example: null },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Only moderators and admins can approve guides',
  })
  @ApiNotFoundResponse({
    description: 'Guide not found',
  })
  @ApiBadRequestResponse({
    description: 'Only pending guides can be approved',
  })
  async approveGuide(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.guidesService.approve(id, user);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reject a pending guide',
    description:
      'Rejects a guide with a reason. Only accessible to moderators and admins.',
  })
  @ApiParam({ name: 'id', description: 'Guide ID', example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        rejectionReason: {
          type: 'string',
          example: 'Guide content does not meet quality standards',
          maxLength: 500,
        },
      },
      required: ['rejectionReason'],
    },
  })
  @ApiOkResponse({
    description: 'Guide rejected successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        title: { type: 'string', example: 'Rejected Guide Title' },
        status: { type: 'string', enum: ['rejected'], example: 'rejected' },
        rejectionReason: {
          type: 'string',
          example: 'Guide content does not meet quality standards',
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Only moderators and admins can reject guides',
  })
  @ApiNotFoundResponse({
    description: 'Guide not found',
  })
  @ApiBadRequestResponse({
    description: 'Only pending guides can be rejected',
  })
  async rejectGuide(
    @Param('id', ParseIntPipe) id: number,
    @Body('rejectionReason') rejectionReason: string,
    @CurrentUser() user: User,
  ) {
    if (!rejectionReason || rejectionReason.trim().length === 0) {
      throw new BadRequestException('Rejection reason is required');
    }
    return this.guidesService.reject(id, rejectionReason, user);
  }
}
