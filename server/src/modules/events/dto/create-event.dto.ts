import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @ApiProperty({ description: 'Event title' })
  title: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Event description' })
  description?: string;

  @IsNumber()
  @ApiProperty({ description: 'ID of the series this event belongs to' })
  seriesId: number;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ description: 'ID of the arc this event belongs to' })
  arcId?: number;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @ApiPropertyOptional({ 
    description: 'IDs of chapters where this event occurs',
    type: [Number]
  })
  chapterIds?: number[];

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Chapter number where the event starts' })
  startChapter?: number;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Chapter number where the event ends' })
  endChapter?: number;
}
