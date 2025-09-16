import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  Patch,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { BadgesService } from './badges.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { AwardBadgeDto, RevokeBadgeDto, UpdateCustomRoleDto } from './dto/award-badge.dto';

@ApiTags('badges')
@Controller('badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available badges' })
  @ApiResponse({ status: 200, description: 'List of all badges' })
  async getAllBadges() {
    return this.badgesService.findAllBadges();
  }

  @Get('supporters')
  @ApiOperation({ summary: 'Get all supporters list' })
  @ApiResponse({ status: 200, description: 'List of supporters' })
  async getSupporters() {
    return this.badgesService.getAllSupporters();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get badge by ID' })
  @ApiParam({ name: 'id', description: 'Badge ID' })
  @ApiResponse({ status: 200, description: 'Badge details' })
  @ApiResponse({ status: 404, description: 'Badge not found' })
  async getBadgeById(@Param('id', ParseIntPipe) id: number) {
    return this.badgesService.findBadgeById(id);
  }

  @Post('award')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Award badge to user (admin only)' })
  @ApiResponse({ status: 201, description: 'Badge awarded successfully' })
  @ApiResponse({ status: 400, description: 'User already has badge or invalid data' })
  @ApiResponse({ status: 404, description: 'User or badge not found' })
  async awardBadge(@Body() awardBadgeDto: AwardBadgeDto, @Request() req) {
    const { userId, badgeId, reason, metadata, year, expiresAt } = awardBadgeDto;
    const awardedByUserId = req.user.userId;

    return this.badgesService.awardBadge(
      userId,
      badgeId,
      reason,
      awardedByUserId,
      metadata,
      year,
      expiresAt,
    );
  }

  @Delete('user/:userId/badge/:badgeId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke badge from user (admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'badgeId', description: 'Badge ID' })
  @ApiResponse({ status: 200, description: 'Badge revoked successfully' })
  @ApiResponse({ status: 404, description: 'User badge not found' })
  async revokeBadge(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('badgeId', ParseIntPipe) badgeId: number,
    @Body() revokeBadgeDto: RevokeBadgeDto,
    @Request() req,
  ) {
    const { reason } = revokeBadgeDto;
    const revokedByUserId = req.user.userId;

    await this.badgesService.revokeBadge(userId, badgeId, reason, revokedByUserId);
    return { message: 'Badge revoked successfully' };
  }

  @Post('expire-badges')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually trigger badge expiration check (admin only)' })
  @ApiResponse({ status: 200, description: 'Badge expiration completed' })
  async expireBadges() {
    const expiredCount = await this.badgesService.expireUserBadges();
    return { 
      message: 'Badge expiration check completed',
      expiredCount 
    };
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get badge statistics (admin only)' })
  @ApiResponse({ status: 200, description: 'Badge statistics' })
  async getBadgeStatistics() {
    return this.badgesService.getBadgeStatistics();
  }
}