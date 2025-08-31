import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { Language } from '../../../entities/translations/translation-types';

export class CreateTranslationDto {
  @ApiProperty({
    description: 'Language of the translation',
    enum: Language,
    example: Language.JA,
  })
  @IsEnum(Language)
  language: Language;

  @ApiPropertyOptional({
    description: 'Translated name/title',
    example: 'ウソウギ',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Translated description',
    example: '賭博の世界で生きる嘘喰いの物語',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Translated title (for chapters, arcs, etc.)',
    example: '第一話: 嘘と真実',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional({
    description: 'Translated subtitle',
    example: '運命の賭け',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subtitle?: string;

  @ApiPropertyOptional({
    description: 'Translated summary',
    example: 'バクが新たな挑戦者と対峙する',
  })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({
    description: 'Translated rules or game mechanics',
    example: '石を取り除くゲーム。最後の石を取った者が負け。',
  })
  @IsOptional()
  @IsString()
  rules?: string;

  @ApiPropertyOptional({
    description: 'Translated win condition',
    example: '相手よりも多くのポイントを獲得する',
  })
  @IsOptional()
  @IsString()
  winCondition?: string;

  @ApiPropertyOptional({
    description: 'Translated role or position',
    example: '主人公',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  role?: string;

  @ApiPropertyOptional({
    description: 'Translated significance or importance',
    example: '物語の中心人物',
  })
  @IsOptional()
  @IsString()
  significance?: string;

  @ApiPropertyOptional({
    description: 'Translated type or category',
    example: 'アクション',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  type?: string;

  @ApiPropertyOptional({
    description: 'Translated content or text',
    example: '「嘘を見抜くのが俺の仕事だ」',
  })
  @IsOptional()
  @IsString()
  content?: string;
}
