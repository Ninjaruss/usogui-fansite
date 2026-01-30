import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Res,
  Body,
} from '@nestjs/common';
import type { Request, Response, CookieOptions } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { DiscordAuthGuard } from './guards/discord-auth.guard';
import { DevBypassAuthGuard } from './guards/dev-bypass-auth.guard';
import { ConfigService } from '@nestjs/config';
import { User } from '../../entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthDiscordController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get cookie options for refresh token
   * Sets proper domain for cross-subdomain cookie sharing (www.example.com and example.com)
   */
  private getRefreshTokenCookieOptions(): CookieOptions {
    const isProduction = process.env.NODE_ENV === 'production';

    // In production, extract root domain for cross-subdomain cookies
    // e.g., "www.l-file.com" -> ".l-file.com" (works for both www and non-www)
    let domain: string | undefined;
    if (isProduction) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      console.log('[DISCORD COOKIE] FRONTEND_URL:', frontendUrl);
      if (frontendUrl) {
        try {
          const url = new URL(frontendUrl);
          const hostname = url.hostname;
          // Extract root domain (e.g., "www.l-file.com" -> "l-file.com")
          const parts = hostname.split('.');
          if (parts.length >= 2) {
            // Get last two parts (domain.tld)
            domain = '.' + parts.slice(-2).join('.');
          }
          console.log('[DISCORD COOKIE] Setting cookie domain:', domain);
        } catch (error) {
          console.error('[AUTH] Failed to parse FRONTEND_URL for cookie domain:', error);
        }
      }
    }

    const options = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      ...(domain && { domain }), // Only set domain if we have one
    };

    console.log('[DISCORD COOKIE] Cookie options:', JSON.stringify(options));
    return options as CookieOptions;
  }

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

  @ApiOperation({
    summary: 'Discord OAuth callback',
    description:
      'Handles the callback from Discord OAuth2 flow and redirects to frontend with access token',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend with access token',
  })
  @ApiResponse({
    status: 401,
    description: 'Discord authentication failed',
  })
  @Get('discord/callback')
  @UseGuards(DiscordAuthGuard)
  async discordCallback(@Req() req: Request, @Res() res: Response) {
    console.log('[DISCORD CALLBACK] Starting callback');
    // Generate JWT token for the authenticated user
    const loginResult = await this.authService.login(req.user as User);
    console.log('[DISCORD CALLBACK] Login result generated for user:', (req.user as User)?.username);

    // Set refresh token as httpOnly cookie before redirecting
    if (loginResult.refresh_token) {
      console.log('[DISCORD CALLBACK] Setting refresh token cookie');
      res.cookie('refreshToken', loginResult.refresh_token, this.getRefreshTokenCookieOptions());
      console.log('[DISCORD CALLBACK] Cookie set successfully');
    }

    // Direct redirect to frontend callback with access token only (refresh token is now in cookie)
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${loginResult.access_token}`;
    console.log('[DISCORD CALLBACK] Redirecting to:', redirectUrl);

    res.redirect(redirectUrl);
  }

  @ApiOperation({
    summary: 'Development login bypass',
    description:
      'Development-only endpoint for bypassing Discord authentication. Only works when NODE_ENV=development.',
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
  async devLogin(
    @Req() req: Request,
    @Res() res: Response,
    @Body() _body: { asAdmin?: boolean },
  ) {
    // This is handled by the DevBypassAuthGuard and strategy
    const loginResult = await this.authService.login(req.user as User);

    // Set refresh token as httpOnly cookie
    if (loginResult.refresh_token) {
      res.cookie('refreshToken', loginResult.refresh_token, this.getRefreshTokenCookieOptions());
    }

    return res.json(loginResult);
  }
}
