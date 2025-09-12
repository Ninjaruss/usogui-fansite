import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
  NotFoundException,
  Patch,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '../../entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { QuotePopularityDto } from './dto/quote-popularity.dto';
import { GamblePopularityDto } from './dto/gamble-popularity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../entities/user.entity';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  // Public users listing endpoint (no authentication required)
  @Get('public')
  @ApiTags('public')
  @ApiOperation({
    summary: 'Get all public user profiles',
    description:
      'Retrieve all users with their public profile information. No authentication required. Only returns safe, non-sensitive information.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of public user profiles',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              username: { type: 'string', example: 'john_doe' },
              role: { type: 'string', example: 'USER' },
              userProgress: { type: 'number', example: 42 },
              profileImageId: {
                type: 'string',
                format: 'uuid',
                nullable: true,
              },
              profileImage: { type: 'object', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 12,
  })
  @ApiQuery({
    name: 'username',
    required: false,
    description: 'Filter by username',
  })
  async getPublicUsers(
    @Query('page') page = '1',
    @Query('limit') limit = '12',
    @Query('username') username?: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;

    const searchParams: any = {
      page: pageNum,
      limit: limitNum,
    };

    if (username) {
      searchParams.username = username;
    }

    const result = await this.service.findAll(searchParams);

    // Return only safe, non-sensitive information for public access
    const publicUsers = result.data.map((user) => ({
      id: user.id,
      username: user.username,
      role: user.role,
      userProgress: user.userProgress,
      profilePictureType: user.profilePictureType,
      selectedCharacterMediaId: user.selectedCharacterMediaId,
      selectedCharacterMedia: user.selectedCharacterMedia ? {
        id: user.selectedCharacterMedia.id,
        url: user.selectedCharacterMedia.url,
        fileName: user.selectedCharacterMedia.fileName,
        description: user.selectedCharacterMedia.description,
        ownerType: user.selectedCharacterMedia.ownerType,
        ownerId: user.selectedCharacterMedia.ownerId,
        chapterNumber: user.selectedCharacterMedia.chapterNumber,
        character: (user.selectedCharacterMedia as any).character || null,
      } : null,
      discordAvatar: user.discordAvatar,
      createdAt: user.createdAt,
    }));

    return {
      data: publicUsers,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  @Get('public/:id')
  @ApiTags('public')
  @ApiOperation({
    summary: 'Get public user profile',
    description:
      "Retrieve a user's public profile information. No authentication required. Only returns safe, non-sensitive information.",
  })
  @ApiResponse({
    status: 200,
    description: 'Public user profile',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        username: { type: 'string', example: 'john_doe' },
        role: { type: 'string', example: 'USER' },
        userProgress: { type: 'number', example: 42 },
        profileImageId: { type: 'string', format: 'uuid', nullable: true },
        profileImage: { type: 'object', nullable: true },
        favoriteQuoteId: { type: 'number', nullable: true },
        favoriteQuote: { type: 'object', nullable: true },
        favoriteGambleId: { type: 'number', nullable: true },
        favoriteGamble: { type: 'object', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', description: 'User ID', example: 1 })
  async getPublicUserProfile(@Param('id', ParseIntPipe) id: number) {
    const user = await this.service.getUserProfile(id);

    // Return only safe, non-sensitive information for public access
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      userProgress: user.userProgress,
      profilePictureType: user.profilePictureType,
      selectedCharacterMediaId: user.selectedCharacterMediaId,
      selectedCharacterMedia: user.selectedCharacterMedia ? {
        id: user.selectedCharacterMedia.id,
        url: user.selectedCharacterMedia.url,
        fileName: user.selectedCharacterMedia.fileName,
        description: user.selectedCharacterMedia.description,
        ownerType: user.selectedCharacterMedia.ownerType,
        ownerId: user.selectedCharacterMedia.ownerId,
        chapterNumber: user.selectedCharacterMedia.chapterNumber,
        character: (user.selectedCharacterMedia as any).character || null,
      } : null,
      favoriteQuoteId: user.favoriteQuoteId,
      favoriteQuote: user.favoriteQuote,
      favoriteGambleId: user.favoriteGambleId,
      favoriteGamble: user.favoriteGamble,
      discordAvatar: user.discordAvatar,
      createdAt: user.createdAt,
    };
  }

  // --- Password reset endpoints ---
  @Post('password-reset/request')
  @ApiOperation({
    summary: 'Request password reset',
    description:
      'Send a password reset email to the user. No authentication required.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Password reset email sent (always returns success for security)',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'If an account with this email exists, a password reset link has been sent.',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid email format' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
      },
    },
  })
  requestPasswordReset(@Body('email') email: string) {
    return this.service.generatePasswordReset(email);
  }

  @Post('password-reset/confirm')
  @ApiOperation({
    summary: 'Confirm password reset',
    description:
      'Reset password using the token received via email. No authentication required.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'Password has been successfully reset. You can now login with your new password.',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @ApiResponse({ status: 400, description: 'Invalid password format' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['token', 'newPassword'],
      properties: {
        token: { type: 'string', example: 'abc123def456...' },
        newPassword: {
          type: 'string',
          example: 'NewSecurePassword123!',
          minLength: 8,
        },
      },
    },
  })
  resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.service.resetPassword(token, newPassword);
  }

  // --- Email verification endpoint ---
  @Get('verify-email')
  @ApiOperation({
    summary: 'Verify email address',
    description:
      'Verify user email using the token received via email. No authentication required.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'Email has been successfully verified. You can now access all features.',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            username: { type: 'string', example: 'john_doe' },
            email: { type: 'string', example: 'john@example.com' },
            isEmailVerified: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired verification token',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiQuery({
    name: 'token',
    description: 'Email verification token',
    example: 'abc123def456...',
  })
  verifyEmail(@Query('token') token: string) {
    return this.service.verifyEmail(token);
  }

  // --- ADMIN ONLY ENDPOINTS ---
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all users',
    description:
      'Retrieve all users with their profile information (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all users',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
        total: { type: 'number' },
        page: { type: 'number' },
        perPage: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async getAll(@Query('page') page = '1', @Query('limit') limit = '1000') {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 1000;
    const result = await this.service.findAll({
      page: pageNum,
      limit: limitNum,
    });

    return {
      data: result.data,
      total: result.total,
      page: result.page,
      perPage: limitNum,
      totalPages: result.totalPages,
    } as const;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user by ID',
    description:
      'Retrieve a specific user by ID with full profile information (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'User found',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        username: { type: 'string', example: 'john_doe' },
        email: { type: 'string', example: 'john@example.com' },
        role: { type: 'string', example: 'USER' },
        isEmailVerified: { type: 'boolean', example: true },
        profileImageId: { type: 'string', format: 'uuid', nullable: true },
        favoriteQuoteId: { type: 'number', nullable: true },
        favoriteGambleId: { type: 'number', nullable: true },
        profileImage: { type: 'object', nullable: true },
        favoriteQuote: { type: 'object', nullable: true },
        favoriteGamble: { type: 'object', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', description: 'User ID', example: 1 })
  getOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create user',
    description: 'Create a new user account (Admin only)',
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        username: { type: 'string', example: 'john_doe' },
        email: { type: 'string', example: 'john@example.com' },
        role: { type: 'string', example: 'USER' },
        isEmailVerified: { type: 'boolean', example: false },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or user already exists',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['username', 'email', 'password'],
      properties: {
        username: {
          type: 'string',
          example: 'john_doe',
          minLength: 3,
          maxLength: 50,
        },
        email: { type: 'string', format: 'email', example: 'john@example.com' },
        password: {
          type: 'string',
          example: 'SecurePassword123!',
          minLength: 8,
        },
      },
    },
  })
  create(
    @Body() data: { username: string; email: string; password: string },
  ): Promise<User> {
    return this.service.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update user',
    description:
      'Update user data including role, email verification status, and profile settings (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        username: { type: 'string', example: 'john_doe_updated' },
        email: { type: 'string', example: 'john.updated@example.com' },
        role: { type: 'string', example: 'MODERATOR' },
        isEmailVerified: { type: 'boolean', example: true },
        profileImageId: { type: 'string', format: 'uuid', nullable: true },
        favoriteQuoteId: { type: 'number', nullable: true },
        favoriteGambleId: { type: 'number', nullable: true },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', description: 'User ID', example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'john_doe_updated' },
        email: {
          type: 'string',
          format: 'email',
          example: 'john.updated@example.com',
        },
        role: {
          type: 'string',
          enum: ['USER', 'MODERATOR', 'ADMIN'],
          example: 'MODERATOR',
        },
        isEmailVerified: { type: 'boolean', example: true },
        profileImageId: { type: 'string', format: 'uuid', nullable: true },
        favoriteQuoteId: { type: 'number', nullable: true },
        favoriteGambleId: { type: 'number', nullable: true },
      },
    },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<User>,
  ): Promise<User> {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete user',
    description:
      'Permanently delete a user account and all associated data (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Deleted successfully' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', description: 'User ID', example: 1 })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
    return { message: 'Deleted successfully' };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user statistics',
    description:
      'Retrieve aggregated user statistics including counts by role, verification status, and activity metrics (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalUsers: { type: 'number', example: 1250 },
        verifiedUsers: { type: 'number', example: 1100 },
        unverifiedUsers: { type: 'number', example: 150 },
        usersByRole: {
          type: 'object',
          properties: {
            USER: { type: 'number', example: 1200 },
            MODERATOR: { type: 'number', example: 45 },
            ADMIN: { type: 'number', example: 5 },
          },
        },
        recentSignups: { type: 'number', example: 25 },
        activeUsers: { type: 'number', example: 890 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async getUserStats() {
    return this.service.getUserStats();
  }

  @Get(':id/activity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user activity',
    description:
      'Retrieve detailed activity log for a specific user including logins, submissions, and interactions (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'User activity retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'number', example: 1 },
        username: { type: 'string', example: 'john_doe' },
        lastLogin: { type: 'string', format: 'date-time' },
        totalLogins: { type: 'number', example: 45 },
        mediaSubmissions: { type: 'number', example: 12 },
        approvedSubmissions: { type: 'number', example: 10 },
        rejectedSubmissions: { type: 'number', example: 2 },
        profileUpdates: { type: 'number', example: 3 },
        accountCreated: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', description: 'User ID', example: 1 })
  async getUserActivity(@Param('id') id: number) {
    return this.service.getUserActivity(id);
  }

  // --- Profile customization endpoints ---
  @Get('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      "Retrieve the current user's profile with favorite quote and gamble details",
  })
  @ApiResponse({
    status: 200,
    description: 'User profile with customization details',
    type: User,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUserProfile(@CurrentUser() user: User): Promise<User> {
    return this.service.getUserProfile(user.id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update user profile',
    description:
      "Update the current user's profile picture, favorite quote, and favorite gamble",
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: User,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Quote or gamble not found' })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    return this.service.updateProfile(user.id, updateProfileDto);
  }

  @Post('profile/refresh-discord-avatar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Refresh Discord avatar',
    description:
      'Fetch the latest Discord avatar for the current user from Discord API',
  })
  @ApiResponse({
    status: 200,
    description: 'Discord avatar refreshed successfully',
    type: User,
  })
  @ApiResponse({ status: 400, description: 'User does not have Discord linked or Discord API error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async refreshDiscordAvatar(@CurrentUser() user: User): Promise<User> {
    return this.service.refreshDiscordAvatar(user.id);
  }

  @Get('profile/progress')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user reading progress',
    description:
      "Get the current user's reading progress (highest chapter read)",
  })
  @ApiResponse({
    status: 200,
    description: 'User reading progress',
    schema: {
      type: 'object',
      properties: {
        userProgress: { type: 'number', example: 42 },
        username: { type: 'string', example: 'john_doe' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserProgress(
    @CurrentUser() user: User,
  ): Promise<{ userProgress: number; username: string }> {
    return {
      userProgress: user.userProgress,
      username: user.username,
    };
  }

  @Put('profile/progress')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update user reading progress',
    description:
      "Update the current user's reading progress (highest chapter read)",
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['userProgress'],
      properties: {
        userProgress: {
          type: 'number',
          example: 45,
          minimum: 1,
          maximum: 539,
          description: 'Highest chapter number the user has read (1-539)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Reading progress updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Reading progress updated successfully',
        },
        userProgress: { type: 'number', example: 45 },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid progress value' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateUserProgress(
    @CurrentUser() user: User,
    @Body('userProgress', ParseIntPipe) userProgress: number,
  ): Promise<{ message: string; userProgress: number }> {
    if (userProgress < 1 || userProgress > 539) {
      throw new NotFoundException('User progress must be between 1 and 539');
    }

    await this.service.updateUserProgress(user.id, userProgress);
    return {
      message: 'Reading progress updated successfully',
      userProgress,
    };
  }


  // --- Statistics endpoints ---
  @Get('stats/quote-popularity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get quote popularity statistics',
    description:
      'Retrieve statistics on how many users have selected each quote as their favorite (Moderator+ only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Quote popularity statistics',
    type: [QuotePopularityDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Moderator role required',
  })
  async getQuotePopularityStats() {
    return this.service.getQuotePopularityStats();
  }

  @Get('stats/gamble-popularity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get gamble popularity statistics',
    description:
      'Retrieve statistics on how many users have selected each gamble as their favorite (Moderator+ only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Gamble popularity statistics',
    type: [GamblePopularityDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Moderator role required',
  })
  async getGamblePopularityStats() {
    return this.service.getGamblePopularityStats();
  }

  @Get('stats/profile-customization')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get profile customization statistics',
    description:
      'Retrieve statistics on profile picture usage and overall customization adoption (Moderator+ only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile customization statistics',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Moderator role required',
  })
  async getProfileCustomizationStats() {
    return this.service.getProfileCustomizationStats();
  }
}
