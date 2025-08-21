import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Character } from './character.entity';

@Injectable()
export class CharactersService {
  constructor(@InjectRepository(Character) private repo: Repository<Character>) {}

  findAll(): Promise<Character[]> {
    return this.repo.find({ relations: ['arc', 'series'] });
  }

  findOne(id: number): Promise<Character | null> {
    return this.repo.findOne({ where: { id }, relations: ['arc', 'series'] });
  }

  create(data: Partial<Character>): Promise<Character> {
    const character = this.repo.create(data);
    return this.repo.save(character);
  }

  update(id: number, data: Partial<Character>) {
    return this.repo.update(id, data);
  }

  remove(id: number) {
    return this.repo.delete(id);
  }
}
