import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthFluxerController } from './auth-fluxer.controller';
import { AuthLinkController } from './auth-link.controller';
import { UsersModule } from '../users/users.module';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { FluxerStrategy } from './strategies/fluxer.strategy';
import { DevBypassStrategy } from './strategies/dev-bypass.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const jwtExpires = config.get('JWT_EXPIRES') || '7d';
        return {
          secret: config.get<string>('JWT_SECRET'),
          signOptions: { expiresIn: jwtExpires },
        };
      },
    }),
    ConfigModule,
    EmailModule,
  ],
  controllers: [AuthController, AuthFluxerController, AuthLinkController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    FluxerStrategy,
    DevBypassStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
