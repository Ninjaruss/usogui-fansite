import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CharacterOrganization } from '../../entities/character-organization.entity';
import { Character } from '../../entities/character.entity';
import { Organization } from '../../entities/organization.entity';
import { CreateCharacterOrganizationDto } from './dto/create-character-organization.dto';
import { UpdateCharacterOrganizationDto } from './dto/update-character-organization.dto';

@Injectable()
export class CharacterOrganizationsService {
  constructor(
    @InjectRepository(CharacterOrganization)
    private readonly repo: Repository<CharacterOrganization>,
    @InjectRepository(Character)
    private readonly characterRepo: Repository<Character>,
    @InjectRepository(Organization)
    private readonly organizationRepo: Repository<Organization>,
  ) {}

  /**
   * Find all character-organization memberships with optional filtering
   */
  async findAll(filters: {
    characterId?: number;
    organizationId?: number;
    userProgress?: number;
    page?: number;
    limit?: number;
  }): Promise<{ data: CharacterOrganization[]; total: number }> {
    const {
      characterId,
      organizationId,
      userProgress,
      page = 1,
      limit = 25,
    } = filters;

    const query = this.repo
      .createQueryBuilder('co')
      .leftJoinAndSelect('co.character', 'character')
      .leftJoinAndSelect('co.organization', 'organization')
      .orderBy('co.startChapter', 'ASC');

    if (characterId) {
      query.andWhere('co.characterId = :characterId', { characterId });
    }

    if (organizationId) {
      query.andWhere('co.organizationId = :organizationId', { organizationId });
    }

    // Note: We return all data regardless of userProgress
    // Frontend handles spoiler display with SpoilerWrapper components

    const total = await query.getCount();
    const data = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total };
  }

  /**
   * Get memberships for a specific character
   */
  async findForCharacter(
    characterId: number,
    _userProgress?: number,
  ): Promise<CharacterOrganization[]> {
    // Note: userProgress kept for API compatibility but no longer filters
    // Frontend handles spoiler display with SpoilerWrapper components
    return this.repo.find({
      where: { characterId },
      relations: ['organization'],
      order: { startChapter: 'ASC' },
    });
  }

  /**
   * Get members for a specific organization
   */
  async findForOrganization(
    organizationId: number,
    _userProgress?: number,
  ): Promise<CharacterOrganization[]> {
    // Note: userProgress kept for API compatibility but no longer filters
    // Frontend handles spoiler display with SpoilerWrapper components
    return this.repo.find({
      where: { organizationId },
      relations: ['character'],
      order: { startChapter: 'ASC' },
    });
  }

  /**
   * Find a single membership by ID
   */
  async findOne(id: number): Promise<CharacterOrganization> {
    const membership = await this.repo.findOne({
      where: { id },
      relations: ['character', 'organization'],
    });

    if (!membership) {
      throw new NotFoundException(
        `CharacterOrganization with ID ${id} not found`,
      );
    }

    return membership;
  }

  /**
   * Create a new character-organization membership
   */
  async create(
    dto: CreateCharacterOrganizationDto,
  ): Promise<CharacterOrganization> {
    // Validate character exists
    const character = await this.characterRepo.findOne({
      where: { id: dto.characterId },
    });
    if (!character) {
      throw new BadRequestException(
        `Character with ID ${dto.characterId} not found`,
      );
    }

    // Validate organization exists
    const organization = await this.organizationRepo.findOne({
      where: { id: dto.organizationId },
    });
    if (!organization) {
      throw new BadRequestException(
        `Organization with ID ${dto.organizationId} not found`,
      );
    }

    // Default spoilerChapter to startChapter if not provided
    const spoilerChapter = dto.spoilerChapter ?? dto.startChapter;

    const membership = this.repo.create({
      characterId: dto.characterId,
      organizationId: dto.organizationId,
      role: dto.role,
      startChapter: dto.startChapter,
      endChapter: dto.endChapter,
      spoilerChapter,
      notes: dto.notes,
    });

    return this.repo.save(membership);
  }

  /**
   * Update an existing membership
   */
  async update(
    id: number,
    dto: UpdateCharacterOrganizationDto,
  ): Promise<CharacterOrganization> {
    const membership = await this.findOne(id);

    // Validate character if being changed
    if (dto.characterId && dto.characterId !== membership.characterId) {
      const character = await this.characterRepo.findOne({
        where: { id: dto.characterId },
      });
      if (!character) {
        throw new BadRequestException(
          `Character with ID ${dto.characterId} not found`,
        );
      }
    }

    // Validate organization if being changed
    if (
      dto.organizationId &&
      dto.organizationId !== membership.organizationId
    ) {
      const organization = await this.organizationRepo.findOne({
        where: { id: dto.organizationId },
      });
      if (!organization) {
        throw new BadRequestException(
          `Organization with ID ${dto.organizationId} not found`,
        );
      }
    }

    // Update fields
    Object.assign(membership, dto);

    return this.repo.save(membership);
  }

  /**
   * Delete a membership
   */
  async remove(id: number): Promise<void> {
    const membership = await this.findOne(id);
    await this.repo.remove(membership);
  }

  /**
   * Check if a membership should be visible based on user progress
   */
  async canViewMembership(
    membershipId: number,
    userProgress: number,
  ): Promise<boolean> {
    const membership = await this.repo.findOne({
      where: { id: membershipId },
      select: ['spoilerChapter'],
    });

    if (!membership) {
      return false;
    }

    return membership.spoilerChapter <= userProgress;
  }

  /**
   * Get unique organizations for a character (for simple listing)
   */
  async getCharacterOrganizations(
    characterId: number,
    userProgress?: number,
  ): Promise<{ organization: Organization; currentRole?: string }[]> {
    const memberships = await this.findForCharacter(characterId, userProgress);

    // Group by organization and find current/latest role
    const orgMap = new Map<
      number,
      { organization: Organization; currentRole?: string }
    >();

    for (const m of memberships) {
      const existing = orgMap.get(m.organizationId);
      // If no existing entry, or this is a current (no endChapter) role, or this is later
      if (
        !existing ||
        m.endChapter === null ||
        (existing.currentRole &&
          m.startChapter >
            (memberships.find(
              (x) =>
                x.organizationId === m.organizationId &&
                x.role === existing.currentRole,
            )?.startChapter ?? 0))
      ) {
        orgMap.set(m.organizationId, {
          organization: m.organization,
          currentRole: m.endChapter === null ? m.role : existing?.currentRole,
        });
      }
    }

    return Array.from(orgMap.values());
  }
}
