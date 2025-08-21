import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Faction } from './faction.entity';

@Injectable()
export class FactionsService {
  constructor(@InjectRepository(Faction) private repo: Repository<Faction>) {}

  findAll(): Promise<Faction[]> {
    return this.repo.find({ relations: ['characters'] });
  }

  async findOne(id: number): Promise<Faction> {
    const faction = await this.repo.findOne({ where: { id }, relations: ['characters'] });
    if (!faction) throw new NotFoundException(`Faction with ID ${id} not found`);
    return faction;
  }

  create(data: Partial<Faction>): Promise<Faction> {
    const faction = this.repo.create(data);
    return this.repo.save(faction);
  }

  async update(id: number, data: Partial<Faction>) {
    const result = await this.repo.update(id, data);
    if (result.affected === 0) throw new NotFoundException(`Faction with ID ${id} not found`);
    return this.findOne(id);
  }

  async remove(id: number) {
    const result = await this.repo.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Faction with ID ${id} not found`);
    return { deleted: true };
  }
}
