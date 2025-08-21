import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChapterSpoiler } from './chapter_spoiler.entity';

@Injectable()
export class ChapterSpoilersService {
  constructor(@InjectRepository(ChapterSpoiler) private repo: Repository<ChapterSpoiler>) {}

  findAll(): Promise<ChapterSpoiler[]> {
    return this.repo.find({ relations: ['event', 'chapter'] });
  }

  findOne(id: number): Promise<ChapterSpoiler | null> {
    return this.repo.findOne({ where: { id }, relations: ['event', 'chapter'] });
  }

  create(data: Partial<ChapterSpoiler>): Promise<ChapterSpoiler> {
    const cs = this.repo.create(data);
    return this.repo.save(cs);
  }

  update(id: number, data: Partial<ChapterSpoiler>) {
    return this.repo.update(id, data);
  }

  remove(id: number) {
    return this.repo.delete(id);
  }
}
