import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import {
  AnnotationStatus,
  AnnotationOwnerType,
} from '../../../entities/annotation.entity';

export class AnnotationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by approval status',
    enum: AnnotationStatus,
  })
  @IsOptional()
  @IsEnum(AnnotationStatus)
  status?: AnnotationStatus;

  @ApiPropertyOptional({
    description: 'Filter by owner type',
    enum: AnnotationOwnerType,
  })
  @IsOptional()
  @IsEnum(AnnotationOwnerType)
  ownerType?: AnnotationOwnerType;

  @ApiPropertyOptional({
    description: 'Filter by author ID',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  authorId?: number;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort order by created date',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: ['id', 'title', 'createdAt'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['id', 'title', 'createdAt'])
  sort?: string = 'createdAt';
}
