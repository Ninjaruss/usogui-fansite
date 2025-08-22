import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGambleTranslationDto {
  @ApiProperty({
    description: 'ID of the gamble to translate',
    example: 1
  })
  @IsNumber()
  @IsNotEmpty()
  gambleId: number;

  @ApiProperty({
    description: 'Language code for the translation (e.g., "en", "ja", "es")',
    example: 'ja'
  })
  @IsString()
  @IsNotEmpty()
  languageCode: string;

  @ApiProperty({
    description: 'Translated name of the gamble',
    example: 'リストカットポーカー'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Translated rules of the gamble',
    example: 'ゲームの説明...'
  })
  @IsString()
  @IsNotEmpty()
  rules: string;

  @ApiPropertyOptional({
    description: 'Translated win condition',
    example: '勝利条件...'
  })
  @IsString()
  @IsOptional()
  winCondition?: string;
}
