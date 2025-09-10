import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Response,
  Body,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { DiscordAuthGuard } from './guards/discord-auth.guard';
import { DevBypassAuthGuard } from './guards/dev-bypass-auth.guard';
import { ConfigService } from '@nestjs/config';

@ApiTags('auth')
@Controller('auth')
export class AuthDiscordController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({
    summary: 'Login with Discord',
    description: 'Redirects to Discord OAuth2 authorization page',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Discord OAuth2 authorization',
  })
  @Get('discord')
  @UseGuards(DiscordAuthGuard)
  async discordLogin() {
    // This route triggers the Discord OAuth2 flow
    // The actual redirect is handled by Passport
  }

  @Get('discord/callback')
  @UseGuards(DiscordAuthGuard)
  async discordCallback(@Request() req, @Response() res) {
    // Generate JWT token for the authenticated user
    const loginResult = await this.authService.login(req.user);
    
    // Set refresh token as httpOnly cookie before redirecting
    if (loginResult.refresh_token) {
      res.cookie('refreshToken', loginResult.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
    }
    
    // Direct redirect to frontend callback with access token only (refresh token is now in cookie)
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${loginResult.access_token}`;
    
    res.redirect(redirectUrl);
  }

  @ApiOperation({
    summary: 'Development login bypass',
    description: 'Development-only endpoint for bypassing Discord authentication. Only works when NODE_ENV=development.',
  })
  @ApiResponse({
    status: 200,
    description: 'Development login successful',
  })
  @ApiResponse({
    status: 403,
    description: 'Not available in production',
  })
  @Post('dev-login')
  @UseGuards(DevBypassAuthGuard)
  async devLogin(@Request() req, @Response() res, @Body() body: { asAdmin?: boolean }) {
    // This is handled by the DevBypassAuthGuard and strategy
    const loginResult = await this.authService.login(req.user);
    
    // Set refresh token as httpOnly cookie
    if (loginResult.refresh_token) {
      res.cookie('refreshToken', loginResult.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
    }
    
    return res.json(loginResult);
  }

  // Keep legacy refresh endpoint
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Get a new access token using a refresh token',
  })
  @Post('refresh')
  async refresh(@Request() req) {
    // Get refresh token from cookie (matching the main auth controller)
    const refresh = req.cookies?.refreshToken;
    if (!refresh) throw new UnauthorizedException('No refresh token');
    return this.authService.refreshAccessToken(refresh);
  }

  @ApiOperation({
    summary: 'Logout',
    description: 'Clear refresh token and logout user',
  })
  @Post('logout')
  async logout(@Body() body: { refresh_token?: string }) {
    if (body.refresh_token) {
      // Find user by refresh token and clear it
      const user = await this.authService['usersService'].findByRefreshToken(body.refresh_token);
      if (user) {
        await this.authService['usersService'].clearRefreshToken(user.id);
      }
    }
    return { message: 'Logged out successfully' };
  }
}