import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dtos/create-media.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../../entities/user.entity';

@Controller('media')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @Roles(UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN)
  create(@Body() createMediaDto: CreateMediaDto, @CurrentUser() user: User) {
    return this.mediaService.create(createMediaDto, user);
  }

  @Get()
  findAll() {
    return this.mediaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(+id);
  }

  @Delete(':id')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.mediaService.remove(+id);
  }

  @Get('pending')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  getPendingSubmissions() {
    return this.mediaService.findPending();
  }

  @Put(':id/approve')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  approveSubmission(@Param('id') id: string) {
    return this.mediaService.approveSubmission(+id);
  }

  @Put(':id/reject')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  rejectSubmission(@Param('id') id: string, @Body('reason') reason: string) {
    return this.mediaService.rejectSubmission(+id, reason);
  }
}
