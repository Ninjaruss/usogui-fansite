import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { GuideStatus } from '../../../entities/guide.entity';

export class GuideQueryDto {
  @ApiPropertyOptional({
    description: 'Search guides by title or description',
    example: 'poker strategy',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter guides by status',
    enum: GuideStatus,
    example: GuideStatus.APPROVED,
  })
  @IsOptional()
  @IsEnum(GuideStatus)
  status?: GuideStatus;

  @ApiPropertyOptional({
    description: 'Filter guides by author ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  authorId?: number;

  @ApiPropertyOptional({
    description: 'Filter guides by tag name',
    example: 'poker',
  })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({
    description: 'Filter guides by character IDs (comma-separated)',
    example: '1,2,3',
  })
  @IsOptional()
  @IsString()
  characterIds?: string;

  @ApiPropertyOptional({
    description: 'Filter guides by arc IDs (comma-separated)',
    example: '1,2',
  })
  @IsOptional()
  @IsString()
  arcIds?: string;

  @ApiPropertyOptional({
    description: 'Filter guides by gamble IDs (comma-separated)',
    example: '1,2,3',
  })
  @IsOptional()
  @IsString()
  gambleIds?: string;

  @ApiPropertyOptional({
    description:
      'Sort by field (id, createdAt, updatedAt, viewCount, likeCount, title, description, authorId)',
    example: 'likeCount',
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order (ASC or DESC)',
    example: 'DESC',
    default: 'DESC',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}
