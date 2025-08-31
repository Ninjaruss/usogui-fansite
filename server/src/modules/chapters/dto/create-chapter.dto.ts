import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateChapterDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  @ApiProperty({ description: 'Chapter title' })
  title: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @ApiProperty({ description: 'Chapter number' })
  number: number;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  @ApiPropertyOptional({
    description: "Brief summary of the chapter's content",
  })
  summary?: string;

  // series removed
  // (series concept removed)
  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ description: 'ID of the arc this chapter belongs to' })
  arcId?: number;
}
