import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult, DeleteResult } from 'typeorm';
import { Gamble } from '../../entities/gamble.entity';
import { GambleCharacter } from '../../entities/gamble-character.entity';
import { GambleRound } from '../../entities/gamble-round.entity';
import { Character } from '../../entities/character.entity';
import { Chapter } from '../../entities/chapter.entity';
import {
  CreateGambleDto,
  CreateGambleParticipantDto,
  CreateGambleRoundDto,
} from './dto/create-gamble.dto';
import { UpdateGambleDto } from './dto/update-gamble.dto';

@Injectable()
export class GamblesService {
  constructor(
    @InjectRepository(Gamble)
    private gamblesRepository: Repository<Gamble>,
    @InjectRepository(GambleCharacter)
    private gambleCharactersRepository: Repository<GambleCharacter>,
    @InjectRepository(GambleRound)
    private gambleRoundsRepository: Repository<GambleRound>,
    @InjectRepository(Character)
    private charactersRepository: Repository<Character>,
    @InjectRepository(Chapter)
    private chaptersRepository: Repository<Chapter>,
  ) {}

  async create(createGambleDto: CreateGambleDto): Promise<Gamble> {
    // Create new gamble
    const gamble = new Gamble();
    gamble.name = createGambleDto.name;
    gamble.rules = createGambleDto.rules;
    gamble.winCondition = createGambleDto.winCondition;
    gamble.chapterId = createGambleDto.chapterId;
    gamble.hasTeams = createGambleDto.hasTeams || false;

    // Save gamble first to establish relationships
    await this.gamblesRepository.save(gamble);

    // Create and link participants
    const participants = await Promise.all(
      createGambleDto.participants.map((participantDto) =>
        this.createParticipant(participantDto, gamble),
      ),
    );
    gamble.participants = participants;

    // Set winner team if provided
    const winner = participants.find((p) => p.isWinner);
    if (winner && gamble.hasTeams) {
      gamble.winnerTeam = winner.teamName;
    }

    // Create and link rounds if provided
    if (createGambleDto.rounds) {
      const rounds = await Promise.all(
        createGambleDto.rounds.map((roundDto) =>
          this.createRound(roundDto, gamble),
        ),
      );
      gamble.rounds = rounds;
    }

    // Add observers if provided
    if (createGambleDto.observerIds?.length) {
      const observers = await Promise.all(
        createGambleDto.observerIds.map((id) =>
          this.charactersRepository.findOneByOrFail({ id }).catch(() => {
            throw new NotFoundException(
              `Observer character with ID ${id} not found`,
            );
          }),
        ),
      );
      gamble.observers = observers;
    }

    // Save final gamble with all relations
    await this.gamblesRepository.save(gamble);

    // Return complete gamble with all relations loaded
    return this.findOne(gamble.id);
  }

  private async createParticipant(
    participantDto: CreateGambleParticipantDto,
    gamble: Gamble,
  ): Promise<GambleCharacter> {
    const character = await this.charactersRepository
      .findOneByOrFail({ id: participantDto.characterId })
      .catch(() => {
        throw new NotFoundException(
          `Character with ID ${participantDto.characterId} not found`,
        );
      });

    const participant = new GambleCharacter();
    participant.gamble = gamble;
    participant.character = character;
    participant.teamName = participantDto.teamName;
    participant.isWinner = participantDto.isWinner || false;
    participant.stake = participantDto.stake;

    return this.gambleCharactersRepository.save(participant);
  }

  private async createRound(
    roundDto: CreateGambleRoundDto,
    gamble: Gamble,
  ): Promise<GambleRound> {
    const round = new GambleRound();
    round.roundNumber = roundDto.roundNumber;
    round.outcome = roundDto.outcome;
    round.reward = roundDto.reward;
    round.penalty = roundDto.penalty;
    round.gamble = gamble;
    round.winnerTeam = roundDto.winnerTeam;

    return this.gambleRoundsRepository.save(round);
  }

  async findAll(options: { page?: number; limit?: number } = {}): Promise<{
    data: Gamble[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 100 } = options;
    const qb = this.gamblesRepository
      .createQueryBuilder('gamble')
      .leftJoinAndSelect('gamble.participants', 'participants')
      .leftJoinAndSelect('participants.character', 'character')
      .leftJoinAndSelect('gamble.rounds', 'rounds')
      .leftJoinAndSelect('gamble.observers', 'observers')
      .leftJoinAndSelect('gamble.chapter', 'chapter')
      .orderBy('gamble.createdAt', 'DESC');

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const transformedData = data.map((gamble) =>
      this.transformGambleWithTeams(gamble),
    );
    return { data: transformedData, total, page, perPage: limit, totalPages };
  }

  async findOne(id: number): Promise<Gamble> {
    const gamble = await this.gamblesRepository
      .createQueryBuilder('gamble')
      .leftJoinAndSelect('gamble.participants', 'participants')
      .leftJoinAndSelect('participants.character', 'character')
      .leftJoinAndSelect('gamble.rounds', 'rounds')
      .leftJoinAndSelect('gamble.observers', 'observers')
      .leftJoinAndSelect('gamble.chapter', 'chapter')
      .where('gamble.id = :id', { id })
      .getOne();

    if (!gamble) {
      throw new NotFoundException(`Gamble with ID ${id} not found`);
    }

    return this.transformGambleWithTeams(gamble);
  }

  private transformGambleWithTeams(gamble: Gamble): Gamble {
    if (!gamble.hasTeams || !gamble.participants) {
      return { ...gamble, teams: [] } as any;
    }

    // Group participants by team
    const teamMap = new Map();
    gamble.participants.forEach((participant) => {
      const teamName = participant.teamName || 'No Team';
      if (!teamMap.has(teamName)) {
        teamMap.set(teamName, {
          id: teamMap.size + 1,
          name: teamName,
          members: [],
          isWinner: false,
        });
      }

      teamMap.get(teamName).members.push({
        id: participant.character.id,
        name: participant.character.name,
      });

      if (participant.isWinner) {
        teamMap.get(teamName).isWinner = true;
      }
    });

    const teams = Array.from(teamMap.values());
    return { ...gamble, teams } as any;
  }

  async findByChapter(chapterId: number): Promise<Gamble[]> {
    // Interpret the incoming number as a chapter number (not a relation id).
    // Find all chapters that have this chapter number (across collections) and match gambles by stored chapterId (which references chapter.id in DB).
    const chapters = await this.chaptersRepository.find({
      where: { number: chapterId },
    });
    if (!chapters.length) return [];
    const chapterIds = chapters.map((c) => c.id);

    return this.gamblesRepository
      .createQueryBuilder('gamble')
      .leftJoinAndSelect('gamble.participants', 'participants')
      .leftJoinAndSelect('participants.character', 'character')
      .leftJoinAndSelect('gamble.rounds', 'rounds')
      .leftJoinAndSelect('gamble.observers', 'observers')
      .leftJoinAndSelect('gamble.chapter', 'chapter')
      .where('gamble.chapterId IN (:...chapterIds)', { chapterIds })
      .orderBy('gamble.createdAt', 'DESC')
      .getMany();
  }

  async findByCharacter(characterId: number): Promise<Gamble[]> {
    return this.gamblesRepository
      .createQueryBuilder('gamble')
      .leftJoinAndSelect('gamble.participants', 'participants')
      .leftJoinAndSelect('participants.character', 'character')
      .leftJoinAndSelect('gamble.rounds', 'rounds')
      .leftJoinAndSelect('gamble.observers', 'observers')
      .leftJoinAndSelect('gamble.chapter', 'chapter')
      .where('character.id = :characterId', { characterId })
      .orWhere('observers.id = :characterId', { characterId })
      .orderBy('gamble.createdAt', 'DESC')
      .getMany();
  }

  async findByTeam(teamName: string): Promise<Gamble[]> {
    return this.gamblesRepository
      .createQueryBuilder('gamble')
      .leftJoinAndSelect('gamble.participants', 'participants')
      .leftJoinAndSelect('participants.character', 'character')
      .leftJoinAndSelect('gamble.rounds', 'rounds')
      .leftJoinAndSelect('gamble.observers', 'observers')
      .leftJoinAndSelect('gamble.chapter', 'chapter')
      .where('participants.teamName ILIKE :teamName', {
        teamName: `%${teamName}%`,
      })
      .orderBy('gamble.createdAt', 'DESC')
      .getMany();
  }

  async getTeamsForGamble(gambleId: number): Promise<string[]> {
    const participants = await this.gambleCharactersRepository
      .createQueryBuilder('participant')
      .select('DISTINCT participant.teamName', 'teamName')
      .where('participant.gamble.id = :gambleId', { gambleId })
      .andWhere('participant.teamName IS NOT NULL')
      .getRawMany();

    return participants.map((p) => p.teamName).filter(Boolean);
  }

  async search(options: {
    gambleName?: string;
    participantName?: string;
    teamName?: string;
    chapterId?: number;
    characterId?: number;
    limit?: number;
    page?: number;
  }): Promise<{
    data: Gamble[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 100 } = options;
    const query = this.gamblesRepository
      .createQueryBuilder('gamble')
      .leftJoinAndSelect('gamble.participants', 'participants')
      .leftJoinAndSelect('participants.character', 'character')
      .leftJoinAndSelect('gamble.rounds', 'rounds')
      .leftJoinAndSelect('gamble.observers', 'observers')
      .leftJoinAndSelect('gamble.chapter', 'chapter');

    const conditions: string[] = [];
    const parameters: any = {};

    if (options.gambleName) {
      conditions.push('gamble.name ILIKE :gambleName');
      parameters.gambleName = `%${options.gambleName}%`;
    }

    if (options.participantName) {
      conditions.push(
        '(character.name ILIKE :participantName OR observers.name ILIKE :participantName)',
      );
      parameters.participantName = `%${options.participantName}%`;
    }

    if (options.teamName) {
      conditions.push('participants.teamName ILIKE :teamName');
      parameters.teamName = `%${options.teamName}%`;
    }

    if (options.chapterId) {
      // Treat options.chapterId as a chapter number. Resolve to chapter IDs before filtering.
      const chapters = await this.chaptersRepository.find({
        where: { number: options.chapterId },
      });
      if (!chapters.length)
        return { data: [], total: 0, page: 1, perPage: limit, totalPages: 1 };
      const chapterIds = chapters.map((c) => c.id);
      conditions.push('gamble.chapterId IN (:...chapterIds)');
      parameters.chapterIds = chapterIds;
    }

    if (options.characterId) {
      conditions.push(
        '(character.id = :characterId OR observers.id = :characterId)',
      );
      parameters.characterId = options.characterId;
    }

    if (conditions.length > 0) {
      query.where(conditions.join(' AND '), parameters);
    }

    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const [data, total] = await query
      .orderBy('gamble.createdAt', 'DESC')
      .getManyAndCount();

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const transformedData = data.map((gamble) =>
      this.transformGambleWithTeams(gamble),
    );
    return { data: transformedData, total, page, perPage: limit, totalPages };
  }

  async update(id: number, updateGambleDto: UpdateGambleDto): Promise<Gamble> {
    const existingGamble = await this.findOne(id);
    if (!existingGamble) {
      throw new NotFoundException(`Gamble with ID ${id} not found`);
    }

    // Update basic gamble info
    await this.gamblesRepository.update(id, {
      name: updateGambleDto.name,
      rules: updateGambleDto.rules,
      winCondition: updateGambleDto.winCondition,
      chapterId: updateGambleDto.chapterId,
      hasTeams: updateGambleDto.hasTeams,
    });

    // Update participants if provided
    if (updateGambleDto.participants) {
      // Remove existing participants
      await this.gambleCharactersRepository.delete({ gamble: { id } });

      // Add new participants
      const participants = await Promise.all(
        updateGambleDto.participants.map((participantDto) =>
          this.createParticipant(participantDto, existingGamble),
        ),
      );

      // Set winner team
      const winner = participants.find((p) => p.isWinner);
      if (winner && updateGambleDto.hasTeams) {
        await this.gamblesRepository.update(id, {
          winnerTeam: winner.teamName,
        });
      }
    }

    // Update rounds if provided
    if (updateGambleDto.rounds) {
      // Remove existing rounds
      await this.gambleRoundsRepository.delete({ gamble: { id } });

      // Add new rounds
      await Promise.all(
        updateGambleDto.rounds.map((roundDto) =>
          this.createRound(roundDto, existingGamble),
        ),
      );
    }

    // Update observers if provided
    if (updateGambleDto.observerIds) {
      const observers = await Promise.all(
        updateGambleDto.observerIds.map((observerId) =>
          this.charactersRepository
            .findOneByOrFail({ id: observerId })
            .catch(() => {
              throw new NotFoundException(
                `Observer character with ID ${observerId} not found`,
              );
            }),
        ),
      );

      const gamble = await this.gamblesRepository.findOneByOrFail({ id });
      gamble.observers = observers;
      await this.gamblesRepository.save(gamble);
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<DeleteResult> {
    const result = await this.gamblesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Gamble with ID ${id} not found`);
    }
    return result;
  }
}
