import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chapter } from '../../entities/chapter.entity';
import { Character } from '../../entities/character.entity';
import { Event } from '../../entities/event.entity';
import { Arc } from '../../entities/arc.entity';
import { Gamble } from '../../entities/gamble.entity';
import { Organization } from '../../entities/organization.entity';
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
    @InjectRepository(Gamble)
    private gambleRepository: Repository<Gamble>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
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
      case SearchType.GAMBLES:
        const gambleResults = await this.searchGambles(query, offset, limit);
        results = gambleResults.results;
        total = gambleResults.total;
        break;
      case SearchType.ORGANIZATIONS:
        const organizationResults = await this.searchOrganizations(
          query,
          offset,
          limit,
        );
        results = organizationResults.results;
        total = organizationResults.total;
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
    const suggestions: string[] = [];

    // Get suggestions from all entity types in priority order: characters, organizations, arcs, gambles, events, chapters
    const [characters, organizations, arcs, gambles, events, chapters] =
      await Promise.all([
        // Characters
        this.characterRepository
          .createQueryBuilder('character')
          .where('character.name ILIKE :query', { query: `%${query}%` })
          .orderBy(
            `CASE 
            WHEN character.name ILIKE :exactQuery THEN 1
            WHEN character.name ILIKE :startQuery THEN 2
            ELSE 3
          END`,
            'ASC',
          )
          .addOrderBy('character.name', 'ASC')
          .setParameters({
            query: `%${query}%`,
            exactQuery: query,
            startQuery: `${query}%`,
          })
          .limit(2)
          .getMany(),

        // Organizations
        this.organizationRepository
          .createQueryBuilder('organization')
          .where('organization.name ILIKE :query', { query: `%${query}%` })
          .orderBy(
            `CASE 
            WHEN organization.name ILIKE :exactQuery THEN 1
            WHEN organization.name ILIKE :startQuery THEN 2
            ELSE 3
          END`,
            'ASC',
          )
          .addOrderBy('organization.name', 'ASC')
          .setParameters({
            query: `%${query}%`,
            exactQuery: query,
            startQuery: `${query}%`,
          })
          .limit(2)
          .getMany(),

        // Arcs
        this.arcRepository
          .createQueryBuilder('arc')
          .where('arc.name ILIKE :query', { query: `%${query}%` })
          .orderBy(
            `CASE 
            WHEN arc.name ILIKE :exactQuery THEN 1
            WHEN arc.name ILIKE :startQuery THEN 2
            ELSE 3
          END`,
            'ASC',
          )
          .addOrderBy('arc.name', 'ASC')
          .setParameters({
            query: `%${query}%`,
            exactQuery: query,
            startQuery: `${query}%`,
          })
          .limit(2)
          .getMany(),

        // Gambles
        this.gambleRepository
          .createQueryBuilder('gamble')
          .where('gamble.name ILIKE :query', { query: `%${query}%` })
          .orderBy(
            `CASE 
            WHEN gamble.name ILIKE :exactQuery THEN 1
            WHEN gamble.name ILIKE :startQuery THEN 2
            ELSE 3
          END`,
            'ASC',
          )
          .addOrderBy('gamble.name', 'ASC')
          .setParameters({
            query: `%${query}%`,
            exactQuery: query,
            startQuery: `${query}%`,
          })
          .limit(1)
          .getMany(),

        // Events
        this.eventRepository
          .createQueryBuilder('event')
          .where('event.title ILIKE :query', { query: `%${query}%` })
          .orderBy(
            `CASE 
            WHEN event.title ILIKE :exactQuery THEN 1
            WHEN event.title ILIKE :startQuery THEN 2
            ELSE 3
          END`,
            'ASC',
          )
          .addOrderBy('event.title', 'ASC')
          .setParameters({
            query: `%${query}%`,
            exactQuery: query,
            startQuery: `${query}%`,
          })
          .limit(1)
          .getMany(),

        // Chapters
        this.chapterRepository
          .createQueryBuilder('chapter')
          .where('chapter.title ILIKE :query', { query: `%${query}%` })
          .orderBy(
            `CASE 
            WHEN chapter.title ILIKE :exactQuery THEN 1
            WHEN chapter.title ILIKE :startQuery THEN 2
            ELSE 3
          END`,
            'ASC',
          )
          .addOrderBy('chapter.title', 'ASC')
          .setParameters({
            query: `%${query}%`,
            exactQuery: query,
            startQuery: `${query}%`,
          })
          .limit(1)
          .getMany(),
      ]);

    // Add suggestions in priority order
    characters.forEach((char) => suggestions.push(char.name));
    organizations.forEach((organization) =>
      suggestions.push(organization.name),
    );
    arcs.forEach((arc) => suggestions.push(arc.name));
    gambles.forEach((gamble) => suggestions.push(gamble.name));
    events.forEach((event) => suggestions.push(event.title || 'Unknown Event'));
    chapters.forEach((chapter) =>
      suggestions.push(chapter.title || `Chapter ${chapter.number}`),
    );

    // Remove duplicates and limit to 8 suggestions
    return Array.from(new Set(suggestions)).slice(0, 8);
  }

  async getContentTypes(): Promise<{ type: string; count: number }[]> {
    const [
      chapterCount,
      characterCount,
      eventCount,
      arcCount,
      gambleCount,
      organizationCount,
    ] = await Promise.all([
      this.chapterRepository.count(),
      this.characterRepository.count(),
      this.eventRepository.count(),
      this.arcRepository.count(),
      this.gambleRepository.count(),
      this.organizationRepository.count(),
    ]);

    return [
      { type: 'characters', count: characterCount },
      { type: 'organizations', count: organizationCount },
      { type: 'arcs', count: arcCount },
      { type: 'gambles', count: gambleCount },
      { type: 'chapters', count: chapterCount },
      { type: 'events', count: eventCount },
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
      .orderBy(
        `CASE 
          WHEN chapter.title ILIKE :exactQuery THEN 1
          WHEN chapter.title ILIKE :startQuery THEN 2
          WHEN chapter.title ILIKE :query THEN 3
          ELSE 4
        END`,
        'ASC',
      )
      .addOrderBy('chapter.number', 'ASC')
      .setParameters({
        query: `%${query}%`,
        exactQuery: query,
        startQuery: `${query}%`,
      })
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
          character.name ILIKE :likeQuery OR
          character.description ILIKE :likeQuery OR
          character."alternateNames" ILIKE :likeQuery OR
          to_tsvector('english', character.name) @@ plainto_tsquery('english', :query) OR
          to_tsvector('english', character.description) @@ plainto_tsquery('english', :query)
        )`,
        { query, likeQuery: `%${query}%` },
      )
      .orderBy(
        `CASE 
          WHEN character.name ILIKE :exactQuery THEN 1
          WHEN character.name ILIKE :startQuery THEN 2
          WHEN character.name ILIKE :likeQuery THEN 3
          WHEN character.description ILIKE :exactQuery THEN 4
          WHEN character.description ILIKE :startQuery THEN 5
          WHEN character.description ILIKE :likeQuery THEN 6
          WHEN character."alternateNames" ILIKE :exactQuery THEN 7
          WHEN character."alternateNames" ILIKE :startQuery THEN 8
          WHEN character."alternateNames" ILIKE :likeQuery THEN 9
          ELSE 10
        END`,
        'ASC',
      )
      .addOrderBy('character.name', 'ASC')
      .setParameters({
        query,
        likeQuery: `%${query}%`,
        exactQuery: query,
        startQuery: `${query}%`,
      })
      .offset(offset)
      .limit(limit)
      .getManyAndCount();

    const results: SearchResultItemDto[] = characters.map((character) => ({
      id: character.id,
      type: 'character',
      title: character.name || 'Unknown Character',
      description: character.description ?? undefined,
      score: 1.0,
      hasSpoilers: false, // Characters don't have spoiler flags typically
      slug: `character-${character.id}`, // Generate slug from ID
      metadata: {
        firstAppearanceChapter: character.firstAppearanceChapter,
        alternateNames: character.alternateNames,
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
      .orderBy(
        `CASE 
          WHEN event.title ILIKE :exactQuery THEN 1
          WHEN event.title ILIKE :startQuery THEN 2
          WHEN event.title ILIKE :query THEN 3
          WHEN event.description ILIKE :exactQuery THEN 4
          WHEN event.description ILIKE :startQuery THEN 5
          WHEN event.description ILIKE :query THEN 6
          ELSE 7
        END`,
        'ASC',
      )
      .addOrderBy('event.title', 'ASC')
      .setParameters({
        query: `%${query}%`,
        exactQuery: query,
        startQuery: `${query}%`,
      })
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
          arc.name ILIKE :likeQuery OR
          arc.description ILIKE :likeQuery OR
          to_tsvector('english', arc.name) @@ plainto_tsquery('english', :query) OR
          to_tsvector('english', arc.description) @@ plainto_tsquery('english', :query)
        )`,
        { query, likeQuery: `%${query}%` },
      )
      .orderBy(
        `CASE 
          WHEN arc.name ILIKE :exactQuery THEN 1
          WHEN arc.name ILIKE :startQuery THEN 2
          WHEN arc.name ILIKE :likeQuery THEN 3
          WHEN arc.description ILIKE :exactQuery THEN 4
          WHEN arc.description ILIKE :startQuery THEN 5
          WHEN arc.description ILIKE :likeQuery THEN 6
          ELSE 7
        END`,
        'ASC',
      )
      .addOrderBy('arc.name', 'ASC')
      .setParameters({
        query,
        likeQuery: `%${query}%`,
        exactQuery: query,
        startQuery: `${query}%`,
      })
      .offset(offset)
      .limit(limit)
      .getManyAndCount();

    const results: SearchResultItemDto[] = arcs.map((arc) => ({
      id: arc.id,
      type: 'arc',
      title: arc.name || 'Unknown Arc',
      description: arc.description ?? undefined,
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

  private async searchGambles(query: string, offset: number, limit: number) {
    const [gambles, total] = await this.gambleRepository
      .createQueryBuilder('gamble')
      .leftJoinAndSelect('gamble.participants', 'character')
      .where(
        `(
          gamble.name ILIKE :likeQuery OR
          gamble.rules ILIKE :likeQuery OR
          character.name ILIKE :likeQuery OR
          to_tsvector('english', gamble.name) @@ plainto_tsquery('english', :query) OR
          to_tsvector('english', gamble.rules) @@ plainto_tsquery('english', :query) OR
          to_tsvector('english', character.name) @@ plainto_tsquery('english', :query)
        )`,
        { query, likeQuery: `%${query}%` },
      )
      .orderBy(
        `CASE 
          WHEN gamble.name ILIKE :exactQuery THEN 1
          WHEN gamble.name ILIKE :startQuery THEN 2
          WHEN gamble.name ILIKE :likeQuery THEN 3
          WHEN character.name ILIKE :exactQuery THEN 4
          WHEN character.name ILIKE :startQuery THEN 5
          WHEN character.name ILIKE :likeQuery THEN 6
          WHEN gamble.rules ILIKE :exactQuery THEN 7
          WHEN gamble.rules ILIKE :startQuery THEN 8
          WHEN gamble.rules ILIKE :likeQuery THEN 9
          ELSE 10
        END`,
        'ASC',
      )
      .addOrderBy('gamble.name', 'ASC')
      .setParameters({
        query,
        likeQuery: `%${query}%`,
        exactQuery: query,
        startQuery: `${query}%`,
      })
      .offset(offset)
      .limit(limit)
      .getManyAndCount();

    const results: SearchResultItemDto[] = gambles.map((gamble) => ({
      id: gamble.id,
      type: 'gamble',
      title: gamble.name || 'Unknown Gamble',
      description: gamble.rules,
      score: 1.0,
      hasSpoilers: false, // Gambles don't typically have spoiler flags
      slug: `gamble-${gamble.id}`,
      metadata: {
        winCondition: gamble.winCondition,
        chapterId: gamble.chapterId,
        participants: gamble.participants?.length || 0,
      },
    }));

    return { results, total };
  }

  private async searchOrganizations(
    query: string,
    offset: number,
    limit: number,
  ) {
    const [organizations, total] = await this.organizationRepository
      .createQueryBuilder('organization')
      .where(
        `(
          organization.name ILIKE :likeQuery OR
          organization.description ILIKE :likeQuery OR
          to_tsvector('english', organization.name) @@ plainto_tsquery('english', :query) OR
          to_tsvector('english', organization.description) @@ plainto_tsquery('english', :query)
        )`,
        { query, likeQuery: `%${query}%` },
      )
      .orderBy(
        `CASE 
          WHEN organization.name ILIKE :exactQuery THEN 1
          WHEN organization.name ILIKE :startQuery THEN 2
          WHEN organization.name ILIKE :likeQuery THEN 3
          WHEN organization.description ILIKE :exactQuery THEN 4
          WHEN organization.description ILIKE :startQuery THEN 5
          WHEN organization.description ILIKE :likeQuery THEN 6
          ELSE 7
        END`,
        'ASC',
      )
      .addOrderBy('organization.name', 'ASC')
      .setParameters({
        query,
        likeQuery: `%${query}%`,
        exactQuery: query,
        startQuery: `${query}%`,
      })
      .offset(offset)
      .limit(limit)
      .getManyAndCount();

    const results: SearchResultItemDto[] = organizations.map(
      (organization) => ({
        id: organization.id,
        type: 'organization',
        title: organization.name || 'Unknown Organization',
        description: organization.description ?? undefined,
        score: 1.0,
        hasSpoilers: false, // Organizations don't typically have spoiler flags
        slug: `organization-${organization.id}`,
        metadata: {},
      }),
    );

    return { results, total };
  }

  private async searchAll(
    query: string,
    userProgress?: number,
    offset: number = 0,
    limit: number = 20,
  ) {
    // Get results from each type with prioritization: character -> organizations -> arcs -> gambles -> events -> chapters
    const resultsPerType = Math.ceil(limit / 6); // Distribute results across 6 types

    const [
      characterResults,
      organizationResults,
      arcResults,
      gambleResults,
      eventResults,
      chapterResults,
    ] = await Promise.all([
      this.searchCharacters(query, 0, resultsPerType),
      this.searchOrganizations(query, 0, resultsPerType),
      this.searchArcs(query, 0, resultsPerType),
      this.searchGambles(query, 0, resultsPerType),
      this.searchEvents(query, userProgress, 0, resultsPerType),
      this.searchChapters(query, userProgress, 0, resultsPerType),
    ]);

    // Combine all results in priority order
    const allResults = [
      ...characterResults.results,
      ...organizationResults.results,
      ...arcResults.results,
      ...gambleResults.results,
      ...eventResults.results,
      ...chapterResults.results,
    ];

    // Apply pagination to combined results
    const results = allResults.slice(offset, offset + limit);
    const total =
      characterResults.total +
      organizationResults.total +
      arcResults.total +
      gambleResults.total +
      eventResults.total +
      chapterResults.total;

    return { results, total };
  }
}
