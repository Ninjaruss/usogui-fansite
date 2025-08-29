import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, IsNotEmpty, MinLength, MaxLength, Min, ArrayMaxSize, ValidateIf, IsEnum, IsBoolean } from 'class-validator';
import { EventType, ChapterReference } from '../../../entities/event.entity';

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

  @IsEnum(EventType)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Type of event',
    enum: EventType,
    default: EventType.OTHER,
    example: EventType.ARC
  })
  type?: EventType;

  // series removed

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

  @IsNumber()
  @IsOptional()
  @Min(1)
  @ApiPropertyOptional({ 
    description: 'Chapter number the user should have read before seeing this event (spoiler protection)',
    example: 44
  })
  spoilerChapter?: number;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @ArrayMaxSize(50)
  @ApiPropertyOptional({ 
    description: 'Page numbers where this event occurs or is referenced',
    type: [Number],
    example: [15, 22, 35]
  })
  pageNumbers?: number[];

  @IsOptional()
  @ApiPropertyOptional({ 
    description: 'List of chapter references with context for additional reading',
    type: 'array',
    example: [
      { chapterNumber: 10, context: "Page 8 - Character background revealed" },
      { chapterNumber: 12, context: "Final scene - Important foreshadowing" }
    ]
  })
  chapterReferences?: ChapterReference[];

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({ 
    description: 'Whether this event has been verified by moderators',
    example: false
  })
  isVerified?: boolean;
}
