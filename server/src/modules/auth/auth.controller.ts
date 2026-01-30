import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response, CookieOptions } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { PasswordResetConfirmDto } from './dto/password-reset-confirm.dto';
import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { User } from '../../entities/user.entity';

// Extend Express Request to include user
interface AuthenticatedRequest extends Request {
  user?: User;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get cookie options for refresh token
   * Sets proper domain for cross-subdomain cookie sharing (www.example.com and example.com)
   */
  private getRefreshTokenCookieOptions(): CookieOptions {
    const isProduction = process.env.NODE_ENV === 'production';

    // Do NOT set domain — the cookie will default to the API server's own domain.
    // With sameSite=none + secure, the browser sends it on cross-origin requests.
    const options = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    };

    console.log('[AUTH COOKIE] Cookie options:', JSON.stringify(options));
    return options as CookieOptions;
  }

  @ApiOperation({
    summary: 'Register a new user account',
    description:
      'Creates a new user account and sends an email verification link. The user must verify their email before they can log in.',
  })
  @ApiCreatedResponse({
    description: 'User successfully registered. Verification email sent.',
    schema: {
      example: {
        message:
          'User registered successfully. Please check your email to verify your account.',
        userId: '123e4567-e89b-12d3-a456-426614174000',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or user already exists',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'Email must be a valid email',
          'Password must be at least 8 characters long',
        ],
        error: 'Bad Request',
      },
    },
  })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @ApiOperation({
    summary: 'Login with username and password',
    description:
      'Authenticates a user with username/email and password. Returns a JWT access token for subsequent authenticated requests.',
  })
  @ApiOkResponse({
    description: 'Login successful. Returns access token and user information.',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          username: 'johndoe',
          email: 'john@example.com',
          role: 'user',
          isEmailVerified: true,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or email not verified',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      },
    },
  })
  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(
    @Body() _dto: LoginDto,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const payload = await this.auth.login(req.user as User);
    // Set refresh token as httpOnly cookie
    try {
      if (payload.refresh_token) {
        res.cookie('refreshToken', payload.refresh_token, this.getRefreshTokenCookieOptions());
      }
    } catch {
      // ignore if unable to set cookie
    }
    // Do not return refresh_token in body for security
    const { refresh_token: _refresh, ...safe } = payload;
    return safe;
  }

  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Refresh the JWT access token using the refresh token stored in HTTP-only cookie. Returns a new access token and updated user information.',
  })
  @ApiOkResponse({
    description: 'Token refreshed successfully',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          username: 'johndoe',
          email: 'john@example.com',
          role: 'user',
          isEmailVerified: true,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'No refresh token provided or token is invalid/expired',
    schema: {
      example: {
        statusCode: 401,
        message: 'No refresh token',
        error: 'Unauthorized',
      },
    },
  })
  @Post('refresh')
  async refresh(@Req() req: AuthenticatedRequest) {
    console.log('[AUTH REFRESH] All cookies received:', JSON.stringify(req.cookies));
    console.log('[AUTH REFRESH] Cookie header:', req.headers.cookie);
    console.log('[AUTH REFRESH] Origin:', req.headers.origin);
    console.log('[AUTH REFRESH] Referer:', req.headers.referer);

    const refresh = req.cookies?.refreshToken;
    if (!refresh) {
      console.error('[AUTH REFRESH] No refresh token in cookies');
      throw new UnauthorizedException('No refresh token');
    }
    const payload = await this.auth.refreshAccessToken(refresh);
    // Return access token and canonical user so client can refresh its stored user
    return { access_token: payload.access_token, user: payload.user };
  }

  @ApiOperation({
    summary: 'Logout user',
    description:
      'Logs out the current user by clearing the refresh token cookie and removing the stored refresh token from the database. Can be called with or without authentication.',
  })
  @ApiOkResponse({
    description: 'User logged out successfully',
    schema: {
      example: {
        message: 'Logged out',
      },
    },
  })
  /**
   * SECURITY NOTE: JWT Token Invalidation Limitation
   *
   * Current implementation clears the refresh token but does NOT invalidate
   * the JWT access token. The JWT remains valid until it expires (default: 24h).
   *
   * This means if a JWT is stolen, logout won't help until the token expires.
   *
   * To fully invalidate JWTs on logout, you would need to implement one of:
   * 1. JWT Blacklist: Store invalidated JWTs in Redis until they expire
   * 2. Shorter JWT lifetime: Reduce to 15 minutes and rely on refresh tokens
   * 3. Token versioning: Store a version number per user and check it on each request
   *
   * For now, this is an accepted limitation. The refresh token (which has a
   * longer lifetime) IS properly invalidated.
   */
  @Post('logout')
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      // clear cookie (must use same domain as when cookie was set)
      const cookieOptions = this.getRefreshTokenCookieOptions();
      res.clearCookie('refreshToken', cookieOptions);
      // clear stored refresh token on user if present
      const user = req.user;
      if (user && user.id) {
        await this.auth['usersService'].clearRefreshToken(user.id);
      } else {
        // If no authenticated user (e.g., client called logout without Authorization header),
        // try to clear persisted refresh token by inspecting the refresh cookie value.
        const refresh = req.cookies?.refreshToken;
        if (refresh) {
          try {
            const u =
              await this.auth['usersService'].findByRefreshToken(refresh);
            if (u && u.id)
              await this.auth['usersService'].clearRefreshToken(u.id);
          } catch {
            // ignore lookup errors
          }
        }
      }
    } catch {
      // ignore
    }
    return { message: 'Logged out' };
  }

  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Returns the profile information of the currently authenticated user. Requires a valid JWT token in the Authorization header.',
  })
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'johndoe',
        email: 'john@example.com',
        role: 'user',
        isEmailVerified: true,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'No valid JWT token provided',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: AuthenticatedRequest) {
    // SECURITY: Don't log user data in production - it may contain sensitive info
    // Only log in development for debugging purposes
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('/me request:', req.user?.id, req.user?.username);
      } catch {
        /* ignore */
      }
    }
    return req.user;
  }

  @ApiOperation({
    summary: 'Verify email address',
    description:
      "Verifies a user's email address using the token sent to their email during registration.",
  })
  @ApiQuery({
    name: 'token',
    description: 'Email verification token received in the verification email',
    example: 'abc123def456ghi789jkl012mno345pqr',
  })
  @ApiOkResponse({
    description: 'Email verified successfully',
    schema: {
      example: {
        message: 'Email verified successfully',
        userId: '123e4567-e89b-12d3-a456-426614174000',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid or expired verification token',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid or expired verification token',
        error: 'Bad Request',
      },
    },
  })
  // --- Email verification ---
  @Get('verify-email')
  async verifyEmail(@Query() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto.token);
  }

  @ApiOperation({
    summary: 'Request password reset',
    description:
      'Sends a password reset email to the specified email address if a user account exists.',
  })
  @ApiOkResponse({
    description: 'Password reset email sent (if email exists)',
    schema: {
      example: {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid email format',
    schema: {
      example: {
        statusCode: 400,
        message: ['Email must be a valid email'],
        error: 'Bad Request',
      },
    },
  })
  // --- Password reset request ---
  @Post('password-reset/request')
  async requestPasswordReset(@Body() dto: PasswordResetRequestDto) {
    return this.auth.requestPasswordReset(dto.email);
  }

  @ApiOperation({
    summary: 'Confirm password reset',
    description:
      "Resets the user's password using the token received in the password reset email.",
  })
  @ApiOkResponse({
    description: 'Password reset successfully',
    schema: {
      example: {
        message: 'Password reset successfully',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid or expired reset token, or invalid password format',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid or expired reset token',
        error: 'Bad Request',
      },
    },
  })
  // --- Password reset confirm ---
  @Post('password-reset/confirm')
  async resetPassword(@Body() dto: PasswordResetConfirmDto) {
    return this.auth.resetPassword(dto.token, dto.newPassword);
  }
}
