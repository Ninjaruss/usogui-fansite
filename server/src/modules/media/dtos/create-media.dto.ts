import { IsString, IsOptional, IsUrl, IsEnum, IsNumber, IsNotEmpty } from 'class-validator';
import { IsMediaUrl } from '../validators/media-url.validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMediaDto {
  @ApiProperty({
    description: 'URL of the media content. For videos, must be from YouTube. For images, must be from DeviantArt, Pixiv, Twitter, or Instagram.',
    example: 'https://www.youtube.com/watch?v=example'
  })
  @IsNotEmpty()
  @IsUrl()
  @IsMediaUrl()
  url: string;

  @ApiProperty({
    description: 'Type of media content',
    enum: ['image', 'video', 'audio'],
    example: 'video'
  })
  @IsNotEmpty()
  @IsEnum(['image', 'video', 'audio'])
  type: string;

  @ApiPropertyOptional({
    description: 'Description of the media content',
    example: 'Fan art of Baku vs Marco'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'ID of the related story arc',
    example: 1
  })
  @IsOptional()
  @IsNumber()
  arcId?: number;

  @ApiPropertyOptional({
    description: 'ID of the related character',
    example: 1
  })
  @IsOptional()
  @IsNumber()
  characterId?: number;

  @ApiPropertyOptional({
    description: 'ID of the related event',
    example: 1
  })
  @IsOptional()
  @IsNumber()
  eventId?: number;
}
