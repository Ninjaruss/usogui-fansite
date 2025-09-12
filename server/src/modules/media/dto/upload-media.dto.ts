import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import {
  MediaType,
  MediaOwnerType,
  MediaPurpose,
} from '../../../entities/media.entity';
import { Transform } from 'class-transformer';

export class UploadMediaDto {
  @ApiProperty({
    description: 'Type of media content',
    enum: MediaType,
    example: MediaType.IMAGE,
  })
  @IsEnum(MediaType)
  type: MediaType;

  @ApiPropertyOptional({
    description: 'Description of the media content',
    example: 'Character illustration from Chapter 45',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Type of entity this media belongs to',
    enum: MediaOwnerType,
    example: MediaOwnerType.CHARACTER,
  })
  @IsEnum(MediaOwnerType)
  ownerType: MediaOwnerType;

  @ApiProperty({
    description: 'ID of the entity this media belongs to',
    example: 1,
  })
  @Transform(({ value }) => {
    if (!value) return undefined;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
  })
  @IsNumber()
  ownerId: number;

  @ApiPropertyOptional({
    description:
      'Chapter number for chapter-based progression (mainly for characters)',
    example: 45,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
  })
  @IsNumber()
  chapterNumber?: number;

  @ApiPropertyOptional({
    description:
      'Purpose of the media - gallery for user uploads or entity display for official entity images',
    enum: MediaPurpose,
    default: MediaPurpose.GALLERY,
    example: MediaPurpose.GALLERY,
  })
  @IsOptional()
  @IsEnum(MediaPurpose)
  purpose?: MediaPurpose;
}

export class UploadCharacterImageDto {
  @ApiProperty({
    description: 'Character image filename',
    example: 'baku-portrait.jpg',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  fileName: string;
}

export class UploadArcImageDto {
  @ApiProperty({
    description: 'Arc image filename',
    example: 'protoporos-arc-cover.jpg',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  fileName: string;
}
