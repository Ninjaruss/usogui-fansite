import { ApiProperty } from '@nestjs/swagger';
import { ProfileImage } from '../../../entities/profile-image.entity';

export class ProfileImageStatsDto {
  @ApiProperty({
    description: 'Profile image details',
    type: () => ProfileImage,
  })
  profileImage: ProfileImage;

  @ApiProperty({
    description: 'Number of users using this profile image',
    example: 10,
  })
  userCount: number;
}

export class CustomizationTotalsDto {
  @ApiProperty({
    description: 'Total users with custom profile images',
    example: 25,
  })
  profileImage: number;

  @ApiProperty({
    description: 'Total users with favorite quotes set',
    example: 18,
  })
  favoriteQuote: number;

  @ApiProperty({
    description: 'Total users with favorite gambles set',
    example: 12,
  })
  favoriteGamble: number;
}

export class ProfileCustomizationStatsDto {
  @ApiProperty({
    description: 'Statistics for profile image usage',
    type: [ProfileImageStatsDto],
  })
  profileImageStats: ProfileImageStatsDto[];

  @ApiProperty({
    description: 'Total counts for each type of customization',
    type: CustomizationTotalsDto,
  })
  totalUsersWithCustomization: CustomizationTotalsDto;
}
