import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ChapterSpoiler, SpoilerLevel } from '../../entities/chapter_spoiler.entity';
import { Chapter } from '../../entities/chapter.entity';
import { Event } from '../../entities/event.entity';
import { CreateChapterSpoilerDto } from './dto/create-chapter-spoiler.dto';

@Injectable()
export class ChapterSpoilersService {
  constructor(
    @InjectRepository(ChapterSpoiler) private repo: Repository<ChapterSpoiler>,
    @InjectRepository(Chapter) private chapterRepo: Repository<Chapter>,
    @InjectRepository(Event) private eventRepo: Repository<Event>,
  ) {}

  async findAll(options?: { 
    level?: SpoilerLevel, 
    category?: string,
    chapterId?: number,
    isVerified?: boolean
  }): Promise<ChapterSpoiler[]> {
    const query = this.repo
      .createQueryBuilder('spoiler')
      .leftJoinAndSelect('spoiler.event', 'event')
      .leftJoinAndSelect('spoiler.chapter', 'chapter')
      .leftJoinAndSelect('spoiler.additionalRequirements', 'additionalRequirements');

    if (options?.level) {
      query.andWhere('spoiler.level = :level', { level: options.level });
    }
    if (options?.category) {
      query.andWhere('spoiler.category = :category', { category: options.category });
    }
    if (options?.chapterId) {
      query.andWhere('chapter.id = :chapterId', { chapterId: options.chapterId });
    }
    if (options?.isVerified !== undefined) {
      query.andWhere('spoiler.isVerified = :isVerified', { isVerified: options.isVerified });
    }

    return query.getMany();
  }

  async findOne(id: number): Promise<ChapterSpoiler> {
    const spoiler = await this.repo.findOne({ 
      where: { id }, 
      relations: ['event', 'chapter', 'additionalRequirements'] 
    });
    
    if (!spoiler) {
      throw new NotFoundException(`Spoiler with ID ${id} not found`);
    }
    
    return spoiler;
  }

  async create(dto: CreateChapterSpoilerDto): Promise<ChapterSpoiler> {
    // Verify chapter exists
    const chapter = await this.chapterRepo.findOne({ where: { id: dto.chapterId }});
    if (!chapter) {
      throw new BadRequestException(`Chapter with ID ${dto.chapterId} not found`);
    }

    // Verify event exists
    const event = await this.eventRepo.findOne({ where: { id: dto.eventId }});
    if (!event) {
      throw new BadRequestException(`Event with ID ${dto.eventId} not found`);
    }

    // Get additional requirements if provided
    let additionalRequirements: Chapter[] = [];
    if (dto.additionalRequirementIds?.length) {
      additionalRequirements = await this.chapterRepo.find({
        where: { id: In(dto.additionalRequirementIds) }
      });
      
      if (additionalRequirements.length !== dto.additionalRequirementIds.length) {
        throw new BadRequestException('Some additional requirement chapters were not found');
      }
    }

    const spoiler = this.repo.create({
      chapter,
      event,
      level: dto.level,
      category: dto.category,
      description: dto.description,
      minimumChapter: dto.minimumChapter,
      requirementExplanation: dto.requirementExplanation,
      isVerified: dto.isVerified ?? false,
      additionalRequirements
    });

    return this.repo.save(spoiler);
  }

  async update(id: number, data: Partial<CreateChapterSpoilerDto>) {
    const spoiler = await this.repo.findOne({
      where: { id },
      relations: ['chapter', 'event', 'additionalRequirements']
    });
    
    if (!spoiler) {
      throw new NotFoundException('Chapter spoiler not found');
    }

    if (data.chapterId) {
      const chapter = await this.chapterRepo.findOne({ where: { id: data.chapterId }});
      if (!chapter) {
        throw new BadRequestException(`Chapter with ID ${data.chapterId} not found`);
      }
      spoiler.chapter = chapter;
    }

    if (data.eventId) {
      const event = await this.eventRepo.findOne({ where: { id: data.eventId }});
      if (!event) {
        throw new BadRequestException(`Event with ID ${data.eventId} not found`);
      }
      spoiler.event = event;
    }

    if (data.additionalRequirementIds?.length) {
      const additionalRequirements = await this.chapterRepo.find({
        where: { id: In(data.additionalRequirementIds) }
      });
      
      if (additionalRequirements.length !== data.additionalRequirementIds.length) {
        throw new BadRequestException('Some additional requirement chapters were not found');
      }
      
      spoiler.additionalRequirements = additionalRequirements;
    }

    Object.assign(spoiler, {
      level: data.level,
      category: data.category,
      description: data.description,
      minimumChapter: data.minimumChapter,
      requirementExplanation: data.requirementExplanation,
      isVerified: data.isVerified
    });

    return this.repo.save(spoiler);
  }

  async remove(id: number) {
    const spoiler = await this.findOne(id);
    return this.repo.remove(spoiler);
  }

  // Check if a user can safely view a spoiler based on their read chapters
  async canViewSpoiler(spoilerId: number, readChapterIds: number[]): Promise<boolean> {
    const spoiler = await this.repo.findOne({
      where: { id: spoilerId },
      relations: ['additionalRequirements']
    });

    if (!spoiler) {
      throw new NotFoundException('Chapter spoiler not found');
    }
    
    // Check minimum chapter requirement
    if (spoiler.minimumChapter && !readChapterIds.includes(spoiler.minimumChapter)) {
      return false;
    }
    
    // Check additional requirements if they exist
    if (spoiler.additionalRequirements?.length) {
      const unreadRequirements = spoiler.additionalRequirements.filter(
        req => !readChapterIds.includes(req.id)
      );

      if (unreadRequirements.length > 0) {
        return false;
      }
    }

    return true;
  }
}
