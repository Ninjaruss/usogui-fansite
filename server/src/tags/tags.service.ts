import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './tag.entity';

@Injectable()
export class TagsService {
  constructor(@InjectRepository(Tag) private repo: Repository<Tag>) {}

  findAll(): Promise<Tag[]> {
    return this.repo.find({ relations: ['events'] });
  }

  async findOne(id: number): Promise<Tag> {
    const tag = await this.repo.findOne({ where: { id }, relations: ['events'] });
    if (!tag) throw new NotFoundException(`Tag with ID ${id} not found`);
    return tag;
  }

  create(data: Partial<Tag>): Promise<Tag> {
    const tag = this.repo.create(data);
    return this.repo.save(tag);
  }

  async update(id: number, data: Partial<Tag>) {
    const result = await this.repo.update(id, data);
    if (result.affected === 0) throw new NotFoundException(`Tag with ID ${id} not found`);
    return this.findOne(id);
  }

  async remove(id: number) {
    const result = await this.repo.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Tag with ID ${id} not found`);
    return { deleted: true };
  }
}
