import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { User } from '../../../entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any): Promise<Partial<User>> {
    const user = await this.usersService.getUserProfile(payload.sub);
    // Return all safe fields including profile preferences and selected character media
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      customRole: user.customRole,
      isEmailVerified: user.isEmailVerified,
      userProgress: user.userProgress,
      profilePictureType: user.profilePictureType,
      selectedCharacterMediaId: user.selectedCharacterMediaId,
      selectedCharacterMedia: user.selectedCharacterMedia,
      favoriteQuoteId: user.favoriteQuoteId,
      favoriteGambleId: user.favoriteGambleId,
      createdAt: user.createdAt,
      // Discord fields
      discordId: user.discordId,
      discordUsername: user.discordUsername,
      discordAvatar: user.discordAvatar,
    };
  }
}
