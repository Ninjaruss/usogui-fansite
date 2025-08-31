import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Language } from '../../../entities/translations/translation-types';

export class TranslationQueryDto {
  @ApiProperty({
    description: 'Language to filter translations by',
    enum: Language,
    required: false,
    example: Language.JA,
  })
  @IsEnum(Language)
  language?: Language;
}
