import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { ProfilePictureType } from '../../../entities/user.entity';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'ID of favorite quote from the quote database',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  favoriteQuoteId?: number;

  @ApiPropertyOptional({
    description: 'ID of favorite gamble from the gamble database',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  favoriteGambleId?: number;

  @ApiPropertyOptional({
    description: 'Type of profile picture to use',
    enum: ProfilePictureType,
    example: ProfilePictureType.DISCORD,
  })
  @IsOptional()
  @IsEnum(ProfilePictureType)
  profilePictureType?: ProfilePictureType;

  @ApiPropertyOptional({
    description:
      'ID of the selected character media (when profilePictureType is CHARACTER_MEDIA)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  selectedCharacterMediaId?: number;
}
