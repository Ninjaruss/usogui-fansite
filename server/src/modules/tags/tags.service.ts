import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from '../../entities/tag.entity';

@Injectable()
export class TagsService {
  constructor(@InjectRepository(Tag) private repo: Repository<Tag>) {}

  /**
   * Sorting: sort (id, name), order (ASC/DESC)
   */
  async findAll(
    filters: {
      sort?: string;
      order?: 'ASC' | 'DESC';
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{
    data: Tag[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    const { sort, order = 'ASC', page = 1, limit = 1000 } = filters;
    const query = this.repo
      .createQueryBuilder('tag')
      .leftJoinAndSelect('tag.events', 'events');
    const allowedSort = ['id', 'name'];
    if (sort && allowedSort.includes(sort)) {
      query.orderBy(`tag.${sort}`, order);
    } else {
      query.orderBy('tag.name', 'ASC');
    }

    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { data, total, page, perPage: limit, totalPages };
  }

  async findOne(id: number): Promise<Tag> {
    const tag = await this.repo.findOne({
      where: { id },
      relations: ['events'],
    });
    if (!tag) throw new NotFoundException(`Tag with ID ${id} not found`);
    return tag;
  }

  create(data: Partial<Tag>): Promise<Tag> {
    const tag = this.repo.create(data);
    return this.repo.save(tag);
  }

  async update(id: number, data: Partial<Tag>) {
    const result = await this.repo.update(id, data);
    if (result.affected === 0)
      throw new NotFoundException(`Tag with ID ${id} not found`);
    return this.findOne(id);
  }

  async remove(id: number) {
    const result = await this.repo.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`Tag with ID ${id} not found`);
    return { deleted: true };
  }
}
