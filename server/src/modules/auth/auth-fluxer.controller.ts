import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { FluxerAuthGuard } from './guards/fluxer-auth.guard';
import { User } from '../../entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthFluxerController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({
    summary: 'Login with Fluxer',
    description: 'Redirects to Fluxer OAuth2 authorization page',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Fluxer OAuth2 authorization',
  })
  @Get('fluxer')
  @UseGuards(FluxerAuthGuard)
  async fluxerLogin() {
    // This route triggers the Fluxer OAuth2 flow
    // The actual redirect is handled by Passport
  }

  @ApiOperation({
    summary: 'Fluxer OAuth callback',
    description:
      'Handles the callback from Fluxer OAuth2 flow and redirects to frontend with access token',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend with access token',
  })
  @ApiResponse({
    status: 401,
    description: 'Fluxer authentication failed',
  })
  @Get('fluxer/callback')
  @UseGuards(FluxerAuthGuard)
  async fluxerCallback(@Req() req: Request, @Res() res: Response) {
    console.log('[FLUXER CALLBACK] Starting callback');
    // Generate JWT token for the authenticated user
    const loginResult = await this.authService.login(req.user as User);
    console.log(
      '[FLUXER CALLBACK] Login result generated for user:',
      (req.user as User)?.username,
    );

    // Pass BOTH tokens to frontend callback
    // Frontend will call /auth/set-cookie to store refresh token as httpOnly cookie
    // This avoids third-party cookie blocking issues with popup-based OAuth
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${loginResult.access_token}&refreshToken=${loginResult.refresh_token}`;
    console.log('[FLUXER CALLBACK] Redirecting to:', redirectUrl);

    res.redirect(redirectUrl);
  }
}
