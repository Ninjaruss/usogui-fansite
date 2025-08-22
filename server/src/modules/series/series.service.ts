import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Series } from '../../entities/series.entity';
import { CreateSeriesDto } from './dto/create-series.dto';

@Injectable()
export class SeriesService {
  constructor(
    @InjectRepository(Series)
    private seriesRepo: Repository<Series>,
  ) {}

  /**
   * Pagination and sorting: page (default 1), limit (default 20), sort (id, name, order), order (ASC/DESC)
   */
  async findAll(filters: { page?: number; limit?: number; sort?: string; order?: 'ASC' | 'DESC' }) {
    const { page = 1, limit = 20, sort, order = 'ASC' } = filters;
    const query = this.seriesRepo.createQueryBuilder('series');

    // Sorting: only allow certain fields for safety
    const allowedSort = ['id', 'name', 'order'];
    if (sort && allowedSort.includes(sort)) {
      query.orderBy(`series.${sort}`, order);
    } else {
      query.orderBy('series.order', 'ASC'); // Default: canonical order
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
    return this.seriesRepo.findOne({ where: { id } });
  }

  create(dto: CreateSeriesDto) {
    if (!dto.name) {
      throw new BadRequestException('Title is required');
    }
    const series = this.seriesRepo.create({
      name: dto.name,
      order: dto.order,
      description: dto.description
    });
    return this.seriesRepo.save(series);
  }

  update(id: number, data: Partial<Series>) {
    return this.seriesRepo.update(id, data);
  }

  remove(id: number) {
    return this.seriesRepo.delete(id);
  }
}
