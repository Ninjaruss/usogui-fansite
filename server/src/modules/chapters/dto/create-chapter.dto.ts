import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateChapterDto {
  @IsString()
  @ApiProperty({ description: 'Chapter title' })
  title: string;

  @IsNumber()
  @ApiProperty({ description: 'Chapter number' })
  number: number;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Chapter description or summary' })
  description?: string;

  @IsNumber()
  @ApiProperty({ description: 'ID of the series this chapter belongs to' })
  seriesId: number;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ description: 'ID of the arc this chapter belongs to' })
  arcId?: number;
}
