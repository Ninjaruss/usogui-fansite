import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCharacterImageDto {
  @ApiProperty({
    description: 'Character image filename',
    example: 'baku-madarame-portrait.webp',
  })
  @IsString()
  @MaxLength(500)
  imageFileName: string;

  @ApiPropertyOptional({
    description: 'Display name for the character image',
    example: 'Baku Madarame - Official Portrait',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  imageDisplayName?: string;
}