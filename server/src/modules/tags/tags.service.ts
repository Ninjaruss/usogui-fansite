import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from '../../entities/tag.entity';
import { EditLogService } from '../edit-log/edit-log.service';
import { EditLogEntityType } from '../../entities/edit-log.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag) private repo: Repository<Tag>,
    private readonly editLogService: EditLogService,
  ) {}

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

  async create(data: Partial<Tag>, userId: number): Promise<Tag> {
    const tag = this.repo.create(data);
    const saved = await this.repo.save(tag);
    await this.editLogService.logCreate(EditLogEntityType.TAG, saved.id, userId);
    return saved;
  }

  async update(id: number, data: Partial<Tag>, userId: number, isMinorEdit = false): Promise<Tag> {
    const tag = await this.findOne(id);
    Object.assign(tag, data);
    if (!isMinorEdit) {
      tag.isVerified = false;
      tag.verifiedById = null;
      tag.verifiedAt = null;
    }
    const saved = await this.repo.save(tag);
    const changedFields = Object.keys(data).filter((k) => data[k as keyof typeof data] !== undefined);
    await this.editLogService.logUpdate(EditLogEntityType.TAG, id, userId, changedFields, isMinorEdit);
    return saved;
  }

  async remove(id: number, userId: number): Promise<{ deleted: boolean }> {
    await this.editLogService.logDelete(EditLogEntityType.TAG, id, userId);
    const result = await this.repo.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Tag with ID ${id} not found`);
    return { deleted: true };
  }

  async verify(id: number, verifierId: number, isAdmin: boolean): Promise<Tag> {
    const tag = await this.findOne(id);
    if (!isAdmin) {
      const lastEdit = await this.editLogService.findLastMajorEdit(EditLogEntityType.TAG, id);
      if (lastEdit && lastEdit.userId === verifierId) {
        throw new ForbiddenException('You cannot verify your own edit');
      }
    }
    tag.isVerified = true;
    tag.verifiedById = verifierId;
    tag.verifiedAt = new Date();
    return this.repo.save(tag);
  }
}
