import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult, In } from 'typeorm';
import { Gamble } from '../../entities/gamble.entity';
import { Character } from '../../entities/character.entity';
import { GambleFaction } from '../../entities/gamble-faction.entity';
import { GambleFactionMember } from '../../entities/gamble-faction-member.entity';
import { CreateGambleDto, CreateFactionDto } from './dto/create-gamble.dto';
import { UpdateGambleDto } from './dto/update-gamble.dto';
import { MediaService } from '../media/media.service';
import { MediaOwnerType } from '../../entities/media.entity';
import { EditLogService } from '../edit-log/edit-log.service';
import { EditLogEntityType } from '../../entities/edit-log.entity';
import { diffFields } from '../../common/utils/diff-fields';

@Injectable()
export class GamblesService {
  constructor(
    @InjectRepository(Gamble)
    private gamblesRepository: Repository<Gamble>,
    @InjectRepository(Character)
    private charactersRepository: Repository<Character>,
    @InjectRepository(GambleFaction)
    private factionRepository: Repository<GambleFaction>,
    @InjectRepository(GambleFactionMember)
    private factionMemberRepository: Repository<GambleFactionMember>,
    private readonly mediaService: MediaService,
    private readonly editLogService: EditLogService,
  ) {}

  async create(
    createGambleDto: CreateGambleDto,
    userId: number,
  ): Promise<Gamble> {
    const gamble = new Gamble();
    gamble.name = createGambleDto.name;
    gamble.description = createGambleDto.description;
    gamble.rules = createGambleDto.rules;
    gamble.winCondition = createGambleDto.winCondition;
    gamble.chapterId = createGambleDto.chapterId;

    // Handle participants if provided (legacy support)
    if (
      createGambleDto.participantIds &&
      createGambleDto.participantIds.length > 0
    ) {
      const participants = await this.charactersRepository.findByIds(
        createGambleDto.participantIds,
      );
      gamble.participants = participants;
    }

    // Save the gamble first to get the ID
    const savedGamble = await this.gamblesRepository.save(gamble);

    // Handle factions if provided
    if (createGambleDto.factions && createGambleDto.factions.length > 0) {
      await this.createFactions(savedGamble.id, createGambleDto.factions);
    }

    // Return the gamble with all relations loaded
    const result = await this.findOne(savedGamble.id);
    await this.editLogService.logCreate(
      EditLogEntityType.GAMBLE,
      savedGamble.id,
      userId,
    );
    return result;
  }

  /**
   * Create factions for a gamble
   */
  private async createFactions(
    gambleId: number,
    factions: CreateFactionDto[],
  ): Promise<GambleFaction[]> {
    const createdFactions: GambleFaction[] = [];

    for (let i = 0; i < factions.length; i++) {
      const factionDto = factions[i];

      // Create the faction
      const faction = this.factionRepository.create({
        gambleId,
        name: factionDto.name || null,
        supportedGamblerId: factionDto.supportedGamblerId || null,
        displayOrder: i,
      });

      const savedFaction = await this.factionRepository.save(faction);

      // Create faction members
      if (factionDto.memberIds && factionDto.memberIds.length > 0) {
        const members = factionDto.memberIds.map((characterId, memberIndex) =>
          this.factionMemberRepository.create({
            factionId: savedFaction.id,
            characterId,
            role: factionDto.memberRoles?.[memberIndex] || null,
            displayOrder: memberIndex,
          }),
        );
        await this.factionMemberRepository.save(members);
      }

      createdFactions.push(savedFaction);
    }

    return createdFactions;
  }

  async findAll(options?: { page?: number; limit?: number }): Promise<{
    data: Gamble[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = options || {};
    const [data, total] = await this.gamblesRepository.findAndCount({
      relations: [
        'participants',
        'factions',
        'factions.supportedGambler',
        'factions.members',
        'factions.members.character',
      ],
      order: {
        chapterId: 'ASC',
        id: 'ASC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAllGambles(): Promise<Gamble[]> {
    return await this.gamblesRepository.find({
      relations: [
        'participants',
        'factions',
        'factions.supportedGambler',
        'factions.members',
        'factions.members.character',
      ],
      order: {
        chapterId: 'ASC',
        id: 'ASC',
      },
    });
  }

  async findOne(id: number): Promise<Gamble> {
    const gamble = await this.gamblesRepository.findOne({
      where: { id },
      relations: [
        'participants',
        'factions',
        'factions.supportedGambler',
        'factions.members',
        'factions.members.character',
      ],
    });

    if (!gamble) {
      throw new NotFoundException(`Gamble with ID ${id} not found`);
    }

    return gamble;
  }

  async findByChapter(chapterId: number): Promise<Gamble[]> {
    return await this.gamblesRepository.find({
      where: { chapterId },
      relations: ['participants'],
      order: { id: 'ASC' },
    });
  }

  async update(
    id: number,
    updateGambleDto: UpdateGambleDto,
    userId: number,
    isMinorEdit = false,
  ): Promise<Gamble> {
    const gamble = await this.findOne(id); // Validates existence and loads relations

    // Snapshot scalar fields before mutation for accurate diffing
    const scalarSnapshot = {
      name: gamble.name,
      description: gamble.description,
      rules: gamble.rules,
      winCondition: gamble.winCondition,
      explanation: gamble.explanation,
      chapterId: gamble.chapterId,
    };
    const scalarDto = {
      name: updateGambleDto.name,
      description: updateGambleDto.description,
      rules: updateGambleDto.rules,
      winCondition: updateGambleDto.winCondition,
      explanation: updateGambleDto.explanation,
      chapterId: updateGambleDto.chapterId,
    };
    const changedFields = diffFields(scalarSnapshot, scalarDto);
    // Relations use presence detection — value-diffing TypeORM entity arrays is unreliable
    if (updateGambleDto.participantIds !== undefined) changedFields.push('participants');
    if (updateGambleDto.factions !== undefined) changedFields.push('factions');

    // Update basic fields
    gamble.name = updateGambleDto.name ?? gamble.name;
    gamble.description = updateGambleDto.description ?? gamble.description;
    gamble.rules = updateGambleDto.rules ?? gamble.rules;
    gamble.winCondition = updateGambleDto.winCondition ?? gamble.winCondition;
    gamble.explanation = updateGambleDto.explanation ?? gamble.explanation;
    gamble.chapterId = updateGambleDto.chapterId ?? gamble.chapterId;

    // Handle participants if provided (legacy support)
    if (updateGambleDto.participantIds !== undefined) {
      if (updateGambleDto.participantIds.length > 0) {
        const participants = await this.charactersRepository.findByIds(
          updateGambleDto.participantIds,
        );
        gamble.participants = participants;
      } else {
        gamble.participants = [];
      }
    }

    if (!isMinorEdit) {
      gamble.isVerified = false;
      gamble.verifiedById = null;
      gamble.verifiedAt = null;
    }
    await this.gamblesRepository.save(gamble);

    // Handle factions if provided
    if (updateGambleDto.factions !== undefined) {
      // Delete existing factions (cascade will delete members)
      await this.factionRepository.delete({ gambleId: id });

      // Create new factions
      if (updateGambleDto.factions.length > 0) {
        await this.createFactions(id, updateGambleDto.factions);
      }
    }

    // Return the updated gamble with all relations
    const result = await this.findOne(id);
    await this.editLogService.logUpdate(
      EditLogEntityType.GAMBLE,
      id,
      userId,
      changedFields,
      isMinorEdit,
    );
    return result;
  }

  async verify(
    id: number,
    verifierId: number,
    isAdmin: boolean,
  ): Promise<Gamble> {
    const gamble = await this.gamblesRepository.findOne({ where: { id } });
    if (!gamble) throw new NotFoundException(`Gamble with id ${id} not found`);
    if (!isAdmin) {
      const lastEdit = await this.editLogService.findLastMajorEdit(
        EditLogEntityType.GAMBLE,
        id,
      );
      if (lastEdit && lastEdit.userId === verifierId) {
        throw new ForbiddenException('You cannot verify your own edit');
      }
    }
    gamble.isVerified = true;
    gamble.verifiedById = verifierId;
    gamble.verifiedAt = new Date();
    return this.gamblesRepository.save(gamble);
  }

  async remove(id: number, userId: number): Promise<DeleteResult> {
    await this.findOne(id); // Validates existence
    await this.editLogService.logDelete(EditLogEntityType.GAMBLE, id, userId);
    return await this.gamblesRepository.delete(id);
  }

  async findGamblesByName(name: string): Promise<Gamble[]> {
    return await this.gamblesRepository
      .createQueryBuilder('gamble')
      .leftJoinAndSelect('gamble.participants', 'participants')
      .where('LOWER(gamble.name) LIKE LOWER(:name)', { name: `%${name}%` })
      .orderBy('gamble.chapterId', 'ASC')
      .addOrderBy('gamble.id', 'ASC')
      .getMany();
  }

  async search(filters: {
    gambleName?: string;
    participantName?: string;
    teamName?: string;
    chapterId?: number;
    characterId?: number;
    limit?: number;
    page?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<{
    data: Gamble[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = filters;
    const query = this.gamblesRepository
      .createQueryBuilder('gamble')
      .leftJoinAndSelect('gamble.participants', 'participants')
      .leftJoinAndSelect('gamble.factions', 'factions')
      .leftJoinAndSelect('factions.supportedGambler', 'supportedGambler')
      .leftJoinAndSelect('factions.members', 'factionMembers')
      .leftJoinAndSelect('factionMembers.character', 'factionMemberChar');

    if (filters.gambleName) {
      query.andWhere('LOWER(gamble.name) LIKE LOWER(:gambleName)', {
        gambleName: `%${filters.gambleName}%`,
      });
    }

    if (filters.chapterId) {
      query.andWhere('gamble.chapterId = :chapterId', {
        chapterId: filters.chapterId,
      });
    }

    if (filters.characterId) {
      query.andWhere('participants.id = :characterId', {
        characterId: filters.characterId,
      });
    }

    if (filters.participantName) {
      query.andWhere('LOWER(participants.name) LIKE LOWER(:participantName)', {
        participantName: `%${filters.participantName}%`,
      });
    }

    // Apply sorting
    const sortOrder = filters.sortOrder === 'DESC' ? 'DESC' : 'ASC';
    if (filters.sortBy === 'name') {
      query.orderBy('gamble.name', sortOrder).addOrderBy('gamble.id', 'ASC');
    } else {
      query.orderBy('gamble.chapterId', 'ASC').addOrderBy('gamble.id', 'ASC');
    }

    // Get total count for pagination
    const total = await query.getCount();

    // Apply pagination
    const data = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByCharacter(characterId: number): Promise<Gamble[]> {
    return await this.gamblesRepository
      .createQueryBuilder('gamble')
      .leftJoinAndSelect('gamble.participants', 'participants')
      .leftJoinAndSelect('gamble.factions', 'factions')
      .leftJoinAndSelect('factions.supportedGambler', 'supportedGambler')
      .leftJoinAndSelect('factions.members', 'factionMembers')
      .leftJoinAndSelect('factionMembers.character', 'factionMemberChar')
      .where('participants.id = :characterId', { characterId })
      .orderBy('gamble.chapterId', 'ASC')
      .addOrderBy('gamble.id', 'ASC')
      .getMany();
  }

  /**
   * Find gambles where a faction has a specific name
   */
  async findByTeam(teamName: string): Promise<Gamble[]> {
    const factions = await this.factionRepository
      .createQueryBuilder('faction')
      .leftJoinAndSelect('faction.gamble', 'gamble')
      .leftJoinAndSelect('gamble.participants', 'participants')
      .leftJoinAndSelect('gamble.factions', 'allFactions')
      .leftJoinAndSelect('allFactions.members', 'members')
      .leftJoinAndSelect('members.character', 'character')
      .where('LOWER(faction.name) LIKE LOWER(:teamName)', {
        teamName: `%${teamName}%`,
      })
      .getMany();

    return factions.map((f) => f.gamble);
  }

  /**
   * Get faction names for a gamble
   */
  async getTeamsForGamble(id: number): Promise<string[]> {
    const gamble = await this.findOne(id); // Validates and loads factions

    if (!gamble.factions) {
      return [];
    }

    return gamble.factions.filter((f) => f.name).map((f) => f.name as string);
  }

  /**
   * Get factions for a gamble
   */
  async getFactionsForGamble(id: number): Promise<GambleFaction[]> {
    const gamble = await this.findOne(id);
    return gamble.factions || [];
  }

  /**
   * Get entity display media for gamble thumbnails with spoiler protection
   */
  async getGambleEntityDisplayMedia(
    gambleId: number,
    userProgress?: number,
    options: {
      page?: number;
      limit?: number;
    } = {},
  ) {
    await this.findOne(gambleId); // Validate gamble exists

    const result = await this.mediaService.findForEntityDisplay(
      MediaOwnerType.GAMBLE,
      gambleId,
      undefined,
      {
        page: options.page,
        limit: options.limit,
      },
    );

    // Apply spoiler protection if user progress is provided and media has chapter number
    if (userProgress !== undefined) {
      result.data = result.data.map((media) => ({
        ...media,
        isSpoiler: media.chapterNumber
          ? media.chapterNumber > userProgress
          : false,
      }));
    }

    return result;
  }

  /**
   * Get gallery media for gamble
   */
  async getGambleGalleryMedia(
    gambleId: number,
    userProgress?: number,
    options: {
      chapter?: number;
      page?: number;
      limit?: number;
    } = {},
  ) {
    await this.findOne(gambleId); // Validate gamble exists

    const result = await this.mediaService.findForGallery(
      MediaOwnerType.GAMBLE,
      gambleId,
      {
        chapter: options.chapter,
        page: options.page,
        limit: options.limit,
      },
    );

    // Apply spoiler protection if user progress is provided and media has chapter number
    if (userProgress !== undefined) {
      result.data = result.data.map((media) => ({
        ...media,
        isSpoiler: media.chapterNumber
          ? media.chapterNumber > userProgress
          : false,
      }));
    }

    return result;
  }

  /**
   * Get the current entity display media for gamble thumbnail
   * Default changes to the one with the latest chapter number within user progress
   */
  async getGambleCurrentThumbnail(gambleId: number, userProgress?: number) {
    await this.findOne(gambleId); // Validate gamble exists

    // Get all entity display media for this gamble
    const allMedia = await this.mediaService.findForEntityDisplay(
      MediaOwnerType.GAMBLE,
      gambleId,
      undefined,
      { limit: 100 }, // Get all to find the right one
    );

    if (allMedia.data.length === 0) {
      return null;
    }

    let selectedMedia: any = null;

    if (userProgress !== undefined) {
      // Find the media with the highest chapter number that doesn't exceed user progress
      const allowedMedia = allMedia.data.filter(
        (media) => !media.chapterNumber || media.chapterNumber <= userProgress,
      );

      if (allowedMedia.length > 0) {
        // Get the one with the highest chapter number within user progress
        selectedMedia = allowedMedia.reduce((latest, current) => {
          const latestChapter = latest.chapterNumber || 0;
          const currentChapter = current.chapterNumber || 0;
          return currentChapter > latestChapter ? current : latest;
        });
      }
    } else {
      // No user progress provided, get default or most recent
      selectedMedia = allMedia.data[0];
    }

    if (selectedMedia) {
      const isSpoiler =
        userProgress !== undefined &&
        selectedMedia.chapterNumber &&
        selectedMedia.chapterNumber > userProgress;

      return {
        ...selectedMedia,
        isSpoiler,
      };
    }

    return null;
  }
}
