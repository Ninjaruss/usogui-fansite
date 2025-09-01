import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { MediaType } from '../../../entities/media.entity';
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

  @ApiPropertyOptional({
    description: 'ID of the character this media belongs to',
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  @IsNumber()
  characterId?: number;

  @ApiPropertyOptional({
    description: 'ID of the arc this media belongs to',
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  @IsNumber()
  arcId?: number;

  @ApiPropertyOptional({
    description: 'ID of the event this media belongs to',
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  @IsNumber()
  eventId?: number;
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