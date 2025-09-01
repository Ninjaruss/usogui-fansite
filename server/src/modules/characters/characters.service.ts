import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Character } from '../../entities/character.entity';
import { UpdateCharacterImageDto } from './dto/update-character-image.dto';

@Injectable()
export class CharactersService {
  constructor(
    @InjectRepository(Character) private repo: Repository<Character>,
  ) {}

  /**
   * Pagination: page (default 1), limit (default 20)
   */
  async findAll(filters: {
    name?: string;
    arc?: string;
    description?: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'ASC' | 'DESC';
  }) {
    const { page = 1, limit = 20, sort, order = 'ASC' } = filters;
    const query = this.repo.createQueryBuilder('character');

    if (filters.name) {
      query.andWhere('LOWER(character.name) LIKE LOWER(:name)', {
        name: `%${filters.name}%`,
      });
    }
    // `arc` relation does not exist on Character entity; skip arc filtering
    // series removed
    if (filters.description) {
      query.andWhere('LOWER(character.description) LIKE LOWER(:description)', {
        description: `%${filters.description}%`,
      });
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

  async updateImage(id: number, imageData: UpdateCharacterImageDto): Promise<Character> {
    const character = await this.repo.findOne({ where: { id } });
    if (!character) {
      throw new NotFoundException(`Character with id ${id} not found`);
    }

    const updateData: Partial<Character> = {};
    if (imageData.imageFileName !== undefined) {
      updateData.imageFileName = imageData.imageFileName;
    }
    if (imageData.imageDisplayName !== undefined) {
      updateData.imageDisplayName = imageData.imageDisplayName || null;
    }

    // Only update if we have data to update
    if (Object.keys(updateData).length > 0) {
      await this.repo
        .createQueryBuilder()
        .update(Character)
        .set(updateData)
        .where("id = :id", { id })
        .execute();
    }

    const updatedCharacter = await this.repo.findOne({ where: { id } });
    if (!updatedCharacter) {
      throw new NotFoundException(`Character with id ${id} not found after update`);
    }
    return updatedCharacter;
  }

  async removeImage(id: number): Promise<Character> {
    const character = await this.repo.findOne({ where: { id } });
    if (!character) {
      throw new NotFoundException(`Character with id ${id} not found`);
    }

    // Use query builder to ensure proper update
    await this.repo
      .createQueryBuilder()
      .update(Character)
      .set({
        imageFileName: null,
        imageDisplayName: null,
      })
      .where("id = :id", { id })
      .execute();

    const updatedCharacter = await this.repo.findOne({ where: { id } });
    if (!updatedCharacter) {
      throw new NotFoundException(`Character with id ${id} not found after update`);
    }
    return updatedCharacter;
  }
}
