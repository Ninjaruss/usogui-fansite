import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Character } from '../../entities/character.entity';
import { Gamble } from '../../entities/gamble.entity';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { UpdateCharacterImageDto } from './dto/update-character-image.dto';

@Injectable()
export class CharactersService {
  constructor(
    @InjectRepository(Character) private repo: Repository<Character>,
    @InjectRepository(Gamble) private gamblesRepository: Repository<Gamble>,
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
    const { page = 1, limit = 20, sort, order = 'ASC' } = filters;
    const query = this.repo
      .createQueryBuilder('character')
      .leftJoinAndSelect('character.factions', 'factions');

    // Join with events and arcs for arc filtering
    if (filters.arc || filters.arcId) {
      query
        .leftJoin('character.events', 'events')
        .leftJoin('events.arc', 'arc');
    }

    if (filters.name) {
      query.andWhere('LOWER(character.name) LIKE LOWER(:name)', {
        name: `%${filters.name}%`,
      });
    }
    if (filters.arc) {
      query.andWhere('LOWER(arc.name) LIKE LOWER(:arc)', {
        arc: `%${filters.arc}%`,
      });
    }
    if (filters.arcId) {
      query.andWhere('arc.id = :arcId', {
        arcId: filters.arcId,
      });
    }
    if (filters.faction) {
      query.andWhere('LOWER(factions.name) LIKE LOWER(:faction)', {
        faction: `%${filters.faction}%`,
      });
    }
    if (filters.description) {
      query.andWhere('LOWER(character.description) LIKE LOWER(:description)', {
        description: `%${filters.description}%`,
      });
    }

    // Group by character to avoid duplicates from joins
    if (filters.arc || filters.arcId) {
      query.groupBy('character.id, factions.id');
    }

    // Sorting: only allow certain fields for safety
    const allowedSort = ['id', 'name', 'description', 'firstAppearanceChapter'];
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
    return this.repo.findOne({
      where: { id },
      relations: ['factions', 'media', 'quotes'],
    });
  }

  async create(data: CreateCharacterDto): Promise<Character> {
    const { factionIds, ...characterData } = data;

    // Clean up numeric fields to handle NaN values
    const cleanedData = {
      ...characterData,
      firstAppearanceChapter:
        characterData.firstAppearanceChapter &&
        !isNaN(Number(characterData.firstAppearanceChapter))
          ? Number(characterData.firstAppearanceChapter)
          : null,
    };

    const character = this.repo.create(cleanedData);

    // If faction IDs are provided, set up the relationship
    if (factionIds && factionIds.length > 0) {
      const validFactionIds = factionIds.filter((id) => !isNaN(Number(id)));
      character.factions = validFactionIds.map(
        (id) => ({ id: Number(id) }) as any,
      );
    }

    return this.repo.save(character);
  }

  async update(id: number, data: UpdateCharacterDto): Promise<Character> {
    const { factionIds, ...updateData } = data;

    // Clean up numeric fields to handle NaN values
    const cleanedUpdateData = { ...updateData };
    if (cleanedUpdateData.firstAppearanceChapter !== undefined) {
      cleanedUpdateData.firstAppearanceChapter =
        cleanedUpdateData.firstAppearanceChapter &&
        !isNaN(Number(cleanedUpdateData.firstAppearanceChapter))
          ? Number(cleanedUpdateData.firstAppearanceChapter)
          : undefined;
    }

    // First update the basic character data
    if (Object.keys(cleanedUpdateData).length > 0) {
      await this.repo.update(id, cleanedUpdateData);
    }

    // Get the character with current relationships
    const character = await this.repo.findOne({
      where: { id },
      relations: ['factions'],
    });

    if (!character) {
      throw new NotFoundException(`Character with ID ${id} not found`);
    }

    // Update faction relationships if provided
    if (factionIds !== undefined) {
      const validFactionIds = factionIds.filter(
        (factionId) => !isNaN(Number(factionId)),
      );
      character.factions = validFactionIds.map(
        (factionId) => ({ id: Number(factionId) }) as any,
      );
      await this.repo.save(character);
    }

    const result = await this.findOne(id);
    if (!result) {
      throw new NotFoundException(
        `Character with ID ${id} not found after update`,
      );
    }
    return result;
  }

  remove(id: number) {
    return this.repo.delete(id);
  }

  async updateImage(
    id: number,
    imageData: UpdateCharacterImageDto,
  ): Promise<Character> {
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
        .where('id = :id', { id })
        .execute();
    }

    const updatedCharacter = await this.repo.findOne({ where: { id } });
    if (!updatedCharacter) {
      throw new NotFoundException(
        `Character with id ${id} not found after update`,
      );
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
      .where('id = :id', { id })
      .execute();

    const updatedCharacter = await this.repo.findOne({ where: { id } });
    if (!updatedCharacter) {
      throw new NotFoundException(
        `Character with id ${id} not found after update`,
      );
    }
    return updatedCharacter;
  }

  async getCharacterGambles(
    characterId: number,
    options: { page: number; limit: number },
  ) {
    const { page, limit } = options;
    const character = await this.repo.findOne({ where: { id: characterId } });
    if (!character) {
      throw new NotFoundException(`Character with id ${characterId} not found`);
    }

    // Use proper database relationships to find gambles where the character is a participant or observer
    const queryBuilder = this.gamblesRepository
      .createQueryBuilder('gamble')
      .leftJoinAndSelect('gamble.participants', 'participants')
      .leftJoinAndSelect('participants.character', 'participant_character')
      .leftJoinAndSelect('gamble.rounds', 'rounds')
      .leftJoinAndSelect('gamble.observers', 'observers')
      .leftJoinAndSelect('gamble.chapter', 'chapter')
      .where(
        '(participant_character.id = :characterId OR observers.id = :characterId)',
        { characterId },
      )
      .orderBy('gamble.createdAt', 'DESC');

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      totalPages,
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

    // Use a subquery with UNION to avoid duplicates without DISTINCT
    // Fix JSON column handling by explicitly casting them to JSONB
    const dataQuery = `
      WITH character_events AS (
        SELECT e.id,
               e.title,
               e.description,
               e.type,
               e."chapterNumber",
               e."spoilerChapter",
               e."pageNumbers"::jsonb as "pageNumbers",
               e."isVerified",
               e."chapterReferences"::jsonb as "chapterReferences",
               e."arcId",
               e."createdAt",
               e."updatedAt",
               CASE 
                 WHEN $2::int IS NOT NULL AND (
                   (e."spoilerChapter" IS NOT NULL AND e."spoilerChapter" > $2) OR
                   (e."spoilerChapter" IS NULL AND e."chapterNumber" > $2)
                 ) THEN true 
                 ELSE false 
               END as is_spoiler
        FROM event e
        INNER JOIN event_characters_character ecc ON ecc."eventId" = e.id
        WHERE ecc."characterId" = $1
        
        UNION
        
        SELECT e.id,
               e.title,
               e.description,
               e.type,
               e."chapterNumber",
               e."spoilerChapter",
               e."pageNumbers"::jsonb as "pageNumbers",
               e."isVerified",
               e."chapterReferences"::jsonb as "chapterReferences",
               e."arcId",
               e."createdAt",
               e."updatedAt",
               CASE 
                 WHEN $2::int IS NOT NULL AND (
                   (e."spoilerChapter" IS NOT NULL AND e."spoilerChapter" > $2) OR
                   (e."spoilerChapter" IS NULL AND e."chapterNumber" > $2)
                 ) THEN true 
                 ELSE false 
               END as is_spoiler
        FROM event e
        WHERE NOT EXISTS (
          SELECT 1 FROM event_characters_character ecc2 
          WHERE ecc2."eventId" = e.id AND ecc2."characterId" = $1
        )
        AND (LOWER(e.title) LIKE LOWER($3) OR LOWER(e.description) LIKE LOWER($3))
      )
      SELECT *, COUNT(*) OVER() as total_count
      FROM character_events
      ORDER BY "chapterNumber" ASC, id ASC
      LIMIT $4 OFFSET $5
    `;

    const searchTerm = `%${character.name}%`;

    const result = await this.repo.query(dataQuery, [
      characterId,
      userProgress || null,
      searchTerm,
      limit,
      offset,
    ]);

    const total = result.length > 0 ? parseInt(result[0].total_count) : 0;
    const data = result.map((row) => {
      const { total_count, is_spoiler, ...event } = row;
      return {
        ...event,
        isSpoiler: is_spoiler,
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

  async getCharacterArcs(characterId: number) {
    const character = await this.repo.findOne({ where: { id: characterId } });
    if (!character) {
      throw new NotFoundException(`Character with id ${characterId} not found`);
    }

    // Query arcs where the character appears through events
    const query = `
      SELECT DISTINCT a.id, a.name, a."order", a.description,
             COUNT(*) OVER() as total_count
      FROM arc a
      INNER JOIN event e ON e."arcId" = a.id
      INNER JOIN event_characters_character ecc ON ecc."eventId" = e.id
      WHERE ecc."characterId" = $1
      ORDER BY a."order" ASC, a.name ASC
    `;

    const result = await this.repo.query(query, [characterId]);

    const total = result.length > 0 ? parseInt(result[0].total_count) : 0;
    const data = result.map((row) => {
      const { total_count, ...arc } = row;
      return arc;
    });

    return {
      data,
      total,
    };
  }
}
