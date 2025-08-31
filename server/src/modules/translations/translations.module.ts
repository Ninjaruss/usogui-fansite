import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TranslationsService } from './translations.service';
import { TranslationsController } from './translations.controller';
import {
  ChapterTranslation,
  CharacterTranslation,
  EventTranslation,
  ArcTranslation,
  FactionTranslation,
  TagTranslation,
  GambleTranslation,
} from '../../entities/translations';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChapterTranslation,
      CharacterTranslation,
      EventTranslation,
      ArcTranslation,
      FactionTranslation,
      TagTranslation,
      GambleTranslation,
    ]),
  ],
  providers: [TranslationsService],
  controllers: [TranslationsController],
  exports: [TranslationsService],
})
export class TranslationsModule {}
