import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsInt,
  IsString,
  Min,
  MinLength,
  MaxLength,
  Matches,
  IsEnum,
  ValidateIf,
  IsUUID,
} from 'class-validator';
import { ProfilePictureType } from '../../../entities/user.entity';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Username to display on the site',
    example: 'UsogulFan42',
    minLength: 3,
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Username can only contain letters, numbers, underscores, and hyphens',
  })
  username?: string;

  @ApiPropertyOptional({
    description: 'ID of favorite quote from the quote database',
    example: 1,
    minimum: 1,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o) => o.favoriteQuoteId !== null)
  @IsInt()
  @Min(1)
  favoriteQuoteId?: number | null;

  @ApiPropertyOptional({
    description: 'ID of favorite gamble from the gamble database',
    example: 1,
    minimum: 1,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o) => o.favoriteGambleId !== null)
  @IsInt()
  @Min(1)
  favoriteGambleId?: number | null;

  @ApiPropertyOptional({
    description: 'Type of profile picture to use',
    enum: ProfilePictureType,
    example: ProfilePictureType.FLUXER,
  })
  @IsOptional()
  @IsEnum(ProfilePictureType)
  profilePictureType?: ProfilePictureType;

  @ApiPropertyOptional({
    description:
      'ID of the selected character media (when profilePictureType is CHARACTER_MEDIA)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o) => o.selectedCharacterMediaId !== null)
  @IsUUID()
  selectedCharacterMediaId?: string | null;
}
