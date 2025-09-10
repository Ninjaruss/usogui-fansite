import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class DevBypassAuthGuard extends AuthGuard('dev-bypass') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Only allow in development
    if (this.configService.get<string>('NODE_ENV') !== 'development') {
      return false;
    }
    return super.canActivate(context);
  }
}