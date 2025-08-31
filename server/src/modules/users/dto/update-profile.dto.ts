import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsInt, Min } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'ID of the selected profile image',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  profileImageId?: string;

  @ApiPropertyOptional({
    description: 'ID of favorite quote from the quote database',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  favoriteQuoteId?: number;

  @ApiPropertyOptional({
    description: 'ID of favorite gamble from the gamble database',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  favoriteGambleId?: number;
}
