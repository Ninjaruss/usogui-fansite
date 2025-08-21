import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './event.entity';

@Injectable()
export class EventsService {
  constructor(@InjectRepository(Event) private repo: Repository<Event>) {}

  findAll(): Promise<Event[]> {
    return this.repo.find({ relations: ['arc', 'characters', 'series'] });
  }

  findOne(id: number): Promise<Event | null> {
    return this.repo.findOne({ where: { id }, relations: ['arc', 'characters', 'series'] });
  }

  create(data: Partial<Event>): Promise<Event> {
    const event = this.repo.create(data);
    return this.repo.save(event);
  }

  update(id: number, data: Partial<Event>) {
    return this.repo.update(id, data);
  }

  remove(id: number) {
    return this.repo.delete(id);
  }
}
