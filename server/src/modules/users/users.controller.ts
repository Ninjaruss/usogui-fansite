import { Controller, Get, Param, Post, Body, Put, Delete, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '../../entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  getAll(): Promise<User[]> {
    return this.service.findAll();
  }

  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() data: { username: string; email: string; password: string }): Promise<User> {
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: Partial<User>): Promise<User> {
    return this.service.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.service.remove(id);
  }

  // --- Password reset endpoints ---
  @Post('password-reset/request')
  requestPasswordReset(@Body('email') email: string) {
    return this.service.generatePasswordReset(email);
  }

  @Post('password-reset/confirm')
  resetPassword(@Body('token') token: string, @Body('newPassword') newPassword: string) {
    return this.service.resetPassword(token, newPassword);
  }

  // --- Email verification endpoint ---
  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.service.verifyEmail(token);
  }
}
