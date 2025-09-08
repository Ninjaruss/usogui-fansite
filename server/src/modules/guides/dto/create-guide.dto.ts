import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsArray,
  IsOptional,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { GuideStatus } from '../../../entities/guide.entity';

export class CreateGuideDto {
  @ApiProperty({
    description: 'Title of the guide',
    example: 'Mastering Poker Strategy in Usogui',
    minLength: 5,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Brief description or summary of the guide',
    example:
      'A comprehensive guide to understanding poker strategies used in the manga',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  description: string;

  @ApiProperty({
    description: 'Main content of the guide in markdown format',
    example:
      '# Introduction\n\nThis guide covers the various poker strategies...',
    minLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(50)
  content: string;

  @ApiPropertyOptional({
    description: 'Status of the guide (defaults to pending for approval)',
    enum: GuideStatus,
    example: GuideStatus.PENDING,
    default: GuideStatus.PENDING,
  })
  @IsEnum(GuideStatus)
  @IsOptional()
  status?: GuideStatus;

  @ApiPropertyOptional({
    description: 'Tag names to associate with this guide',
    example: ['poker', 'strategy', 'gambling'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @MaxLength(50, { each: true })
  tagNames?: string[];

  @ApiPropertyOptional({
    description: 'Character IDs to associate with this guide',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  characterIds?: number[];

  @ApiPropertyOptional({
    description: 'Arc ID to associate with this guide',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  arcId?: number;

  @ApiPropertyOptional({
    description: 'Gamble IDs to associate with this guide',
    example: [1, 2],
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  gambleIds?: number[];
}
