import { IsNumber, IsOptional, IsString, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AwardBadgeDto {
  @ApiProperty({
    description: 'ID of the user to award the badge to',
    example: 1,
  })
  @IsNumber()
  userId: number;

  @ApiProperty({
    description: 'ID of the badge to award',
    example: 1,
  })
  @IsNumber()
  badgeId: number;

  @ApiPropertyOptional({
    description: 'Reason for awarding the badge',
    example: 'Outstanding contribution to the community',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Year for supporter badges',
    example: 2024,
  })
  @IsOptional()
  @IsNumber()
  year?: number;

  @ApiPropertyOptional({
    description: 'Expiration date for the badge (ISO string). Note: Active Supporter badges automatically expire after 1 year regardless of this value.',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata (JSON object)',
    example: { event: 'community_contest_winner' },
  })
  @IsOptional()
  metadata?: any;
}

export class RevokeBadgeDto {
  @ApiProperty({
    description: 'Reason for revoking the badge',
    example: 'Policy violation',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class UpdateCustomRoleDto {
  @ApiProperty({
    description: 'Custom cosmetic role to display alongside username',
    example: 'Usogui Superfan',
    maxLength: 50,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  customRole: string | null;
}