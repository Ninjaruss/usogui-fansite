import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Min,
  IsUrl,
} from 'class-validator';

export class CreateVolumeDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @ApiProperty({
    description: 'Volume number',
    example: 1,
  })
  number: number;

  @IsString()
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  @ApiPropertyOptional({
    description: 'URL to the volume cover image',
    example: 'https://example.com/covers/volume1.jpg',
  })
  coverUrl?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @ApiProperty({
    description: 'First chapter number included in this volume',
    example: 1,
  })
  startChapter: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @ApiProperty({
    description: 'Last chapter number included in this volume',
    example: 10,
  })
  endChapter: number;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  @ApiPropertyOptional({
    description: "Brief description of the volume's content",
  })
  description?: string;

  // (series concept removed)
}
