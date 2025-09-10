import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../../entities/user.entity';
import { randomBytes } from 'crypto';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly isTestUser = (email: string) =>
    email === 'testuser@example.com';

  constructor(
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  // --- Discord Authentication ---
  async validateDiscordUser(profile: any): Promise<User> {
    const { id: discordId, username: discordUsername, avatar, email } = profile;
    
    // Check if user already exists
    let user = await this.usersService.findByDiscordId(discordId);
    
    if (!user) {
      // Auto-register new Discord user
      const avatarUrl = avatar 
        ? `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png`
        : null;
      
      // Check if admin Discord ID
      const adminDiscordId = this.configService.get<string>('ADMIN_DISCORD_ID');
      const isAdmin = adminDiscordId && discordId === adminDiscordId;
      
      user = await this.usersService.createDiscordUser({
        discordId,
        discordUsername,
        discordAvatar: avatarUrl,
        username: discordUsername.replace('#', '_'), // Make username safe
        email: email || null,
        role: isAdmin ? UserRole.ADMIN : UserRole.USER,
      });
    } else {
      // Update existing user's Discord info
      await this.usersService.updateDiscordInfo(user.id, {
        discordUsername,
        discordAvatar: profile.avatar 
          ? `https://cdn.discordapp.com/avatars/${discordId}/${profile.avatar}.png`
          : null,
      });
    }

    return user;
  }

  // --- Development Bypass ---
  async validateDevBypass(asAdmin: boolean = false): Promise<User> {
    if (this.configService.get<string>('NODE_ENV') !== 'development') {
      throw new Error('Development bypass only available in development');
    }

    // Use different dev users for admin vs regular user
    const devUserId = asAdmin ? 'dev-admin-12345' : 'dev-user-12345';
    const username = asAdmin ? 'dev_admin' : 'dev_user';
    const discordUsername = asAdmin ? 'DevAdmin#0000' : 'DevUser#0000';
    
    let user = await this.usersService.findByDiscordId(devUserId);
    
    if (!user) {
      user = await this.usersService.createDiscordUser({
        discordId: devUserId,
        discordUsername: discordUsername,
        discordAvatar: null,
        username: username,
        email: asAdmin ? 'dev-admin@localhost' : 'dev-user@localhost',
        role: asAdmin ? UserRole.ADMIN : UserRole.USER,
      });
    } else {
      // Update existing user to ensure correct role and details
      if (asAdmin && user.role !== UserRole.ADMIN) {
        await this.usersService.updateRole(user.id, UserRole.ADMIN);
        user.role = UserRole.ADMIN;
      } else if (!asAdmin && user.role !== UserRole.USER) {
        await this.usersService.updateRole(user.id, UserRole.USER);
        user.role = UserRole.USER;
      }
      
      // Update username and email to match the current request
      if (user.username !== username || user.email !== (asAdmin ? 'dev-admin@localhost' : 'dev-user@localhost')) {
        await this.usersService.update(user.id, {
          username: username,
          email: asAdmin ? 'dev-admin@localhost' : 'dev-user@localhost',
          discordUsername: discordUsername,
        });
        user.username = username;
        user.email = asAdmin ? 'dev-admin@localhost' : 'dev-user@localhost';
        user.discordUsername = discordUsername;
      }
    }

    return user;
  }

  // --- Legacy Authentication (keep for reference) ---
  async validateUser(username: string, password: string): Promise<User | null> {
    // Allow login by username or email
    let user = await this.usersService.findByUsername(username);
    if (!user) {
      // if the provided identifier looks like an email, or username lookup failed, try email lookup
      user = await this.usersService.findByEmail(username);
    }
    if (!user) return null;
    const ok = await this.usersService.validatePassword(user, password);
    if (!ok) return null;

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Email not verified');
    }

    return user;
  }

  // --- JWT token ---
  signToken(user: User) {
    const payload = { sub: user.id, username: user.username, role: user.role };
    return this.jwt.sign(payload);
  }

  async login(user: User) {
    const access_token = this.signToken(user);
    // create a refresh token (random) and persist it
    const refreshToken = randomBytes(48).toString('hex');
    await this.usersService.setRefreshToken(user.id, refreshToken);
    return {
      access_token,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        discordId: user.discordId,
        discordUsername: user.discordUsername,
        discordAvatar: user.discordAvatar,
      },
    };
  }

  // Refresh access token using a stored refresh token
  async refreshAccessToken(refreshToken: string) {
    console.log('refreshAccessToken called with token:', refreshToken);
    console.log('refreshToken type:', typeof refreshToken);
    console.log('refreshToken length:', refreshToken?.length);
    console.log('refreshToken truthy:', !!refreshToken);
    
    if (!refreshToken) {
      console.log('No refresh token provided, throwing error');
      throw new UnauthorizedException('No refresh token provided');
    }
    
    console.log('Looking for user with refresh token...');
    const user = await this.usersService.findByRefreshToken(refreshToken);
    console.log('User found:', !!user);
    
    if (!user) throw new UnauthorizedException('Invalid refresh token');
    
    const access_token = this.signToken(user);
    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        discordId: user.discordId,
        discordUsername: user.discordUsername,
        discordAvatar: user.discordAvatar,
      },
    };
  }

  // --- Legacy Registration (keep for reference) ---
  async register(data: { username: string; email: string; password: string }) {
    const user = await this.usersService.create(data);
    const token = await this.usersService.generateEmailVerificationToken(
      user.id,
    );

    // For test user, return token directly instead of sending email
    if (this.isTestUser(data.email)) {
      return {
        message:
          'Registration successful. Test user - use this token to verify email.',
        token,
      };
    }

    await this.emailService.sendEmailVerification(data.email, token);
    return {
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }

  // --- Legacy Email Verification (keep for reference) ---
  async verifyEmail(token: string) {
    await this.usersService.verifyEmail(token);
    return { message: 'Email successfully verified' };
  }

  // --- Legacy Password Reset (keep for reference) ---
  async requestPasswordReset(email: string) {
    const token = await this.usersService.generatePasswordReset(email);

    // For test user, return token directly instead of sending email
    if (this.isTestUser(email)) {
      return {
        message:
          'Password reset request received. Test user - use this token to reset password.',
        token,
      };
    }

    await this.emailService.sendPasswordReset(email, token);
    return {
      message:
        'If an account exists with this email, a password reset link has been sent.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    await this.usersService.resetPassword(token, newPassword);
    return { message: 'Password successfully reset' };
  }
}
