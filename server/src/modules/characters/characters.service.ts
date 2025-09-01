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

  async getCharacterGambles(characterId: number, options: { page: number; limit: number }) {
    const { page, limit } = options;
    const character = await this.repo.findOne({ where: { id: characterId } });
    if (!character) {
      throw new NotFoundException(`Character with id ${characterId} not found`);
    }

    // Since there's no direct relationship, we'll search for gambles that mention the character
    // This is a simple text search - in a real app you might want a proper relationship
    const query = `
      SELECT g.*, COUNT(*) OVER() as total_count
      FROM gamble g
      WHERE LOWER(g.name) LIKE LOWER($1) 
         OR LOWER(g.rules) LIKE LOWER($1)
         OR LOWER(g."winCondition") LIKE LOWER($1)
      ORDER BY g.id ASC
      LIMIT $2 OFFSET $3
    `;
    
    const searchTerm = `%${character.name}%`;
    const offset = (page - 1) * limit;
    
    const result = await this.repo.query(query, [searchTerm, limit, offset]);
    
    const total = result.length > 0 ? parseInt(result[0].total_count) : 0;
    const data = result.map(row => {
      const { total_count, ...gamble } = row;
      return gamble;
    });
    
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCharacterEvents(characterId: number, options: { page: number; limit: number }) {
    const { page, limit } = options;
    const character = await this.repo.findOne({ where: { id: characterId } });
    if (!character) {
      throw new NotFoundException(`Character with id ${characterId} not found`);
    }

    // Search for events that mention the character, ordered chronologically
    const query = `
      SELECT e.*, COUNT(*) OVER() as total_count
      FROM event e
      WHERE LOWER(e.title) LIKE LOWER($1) 
         OR LOWER(e.description) LIKE LOWER($1)
      ORDER BY e."startChapter" ASC, e.id ASC
      LIMIT $2 OFFSET $3
    `;
    
    const searchTerm = `%${character.name}%`;
    const offset = (page - 1) * limit;
    
    const result = await this.repo.query(query, [searchTerm, limit, offset]);
    
    const total = result.length > 0 ? parseInt(result[0].total_count) : 0;
    const data = result.map(row => {
      const { total_count, ...event } = row;
      return event;
    });
    
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCharacterGuides(characterId: number, options: { page: number; limit: number }) {
    const { page, limit } = options;
    const character = await this.repo.findOne({ where: { id: characterId } });
    if (!character) {
      throw new NotFoundException(`Character with id ${characterId} not found`);
    }

    // Search for guides that mention the character
    const query = `
      SELECT g.*, u.username as author_name, COUNT(*) OVER() as total_count
      FROM guide g
      LEFT JOIN "user" u ON g."authorId" = u.id
      WHERE g.status = 'published' 
        AND (LOWER(g.title) LIKE LOWER($1) 
             OR LOWER(g.description) LIKE LOWER($1)
             OR LOWER(g.content) LIKE LOWER($1))
      ORDER BY g."likeCount" DESC, g."createdAt" DESC
      LIMIT $2 OFFSET $3
    `;
    
    const searchTerm = `%${character.name}%`;
    const offset = (page - 1) * limit;
    
    const result = await this.repo.query(query, [searchTerm, limit, offset]);
    
    const total = result.length > 0 ? parseInt(result[0].total_count) : 0;
    const data = result.map(row => {
      const { total_count, author_name, ...guide } = row;
      return {
        ...guide,
        author: { username: author_name }
      };
    });
    
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
