import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Arc } from './arc.entity';

@Injectable()
export class ArcsService {
  constructor(@InjectRepository(Arc) private repo: Repository<Arc>) {}

  findAll() {
    return this.repo.find({ relations: ['series', 'characters'] });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id }, relations: ['series', 'characters'] });
  }

  create(data: Partial<Arc>) {
    const arc = this.repo.create(data);
    return this.repo.save(arc);
  }

  update(id: number, data: Partial<Arc>) {
    return this.repo.update(id, data);
  }

  remove(id: number) {
    return this.repo.delete(id);
  }
}
