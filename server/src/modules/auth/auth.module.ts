import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthDiscordController } from './auth-discord.controller';
import { AuthLegacyController } from './legacy/auth-legacy.controller';
import { UsersModule } from '../users/users.module';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { DiscordStrategy } from './strategies/discord.strategy';
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
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES') || '7d' },
      }),
    }),
    ConfigModule,
    EmailModule,
  ],
  controllers: [AuthController, AuthDiscordController, AuthLegacyController],
  providers: [
    AuthService, 
    LocalStrategy, 
    JwtStrategy,
    DiscordStrategy,
    DevBypassStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
