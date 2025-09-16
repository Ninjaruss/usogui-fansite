import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Min,
  ArrayMaxSize,
  IsEnum,
} from 'class-validator';
import { EventType, EventStatus } from '../../../entities/event.entity';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  @ApiProperty({
    description: 'Event title',
    example: 'The 17 Steps Tournament',
  })
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(5000)
  @ApiProperty({
    description: 'Event description',
    example:
      'A high-stakes tournament where participants must climb 17 steps...',
  })
  description: string;

  @IsEnum(EventType)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Type of event',
    enum: EventType,
    default: EventType.DECISION,
    example: EventType.GAMBLE,
  })
  type?: EventType;

  @IsEnum(EventStatus)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Status of the event',
    enum: EventStatus,
    default: EventStatus.PENDING,
    example: EventStatus.PENDING,
  })
  status?: EventStatus;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @ApiPropertyOptional({
    description: 'ID of the arc this event belongs to',
    example: 1,
  })
  arcId?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @ApiPropertyOptional({
    description: 'ID of the gamble associated with this event',
    example: 1,
  })
  gambleId?: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @ApiProperty({
    description: 'Chapter number where this event occurs',
    example: 45,
  })
  chapterNumber: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @ApiPropertyOptional({
    description:
      'Chapter number the user should have read before seeing this event (spoiler protection)',
    example: 44,
  })
  spoilerChapter?: number;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @ArrayMaxSize(20)
  @ApiPropertyOptional({
    description: 'IDs of characters involved in this event',
    type: [Number],
    example: [1, 3, 5],
  })
  characterIds?: number[];
}
