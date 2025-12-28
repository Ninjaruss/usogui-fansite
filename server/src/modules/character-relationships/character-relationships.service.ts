import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CharacterRelationship,
  RelationshipType,
} from '../../entities/character-relationship.entity';
import { Character } from '../../entities/character.entity';
import { CreateCharacterRelationshipDto } from './dto/create-character-relationship.dto';
import { UpdateCharacterRelationshipDto } from './dto/update-character-relationship.dto';

@Injectable()
export class CharacterRelationshipsService {
  constructor(
    @InjectRepository(CharacterRelationship)
    private repo: Repository<CharacterRelationship>,
    @InjectRepository(Character)
    private characterRepo: Repository<Character>,
  ) {}

  /**
   * Find all relationships for a character, filtered by user progress
   * Returns relationships grouped by type
   */
  async findForCharacter(
    characterId: number,
    _userProgress?: number, // Kept for API compatibility but no longer filters - frontend handles spoiler display
  ): Promise<{
    outgoing: CharacterRelationship[];
    incoming: CharacterRelationship[];
  }> {
    // Build query for outgoing relationships (this character → others)
    const outgoingQuery = this.repo
      .createQueryBuilder('rel')
      .leftJoinAndSelect('rel.targetCharacter', 'target')
      .where('rel.sourceCharacterId = :characterId', { characterId })
      .orderBy('rel.startChapter', 'ASC');

    // Build query for incoming relationships (others → this character)
    const incomingQuery = this.repo
      .createQueryBuilder('rel')
      .leftJoinAndSelect('rel.sourceCharacter', 'source')
      .where('rel.targetCharacterId = :characterId', { characterId })
      .orderBy('rel.startChapter', 'ASC');

    const [outgoing, incoming] = await Promise.all([
      outgoingQuery.getMany(),
      incomingQuery.getMany(),
    ]);

    return { outgoing, incoming };
  }

  /**
   * Find relationships grouped by type for display
   */
  async findForCharacterGrouped(
    characterId: number,
    userProgress?: number,
  ): Promise<Record<RelationshipType, CharacterRelationship[]>> {
    const { outgoing } = await this.findForCharacter(characterId, userProgress);

    // Group by relationship type
    const grouped: Record<RelationshipType, CharacterRelationship[]> =
      {} as Record<RelationshipType, CharacterRelationship[]>;

    for (const type of Object.values(RelationshipType)) {
      grouped[type] = outgoing.filter((r) => r.relationshipType === type);
    }

    return grouped;
  }

  /**
   * Find all relationships (admin use)
   */
  async findAll(filters: {
    sourceCharacterId?: number;
    targetCharacterId?: number;
    relationshipType?: RelationshipType;
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'ASC' | 'DESC';
  }) {
    const { page = 1, limit = 20, sort, order = 'ASC' } = filters;

    const query = this.repo
      .createQueryBuilder('rel')
      .leftJoinAndSelect('rel.sourceCharacter', 'source')
      .leftJoinAndSelect('rel.targetCharacter', 'target');

    if (filters.sourceCharacterId) {
      query.andWhere('rel.sourceCharacterId = :sourceId', {
        sourceId: filters.sourceCharacterId,
      });
    }

    if (filters.targetCharacterId) {
      query.andWhere('rel.targetCharacterId = :targetId', {
        targetId: filters.targetCharacterId,
      });
    }

    if (filters.relationshipType) {
      query.andWhere('rel.relationshipType = :type', {
        type: filters.relationshipType,
      });
    }

    // Sorting
    const allowedSort = [
      'id',
      'startChapter',
      'endChapter',
      'relationshipType',
      'createdAt',
    ];
    if (sort && allowedSort.includes(sort)) {
      query.orderBy(`rel.${sort}`, order);
    } else {
      query.orderBy('rel.id', 'DESC');
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

  /**
   * Find a single relationship by ID
   */
  async findOne(id: number): Promise<CharacterRelationship> {
    const relationship = await this.repo.findOne({
      where: { id },
      relations: ['sourceCharacter', 'targetCharacter'],
    });

    if (!relationship) {
      throw new NotFoundException(`Relationship with ID ${id} not found`);
    }

    return relationship;
  }

  /**
   * Create a new relationship
   */
  async create(
    dto: CreateCharacterRelationshipDto,
  ): Promise<
    | CharacterRelationship
    | { primary: CharacterRelationship; reverse: CharacterRelationship }
  > {
    // Validate: no self-relationships
    if (dto.sourceCharacterId === dto.targetCharacterId) {
      throw new BadRequestException(
        'A character cannot have a relationship with themselves',
      );
    }

    // Validate: endChapter must be >= startChapter if provided
    if (dto.endChapter && dto.endChapter < dto.startChapter) {
      throw new BadRequestException(
        'End chapter must be greater than or equal to start chapter',
      );
    }

    // Validate characters exist
    const [sourceExists, targetExists] = await Promise.all([
      this.characterRepo.findOne({ where: { id: dto.sourceCharacterId } }),
      this.characterRepo.findOne({ where: { id: dto.targetCharacterId } }),
    ]);

    if (!sourceExists) {
      throw new NotFoundException(
        `Source character with ID ${dto.sourceCharacterId} not found`,
      );
    }

    if (!targetExists) {
      throw new NotFoundException(
        `Target character with ID ${dto.targetCharacterId} not found`,
      );
    }

    // Default spoilerChapter to startChapter if not provided
    const spoilerChapter = dto.spoilerChapter ?? dto.startChapter;

    // Check for existing relationship to prevent duplicates
    const existingRelationship = await this.repo.findOne({
      where: {
        sourceCharacterId: dto.sourceCharacterId,
        targetCharacterId: dto.targetCharacterId,
        startChapter: dto.startChapter,
      },
    });

    if (existingRelationship) {
      throw new BadRequestException(
        `A relationship from character ${dto.sourceCharacterId} to ${dto.targetCharacterId} at chapter ${dto.startChapter} already exists`,
      );
    }

    // Create primary relationship
    const relationship = this.repo.create({
      sourceCharacterId: dto.sourceCharacterId,
      targetCharacterId: dto.targetCharacterId,
      relationshipType: dto.relationshipType,
      description: dto.description,
      startChapter: dto.startChapter,
      endChapter: dto.endChapter,
      spoilerChapter,
    });

    const savedPrimary = await this.repo.save(relationship);

    // If reverse relationship type is provided, create the reverse relationship
    if (dto.reverseRelationshipType) {
      // Check for existing reverse relationship
      const existingReverse = await this.repo.findOne({
        where: {
          sourceCharacterId: dto.targetCharacterId,
          targetCharacterId: dto.sourceCharacterId,
          startChapter: dto.startChapter,
        },
      });

      if (!existingReverse) {
        const reverseRelationship = this.repo.create({
          sourceCharacterId: dto.targetCharacterId,
          targetCharacterId: dto.sourceCharacterId,
          relationshipType: dto.reverseRelationshipType,
          description: dto.reverseDescription ?? dto.description,
          startChapter: dto.startChapter,
          endChapter: dto.endChapter,
          spoilerChapter,
        });

        const savedReverse = await this.repo.save(reverseRelationship);
        return { primary: savedPrimary, reverse: savedReverse };
      }
    }

    return savedPrimary;
  }

  /**
   * Update an existing relationship
   */
  async update(
    id: number,
    dto: UpdateCharacterRelationshipDto,
  ): Promise<CharacterRelationship> {
    const relationship = await this.findOne(id);

    // Validate: no self-relationships
    const sourceId = dto.sourceCharacterId ?? relationship.sourceCharacterId;
    const targetId = dto.targetCharacterId ?? relationship.targetCharacterId;

    if (sourceId === targetId) {
      throw new BadRequestException(
        'A character cannot have a relationship with themselves',
      );
    }

    // Validate: endChapter must be >= startChapter
    const startChapter = dto.startChapter ?? relationship.startChapter;
    const endChapter = dto.endChapter ?? relationship.endChapter;

    if (endChapter && endChapter < startChapter) {
      throw new BadRequestException(
        'End chapter must be greater than or equal to start chapter',
      );
    }

    // Validate characters exist if being changed
    if (dto.sourceCharacterId) {
      const sourceExists = await this.characterRepo.findOne({
        where: { id: dto.sourceCharacterId },
      });
      if (!sourceExists) {
        throw new NotFoundException(
          `Source character with ID ${dto.sourceCharacterId} not found`,
        );
      }
    }

    if (dto.targetCharacterId) {
      const targetExists = await this.characterRepo.findOne({
        where: { id: dto.targetCharacterId },
      });
      if (!targetExists) {
        throw new NotFoundException(
          `Target character with ID ${dto.targetCharacterId} not found`,
        );
      }
    }

    Object.assign(relationship, dto);
    return this.repo.save(relationship);
  }

  /**
   * Delete a relationship
   */
  async remove(id: number): Promise<{ message: string }> {
    const relationship = await this.findOne(id);
    await this.repo.remove(relationship);
    return { message: `Relationship ${id} deleted successfully` };
  }

  /**
   * Check if a relationship is visible to a user at their reading progress
   */
  async canView(
    relationshipId: number,
    userProgress: number,
  ): Promise<boolean> {
    const relationship = await this.repo.findOne({
      where: { id: relationshipId },
      select: ['spoilerChapter'],
    });

    if (!relationship) {
      throw new NotFoundException(
        `Relationship with ID ${relationshipId} not found`,
      );
    }

    return relationship.spoilerChapter <= userProgress;
  }

  /**
   * Find all relationships between two specific characters (both directions)
   */
  async findBetweenCharacters(
    characterAId: number,
    characterBId: number,
  ): Promise<CharacterRelationship[]> {
    return this.repo.find({
      where: [
        { sourceCharacterId: characterAId, targetCharacterId: characterBId },
        { sourceCharacterId: characterBId, targetCharacterId: characterAId },
      ],
      relations: ['sourceCharacter', 'targetCharacter'],
      order: { startChapter: 'ASC' },
    });
  }
}
