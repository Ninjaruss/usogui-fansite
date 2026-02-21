import {
  Controller,
  Delete,
  Get,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from '../../entities/user.entity';

export const LINK_TOKEN_COOKIE = 'link_token';

@ApiTags('auth')
@Controller('auth/link')
export class AuthLinkController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  private getFrontendUrl(): string {
    return (
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'
    );
  }

  getLinkTokenCookieOptions() {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ('none' as const) : ('lax' as const),
      maxAge: 10 * 60 * 1000, // 10 minutes
      path: '/',
    };
  }

  // --- Link Initiation (reuses existing OAuth callback URLs) ---

  @ApiOperation({ summary: 'Initiate Fluxer account linking' })
  @ApiResponse({ status: 302, description: 'Redirects to Fluxer OAuth' })
  @Get('fluxer/init')
  async fluxerLinkInit(
    @Query('accessToken') accessToken: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!accessToken) {
      throw new UnauthorizedException('Access token required');
    }

    let payload: any;
    try {
      payload = this.jwtService.verify(accessToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    const userId =
      typeof payload.sub === 'string'
        ? parseInt(payload.sub, 10)
        : payload.sub;

    const linkToken = this.authService.generateLinkToken(userId);
    res.cookie(LINK_TOKEN_COOKIE, linkToken, this.getLinkTokenCookieOptions());

    // Redirect to the EXISTING Fluxer OAuth route so the registered callback URL is used
    const apiBase = `${req.protocol}://${req.get('host')}`;
    res.redirect(`${apiBase}/api/auth/fluxer`);
  }

  // --- Unlink ---

  @ApiOperation({ summary: 'Unlink Fluxer from current account' })
  @ApiResponse({ status: 200, description: 'Fluxer unlinked' })
  @Delete('fluxer')
  @UseGuards(JwtAuthGuard)
  async unlinkFluxer(@Req() req: Request) {
    const user = req.user as User;
    await this.authService.unlinkProvider(user.id, 'fluxer');
    return { message: 'Fluxer account unlinked' };
  }
}
