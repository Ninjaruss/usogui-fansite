import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsEnum, ValidateIf } from 'class-validator';
import { ProfilePictureType } from '../../../entities/user.entity';

export class UpdateProfileDto {
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
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o) => o.selectedCharacterMediaId !== null)
  @IsInt()
  @Min(1)
  selectedCharacterMediaId?: number | null;
}
