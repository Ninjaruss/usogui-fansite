import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../../entities/user.entity';
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

  // --- Validate login ---
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
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    };
  }

  // Refresh access token using a stored refresh token
  async refreshAccessToken(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('No refresh token provided');
    const user = await this.usersService.findByRefreshToken(refreshToken);
    if (!user) throw new UnauthorizedException('Invalid refresh token');
    const access_token = this.signToken(user);
    return { access_token, user: { id: user.id, username: user.username, email: user.email, role: user.role } };
  }

  // --- Registration ---
  async register(data: { username: string; email: string; password: string }) {
    const user = await this.usersService.create(data);
    const token = await this.usersService.generateEmailVerificationToken(user.id);

    // For test user, return token directly instead of sending email
    if (this.isTestUser(data.email)) {
      return { 
        message: 'Registration successful. Test user - use this token to verify email.',
        token 
      };
    }

    await this.emailService.sendEmailVerification(data.email, token);
    return { message: 'Registration successful. Please check your email to verify your account.' };
  }

  // --- Verify email ---
  async verifyEmail(token: string) {
    await this.usersService.verifyEmail(token);
    return { message: 'Email successfully verified' };
  }

  // --- Password reset ---
  async requestPasswordReset(email: string) {
    const token = await this.usersService.generatePasswordReset(email);

    // For test user, return token directly instead of sending email
    if (this.isTestUser(email)) {
      return { 
        message: 'Password reset request received. Test user - use this token to reset password.',
        token 
      };
    }

    await this.emailService.sendPasswordReset(email, token);
    return { message: 'If an account exists with this email, a password reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    await this.usersService.resetPassword(token, newPassword);
    return { message: 'Password successfully reset' };
  }
}
