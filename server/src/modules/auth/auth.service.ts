import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../../entities/user.entity';
import { randomBytes } from 'crypto';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  // SECURITY: Test user functionality is strictly for development/testing only
  // Triple-check: must NOT be production AND must be explicitly enabled AND email must match
  private readonly isTestUser = (email: string) =>
    this.configService.get<string>('NODE_ENV') !== 'production' &&
    this.configService.get<string>('ENABLE_TEST_USER') === 'true' &&
    email ===
      this.configService.get<string>('TEST_USER_EMAIL', 'testuser@example.com');

  constructor(
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async validateFluxerUser(profile: any): Promise<User> {
    const {
      id: fluxerId,
      username: fluxerUsername,
      avatar,
      email,
      global_name: displayName,
    } = profile;

    // Check if user already exists
    let user = await this.usersService.findByFluxerId(fluxerId);

    if (!user) {
      // Check if admin Fluxer ID
      const adminFluxerId = this.configService.get<string>('ADMIN_FLUXER_ID');
      const isAdmin = adminFluxerId && fluxerId === adminFluxerId;

      // Use Fluxer display name if available, fall back to username
      const siteUsername = (displayName || fluxerUsername).replace('#', '_');

      user = await this.usersService.createFluxerUser({
        fluxerId,
        fluxerUsername,
        fluxerAvatar: avatar || null, // Store hash only, URL constructed on frontend
        username: siteUsername,
        email: email || null,
        role: isAdmin ? UserRole.ADMIN : UserRole.USER,
      });
    } else {
      // Update existing user's Fluxer info (store hash only)
      await this.usersService.updateFluxerInfo(user.id, {
        fluxerUsername,
        fluxerAvatar: avatar || null,
      });
    }

    return user;
  }

  // --- Development Bypass ---
  async validateDevBypass(asAdmin: boolean = false): Promise<User> {
    const nodeEnv = this.configService.get<string>('NODE_ENV');

    // SECURITY: Defense-in-depth - final check before creating user
    // This should never be reached in production if guard and strategy work correctly
    if (nodeEnv !== 'development') {
      throw new ForbiddenException(
        'Development bypass only available in development',
      );
    }

    // SECURITY: Verify that DEV_BYPASS_SECRET is configured
    // This ensures the feature can't work even in development without explicit configuration
    const devBypassSecret = this.configService.get<string>('DEV_BYPASS_SECRET');
    if (!devBypassSecret) {
      throw new ForbiddenException('Development bypass not configured');
    }

    // Use different dev users for admin vs regular user
    const devFluxerId = asAdmin ? 'dev-admin-12345' : 'dev-user-12345';
    const username = asAdmin ? 'dev_admin' : 'dev_user';
    const fluxerUsername = asAdmin ? 'DevAdmin' : 'DevUser';

    let user = await this.usersService.findByFluxerId(devFluxerId);

    if (!user) {
      user = await this.usersService.createFluxerUser({
        fluxerId: devFluxerId,
        fluxerUsername: fluxerUsername,
        fluxerAvatar: null,
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
      if (
        user.username !== username ||
        user.email !== (asAdmin ? 'dev-admin@localhost' : 'dev-user@localhost')
      ) {
        await this.usersService.update(user.id, {
          username: username,
          email: asAdmin ? 'dev-admin@localhost' : 'dev-user@localhost',
          fluxerUsername: fluxerUsername,
        });
        user.username = username;
        user.email = asAdmin ? 'dev-admin@localhost' : 'dev-user@localhost';
        user.fluxerUsername = fluxerUsername;
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
        fluxerId: user.fluxerId,
        fluxerUsername: user.fluxerUsername,
        fluxerAvatar: user.fluxerAvatar,
      },
    };
  }

  // Refresh access token using a stored refresh token
  async refreshAccessToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const user = await this.usersService.findByRefreshToken(refreshToken);

    if (!user) throw new UnauthorizedException('Invalid refresh token');

    const access_token = this.signToken(user);
    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fluxerId: user.fluxerId,
        fluxerUsername: user.fluxerUsername,
        fluxerAvatar: user.fluxerAvatar,
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

  // --- Account Linking ---

  generateLinkToken(userId: number): string {
    return this.jwt.sign(
      { sub: userId, purpose: 'link' },
      { expiresIn: '10m' },
    );
  }

  verifyLinkToken(token: string): { sub: number; purpose: string } {
    try {
      return this.jwt.verify(token) as { sub: number; purpose: string };
    } catch {
      throw new UnauthorizedException('Invalid or expired link token');
    }
  }

  async linkFluxerToUser(userId: number, fluxerUser: any): Promise<void> {
    // The Fluxer strategy returns a User entity (from validateFluxerUser),
    // not a raw Fluxer profile. Extract the provider-specific fields.
    const fluxerId = fluxerUser.fluxerId;
    const fluxerUsername = fluxerUser.fluxerUsername;
    const fluxerAvatar = fluxerUser.fluxerAvatar;

    if (!fluxerId) {
      throw new ForbiddenException('Fluxer profile data is missing');
    }

    // Check if this Fluxer account is already linked to another user
    const existingUser = await this.usersService.findByFluxerId(fluxerId);
    if (existingUser && existingUser.id !== userId) {
      // validateFluxerUser may have created a duplicate user — clean it up
      // if it's a freshly-created shell account (not the target user)
      if (existingUser.id === fluxerUser.id) {
        await this.usersService.remove(existingUser.id);
      } else {
        throw new ForbiddenException(
          'This Fluxer account is already linked to another user',
        );
      }
    }

    await this.usersService.linkFluxer(userId, {
      fluxerId,
      fluxerUsername,
      fluxerAvatar: fluxerAvatar || null,
    });
  }

  async unlinkProvider(
    userId: number,
    provider: 'fluxer',
  ): Promise<void> {
    const hasOther = await this.usersService.hasOtherAuthMethod(
      userId,
      provider,
    );
    if (!hasOther) {
      throw new ForbiddenException(
        'Cannot unlink your only authentication method',
      );
    }

    await this.usersService.unlinkFluxer(userId);
  }
}
