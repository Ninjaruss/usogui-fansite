import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GambleTranslation } from '../../entities/translations/gamble-translation.entity';
import { CreateGambleTranslationDto } from './dto/create-gamble-translation.dto';

@Injectable()
export class GambleTranslationsService {
  constructor(
    @InjectRepository(GambleTranslation)
    private readonly gambleTranslationRepo: Repository<GambleTranslation>
  ) {}

  async create(data: CreateGambleTranslationDto): Promise<GambleTranslation> {
    const translation = this.gambleTranslationRepo.create({
      gamble: { id: data.gambleId },
      languageCode: data.languageCode,
      name: data.name,
      rules: data.rules,
      winCondition: data.winCondition
    });
    return this.gambleTranslationRepo.save(translation);
  }

  async findByGambleId(gambleId: number): Promise<GambleTranslation[]> {
    return this.gambleTranslationRepo.find({
      where: { gamble: { id: gambleId } },
      relations: ['gamble']
    });
  }

  async findByGambleIdAndLanguage(gambleId: number, languageCode: string): Promise<GambleTranslation> {
    const translation = await this.gambleTranslationRepo.findOne({
      where: { gamble: { id: gambleId }, languageCode },
      relations: ['gamble']
    });

    if (!translation) {
      throw new NotFoundException(`Translation not found for gamble ${gambleId} in language ${languageCode}`);
    }

    return translation;
  }

  async update(id: number, data: Partial<CreateGambleTranslationDto>): Promise<GambleTranslation> {
    const translation = await this.gambleTranslationRepo.findOne({
      where: { id },
      relations: ['gamble']
    });

    if (!translation) {
      throw new NotFoundException(`Translation with id ${id} not found`);
    }

    Object.assign(translation, {
      name: data.name || translation.name,
      rules: data.rules || translation.rules,
      winCondition: data.winCondition
    });

    return this.gambleTranslationRepo.save(translation);
  }

  async remove(id: number): Promise<void> {
    const result = await this.gambleTranslationRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Translation with id ${id} not found`);
    }
  }
}
