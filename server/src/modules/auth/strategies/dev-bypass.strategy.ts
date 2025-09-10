import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { User } from '../../../entities/user.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DevBypassStrategy extends PassportStrategy(Strategy, 'dev-bypass') {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async validate(req: Request): Promise<User> {
    // Only allow in development
    if (this.configService.get<string>('NODE_ENV') !== 'development') {
      throw new Error('Development bypass only available in development environment');
    }

    const isAdmin = req.body?.asAdmin === true;
    
    return await this.authService.validateDevBypass(isAdmin);
  }
}