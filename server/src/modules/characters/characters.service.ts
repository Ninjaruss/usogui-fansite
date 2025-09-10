import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Character } from '../../entities/character.entity';
import { Gamble } from '../../entities/gamble.entity';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { UpdateCharacterImageDto } from './dto/update-character-image.dto';
import { PageViewsService } from '../page-views/page-views.service';
import { PageType } from '../../entities/page-view.entity';

@Injectable()
export class CharactersService {
  constructor(
    @InjectRepository(Character) private repo: Repository<Character>,
    @InjectRepository(Gamble) private gamblesRepository: Repository<Gamble>,
    private readonly pageViewsService: PageViewsService,
  ) {}

  /**
   * Pagination: page (default 1), limit (default 20)
   */
  async findAll(filters: {
    name?: string;
    arc?: string;
    arcId?: number;
    faction?: string;
    description?: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'ASC' | 'DESC';
  }) {
    const {
      name,
      arc,
      arcId,
      faction,
      description,
      page = 1,
      limit = 20,
      sort = 'name',
      order = 'ASC',
    } = filters;

    const qb = this.repo.createQueryBuilder('character');

    if (name) {
      qb.andWhere(
        '(LOWER(character.name) LIKE LOWER(:name) OR character.alternateNames ILIKE :name)',
        {
          name: `%${name}%`,
        },
      );
    }

    if (arcId) {
      qb.innerJoin('character.characterArcs', 'ca')
        .innerJoin('ca.arc', 'arc')
        .andWhere('arc.id = :arcId', { arcId });
    } else if (arc) {
      qb.innerJoin('character.characterArcs', 'ca')
        .innerJoin('ca.arc', 'arc')
        .andWhere('LOWER(arc.name) LIKE LOWER(:arc)', { arc: `%${arc}%` });
    }

    if (faction) {
      qb.andWhere(':faction = ANY(character.affiliations)', { faction });
    }

    if (description) {
      qb.andWhere('LOWER(character.description) LIKE LOWER(:description)', {
        description: `%${description}%`,
      });
    }

    // Sorting
    const allowedSorts = ['name', 'firstAppearanceChapter', 'createdAt'];
    if (allowedSorts.includes(sort)) {
      qb.orderBy(`character.${sort}`, order);
    } else {
      qb.orderBy('character.name', 'ASC');
    }

    // Pagination
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      totalPages,
    };
  }

  async findOne(id: number): Promise<Character> {
    const character = await this.repo.findOne({ where: { id } });

    if (!character) {
      throw new NotFoundException(`Character with id ${id} not found`);
    }
    return character;
  }

  async create(createCharacterDto: CreateCharacterDto): Promise<Character> {
    const character = this.repo.create(createCharacterDto);
    return this.repo.save(character);
  }

  async update(
    id: number,
    updateCharacterDto: UpdateCharacterDto,
  ): Promise<Character> {
    const result = await this.repo.update(id, updateCharacterDto);
    if (result.affected === 0) {
      throw new NotFoundException(`Character with id ${id} not found`);
    }
    return this.findOne(id);
  }

  async updateImage(
    id: number,
    updateCharacterImageDto: UpdateCharacterImageDto,
  ): Promise<Character> {
    const result = await this.repo.update(id, updateCharacterImageDto);
    if (result.affected === 0) {
      throw new NotFoundException(`Character with id ${id} not found`);
    }
    return this.findOne(id);
  }

  async removeImage(id: number): Promise<Character> {
    const result = await this.repo.update(id, {
      imageFileName: null,
      imageDisplayName: null,
    });
    if (result.affected === 0) {
      throw new NotFoundException(`Character with id ${id} not found`);
    }
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ affected: number }> {
    const result = await this.repo.delete(id);
    if (!result.affected || result.affected === 0) {
      throw new NotFoundException(`Character with id ${id} not found`);
    }
    return { affected: result.affected };
  }

  // Character-related associations
  async getCharacterGambles(
    characterId: number,
    options: { page: number; limit: number },
  ) {
    const { page, limit } = options;
    const character = await this.repo.findOne({ where: { id: characterId } });
    if (!character) {
      throw new NotFoundException(`Character with id ${characterId} not found`);
    }

    const offset = (page - 1) * limit;

    // First get the total count
    const countQuery = `
      SELECT COUNT(DISTINCT g.id) as total_count
      FROM gamble g
      INNER JOIN gamble_participants gc ON g.id = gc."gambleId"
      WHERE gc."characterId" = $1
    `;

    const countResult = await this.repo.query(countQuery, [characterId]);
    const total = parseInt(countResult[0].total_count) || 0;

    // Then get the actual data
    const dataQuery = `
      SELECT DISTINCT g.*
      FROM gamble g
      INNER JOIN gamble_participants gc ON g.id = gc."gambleId"
      WHERE gc."characterId" = $1
      ORDER BY g."createdAt" DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await this.repo.query(dataQuery, [
      characterId,
      limit,
      offset,
    ]);

    const data = result.map((row) => {
      return row;
    });

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCharacterEvents(
    characterId: number,
    options: { page: number; limit: number },
    userProgress?: number,
  ) {
    const { page, limit } = options;
    const character = await this.repo.findOne({ where: { id: characterId } });
    if (!character) {
      throw new NotFoundException(`Character with id ${characterId} not found`);
    }

    const offset = (page - 1) * limit;
    const searchTerm = `%${character.name}%`;

    // Build the base query - search both through relationships and text mentions
    const whereClause = `
      (ec."characterId" = $1 
       OR LOWER(e.title) LIKE LOWER($2) 
       OR LOWER(e.description) LIKE LOWER($2))
    `;
    const params = [characterId, searchTerm];

    // Note: Removed server-side spoiler filtering to allow client-side spoiler wrapping
    // Client will handle spoiler protection with SpoilerWrapper components

    // Get paginated unique event IDs with proper ordering first
    const paginatedQuery = `
      WITH unique_events AS (
        SELECT DISTINCT e.id, e."chapterNumber", e."createdAt"
        FROM event e
        LEFT JOIN event_characters_character ec ON e.id = ec."eventId"
        WHERE ${whereClause}
        ORDER BY e."chapterNumber" ASC, e."createdAt" DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      ),
      total_count AS (
        SELECT COUNT(DISTINCT e.id) as count
        FROM event e
        LEFT JOIN event_characters_character ec ON e.id = ec."eventId"
        WHERE ${whereClause}
      )
      SELECT e.*, u.username as author_name, a.name as arc_name, tc.count as total_count
      FROM unique_events ue
      JOIN event e ON ue.id = e.id
      LEFT JOIN "user" u ON e."createdById" = u.id
      LEFT JOIN arc a ON e."arcId" = a.id
      CROSS JOIN total_count tc
      ORDER BY e."chapterNumber" ASC, e."createdAt" DESC
    `;

    const result = await this.repo.query(paginatedQuery, [
      ...params,
      limit,
      offset,
    ]);

    const total = result.length > 0 ? parseInt(result[0].total_count) : 0;
    const data = result.map((row) => {
      const { total_count, author_name, arc_name, ...event } = row;
      return {
        ...event,
        author: { username: author_name },
        arcName: arc_name,
      };
    });

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCharacterQuotes(
    characterId: number,
    options: { page: number; limit: number },
  ) {
    const { page, limit } = options;
    const character = await this.repo.findOne({ where: { id: characterId } });
    if (!character) {
      throw new NotFoundException(`Character with id ${characterId} not found`);
    }

    // Query quotes directly from the quotes table
    const query = `
      SELECT q.*, c.name as character_name, u.username as submitted_by_username, 
             COUNT(*) OVER() as total_count
      FROM quote q
      LEFT JOIN character c ON q."characterId" = c.id
      LEFT JOIN "user" u ON q."submittedById" = u.id
      WHERE q."characterId" = $1
      ORDER BY q."chapterNumber" ASC, q."pageNumber" ASC, q."createdAt" DESC
      LIMIT $2 OFFSET $3
    `;

    const offset = (page - 1) * limit;

    const result = await this.repo.query(query, [characterId, limit, offset]);

    const total = result.length > 0 ? parseInt(result[0].total_count) : 0;
    const data = result.map((row) => {
      const { total_count, character_name, submitted_by_username, ...quote } =
        row;
      return {
        ...quote,
        character: { name: character_name },
        submittedBy: submitted_by_username
          ? { username: submitted_by_username }
          : null,
      };
    });

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCharacterGuides(
    characterId: number,
    options: { page: number; limit: number },
  ) {
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
    const data = result.map((row) => {
      const { total_count, author_name, ...guide } = row;
      return {
        ...guide,
        author: { username: author_name },
      };
    });

    // Get unique view counts for all guides
    const guideIds = data.map((guide) => guide.id);
    const viewCounts =
      guideIds.length > 0
        ? await this.pageViewsService.getUniqueViewCounts(
            PageType.GUIDE,
            guideIds,
          )
        : new Map<number, number>();

    // Add unique view counts to each guide
    const dataWithViewCounts = data.map((guide) => ({
      ...guide,
      viewCount: viewCounts.get(guide.id) || 0,
    }));

    return {
      data: dataWithViewCounts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCharacterArcs(characterId: number) {
    const character = await this.repo.findOne({ where: { id: characterId } });
    if (!character) {
      throw new NotFoundException(`Character with id ${characterId} not found`);
    }

    // First get the total count
    const countQuery = `
      SELECT COUNT(DISTINCT a.id) as total_count
      FROM arc a
      INNER JOIN event e ON e."arcId" = a.id
      INNER JOIN event_characters_character ecc ON ecc."eventId" = e.id
      WHERE ecc."characterId" = $1
    `;

    const countResult = await this.repo.query(countQuery, [characterId]);
    const total = parseInt(countResult[0].total_count) || 0;

    // Then get the actual data
    const dataQuery = `
      SELECT DISTINCT a.id, a.name, a."order", a.description
      FROM arc a
      INNER JOIN event e ON e."arcId" = a.id
      INNER JOIN event_characters_character ecc ON ecc."eventId" = e.id
      WHERE ecc."characterId" = $1
      ORDER BY a."order" ASC, a.name ASC
    `;

    const result = await this.repo.query(dataQuery, [characterId]);

    const data = result.map((row) => {
      return row;
    });

    return {
      data,
      total,
    };
  }
}
