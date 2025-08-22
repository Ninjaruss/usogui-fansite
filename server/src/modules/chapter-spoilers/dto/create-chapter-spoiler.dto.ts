import { IsEnum, IsString, IsNumber, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { SpoilerLevel, SpoilerCategory } from '../../../entities/chapter-spoiler.entity';

export class CreateChapterSpoilerDto {
  @IsNumber()
  eventId: number;

  @IsNumber()
  chapterId: number;

  @IsEnum(SpoilerLevel)
  level: SpoilerLevel;

  @IsEnum(SpoilerCategory)
  category: SpoilerCategory;

  @IsString()
  description: string;

  @IsNumber()
  minimumChapter: number;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  additionalRequirementIds?: number[];

  @IsString()
  @IsOptional()
  requirementExplanation?: string;

  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;
}
