import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TranslationsService } from './translations.service';
import { TranslationsController } from './translations.controller';
import {
  SeriesTranslation,
  ChapterTranslation,
  CharacterTranslation,
  EventTranslation,
  ArcTranslation,
  FactionTranslation,
  TagTranslation,
  ChapterSpoilerTranslation,
  GambleTranslation
} from '../../entities/translations';

@Module({
  imports: [TypeOrmModule.forFeature([
    SeriesTranslation,
    ChapterTranslation,
    CharacterTranslation,
    EventTranslation,
    ArcTranslation,
    FactionTranslation,
    TagTranslation,
    ChapterSpoilerTranslation,
    GambleTranslation
  ])],
  providers: [TranslationsService],
  controllers: [TranslationsController],
  exports: [TranslationsService],
})
export class TranslationsModule {}
