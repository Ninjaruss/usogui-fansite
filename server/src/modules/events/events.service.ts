import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event, EventType } from '../../entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(@InjectRepository(Event) private repo: Repository<Event>) {}

  /**
   * Find all events with filtering and spoiler protection
   */
  async findAll(filters: {
    title?: string;
    arc?: string;
    description?: string;
    type?: EventType;
    userProgress?: number;
    isVerified?: boolean;
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
    if (filters.isVerified !== undefined) {
      query.andWhere('event.isVerified = :isVerified', {
        isVerified: filters.isVerified,
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
      isVerified?: boolean;
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
    if (filters?.isVerified !== undefined) {
      query.andWhere('event.isVerified = :isVerified', {
        isVerified: filters.isVerified,
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

  findOne(id: number): Promise<Event | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['arc', 'characters', 'tags'],
    });
  }

  async create(data: CreateEventDto): Promise<Event> {
    const event = this.repo.create({
      ...data,
      type: data.type || EventType.OTHER,
      isVerified: data.isVerified || false,
    });
    return this.repo.save(event);
  }

  update(id: number, data: UpdateEventDto) {
    return this.repo.update(id, data);
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
      isVerified?: boolean;
    },
  ): Promise<{
    mainArcs: Array<{
      arc: any;
      events: Event[];
    }>;
    miniArcs: Array<{
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

    if (filters?.isVerified !== undefined) {
      eventsQuery.andWhere('event.isVerified = :isVerified', {
        isVerified: filters.isVerified,
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

    // Get arc details and separate by type
    const mainArcs: Array<{ arc: any; events: Event[] }> = [];
    const miniArcs: Array<{ arc: any; events: Event[] }> = [];

    for (const [arcId, arcEvents] of Object.entries(arcGroups)) {
      const arc = arcEvents[0].arc; // Arc is already loaded via leftJoinAndSelect
      const arcGroup = { arc, events: arcEvents };
      
      if (arc.type === 'mini') {
        miniArcs.push(arcGroup);
      } else {
        mainArcs.push(arcGroup);
      }
    }

    // Sort arc groups by arc order
    mainArcs.sort((a, b) => (a.arc.order || 0) - (b.arc.order || 0));
    miniArcs.sort((a, b) => (a.arc.order || 0) - (b.arc.order || 0));

    return {
      mainArcs,
      miniArcs,
      noArc: noArcEvents,
    };
  }
}
