import { Language } from './translation-types';
import {
  ChapterTranslation,
  CharacterTranslation,
  EventTranslation,
  ArcTranslation,
  FactionTranslation,
  TagTranslation,
  GambleTranslation,
} from './index';

export { Language };

// List of valid entity types for translations
export const TRANSLATABLE_ENTITY_TYPES = [
  'chapter',
  'character',
  'event',
  'arc',
  'faction',
  'tag',
  'gamble',
] as const;

export type TranslatableEntityType = (typeof TRANSLATABLE_ENTITY_TYPES)[number];

// Union type of all translation entities
export type TranslationEntity =
  | ChapterTranslation
  | CharacterTranslation
  | EventTranslation
  | ArcTranslation
  | FactionTranslation
  | TagTranslation
  | GambleTranslation;

// Base interface for translation fields
export interface BaseTranslationFields {
  id: number;
  language: Language;
  name?: string;
  description?: string;
  updatedAt?: Date;
}
