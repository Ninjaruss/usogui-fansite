import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request, Response, CookieOptions } from 'express';
import { AuthService } from './auth.service';
import { FluxerAuthGuard } from './guards/fluxer-auth.guard';
import { User } from '../../entities/user.entity';
import { LINK_TOKEN_COOKIE } from './auth-link.controller';

@ApiTags('auth')
@Controller('auth')
export class AuthFluxerController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private getLinkTokenCookieOptions(): CookieOptions {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 10 * 60 * 1000,
      path: '/',
    };
  }

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
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    // Guard suppresses exceptions — a null user means authentication failed
    if (!req.user) {
      console.error('[FLUXER CALLBACK] Authentication failed — req.user is null');
      return res.redirect(`${frontendUrl}/login?error=callback_error`);
    }

    try {
      // Check if this is an account-linking flow (link_token cookie present)
      const linkToken = req.cookies?.[LINK_TOKEN_COOKIE];
      if (linkToken) {
        console.log('[FLUXER CALLBACK] Link token found — linking account');
        res.clearCookie(LINK_TOKEN_COOKIE, this.getLinkTokenCookieOptions());

        let userId: number;
        try {
          const payload = this.authService.verifyLinkToken(linkToken);
          userId = payload.sub;
        } catch {
          console.error('[FLUXER CALLBACK] Invalid link token');
          return res.redirect(
            `${frontendUrl}/auth/callback?error=link_token_invalid`,
          );
        }

        try {
          await this.authService.linkFluxerToUser(userId, req.user);
          console.log(`[FLUXER CALLBACK] Linked Fluxer to user ${userId}`);
        } catch (err: any) {
          console.error('[FLUXER CALLBACK] Link failed:', err.message);
          return res.redirect(
            `${frontendUrl}/auth/callback?error=${encodeURIComponent(err.message || 'link_failed')}`,
          );
        }

        return res.redirect(`${frontendUrl}/auth/callback?linked=fluxer`);
      }

      // Normal login flow
      const loginResult = await this.authService.login(req.user as User);
      console.log(
        '[FLUXER CALLBACK] Login result generated for user:',
        (req.user as User)?.username,
      );

      // Pass both tokens in the redirect URL so the frontend can establish the
      // session via a direct POST (cookies set on redirect responses are
      // unreliable across browsers and cross-domain setups).
      const rtParam = loginResult.refresh_token
        ? `&rt=${encodeURIComponent(loginResult.refresh_token)}`
        : '';
      const redirectUrl = `${frontendUrl}/auth/callback?token=${loginResult.access_token}${rtParam}`;
      console.log('[FLUXER CALLBACK] Redirecting to frontend callback');
      res.redirect(redirectUrl);
    } catch (err: any) {
      console.error('[FLUXER CALLBACK] Unexpected error:', err?.message || err);
      return res.redirect(`${frontendUrl}/login?error=callback_error`);
    }
  }
}
