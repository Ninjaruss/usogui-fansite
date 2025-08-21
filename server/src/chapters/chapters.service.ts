import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chapter } from './chapter.entity';

@Injectable()
export class ChaptersService {
  constructor(@InjectRepository(Chapter) private repo: Repository<Chapter>) {}

  findAll(): Promise<Chapter[]> {
    return this.repo.find({ relations: ['arc', 'series'] });
  }

  findOne(id: number): Promise<Chapter | null> {
    return this.repo.findOne({ where: { id }, relations: ['arc', 'series'] });
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
