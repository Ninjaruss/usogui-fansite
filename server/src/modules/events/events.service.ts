import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event, EventType, EventStatus } from '../../entities/event.entity';
import { Character } from '../../entities/character.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private repo: Repository<Event>,
    @InjectRepository(Character) private characterRepo: Repository<Character>,
  ) {}

  /**
   * Find all events with filtering and spoiler protection
   */
  async findAll(filters: {
    title?: string;
    arc?: string;
    description?: string;
    type?: EventType;
    userProgress?: number;
    status?: EventStatus;
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'ASC' | 'DESC';
  }) {
    const { page = 1, limit = 20, sort, order = 'ASC' } = filters;
    const query = this.repo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.arc', 'arc')
      .leftJoinAndSelect('event.characters', 'characters');

    if (filters.title) {
      query.andWhere('LOWER(event.title) LIKE LOWER(:title)', {
        title: `%${filters.title}%`,
      });
    }
    if (filters.arc) {
      query.andWhere('LOWER(arc.name) LIKE LOWER(:arc)', {
        arc: `%${filters.arc}%`,
      });
    }
    // series filter removed
    if (filters.description) {
      query.andWhere('LOWER(event.description) LIKE LOWER(:description)', {
        description: `%${filters.description}%`,
      });
    }
    if (filters.type) {
      query.andWhere('event.type = :type', { type: filters.type });
    }
    if (filters.status !== undefined) {
      query.andWhere('event.status = :status', {
        status: filters.status,
      });
    }

    // Spoiler protection: only show events user can safely view
    if (filters.userProgress !== undefined) {
      query.andWhere(
        '(event.spoilerChapter IS NULL OR event.spoilerChapter <= :userProgress)',
        { userProgress: filters.userProgress },
      );
    }

    // Sorting: only allow certain fields for safety
    const allowedSort = ['id', 'title', 'description', 'chapterNumber', 'type'];
    if (sort && allowedSort.includes(sort)) {
      query.orderBy(`event.${sort}`, order);
    } else {
      query.orderBy('event.chapterNumber', 'ASC');
    }

    query.skip((page - 1) * limit).take(limit);
    const [data, total] = await query.getManyAndCount();
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findViewableEvents(
    userProgress: number,
    filters?: {
      type?: EventType;
      status?: EventStatus;
      arc?: string;
    },
  ): Promise<Event[]> {
    const query = this.repo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.arc', 'arc')
      .leftJoinAndSelect('event.characters', 'characters')
      .where(
        '(event.spoilerChapter IS NULL OR event.spoilerChapter <= :userProgress)',
        { userProgress },
      );

    if (filters?.type) {
      query.andWhere('event.type = :type', { type: filters.type });
    }
    if (filters?.status !== undefined) {
      query.andWhere('event.status = :status', {
        status: filters.status,
      });
    }
    if (filters?.arc) {
      query.andWhere('LOWER(arc.name) LIKE LOWER(:arc)', {
        arc: `%${filters.arc}%`,
      });
    }
    // series filter intentionally removed

    query.orderBy('event.chapterNumber', 'ASC');
    return query.getMany();
  }

  async canViewEvent(eventId: number, userProgress: number): Promise<boolean> {
    const event = await this.repo.findOne({
      where: { id: eventId },
      select: ['spoilerChapter'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    return (
      event.spoilerChapter === null || event.spoilerChapter <= userProgress
    );
  }

  async findByType(type: EventType, userProgress?: number): Promise<Event[]> {
    const query = this.repo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.arc', 'arc')
      .leftJoinAndSelect('event.characters', 'characters')
      .where('event.type = :type', { type });

    if (userProgress !== undefined) {
      query.andWhere(
        '(event.spoilerChapter IS NULL OR event.spoilerChapter <= :userProgress)',
        { userProgress },
      );
    }

    query.orderBy('event.chapterNumber', 'ASC');
    return query.getMany();
  }

  async findByArc(
    arcId: number,
    filters: {
      title?: string;
      description?: string;
      type?: EventType;
      userProgress?: number;
      status?: EventStatus;
    },
  ): Promise<Event[]> {
    const query = this.repo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.arc', 'arc')
      .leftJoinAndSelect('event.characters', 'characters')
      .where('event.arcId = :arcId', { arcId });

    if (filters.title) {
      query.andWhere('LOWER(event.title) LIKE LOWER(:title)', {
        title: `%${filters.title}%`,
      });
    }
    if (filters.description) {
      query.andWhere('LOWER(event.description) LIKE LOWER(:description)', {
        description: `%${filters.description}%`,
      });
    }
    if (filters.type) {
      query.andWhere('event.type = :type', { type: filters.type });
    }
    if (filters.status !== undefined) {
      query.andWhere('event.status = :status', {
        status: filters.status,
      });
    }

    // Spoiler protection: only show events user can safely view
    if (filters.userProgress !== undefined) {
      query.andWhere(
        '(event.spoilerChapter IS NULL OR event.spoilerChapter <= :userProgress)',
        { userProgress: filters.userProgress },
      );
    }

    query.orderBy('event.chapterNumber', 'ASC');
    return query.getMany();
  }

  async findByChapter(
    chapterNumber: number,
    filters: {
      title?: string;
      description?: string;
      type?: EventType;
      userProgress?: number;
      status?: EventStatus;
    },
  ): Promise<Event[]> {
    const query = this.repo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.arc', 'arc')
      .leftJoinAndSelect('event.characters', 'characters')
      .where('event.chapterNumber = :chapterNumber', { chapterNumber });

    if (filters.title) {
      query.andWhere('LOWER(event.title) LIKE LOWER(:title)', {
        title: `%${filters.title}%`,
      });
    }
    if (filters.description) {
      query.andWhere('LOWER(event.description) LIKE LOWER(:description)', {
        description: `%${filters.description}%`,
      });
    }
    if (filters.type) {
      query.andWhere('event.type = :type', { type: filters.type });
    }
    if (filters.status !== undefined) {
      query.andWhere('event.status = :status', {
        status: filters.status,
      });
    }

    // Spoiler protection: only show events user can safely view
    if (filters.userProgress !== undefined) {
      query.andWhere(
        '(event.spoilerChapter IS NULL OR event.spoilerChapter <= :userProgress)',
        { userProgress: filters.userProgress },
      );
    }

    query.orderBy('event.chapterNumber', 'ASC');
    return query.getMany();
  }

  findOne(id: number): Promise<Event | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['arc', 'characters', 'tags', 'gamble'],
    });
  }

  async create(data: CreateEventDto): Promise<Event> {
    const { characterIds, ...eventData } = data;

    // Clean up numeric fields to handle NaN values
    const cleanedData = {
      ...eventData,
      type: data.type || EventType.DECISION,
      status: data.status || EventStatus.DRAFT,
      chapterNumber: Number(eventData.chapterNumber) || 1,
      spoilerChapter:
        eventData.spoilerChapter && !isNaN(Number(eventData.spoilerChapter))
          ? Number(eventData.spoilerChapter)
          : undefined,
      arcId:
        eventData.arcId && !isNaN(Number(eventData.arcId))
          ? Number(eventData.arcId)
          : undefined,
    };

    const event = this.repo.create(cleanedData);

    // If character IDs are provided, set up the relationship
    if (characterIds && characterIds.length > 0) {
      const validCharacterIds = characterIds.filter((id) => !isNaN(Number(id)));
      if (validCharacterIds.length > 0) {
        // Load actual Character entities
        const characters = await this.characterRepo.findByIds(
          validCharacterIds.map((id) => Number(id)),
        );
        event.characters = characters;
      }
    }

    return this.repo.save(event);
  }

  async update(id: number, data: UpdateEventDto): Promise<Event> {
    const { characterIds, ...updateData } = data;

    // Clean up numeric fields to handle NaN values
    const cleanedUpdateData = { ...updateData };
    if (cleanedUpdateData.chapterNumber !== undefined) {
      cleanedUpdateData.chapterNumber =
        Number(cleanedUpdateData.chapterNumber) || 1;
    }
    if (cleanedUpdateData.spoilerChapter !== undefined) {
      cleanedUpdateData.spoilerChapter =
        cleanedUpdateData.spoilerChapter &&
        !isNaN(Number(cleanedUpdateData.spoilerChapter))
          ? Number(cleanedUpdateData.spoilerChapter)
          : undefined;
    }
    if (cleanedUpdateData.arcId !== undefined) {
      cleanedUpdateData.arcId =
        cleanedUpdateData.arcId && !isNaN(Number(cleanedUpdateData.arcId))
          ? Number(cleanedUpdateData.arcId)
          : undefined;
    }

    // First update the basic event data
    if (Object.keys(cleanedUpdateData).length > 0) {
      await this.repo.update(id, cleanedUpdateData);
    }

    // Get the event with current relationships
    const event = await this.repo.findOne({
      where: { id },
      relations: ['characters'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Update character relationships if provided
    if (characterIds !== undefined) {
      const validCharacterIds = characterIds.filter(
        (charId) => !isNaN(Number(charId)),
      );

      if (validCharacterIds.length > 0) {
        // Load actual Character entities
        const characters = await this.characterRepo.findByIds(
          validCharacterIds.map((id) => Number(id)),
        );
        event.characters = characters;
      } else {
        // Clear all character relationships
        event.characters = [];
      }

      await this.repo.save(event);
    }

    const result = await this.findOne(id);
    if (!result) {
      throw new NotFoundException(`Event with ID ${id} not found after update`);
    }
    return result;
  }

  remove(id: number) {
    return this.repo.delete(id);
  }

  async getEventsByChapter(
    chapterNumber: number,
    userProgress?: number,
  ): Promise<Event[]> {
    const query = this.repo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.arc', 'arc')
      .leftJoinAndSelect('event.characters', 'characters')
      .where('event.chapterNumber = :chapterNumber', { chapterNumber });

    if (userProgress !== undefined) {
      query.andWhere(
        '(event.spoilerChapter IS NULL OR event.spoilerChapter <= :userProgress)',
        { userProgress },
      );
    }

    return query.getMany();
  }

  async searchEvents(
    searchTerm: string,
    options?: {
      type?: EventType;
      userProgress?: number;
      limit?: number;
    },
  ): Promise<Event[]> {
    const query = this.repo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.arc', 'arc')
      .leftJoinAndSelect('event.characters', 'characters')
      .where('event.title ILIKE :search OR event.description ILIKE :search', {
        search: `%${searchTerm}%`,
      });

    if (options?.type) {
      query.andWhere('event.type = :type', { type: options.type });
    }

    if (options?.userProgress !== undefined) {
      query.andWhere(
        '(event.spoilerChapter IS NULL OR event.spoilerChapter <= :userProgress)',
        { userProgress: options.userProgress },
      );
    }

    if (options?.limit) {
      query.limit(options.limit);
    }

    query.orderBy('event.chapterNumber', 'ASC');
    return query.getMany();
  }

  /**
   * Group events by arc chapter ranges with main/mini arc classification
   */
  async getEventsGroupedByArc(
    userProgress?: number,
    filters?: {
      type?: EventType;
      status?: EventStatus;
    },
  ): Promise<{
    arcs: Array<{
      arc: any;
      events: Event[];
    }>;
    noArc: Event[];
  }> {
    // Get all viewable events
    const eventsQuery = this.repo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.arc', 'arc')
      .leftJoinAndSelect('event.characters', 'characters');

    if (userProgress !== undefined) {
      eventsQuery.andWhere(
        '(event.spoilerChapter IS NULL OR event.spoilerChapter <= :userProgress)',
        { userProgress },
      );
    }

    if (filters?.type) {
      eventsQuery.andWhere('event.type = :type', { type: filters.type });
    }

    if (filters?.status !== undefined) {
      eventsQuery.andWhere('event.status = :status', {
        status: filters.status,
      });
    }

    eventsQuery.orderBy('event.chapterNumber', 'ASC');
    const events = await eventsQuery.getMany();

    // Group events by arc
    const arcGroups: { [arcId: number]: Event[] } = {};
    const noArcEvents: Event[] = [];

    events.forEach((event) => {
      if (event.arc) {
        if (!arcGroups[event.arc.id]) {
          arcGroups[event.arc.id] = [];
        }
        arcGroups[event.arc.id].push(event);
      } else {
        noArcEvents.push(event);
      }
    });

    // Create arc groups
    const arcs: Array<{ arc: any; events: Event[] }> = [];

    for (const [arcId, arcEvents] of Object.entries(arcGroups)) {
      const arc = arcEvents[0].arc; // Arc is already loaded via leftJoinAndSelect
      const arcGroup = { arc, events: arcEvents };
      arcs.push(arcGroup);
    }

    // Sort arc groups by arc order
    arcs.sort((a, b) => (a.arc.order || 0) - (b.arc.order || 0));

    return {
      arcs,
      noArc: noArcEvents,
    };
  }

  async findGroupedByArc(filters?: {
    userProgress?: number;
    type?: EventType;
    status?: EventStatus;
  }) {
    return this.getEventsGroupedByArc(filters?.userProgress, {
      type: filters?.type,
      status: filters?.status,
    });
  }
}
