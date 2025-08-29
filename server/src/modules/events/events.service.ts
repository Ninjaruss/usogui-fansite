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
    order?: 'ASC' | 'DESC' 
  }) {
    const { page = 1, limit = 20, sort, order = 'ASC' } = filters;
    const query = this.repo.createQueryBuilder('event')
      .leftJoinAndSelect('event.arc', 'arc')
      .leftJoinAndSelect('event.characters', 'characters');

    if (filters.title) {
      query.andWhere('LOWER(event.title) LIKE LOWER(:title)', { title: `%${filters.title}%` });
    }
    if (filters.arc) {
      query.andWhere('LOWER(arc.name) LIKE LOWER(:arc)', { arc: `%${filters.arc}%` });
    }
  // series filter removed
    if (filters.description) {
      query.andWhere('LOWER(event.description) LIKE LOWER(:description)', { description: `%${filters.description}%` });
    }
    if (filters.type) {
      query.andWhere('event.type = :type', { type: filters.type });
    }
    if (filters.isVerified !== undefined) {
      query.andWhere('event.isVerified = :isVerified', { isVerified: filters.isVerified });
    }

    // Spoiler protection: only show events user can safely view
    if (filters.userProgress !== undefined) {
      query.andWhere(
        '(event.spoilerChapter IS NULL OR event.spoilerChapter <= :userProgress)',
        { userProgress: filters.userProgress }
      );
    }

    // Sorting: only allow certain fields for safety
    const allowedSort = ['id', 'title', 'description', 'startChapter', 'type'];
    if (sort && allowedSort.includes(sort)) {
      query.orderBy(`event.${sort}`, order);
    } else {
      query.orderBy('event.startChapter', 'ASC');
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

  async findViewableEvents(userProgress: number, filters?: {
    type?: EventType;
    isVerified?: boolean;
    arc?: string;
  }): Promise<Event[]> {
    const query = this.repo.createQueryBuilder('event')
      .leftJoinAndSelect('event.arc', 'arc')
      .leftJoinAndSelect('event.characters', 'characters')
      .where('(event.spoilerChapter IS NULL OR event.spoilerChapter <= :userProgress)', 
        { userProgress });

    if (filters?.type) {
      query.andWhere('event.type = :type', { type: filters.type });
    }
    if (filters?.isVerified !== undefined) {
      query.andWhere('event.isVerified = :isVerified', { isVerified: filters.isVerified });
    }
    if (filters?.arc) {
      query.andWhere('LOWER(arc.name) LIKE LOWER(:arc)', { arc: `%${filters.arc}%` });
    }
  // series filter intentionally removed

    query.orderBy('event.startChapter', 'ASC');
    return query.getMany();
  }

  async canViewEvent(eventId: number, userProgress: number): Promise<boolean> {
    const event = await this.repo.findOne({ 
      where: { id: eventId },
      select: ['spoilerChapter']
    });
    
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    return event.spoilerChapter === null || event.spoilerChapter <= userProgress;
  }

  async findByType(type: EventType, userProgress?: number): Promise<Event[]> {
    const query = this.repo.createQueryBuilder('event')
      .leftJoinAndSelect('event.arc', 'arc')
      .leftJoinAndSelect('event.characters', 'characters')
      .where('event.type = :type', { type });

    if (userProgress !== undefined) {
      query.andWhere(
        '(event.spoilerChapter IS NULL OR event.spoilerChapter <= :userProgress)',
        { userProgress }
      );
    }

    query.orderBy('event.startChapter', 'ASC');
    return query.getMany();
  }

  findOne(id: number): Promise<Event | null> {
      return this.repo.findOne({ 
        where: { id }, 
        relations: ['arc', 'characters', 'tags'] 
      });
  }

  async create(data: CreateEventDto): Promise<Event> {
    const event = this.repo.create({
      ...data,
      type: data.type || EventType.OTHER,
      isVerified: data.isVerified || false
    });
    return this.repo.save(event);
  }

  update(id: number, data: UpdateEventDto) {
    return this.repo.update(id, data);
  }

  remove(id: number) {
    return this.repo.delete(id);
  }

  async getEventsByChapter(chapterNumber: number, userProgress?: number): Promise<Event[]> {
    const query = this.repo.createQueryBuilder('event')
      .leftJoinAndSelect('event.arc', 'arc')
      .leftJoinAndSelect('event.characters', 'characters')
      .where('event.startChapter <= :chapterNumber', { chapterNumber })
      .andWhere('(event.endChapter IS NULL OR event.endChapter >= :chapterNumber)', { chapterNumber });

    if (userProgress !== undefined) {
      query.andWhere(
        '(event.spoilerChapter IS NULL OR event.spoilerChapter <= :userProgress)',
        { userProgress }
      );
    }

    return query.getMany();
  }

  async searchEvents(searchTerm: string, options?: {
    type?: EventType;
    userProgress?: number;
    limit?: number;
  }): Promise<Event[]> {
    const query = this.repo.createQueryBuilder('event')
      .leftJoinAndSelect('event.arc', 'arc')
      .leftJoinAndSelect('event.characters', 'characters')
      .where('event.title ILIKE :search OR event.description ILIKE :search', {
        search: `%${searchTerm}%`
      });

    if (options?.type) {
      query.andWhere('event.type = :type', { type: options.type });
    }

    if (options?.userProgress !== undefined) {
      query.andWhere(
        '(event.spoilerChapter IS NULL OR event.spoilerChapter <= :userProgress)',
        { userProgress: options.userProgress }
      );
    }

    if (options?.limit) {
      query.limit(options.limit);
    }

    query.orderBy('event.startChapter', 'ASC');
    return query.getMany();
  }
}
