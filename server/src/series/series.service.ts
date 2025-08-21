import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Series } from './series.entity';

@Injectable()
export class SeriesService {
  constructor(
    @InjectRepository(Series)
    private seriesRepo: Repository<Series>,
  ) {}

  findAll() {
    return this.seriesRepo.find();
  }

  findOne(id: number) {
    return this.seriesRepo.findOne({ where: { id } });
  }

  create(data: Partial<Series>) {
    const series = this.seriesRepo.create(data);
    return this.seriesRepo.save(series);
  }

  update(id: number, data: Partial<Series>) {
    return this.seriesRepo.update(id, data);
  }

  remove(id: number) {
    return this.seriesRepo.delete(id);
  }
}
