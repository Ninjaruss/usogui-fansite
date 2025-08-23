import { Body, Controller, Get, Post, Request, UseGuards, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { PasswordResetConfirmDto } from './dto/password-reset-confirm.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @ApiOperation({ 
    summary: 'Register a new user account',
    description: 'Creates a new user account and sends an email verification link. The user must verify their email before they can log in.'
  })
  @ApiCreatedResponse({ 
    description: 'User successfully registered. Verification email sent.',
    schema: {
      example: {
        message: 'User registered successfully. Please check your email to verify your account.',
        userId: '123e4567-e89b-12d3-a456-426614174000'
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid input data or user already exists',
    schema: {
      example: {
        statusCode: 400,
        message: ['Email must be a valid email', 'Password must be at least 8 characters long'],
        error: 'Bad Request'
      }
    }
  })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @ApiOperation({
    summary: 'Login with username and password',
    description: 'Authenticates a user with username/email and password. Returns a JWT access token for subsequent authenticated requests.'
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
          isEmailVerified: true
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or email not verified',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized'
      }
    }
  })
  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(@Body() _dto: LoginDto, @Request() req) {
    return this.auth.login(req.user);
  }

  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns the profile information of the currently authenticated user. Requires a valid JWT token in the Authorization header.'
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
        updatedAt: '2024-01-15T10:30:00Z'
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'No valid JWT token provided',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Request() req) {
    console.log("/me request: " + req.user); // Should print { id, username, email, role }
    return req.user;
  }

  @ApiOperation({
    summary: 'Verify email address',
    description: 'Verifies a user\'s email address using the token sent to their email during registration.'
  })
  @ApiQuery({
    name: 'token',
    description: 'Email verification token received in the verification email',
    example: 'abc123def456ghi789jkl012mno345pqr'
  })
  @ApiOkResponse({
    description: 'Email verified successfully',
    schema: {
      example: {
        message: 'Email verified successfully',
        userId: '123e4567-e89b-12d3-a456-426614174000'
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Invalid or expired verification token',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid or expired verification token',
        error: 'Bad Request'
      }
    }
  })
  // --- Email verification ---
  @Get('verify-email')
  async verifyEmail(@Query() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto.token);
  }

  @ApiOperation({
    summary: 'Request password reset',
    description: 'Sends a password reset email to the specified email address if a user account exists.'
  })
  @ApiOkResponse({
    description: 'Password reset email sent (if email exists)',
    schema: {
      example: {
        message: 'If an account with that email exists, a password reset link has been sent.'
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Invalid email format',
    schema: {
      example: {
        statusCode: 400,
        message: ['Email must be a valid email'],
        error: 'Bad Request'
      }
    }
  })
  // --- Password reset request ---
  @Post('password-reset/request')
  async requestPasswordReset(@Body() dto: PasswordResetRequestDto) {
    return this.auth.requestPasswordReset(dto.email);
  }

  @ApiOperation({
    summary: 'Confirm password reset',
    description: 'Resets the user\'s password using the token received in the password reset email.'
  })
  @ApiOkResponse({
    description: 'Password reset successfully',
    schema: {
      example: {
        message: 'Password reset successfully'
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Invalid or expired reset token, or invalid password format',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid or expired reset token',
        error: 'Bad Request'
      }
    }
  })
  // --- Password reset confirm ---
  @Post('password-reset/confirm')
  async resetPassword(@Body() dto: PasswordResetConfirmDto) {
    return this.auth.resetPassword(dto.token, dto.newPassword);
  }
}
