import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Faction } from '../../entities/faction.entity';

@Injectable()
export class FactionsService {
  constructor(@InjectRepository(Faction) private repo: Repository<Faction>) {}

  /**
   * Sorting: sort (id, name), order (ASC/DESC)
   */
  async findAll(filters: { sort?: string; order?: 'ASC' | 'DESC'; page?: number; limit?: number } = {}): Promise<{ data: Faction[]; total: number; page: number; totalPages: number }> {
    const { sort, order = 'ASC', page = 1, limit = 1000 } = filters;
    const query = this.repo.createQueryBuilder('faction').leftJoinAndSelect('faction.characters', 'characters');
    const allowedSort = ['id', 'name'];
    if (sort && allowedSort.includes(sort)) {
      query.orderBy(`faction.${sort}`, order);
    } else {
      query.orderBy('faction.name', 'ASC');
    }

    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { data, total, page, totalPages };
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
