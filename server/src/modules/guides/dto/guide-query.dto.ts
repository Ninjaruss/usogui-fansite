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
    example: GuideStatus.PUBLISHED,
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
    description:
      'Sort by field (createdAt, updatedAt, viewCount, likeCount, title)',
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
