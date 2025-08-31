import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
} from 'class-validator';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
}

export class CreateMediaDto {
  @ApiProperty({
    description: 'URL of the media content',
    example: 'https://www.youtube.com/watch?v=example',
  })
  @IsNotEmpty()
  @IsUrl()
  @Matches(
    /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|deviantart\.com|pixiv\.net|twitter\.com|instagram\.com)\/.+$/,
    {
      message:
        'URL must be from YouTube, DeviantArt, Pixiv, Twitter, or Instagram',
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

  @ApiPropertyOptional({
    description: 'ID of the arc this media belongs to',
  })
  @IsOptional()
  arcId?: number;

  @ApiPropertyOptional({
    description: 'ID of the character this media belongs to',
  })
  @IsOptional()
  characterId?: number;

  @ApiPropertyOptional({
    description: 'ID of the event this media belongs to',
  })
  @IsOptional()
  eventId?: number;
}
