import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import {
  Language,
  SeriesTranslation,
  ChapterTranslation,
  CharacterTranslation,
  EventTranslation,
  ArcTranslation,
  FactionTranslation,
  TagTranslation,
  ChapterSpoilerTranslation
} from '../../entities/translations';
import type { 
  TranslatableEntityType,
  TranslationEntity, 
  BaseTranslationFields 
} from '../../entities/translations/types';

@Injectable()
export class TranslationsService {
  private repositories: Record<TranslatableEntityType, Repository<TranslationEntity>>;

  private initRepositories(
    seriesRepo: Repository<SeriesTranslation>,
    chapterRepo: Repository<ChapterTranslation>,
    characterRepo: Repository<CharacterTranslation>,
    eventRepo: Repository<EventTranslation>,
    arcRepo: Repository<ArcTranslation>,
    factionRepo: Repository<FactionTranslation>,
    tagRepo: Repository<TagTranslation>,
    chapterSpoilerRepo: Repository<ChapterSpoilerTranslation>
  ) {
    this.repositories = {
      series: seriesRepo,
      chapter: chapterRepo,
      character: characterRepo,
      event: eventRepo,
      arc: arcRepo,
      faction: factionRepo,
      tag: tagRepo,
      chapterSpoiler: chapterSpoilerRepo,
    } as Record<TranslatableEntityType, Repository<TranslationEntity>>;
  }

  constructor(
    @InjectRepository(SeriesTranslation)
    seriesTranslationRepo: Repository<SeriesTranslation>,
    @InjectRepository(ChapterTranslation)
    chapterTranslationRepo: Repository<ChapterTranslation>,
    @InjectRepository(CharacterTranslation)
    characterTranslationRepo: Repository<CharacterTranslation>,
    @InjectRepository(EventTranslation)
    eventTranslationRepo: Repository<EventTranslation>,
    @InjectRepository(ArcTranslation)
    arcTranslationRepo: Repository<ArcTranslation>,
    @InjectRepository(FactionTranslation)
    factionTranslationRepo: Repository<FactionTranslation>,
    @InjectRepository(TagTranslation)
    tagTranslationRepo: Repository<TagTranslation>,
    @InjectRepository(ChapterSpoilerTranslation)
    chapterSpoilerTranslationRepo: Repository<ChapterSpoilerTranslation>,
  ) {
    this.initRepositories(
      seriesTranslationRepo,
      chapterTranslationRepo,
      characterTranslationRepo,
      eventTranslationRepo,
      arcTranslationRepo,
      factionTranslationRepo,
      tagTranslationRepo,
      chapterSpoilerTranslationRepo
    );
  }

  private getRepository<T extends TranslationEntity>(entityType: TranslatableEntityType): Repository<T> {
    const repo = this.repositories[entityType];
    if (!repo) {
      throw new Error(`No repository found for entity type: ${entityType}`);
    }
    return repo as Repository<T>;
  }

  async getTranslation<T extends TranslationEntity>(
    entityType: TranslatableEntityType,
    referenceId: number,
    language: Language
  ): Promise<T | null> {
    const repo = this.getRepository<T>(entityType);
    return repo.findOne({
      where: {
        referenceId,
        language,
      } as any,
    });
  }

  async createTranslation<T extends TranslationEntity>(
    entityType: TranslatableEntityType,
    referenceId: number,
    language: Language,
    data: Partial<T & BaseTranslationFields>
  ): Promise<T> {
    const repo = this.getRepository<T>(entityType);
    const translationData = {
      referenceId,
      language,
      ...data,
    } as unknown as DeepPartial<T>;
    const translation = repo.create(translationData);
    const saved = await repo.save(translation);
    return saved;
  }

  async updateTranslation<T extends TranslationEntity>(
    entityType: TranslatableEntityType,
    id: number,
    data: Partial<T & BaseTranslationFields>
  ): Promise<T | null> {
    const repo = this.getRepository<T>(entityType);
    await repo.update(id, {
      ...data,
      updatedAt: new Date(),
    } as any);
    const updated = await repo.findOne({ where: { id } as any });
    return updated as T | null;
  }

  async deleteTranslation(
    entityType: TranslatableEntityType,
    id: number
  ): Promise<void> {
    const repo = this.getRepository(entityType);
    await repo.delete(id);
  }

  async getTranslations<T extends TranslationEntity>(
    entityType: TranslatableEntityType,
    referenceId: number
  ): Promise<T[]> {
    const repo = this.getRepository<T>(entityType);
    return repo.find({
      where: {
        referenceId,
      } as any,
    });
  }
}
