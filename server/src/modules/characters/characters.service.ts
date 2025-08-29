import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Character } from '../../entities/character.entity';

@Injectable()
export class CharactersService {
  constructor(@InjectRepository(Character) private repo: Repository<Character>) {}

  /**
   * Pagination: page (default 1), limit (default 20)
   */
  async findAll(filters: { name?: string; arc?: string; description?: string; page?: number; limit?: number; sort?: string; order?: 'ASC' | 'DESC' }) {
    const { page = 1, limit = 20, sort, order = 'ASC' } = filters;
  const query = this.repo.createQueryBuilder('character');

    if (filters.name) {
      query.andWhere('LOWER(character.name) LIKE LOWER(:name)', { name: `%${filters.name}%` });
    }
  // `arc` relation does not exist on Character entity; skip arc filtering
  // series removed
    if (filters.description) {
      query.andWhere('LOWER(character.description) LIKE LOWER(:description)', { description: `%${filters.description}%` });
    }

    // Sorting: only allow certain fields for safety
    const allowedSort = ['id', 'name', 'description'];
    if (sort && allowedSort.includes(sort)) {
      query.orderBy(`character.${sort}`, order);
    } else {
      query.orderBy('character.id', 'ASC');
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

  findOne(id: number): Promise<Character | null> {
    return this.repo.findOne({ where: { id } });
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
