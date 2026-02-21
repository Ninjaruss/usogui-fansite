import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { AuthService } from '../auth.service';
import { User } from '../../../entities/user.entity';

@Injectable()
export class FluxerStrategy extends PassportStrategy(Strategy, 'fluxer') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      authorizationURL: 'https://web.fluxer.app/oauth2/authorize',
      tokenURL: 'https://api.fluxer.app/v1/oauth2/token',
      clientID: configService.get<string>('FLUXER_CLIENT_ID')!,
      clientSecret: configService.get<string>('FLUXER_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('FLUXER_CALLBACK_URL')!,
      scope: 'identify email',
      // Disable state verification — this app uses JWT (no sessions),
      // and passport-oauth2 state requires session middleware.
      // The OAuth flow is still protected by redirect URI validation on Fluxer's side.
      state: false,
    });
  }

  async validate(accessToken: string, _refreshToken: string): Promise<User> {
    console.log('[FLUXER STRATEGY] validate() called, fetching user profile...');
    // Fetch user profile from Fluxer OAuth2 API
    const response = await fetch('https://api.fluxer.app/v1/oauth2/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '(unreadable)');
      console.error(
        `[FLUXER STRATEGY] Failed to fetch profile: ${response.status} ${response.statusText}`,
        body,
      );
      throw new Error(
        `Failed to fetch Fluxer user profile: ${response.status}`,
      );
    }

    const data = await response.json();
    console.log('[FLUXER STRATEGY] Profile response keys:', Object.keys(data));
    // The oauth2/@me endpoint wraps user info in a .user property
    const profile = data.user;
    if (!profile) {
      console.error('[FLUXER STRATEGY] No .user in response:', JSON.stringify(data).substring(0, 500));
      throw new Error('Fluxer profile response missing user data');
    }
    console.log('[FLUXER STRATEGY] Got profile for:', profile.username, 'id:', profile.id);
    return await this.authService.validateFluxerUser(profile);
  }
}
