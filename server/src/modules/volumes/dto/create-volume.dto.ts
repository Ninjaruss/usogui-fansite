import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  Min,
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

  // Cover images are now handled polymorphically through the Media entity
  // with ownerType='volume' and ownerId=volume.id
}
