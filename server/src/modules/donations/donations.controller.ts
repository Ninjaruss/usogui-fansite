import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Patch,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { DonationsService } from './donations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { KofiWebhookDto } from '../badges/dto/kofi-webhook.dto';

@ApiTags('donations')
@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post('webhook/kofi')
  @ApiOperation({ summary: 'Ko-fi webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook data' })
  async handleKofiWebhook(@Body() webhookData: KofiWebhookDto) {
    return this.donationsService.processKofiWebhook(webhookData);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all donations (admin only)' })
  @ApiResponse({ status: 200, description: 'List of all donations' })
  async getAllDonations() {
    return this.donationsService.findAllDonations();
  }

  @Get('top-donors')
  @ApiOperation({ summary: 'Get top donors leaderboard' })
  @ApiResponse({ status: 200, description: 'List of top donors' })
  async getTopDonors() {
    return this.donationsService.getTopDonors();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get donation by ID (admin only)' })
  @ApiParam({ name: 'id', description: 'Donation ID' })
  @ApiResponse({ status: 200, description: 'Donation details' })
  @ApiResponse({ status: 404, description: 'Donation not found' })
  async getDonationById(@Param('id', ParseIntPipe) id: number) {
    return this.donationsService.findDonationById(id);
  }

  @Patch(':id/assign/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign pending donation to user (admin only)' })
  @ApiParam({ name: 'id', description: 'Donation ID' })
  @ApiParam({ name: 'userId', description: 'User ID to assign donation to' })
  @ApiResponse({ status: 200, description: 'Donation assigned successfully' })
  @ApiResponse({ status: 404, description: 'Donation or user not found' })
  async assignDonationToUser(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.donationsService.assignDonationToUser(id, userId);
  }
}
