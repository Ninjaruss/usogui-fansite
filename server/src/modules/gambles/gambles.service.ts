import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gamble } from '../../entities/gamble.entity';
import { GambleTeam } from '../../entities/gamble-team.entity';
import { GambleRound } from '../../entities/gamble-round.entity';
import { Character } from '../../entities/character.entity';
import { Chapter } from '../../entities/chapter.entity';
import { CreateGambleDto, CreateGambleTeamDto, CreateGambleRoundDto } from './dtos/create-gamble.dto';

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
    // Validate chapter exists
    const chapter = await this.chaptersRepository.findOneByOrFail({ 
      id: createGambleDto.chapterId 
    }).catch(() => {
      throw new NotFoundException(`Chapter with ID ${createGambleDto.chapterId} not found`);
    });

    // Create new gamble
    const gamble = new Gamble();
    gamble.name = createGambleDto.name;
    gamble.rules = createGambleDto.rules;
    gamble.winCondition = createGambleDto.winCondition;
    gamble.chapter = chapter;

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

  async findAll(): Promise<Gamble[]> {
    return this.gamblesRepository.createQueryBuilder('gamble')
      .leftJoinAndSelect('gamble.teams', 'teams')
      .leftJoinAndSelect('teams.members', 'teamMembers')
      .leftJoinAndSelect('gamble.rounds', 'rounds')
      .leftJoinAndSelect('rounds.winner', 'roundWinner')
      .leftJoinAndSelect('gamble.observers', 'observers')
      .leftJoinAndSelect('gamble.chapter', 'chapter')
      .orderBy('gamble.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: number): Promise<Gamble> {
    const gamble = await this.gamblesRepository.createQueryBuilder('gamble')
      .leftJoinAndSelect('gamble.teams', 'teams')
      .leftJoinAndSelect('teams.members', 'teamMembers')
      .leftJoinAndSelect('gamble.rounds', 'rounds')
      .leftJoinAndSelect('rounds.winner', 'roundWinner')
      .leftJoinAndSelect('gamble.observers', 'observers')
      .leftJoinAndSelect('gamble.chapter', 'chapter')
      .where('gamble.id = :id', { id })
      .getOne();

    if (!gamble) {
      throw new NotFoundException(`Gamble with ID ${id} not found`);
    }

    return gamble;
  }

  async findByChapter(chapterId: number): Promise<Gamble[]> {
    return this.gamblesRepository.createQueryBuilder('gamble')
      .leftJoinAndSelect('gamble.teams', 'teams')
      .leftJoinAndSelect('teams.members', 'teamMembers')
      .leftJoinAndSelect('gamble.rounds', 'rounds')
      .leftJoinAndSelect('rounds.winner', 'roundWinner')
      .leftJoinAndSelect('gamble.observers', 'observers')
      .leftJoinAndSelect('gamble.chapter', 'chapter')
      .where('chapter.id = :chapterId', { chapterId })
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
      .leftJoinAndSelect('gamble.chapter', 'chapter')
      .where('teamMembers.id = :characterId', { characterId })
      .orWhere('observers.id = :characterId', { characterId })
      .orderBy('gamble.createdAt', 'DESC')
      .getMany();
  }
}
