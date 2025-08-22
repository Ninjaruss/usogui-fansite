import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional } from 'class-validator';

export class CreateCharacterDto {
  @ApiProperty({ description: 'Character\'s primary name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Alternative names or aliases' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  alternateNames?: string[];

  @ApiPropertyOptional({ description: 'Character description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'First chapter appearance number' })
  @IsNumber()
  @IsOptional()
  firstAppearanceChapter?: number;

  @ApiPropertyOptional({ description: 'Character\'s roles' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  notableRoles?: string[];

  @ApiPropertyOptional({ description: 'Series ID the character belongs to' })
  @IsNumber()
  @IsOptional()
  seriesId?: number;
}
