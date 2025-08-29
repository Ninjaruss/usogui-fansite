import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, MinLength, MaxLength, Min, IsUrl } from 'class-validator';

export class UpdateVolumeDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  @ApiPropertyOptional({ 
  description: 'Volume number',
    example: 1
  })
  number?: number;

  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(200)
  @ApiPropertyOptional({ 
    description: 'Title of the volume',
    example: 'The Beginning'
  })
  title?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  @ApiPropertyOptional({ 
    description: 'URL to the volume cover image',
    example: 'https://example.com/covers/volume1.jpg'
  })
  coverUrl?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @ApiPropertyOptional({ 
    description: 'First chapter number included in this volume',
    example: 1
  })
  startChapter?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @ApiPropertyOptional({ 
    description: 'Last chapter number included in this volume',
    example: 10
  })
  endChapter?: number;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  @ApiPropertyOptional({ 
    description: 'Brief description of the volume\'s content',
    example: 'The first volume introducing the main characters and setting'
  })
  description?: string;

  // related collection id removed
}
