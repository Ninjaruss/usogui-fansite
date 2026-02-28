import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { UserRole } from '../../../entities/user.entity';

/**
 * DTO for admin user updates. Only whitelisted safe fields are allowed.
 * Sensitive fields like password, tokens, and OAuth provider IDs are excluded.
 */
export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Username',
    example: 'john_doe_updated',
    minLength: 3,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'john.updated@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: UserRole,
    example: UserRole.MODERATOR,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Email verification status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Favorite quote ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  favoriteQuoteId?: number | null;

  @ApiPropertyOptional({
    description: 'Favorite gamble ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  favoriteGambleId?: number | null;

  @ApiPropertyOptional({
    description: 'Custom role title displayed on profile',
    example: 'Community Leader',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  customRole?: string | null;
}
