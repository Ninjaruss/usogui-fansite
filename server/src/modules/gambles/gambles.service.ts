import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gamble } from '../../entities/gamble.entity';
import { GambleTeam } from '../../entities/gamble-team.entity';
import { GambleRound } from '../../entities/gamble-round.entity';
import { Character } from '../../entities/character.entity';
import { Chapter } from '../../entities/chapter.entity';
import { CreateGambleDto, CreateGambleTeamDto, CreateGambleRoundDto } from './dto/create-gamble.dto';

@Injectable()
export class GamblesService {
  constructor(
    @InjectRepository(Gamble)
    private gamblesRepository: Repository<Gamble>,
    @InjectRepository(GambleTeam)
    private gambleTeamsRepository: Repository<GambleTeam>,
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

    // Save gamble first to establish relationships
    await this.gamblesRepository.save(gamble);

    // Create and link teams
    const teams = await Promise.all(
      createGambleDto.teams.map(teamDto => this.createTeam(teamDto, gamble))
    );
    gamble.teams = teams;

    // Create and link rounds if provided
    if (createGambleDto.rounds) {
      const rounds = await Promise.all(
        createGambleDto.rounds.map(roundDto => this.createRound(roundDto, gamble))
      );
      gamble.rounds = rounds;
    }

    // Add observers if provided
    if (createGambleDto.observerIds?.length) {
      const observers = await Promise.all(
        createGambleDto.observerIds.map(id => 
          this.charactersRepository.findOneByOrFail({ id }).catch(() => {
            throw new NotFoundException(`Observer character with ID ${id} not found`);
          })
        )
      );
      gamble.observers = observers;
    }

    // Save final gamble with all relations
    await this.gamblesRepository.save(gamble);

    // Return complete gamble with all relations loaded
    return this.findOne(gamble.id);
  }

  private async createTeam(teamDto: CreateGambleTeamDto, gamble: Gamble): Promise<GambleTeam> {
    const members = await Promise.all(
      teamDto.memberIds.map(id => 
        this.charactersRepository.findOneByOrFail({ id }).catch(() => {
          throw new NotFoundException(`Character with ID ${id} not found`);
        })
      )
    );

    const team = new GambleTeam();
    team.name = teamDto.name;
    team.stake = teamDto.stake;
    team.gamble = gamble;
    team.members = members;

    return this.gambleTeamsRepository.save(team);
  }

  private async createRound(roundDto: CreateGambleRoundDto, gamble: Gamble): Promise<GambleRound> {
    const round = new GambleRound();
    round.roundNumber = roundDto.roundNumber;
    round.outcome = roundDto.outcome;
    round.reward = roundDto.reward;
    round.penalty = roundDto.penalty;
    round.gamble = gamble;
    
    if (roundDto.winnerTeamId) {
      const winnerTeam = await this.gambleTeamsRepository.findOneOrFail({ 
        where: { id: roundDto.winnerTeamId } 
      }).catch(() => {
        throw new NotFoundException(`Winner team with ID ${roundDto.winnerTeamId} not found`);
      });
      round.winner = winnerTeam;
    }

    return this.gambleRoundsRepository.save(round);
  }

  async findAll(options: { page?: number; limit?: number } = {}): Promise<{ data: Gamble[]; total: number; page: number; totalPages: number }> {
    const { page = 1, limit = 100 } = options;
    const qb = this.gamblesRepository.createQueryBuilder('gamble')
      .leftJoinAndSelect('gamble.teams', 'teams')
      .leftJoinAndSelect('teams.members', 'teamMembers')
      .leftJoinAndSelect('gamble.rounds', 'rounds')
      .leftJoinAndSelect('rounds.winner', 'roundWinner')
      .leftJoinAndSelect('gamble.observers', 'observers')
      .orderBy('gamble.createdAt', 'DESC');

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { data, total, page, totalPages };
  }

  async findOne(id: number): Promise<Gamble> {
    const gamble = await this.gamblesRepository.createQueryBuilder('gamble')
      .leftJoinAndSelect('gamble.teams', 'teams')
      .leftJoinAndSelect('teams.members', 'teamMembers')
      .leftJoinAndSelect('gamble.rounds', 'rounds')
      .leftJoinAndSelect('rounds.winner', 'roundWinner')
      .leftJoinAndSelect('gamble.observers', 'observers')
      .where('gamble.id = :id', { id })
      .getOne();

    if (!gamble) {
      throw new NotFoundException(`Gamble with ID ${id} not found`);
    }

    return gamble;
  }

  async findByChapter(chapterId: number): Promise<Gamble[]> {
    // Interpret the incoming number as a chapter number (not a relation id).
    // Find all chapters that have this chapter number (across series) and match gambles by stored chapterId (which references chapter.id in DB).
    const chapters = await this.chaptersRepository.find({ where: { number: chapterId } });
    if (!chapters.length) return [];
    const chapterIds = chapters.map(c => c.id);

    return this.gamblesRepository.createQueryBuilder('gamble')
      .leftJoinAndSelect('gamble.teams', 'teams')
      .leftJoinAndSelect('teams.members', 'teamMembers')
      .leftJoinAndSelect('gamble.rounds', 'rounds')
      .leftJoinAndSelect('rounds.winner', 'roundWinner')
      .leftJoinAndSelect('gamble.observers', 'observers')
      .where('gamble.chapterId IN (:...chapterIds)', { chapterIds })
      .orderBy('gamble.createdAt', 'DESC')
      .getMany();
  }

  async findByCharacter(characterId: number): Promise<Gamble[]> {
    return this.gamblesRepository.createQueryBuilder('gamble')
      .leftJoinAndSelect('gamble.teams', 'teams')
      .leftJoinAndSelect('teams.members', 'teamMembers')
      .leftJoinAndSelect('gamble.rounds', 'rounds')
      .leftJoinAndSelect('rounds.winner', 'roundWinner')
      .leftJoinAndSelect('gamble.observers', 'observers')
      .where('teamMembers.id = :characterId', { characterId })
      .orWhere('observers.id = :characterId', { characterId })
      .orderBy('gamble.createdAt', 'DESC')
      .getMany();
  }

  async search(options: {
    gambleName?: string;
    participantName?: string;
    teamName?: string;
    chapterId?: number;
    characterId?: number;
    limit?: number;
  }): Promise<Gamble[]> {
    const query = this.gamblesRepository.createQueryBuilder('gamble')
      .leftJoinAndSelect('gamble.teams', 'teams')
      .leftJoinAndSelect('teams.members', 'teamMembers')
      .leftJoinAndSelect('gamble.rounds', 'rounds')
      .leftJoinAndSelect('rounds.winner', 'roundWinner')
      .leftJoinAndSelect('gamble.observers', 'observers');

    const conditions: string[] = [];
    const parameters: any = {};

    if (options.gambleName) {
      conditions.push('gamble.name ILIKE :gambleName');
      parameters.gambleName = `%${options.gambleName}%`;
    }

    if (options.participantName) {
      conditions.push('(teamMembers.name ILIKE :participantName OR observers.name ILIKE :participantName)');
      parameters.participantName = `%${options.participantName}%`;
    }

    if (options.teamName) {
      conditions.push('teams.name ILIKE :teamName');
      parameters.teamName = `%${options.teamName}%`;
    }

    if (options.chapterId) {
  // Treat options.chapterId as a chapter number. Resolve to chapter IDs before filtering.
  const chapters = await this.chaptersRepository.find({ where: { number: options.chapterId } });
  if (!chapters.length) return [];
  const chapterIds = chapters.map(c => c.id);
  conditions.push('gamble.chapterId IN (:...chapterIds)');
  parameters.chapterIds = chapterIds;
    }

    if (options.characterId) {
      conditions.push('(teamMembers.id = :characterId OR observers.id = :characterId)');
      parameters.characterId = options.characterId;
    }

    if (conditions.length > 0) {
      query.where(conditions.join(' AND '), parameters);
    }

    if (options.limit) {
      query.limit(options.limit);
    }

    return query
      .orderBy('gamble.createdAt', 'DESC')
      .getMany();
  }
}
