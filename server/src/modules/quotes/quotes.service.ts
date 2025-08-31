import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Quote } from '../../entities/quote.entity';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { User, UserRole } from '../../entities/user.entity';
import { Character } from '../../entities/character.entity';

@Injectable()
export class QuotesService {
  constructor(
    @InjectRepository(Quote)
    private quotesRepository: Repository<Quote>,
    @InjectRepository(Character)
    private charactersRepository: Repository<Character>,
  ) {}

  async create(createQuoteDto: CreateQuoteDto, user: User): Promise<Quote> {
    // Verify character exists
    const character = await this.charactersRepository.findOne({
      where: { id: createQuoteDto.characterId },
    });
    if (!character) {
      throw new NotFoundException(
        `Character with ID ${createQuoteDto.characterId} not found`,
      );
    }

    const quote = this.quotesRepository.create({
      ...createQuoteDto,
      character,
      submittedBy: user,
    });

    return this.quotesRepository.save(quote);
  }

  async findAll(options?: {
    characterId?: number;
    chapterNumber?: number;
    chapterRange?: { start: number; end: number };
    search?: string;
    submittedById?: number;
    page?: number;
    limit?: number;
  }): Promise<{
    data: Quote[];
    total: number;
    page?: number;
    perPage?: number;
    totalPages?: number;
  }> {
    const queryBuilder = this.quotesRepository
      .createQueryBuilder('quote')
      .leftJoinAndSelect('quote.character', 'character')
      .leftJoinAndSelect('quote.submittedBy', 'submittedBy')
      .orderBy('quote.createdAt', 'DESC');

    if (options?.characterId) {
      queryBuilder.andWhere('quote.characterId = :characterId', {
        characterId: options.characterId,
      });
    }

    if (options?.chapterNumber) {
      queryBuilder.andWhere('quote.chapterNumber = :chapterNumber', {
        chapterNumber: options.chapterNumber,
      });
    }

    if (options?.chapterRange) {
      queryBuilder.andWhere('quote.chapterNumber BETWEEN :start AND :end', {
        start: options.chapterRange.start,
        end: options.chapterRange.end,
      });
    }

    if (options?.search) {
      queryBuilder.andWhere(
        '(quote.text ILIKE :search OR quote.description ILIKE :search)',
        { search: `%${options.search}%` },
      );
    }

    if (options?.submittedById) {
      queryBuilder.andWhere('quote.submittedById = :submittedById', {
        submittedById: options.submittedById,
      });
    }

    const total = await queryBuilder.getCount();

    if (options?.page && options?.limit) {
      const skip = (options.page - 1) * options.limit;
      queryBuilder.skip(skip).take(options.limit);
    }

    const quotes = await queryBuilder.getMany();
    const page = options?.page ?? 1;
    const perPage = options?.limit ?? quotes.length;
    const totalPages = perPage ? Math.ceil(total / perPage) : 1;

    return { data: quotes, total, page, perPage, totalPages };
  }

  async findOne(id: number): Promise<Quote> {
    const quote = await this.quotesRepository.findOne({
      where: { id },
      relations: ['character', 'submittedBy'],
    });

    if (!quote) {
      throw new NotFoundException(`Quote with ID ${id} not found`);
    }

    return quote;
  }

  async findRandom(options?: {
    characterId?: number;
    chapterRange?: { start: number; end: number };
  }): Promise<Quote> {
    const queryBuilder = this.quotesRepository
      .createQueryBuilder('quote')
      .leftJoinAndSelect('quote.character', 'character')
      .leftJoinAndSelect('quote.submittedBy', 'submittedBy')
      .orderBy('RANDOM()');

    if (options?.characterId) {
      queryBuilder.andWhere('quote.characterId = :characterId', {
        characterId: options.characterId,
      });
    }

    if (options?.chapterRange) {
      queryBuilder.andWhere('quote.chapterNumber BETWEEN :start AND :end', {
        start: options.chapterRange.start,
        end: options.chapterRange.end,
      });
    }

    const quote = await queryBuilder.getOne();

    if (!quote) {
      throw new NotFoundException('No quotes found matching the criteria');
    }

    return quote;
  }

  async getCharacterStats(characterId: number): Promise<{
    totalQuotes: number;
    chaptersWithQuotes: number[];
    firstQuoteChapter: number;
    lastQuoteChapter: number;
  }> {
    const character = await this.charactersRepository.findOne({
      where: { id: characterId },
    });

    if (!character) {
      throw new NotFoundException(`Character with ID ${characterId} not found`);
    }

    const quotes = await this.quotesRepository.find({
      where: { character: { id: characterId } },
      select: ['chapterNumber'],
      order: { chapterNumber: 'ASC' },
    });

    const chaptersWithQuotes = [...new Set(quotes.map((q) => q.chapterNumber))];

    return {
      totalQuotes: quotes.length,
      chaptersWithQuotes,
      firstQuoteChapter: chaptersWithQuotes[0] || 0,
      lastQuoteChapter: chaptersWithQuotes[chaptersWithQuotes.length - 1] || 0,
    };
  }

  async update(
    id: number,
    updateQuoteDto: UpdateQuoteDto,
    user: User,
  ): Promise<Quote> {
    const quote = await this.findOne(id);

    // Check if user can update this quote (only submitter, moderator, or admin)
    if (
      quote.submittedBy.id !== user.id &&
      user.role !== UserRole.MODERATOR &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('You can only update your own quotes');
    }

    // If changing character, verify it exists
    if (
      updateQuoteDto.characterId &&
      updateQuoteDto.characterId !== quote.character.id
    ) {
      const character = await this.charactersRepository.findOne({
        where: { id: updateQuoteDto.characterId },
      });
      if (!character) {
        throw new NotFoundException(
          `Character with ID ${updateQuoteDto.characterId} not found`,
        );
      }
    }

    await this.quotesRepository.update(id, updateQuoteDto);
    return this.findOne(id);
  }

  async remove(id: number, user: User): Promise<void> {
    const quote = await this.findOne(id);

    // Check if user can delete this quote (only submitter, moderator, or admin)
    if (
      quote.submittedBy.id !== user.id &&
      user.role !== UserRole.MODERATOR &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('You can only delete your own quotes');
    }

    await this.quotesRepository.remove(quote);
  }

  async getQuotesByChapter(chapterNumber: number): Promise<Quote[]> {
    return this.quotesRepository.find({
      where: { chapterNumber },
      relations: ['character', 'submittedBy'],
      order: { pageNumber: 'ASC', createdAt: 'ASC' },
    });
  }

  async searchQuotes(
    searchTerm: string,
    options?: {
      characterId?: number;
      limit?: number;
    },
  ): Promise<Quote[]> {
    const queryBuilder = this.quotesRepository
      .createQueryBuilder('quote')
      .leftJoinAndSelect('quote.character', 'character')
      .leftJoinAndSelect('quote.submittedBy', 'submittedBy')
      .where('quote.text ILIKE :search OR quote.description ILIKE :search', {
        search: `%${searchTerm}%`,
      })
      .orderBy('quote.createdAt', 'DESC');

    if (options?.characterId) {
      queryBuilder.andWhere('quote.characterId = :characterId', {
        characterId: options.characterId,
      });
    }

    if (options?.limit) {
      queryBuilder.limit(options.limit);
    }

    return queryBuilder.getMany();
  }

  async bulkDeleteByCharacter(characterId: number): Promise<number> {
    const quotes = await this.quotesRepository.find({
      where: { character: { id: characterId } },
    });

    if (quotes.length > 0) {
      await this.quotesRepository.remove(quotes);
    }

    return quotes.length;
  }
}
