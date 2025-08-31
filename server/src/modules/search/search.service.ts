import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chapter } from '../../entities/chapter.entity';
import { Character } from '../../entities/character.entity';
import { Event } from '../../entities/event.entity';
import { Arc } from '../../entities/arc.entity';
import { SearchQueryDto, SearchType } from './dto/search-query.dto';
import { SearchResultDto, SearchResultItemDto } from './dto/search-result.dto';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Chapter)
    private chapterRepository: Repository<Chapter>,
    @InjectRepository(Character)
    private characterRepository: Repository<Character>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(Arc)
    private arcRepository: Repository<Arc>,
  ) {}

  async search(searchQuery: SearchQueryDto): Promise<SearchResultDto> {
    const {
      query,
      type = SearchType.ALL,
      userProgress,
      page = 1,
      limit = 20,
    } = searchQuery;
    const offset = (page - 1) * limit;

    let results: SearchResultItemDto[] = [];
    let total = 0;

    switch (type) {
      case SearchType.CHAPTERS:
        const chapterResults = await this.searchChapters(
          query,
          userProgress,
          offset,
          limit,
        );
        results = chapterResults.results;
        total = chapterResults.total;
        break;
      case SearchType.CHARACTERS:
        const characterResults = await this.searchCharacters(
          query,
          offset,
          limit,
        );
        results = characterResults.results;
        total = characterResults.total;
        break;
      case SearchType.EVENTS:
        const eventResults = await this.searchEvents(
          query,
          userProgress,
          offset,
          limit,
        );
        results = eventResults.results;
        total = eventResults.total;
        break;
      case SearchType.ARCS:
        const arcResults = await this.searchArcs(query, offset, limit);
        results = arcResults.results;
        total = arcResults.total;
        break;
      case SearchType.ALL:
      default:
        const allResults = await this.searchAll(
          query,
          userProgress,
          offset,
          limit,
        );
        results = allResults.results;
        total = allResults.total;
        break;
    }

    const totalPages = Math.ceil(total / limit);

    return {
      results,
      total,
      page,
      perPage: limit,
      totalPages,
    };
  }

  async getSuggestions(query: string): Promise<string[]> {
    // Simple implementation - you can enhance this with more sophisticated algorithms
    const suggestions: string[] = [];

    // Get character name suggestions
    const characters = await this.characterRepository
      .createQueryBuilder('character')
      .where('character.name ILIKE :query', { query: `%${query}%` })
      .limit(5)
      .getMany();

    characters.forEach((char) => {
      suggestions.push(char.name);
    });

    return suggestions;
  }

  async getContentTypes(): Promise<{ type: string; count: number }[]> {
    const [chapterCount, characterCount, eventCount, arcCount] =
      await Promise.all([
        this.chapterRepository.count(),
        this.characterRepository.count(),
        this.eventRepository.count(),
        this.arcRepository.count(),
      ]);

    return [
      { type: 'chapters', count: chapterCount },
      { type: 'characters', count: characterCount },
      { type: 'events', count: eventCount },
      { type: 'arcs', count: arcCount },
    ];
  }

  private async searchChapters(
    query: string,
    userProgress?: number,
    offset: number = 0,
    limit: number = 20,
  ) {
    const queryBuilder = this.chapterRepository
      .createQueryBuilder('chapter')
      .where('chapter.title ILIKE :query OR chapter.summary ILIKE :query', {
        query: `%${query}%`,
      });

    // Apply spoiler filtering based on user progress
    if (userProgress !== undefined) {
      queryBuilder.andWhere('chapter.number <= :userProgress', {
        userProgress,
      });
    }

    const [chapters, total] = await queryBuilder
      .orderBy('chapter.number', 'ASC')
      .offset(offset)
      .limit(limit)
      .getManyAndCount();

    const results: SearchResultItemDto[] = chapters.map((chapter) => ({
      id: chapter.id,
      type: 'chapter',
      title: chapter.title || `Chapter ${chapter.number}`,
      description: chapter.summary,
      score: 1.0,
      hasSpoilers: userProgress ? chapter.number > userProgress : false,
      slug: `chapter-${chapter.number}`,
      metadata: {
        chapterNumber: chapter.number,
      },
    }));

    return { results, total };
  }

  private async searchCharacters(query: string, offset: number, limit: number) {
    const [characters, total] = await this.characterRepository
      .createQueryBuilder('character')
      .where(
        `(
          to_tsvector('english', character.name) @@ plainto_tsquery('english', :query) OR
          to_tsvector('english', character.description) @@ plainto_tsquery('english', :query)
        )`,
        { query },
      )
      .orderBy(
        `ts_rank(
          to_tsvector('english', character.name || ' ' || character.description),
          plainto_tsquery('english', :query)
        )`,
        'DESC',
      )
      .offset(offset)
      .limit(limit)
      .getManyAndCount();

    const results: SearchResultItemDto[] = characters.map((character) => ({
      id: character.id,
      type: 'character',
      title: character.name || 'Unknown Character',
      description: character.description,
      score: 1.0,
      hasSpoilers: false, // Characters don't have spoiler flags typically
      slug: `character-${character.id}`, // Generate slug from ID
      metadata: {
        occupation: character.occupation,
        firstAppearanceChapter: character.firstAppearanceChapter,
      },
    }));

    return { results, total };
  }

  private async searchEvents(
    query: string,
    userProgress?: number,
    offset: number = 0,
    limit: number = 20,
  ) {
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .where('event.title ILIKE :query OR event.description ILIKE :query', {
        query: `%${query}%`,
      });

    // Apply spoiler filtering based on user progress
    if (userProgress !== undefined) {
      queryBuilder.andWhere(
        '(event.spoilerChapter IS NULL OR event.spoilerChapter <= :userProgress)',
        { userProgress },
      );
    }

    const [events, total] = await queryBuilder
      .orderBy('event.title', 'ASC')
      .offset(offset)
      .limit(limit)
      .getManyAndCount();

    const results: SearchResultItemDto[] = events.map((event) => ({
      id: event.id,
      type: 'event',
      title: event.title || 'Unknown Event',
      description: event.description,
      score: 1.0,
      hasSpoilers: userProgress
        ? !!(event.spoilerChapter && event.spoilerChapter > userProgress)
        : !!event.spoilerChapter,
      slug: `event-${event.id}`,
      metadata: {
        type: event.type,
        spoilerChapter: event.spoilerChapter,
      },
    }));

    return { results, total };
  }

  private async searchArcs(query: string, offset: number, limit: number) {
    const [arcs, total] = await this.arcRepository
      .createQueryBuilder('arc')
      .where(
        `(
          to_tsvector('english', arc.name) @@ plainto_tsquery('english', :query) OR
          to_tsvector('english', arc.description) @@ plainto_tsquery('english', :query)
        )`,
        { query },
      )
      .orderBy(
        `ts_rank(
          to_tsvector('english', arc.name || ' ' || arc.description),
          plainto_tsquery('english', :query)
        )`,
        'DESC',
      )
      .offset(offset)
      .limit(limit)
      .getManyAndCount();

    const results: SearchResultItemDto[] = arcs.map((arc) => ({
      id: arc.id,
      type: 'arc',
      title: arc.name || 'Unknown Arc',
      description: arc.description,
      score: 1.0,
      hasSpoilers: false, // Arcs don't typically have spoiler flags
      slug: `arc-${arc.id}`, // Generate slug from ID
      metadata: {
        startChapter: arc.startChapter,
        endChapter: arc.endChapter,
        order: arc.order,
      },
    }));

    return { results, total };
  }

  private async searchAll(
    query: string,
    userProgress?: number,
    offset: number = 0,
    limit: number = 20,
  ) {
    // Simple approach: get results from each type and combine them
    const resultsPerType = Math.ceil(limit / 4); // Distribute results across 4 types

    const [chapterResults, characterResults, eventResults, arcResults] =
      await Promise.all([
        this.searchChapters(query, userProgress, 0, resultsPerType),
        this.searchCharacters(query, 0, resultsPerType),
        this.searchEvents(query, userProgress, 0, resultsPerType),
        this.searchArcs(query, 0, resultsPerType),
      ]);

    // Combine all results
    const allResults = [
      ...chapterResults.results,
      ...characterResults.results,
      ...eventResults.results,
      ...arcResults.results,
    ];

    // Apply pagination to combined results
    const results = allResults.slice(offset, offset + limit);
    const total =
      chapterResults.total +
      characterResults.total +
      eventResults.total +
      arcResults.total;

    return { results, total };
  }
}
