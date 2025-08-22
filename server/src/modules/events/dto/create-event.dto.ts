import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, IsNotEmpty, MinLength, MaxLength, Min, ArrayMaxSize, ValidateIf } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  @ApiProperty({ 
    description: 'Event title',
    example: 'The 17 Steps Tournament'
  })
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(5000)
  @ApiProperty({ 
    description: 'Event description',
    example: 'A high-stakes tournament where participants must climb 17 steps...'
  })
  description: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @ApiProperty({ 
    description: 'ID of the series this event belongs to',
    example: 1
  })
  seriesId: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @ApiPropertyOptional({ 
    description: 'ID of the arc this event belongs to',
    example: 1
  })
  arcId?: number;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @ArrayMaxSize(100)
  @ApiPropertyOptional({ 
    description: 'IDs of chapters where this event occurs',
    type: [Number],
    example: [45, 46, 47]
  })
  chapterIds?: number[];

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @ApiProperty({ 
    description: 'Chapter number where the event starts',
    example: 45
  })
  startChapter: number;

  @IsNumber()
  @IsOptional()
  @ValidateIf(o => o.endChapter && o.endChapter >= o.startChapter)
  @Min(1)
  @ApiPropertyOptional({ 
    description: 'Chapter number where the event ends',
    example: 52
  })
  endChapter?: number;
}
