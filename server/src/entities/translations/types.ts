import { Language } from './translation-types';
import {
  SeriesTranslation,
  ChapterTranslation,
  CharacterTranslation,
  EventTranslation,
  ArcTranslation,
  FactionTranslation,
  TagTranslation,
  ChapterSpoilerTranslation
} from './index';

export { Language };

// List of valid entity types for translations
export const TRANSLATABLE_ENTITY_TYPES = [
  'series',
  'chapter',
  'character',
  'event',
  'arc',
  'faction',
  'tag',
  'chapterSpoiler'
] as const;

export type TranslatableEntityType = typeof TRANSLATABLE_ENTITY_TYPES[number];

// Union type of all translation entities
export type TranslationEntity = 
  | SeriesTranslation
  | ChapterTranslation
  | CharacterTranslation
  | EventTranslation
  | ArcTranslation
  | FactionTranslation
  | TagTranslation
  | ChapterSpoilerTranslation;

// Base interface for translation fields
export interface BaseTranslationFields {
  id: number;
  language: Language;
  name?: string;
  description?: string;
  updatedAt?: Date;
}
