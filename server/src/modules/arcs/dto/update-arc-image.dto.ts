import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateArcImageDto {
  @ApiProperty({
    description: 'Arc image filename',
    example: '17-steps-tournament-cover.webp',
  })
  @IsString()
  @MaxLength(500)
  imageFileName: string;

  @ApiPropertyOptional({
    description: 'Display name for the arc image',
    example: '17 Steps Tournament - Official Cover',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  imageDisplayName?: string;
}