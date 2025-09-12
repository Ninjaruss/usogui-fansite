import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import {
  MediaType,
  MediaOwnerType,
  MediaPurpose,
} from '../../../entities/media.entity';

export class CreateMediaDto {
  @ApiProperty({
    description: 'URL of the media content',
    example: 'https://www.youtube.com/watch?v=example',
  })
  @IsNotEmpty()
  @IsUrl()
  @Matches(
    /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|tiktok\.com|vm\.tiktok\.com|deviantart\.com|pixiv\.net|twitter\.com|x\.com|instagram\.com|imgur\.com|i\.imgur\.com|soundcloud\.com)\/.+$|^https?:\/\/[\w\-._~:\/?#\[\]@!$&'()*+,;=]+\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|webm|mp3|wav|ogg|flac)$/i,
    {
      message:
        'URL must be from supported platforms (YouTube, TikTok, Instagram, Twitter, DeviantArt, Pixiv, Imgur, SoundCloud) or a direct media file link',
    },
  )
  url: string;

  @ApiProperty({
    description: 'Type of media content',
    enum: MediaType,
    example: MediaType.VIDEO,
  })
  @IsEnum(MediaType, {
    message: 'Type must be either image, video, or audio',
  })
  type: MediaType;

  @ApiPropertyOptional({
    description: 'Description of the media content',
    example: 'Character illustration from Chapter 45',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
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
  @IsNumber()
  ownerId: number;

  @ApiPropertyOptional({
    description:
      'Chapter number for chapter-based progression (mainly for characters)',
    example: 45,
  })
  @IsOptional()
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
