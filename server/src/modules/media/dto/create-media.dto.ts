import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
} from 'class-validator';
import {
  MediaType,
  MediaOwnerType,
  MediaPurpose,
} from '../../../entities/media.entity';

export class CreateMediaDto {
  @ApiProperty({
    description:
      'URL of the media content. Note: Image URLs are not allowed - images must be uploaded via the /media/upload endpoint. Only video and audio URLs are accepted.',
    example: 'https://www.youtube.com/watch?v=example',
  })
  @IsNotEmpty()
  @IsUrl()
  @Matches(
    /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|tiktok\.com|vm\.tiktok\.com|soundcloud\.com)\/.+$|^https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=]+\.(mp4|mov|avi|webm|mp3|wav|ogg|flac)$/i,
    {
      message:
        'URL must be from supported platforms (YouTube, TikTok, SoundCloud) or a direct video/audio file link. Images must be uploaded via /media/upload',
    },
  )
  url: string;

  @ApiPropertyOptional({
    description:
      'Type of media content. If not provided, will be auto-detected from the URL.',
    enum: MediaType,
    example: MediaType.VIDEO,
  })
  @IsOptional()
  @IsEnum(MediaType, {
    message: 'Type must be either image, video, or audio',
  })
  type?: MediaType;

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
