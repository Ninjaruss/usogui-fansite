import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Arc } from '../../entities/arc.entity';
import { Chapter } from '../../entities/chapter.entity';
import { CreateArcDto } from './dto/create-arc.dto';

@Injectable()
export class ArcsService {
  constructor(
    @InjectRepository(Arc) private repo: Repository<Arc>,
    @InjectRepository(Chapter) private chapterRepo: Repository<Chapter>
  ) {}

  /**
   * Pagination: page (default 1), limit (default 20)
   */
  async findAll(filters: { name?: string; description?: string; page?: number; limit?: number; sort?: string; order?: 'ASC' | 'DESC' }) {
    const { page = 1, limit = 20, sort, order = 'ASC' } = filters;
  const query = this.repo.createQueryBuilder('arc');

    if (filters.name) {
      query.andWhere('LOWER(arc.name) LIKE LOWER(:name)', { name: `%${filters.name}%` });
    }
  // series removed
    if (filters.description) {
      query.andWhere('LOWER(arc.description) LIKE LOWER(:description)', { description: `%${filters.description}%` });
    }

    // Sorting: only allow certain fields for safety
    const allowedSort = ['id', 'name', 'description', 'order'];
    if (sort && allowedSort.includes(sort)) {
      query.orderBy(`arc.${sort}`, order);
    } else {
      query.orderBy('arc.order', 'ASC'); // Default: canonical order
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

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: CreateArcDto) {
    const arc = this.repo.create({
      name: data.name,
      order: data.order,
      description: data.description,
      startChapter: data.startChapter,
      endChapter: data.endChapter
    });
    return this.repo.save(arc);
  }

  update(id: number, data: Partial<Arc>) {
    return this.repo.update(id, data);
  }

  remove(id: number) {
    return this.repo.delete(id);
  }

  async getChaptersInArc(arcId: number): Promise<Chapter[]> {
  const arc = await this.repo.findOne({ where: { id: arcId } });
    
    if (!arc) {
      throw new NotFoundException(`Arc with id ${arcId} not found`);
    }

    if (!arc.startChapter || !arc.endChapter) {
      return [];
    }
    
    return this.chapterRepo.find({
      where: {
        number: Between(arc.startChapter, arc.endChapter)
      },
      order: { number: 'ASC' }
    });
  }
}
