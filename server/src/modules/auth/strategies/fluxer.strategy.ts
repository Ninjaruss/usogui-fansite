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
      authorizationURL: 'https://fluxer.app/oauth2/authorize',
      tokenURL: 'https://api.fluxer.app/v1/oauth2/token',
      clientID: configService.get<string>('FLUXER_CLIENT_ID')!,
      clientSecret: configService.get<string>('FLUXER_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('FLUXER_CALLBACK_URL')!,
      scope: 'identify email',
    });
  }

  async validate(accessToken: string, refreshToken: string): Promise<User> {
    // Fetch user profile from Fluxer API using the access token
    const response = await fetch('https://api.fluxer.app/v1/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch Fluxer user profile: ${response.status}`,
      );
    }

    const profile = await response.json();
    return await this.authService.validateFluxerUser(profile);
  }
}
