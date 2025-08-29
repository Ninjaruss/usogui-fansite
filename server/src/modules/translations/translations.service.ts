import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import {
  Language,
  ChapterTranslation,
  CharacterTranslation,
  EventTranslation,
  ArcTranslation,
  FactionTranslation,
  TagTranslation,
  GambleTranslation
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
    chapterRepo: Repository<ChapterTranslation>,
    characterRepo: Repository<CharacterTranslation>,
    eventRepo: Repository<EventTranslation>,
    arcRepo: Repository<ArcTranslation>,
    factionRepo: Repository<FactionTranslation>,
    tagRepo: Repository<TagTranslation>,
    gambleRepo: Repository<GambleTranslation>
  ) {
    this.repositories = {
      chapter: chapterRepo,
      character: characterRepo,
      event: eventRepo,
      arc: arcRepo,
      faction: factionRepo,
      tag: tagRepo,
      gamble: gambleRepo,
    } as Record<TranslatableEntityType, Repository<TranslationEntity>>;
  }

  constructor(
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
    @InjectRepository(GambleTranslation)
    gambleTranslationRepo: Repository<GambleTranslation>,
  ) {
    this.initRepositories(
      chapterTranslationRepo,
      characterTranslationRepo,
      eventTranslationRepo,
      arcTranslationRepo,
      factionTranslationRepo,
      tagTranslationRepo,
      gambleTranslationRepo
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

  async getTranslationStats(): Promise<{
    totalEntities: number;
    translatedEntities: Record<string, number>;
    coveragePercentage: Record<string, number>;
    byEntityType: Record<string, any>;
  }> {
    const stats = {
      totalEntities: 0,
      translatedEntities: {} as Record<string, number>,
      coveragePercentage: {} as Record<string, number>,
      byEntityType: {} as Record<string, any>
    };

    // Initialize language counters
    Object.values(Language).forEach(lang => {
      stats.translatedEntities[lang] = 0;
      stats.coveragePercentage[lang] = 0;
    });

    // Get stats for each entity type
    for (const [entityType, repo] of Object.entries(this.repositories)) {
      const totalTranslations = await repo.count();
      stats.totalEntities += totalTranslations;

      // Count translations by language for this entity type
      const languageStats = await repo
        .createQueryBuilder('translation')
        .select('translation.language', 'language')
        .addSelect('COUNT(*)', 'count')
        .groupBy('translation.language')
        .getRawMany();

      const entityTypeStats = {
        total: totalTranslations,
        translated: {} as Record<string, number>
      };

      // Process language stats
      languageStats.forEach(langStat => {
        const count = parseInt(langStat.count);
        entityTypeStats.translated[langStat.language] = count;
        stats.translatedEntities[langStat.language] += count;
      });

      stats.byEntityType[entityType] = entityTypeStats;
    }

    // Calculate coverage percentages
    Object.values(Language).forEach(lang => {
      if (stats.totalEntities > 0) {
        stats.coveragePercentage[lang] = Math.round(
          (stats.translatedEntities[lang] / stats.totalEntities) * 100
        );
      }
    });

    return stats;
  }
}
