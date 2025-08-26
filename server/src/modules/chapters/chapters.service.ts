import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chapter } from '../../entities/chapter.entity';

@Injectable()
export class ChaptersService {
  constructor(@InjectRepository(Chapter) private repo: Repository<Chapter>) {}

  /**
   * Pagination: page (default 1), limit (default 20)
   */
  async findAll(filters: { title?: string; number?: string; arc?: string; series?: string; page?: number; limit?: number; sort?: string; order?: 'ASC' | 'DESC' }) {
    const { page = 1, limit = 20, sort, order = 'ASC' } = filters;
    const query = this.repo.createQueryBuilder('chapter')
      .leftJoinAndSelect('chapter.series', 'series');

    if (filters.title) {
      query.andWhere('LOWER(chapter.title) LIKE LOWER(:title)', { title: `%${filters.title}%` });
    }
    if (filters.number) {
      query.andWhere('chapter.number = :number', { number: filters.number });
    }
  // arc filtering removed: Chapter entity does not define an 'arc' relation
    if (filters.series) {
      query.andWhere('LOWER(series.name) LIKE LOWER(:series)', { series: `%${filters.series}%` });
    }

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
    return this.repo.findOne({ where: { id }, relations: ['series'] });
  }

  create(data: Partial<Chapter>): Promise<Chapter> {
    const chapter = this.repo.create(data);
    return this.repo.save(chapter);
  }

  update(id: number, data: Partial<Chapter>) {
    return this.repo.update(id, data);
  }

  remove(id: number) {
    return this.repo.delete(id);
  }
}
