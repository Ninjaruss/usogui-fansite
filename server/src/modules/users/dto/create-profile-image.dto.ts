import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  IsArray,
  Min,
} from 'class-validator';

export class CreateProfileImageDto {
  @ApiProperty({
    description: 'Display name for the profile image',
    example: 'Baku Madarame - Confident Smile',
  })
  @IsString()
  displayName: string;

  @ApiProperty({
    description: 'File name/path of the image',
    example: 'baku-madarame-confident-v2.webp',
  })
  @IsString()
  fileName: string;

  @ApiPropertyOptional({
    description: 'Optional description of the image/pose',
    example:
      'Baku with his signature confident expression during a high-stakes gamble',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Character ID this image represents',
    example: 1,
  })
  @IsInt()
  @Min(1)
  characterId: number;

  @ApiPropertyOptional({
    description: 'Whether this image is currently available for selection',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Display order for sorting images',
    example: 1,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Tags for categorizing images',
    example: ['confident', 'smiling', 'formal'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
