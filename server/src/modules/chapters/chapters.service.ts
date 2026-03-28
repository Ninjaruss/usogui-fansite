import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chapter } from '../../entities/chapter.entity';
import { EditLogService } from '../edit-log/edit-log.service';
import { EditLogEntityType } from '../../entities/edit-log.entity';

@Injectable()
export class ChaptersService {
  constructor(
    @InjectRepository(Chapter) private repo: Repository<Chapter>,
    private readonly editLogService: EditLogService,
  ) {}

  /**
   * Pagination: page (default 1), limit (default 20)
   */
  async findAll(filters: {
    title?: string;
    number?: string;
    arc?: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'ASC' | 'DESC';
  }) {
    const { page = 1, limit = 20, sort, order = 'ASC' } = filters;
    const query = this.repo.createQueryBuilder('chapter');

    if (filters.title) {
      query.andWhere('LOWER(chapter.title) LIKE LOWER(:title)', {
        title: `%${filters.title}%`,
      });
    }
    if (filters.number) {
      query.andWhere('chapter.number = :number', { number: filters.number });
    }
    // arc filtering removed: Chapter entity does not define an 'arc' relation
    // series removed

    // Sorting: only allow certain fields for safety
    const allowedSort = ['id', 'title', 'number'];
    if (sort && allowedSort.includes(sort)) {
      // If sorting by number, cast to integer for correct order
      if (sort === 'number') {
        query.orderBy('chapter.number', order);
      } else {
        query.orderBy(`chapter.${sort}`, order);
      }
    } else {
      query.orderBy('chapter.id', 'ASC');
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

  findOne(id: number): Promise<Chapter | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByNumber(number: number): Promise<Chapter | null> {
    return this.repo.findOne({ where: { number } });
  }

  async create(data: Partial<Chapter>, userId: number): Promise<Chapter> {
    const chapter = this.repo.create(data);
    const saved = await this.repo.save(chapter);
    await this.editLogService.logCreate(EditLogEntityType.CHAPTER, saved.id, userId);
    return saved;
  }

  async update(id: number, data: Partial<Chapter>, userId: number) {
    const result = await this.repo.update(id, data);
    if (result.affected && result.affected > 0) {
      const changedFields = Object.keys(data).filter(k => data[k as keyof typeof data] !== undefined);
      await this.editLogService.logUpdate(EditLogEntityType.CHAPTER, id, userId, changedFields);
    }
    return result;
  }

  async remove(id: number, userId: number) {
    await this.editLogService.logDelete(EditLogEntityType.CHAPTER, id, userId);
    return this.repo.delete(id);
  }
}
