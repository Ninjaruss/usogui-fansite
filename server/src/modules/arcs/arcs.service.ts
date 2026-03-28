import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Arc } from '../../entities/arc.entity';
import { Chapter } from '../../entities/chapter.entity';
import { Gamble } from '../../entities/gamble.entity';
import { CreateArcDto } from './dto/create-arc.dto';
import { MediaService } from '../media/media.service';
import { MediaOwnerType } from '../../entities/media.entity';
import { EditLogService } from '../edit-log/edit-log.service';
import { EditLogEntityType } from '../../entities/edit-log.entity';

@Injectable()
export class ArcsService {
  constructor(
    @InjectRepository(Arc) private repo: Repository<Arc>,
    @InjectRepository(Chapter) private chapterRepo: Repository<Chapter>,
    @InjectRepository(Gamble) private gambleRepo: Repository<Gamble>,
    private readonly mediaService: MediaService,
    private readonly editLogService: EditLogService,
  ) {}

  /**
   * Pagination: page (default 1), limit (default 20)
   * includeHierarchy: when true, returns only parent arcs with children nested
   */
  async findAll(filters: {
    name?: string;
    description?: string;
    parentId?: number;
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'ASC' | 'DESC';
    includeHierarchy?: boolean;
  }) {
    const {
      page = 1,
      limit = 20,
      sort,
      order = 'ASC',
      includeHierarchy = false,
    } = filters;
    const query = this.repo.createQueryBuilder('arc');

    // Load children relation for hierarchical display
    if (includeHierarchy) {
      query.leftJoinAndSelect('arc.children', 'children');
      // Only return top-level arcs (no parent)
      query.andWhere('arc.parentId IS NULL');
    }

    // Filter by parentId (for finding sub-arcs of a specific arc)
    if (filters.parentId !== undefined) {
      query.andWhere('arc.parentId = :parentId', {
        parentId: filters.parentId,
      });
    }

    if (filters.name) {
      query.andWhere('LOWER(arc.name) LIKE LOWER(:name)', {
        name: `%${filters.name}%`,
      });
    }
    // series removed
    if (filters.description) {
      query.andWhere('LOWER(arc.description) LIKE LOWER(:description)', {
        description: `%${filters.description}%`,
      });
    }

    // Sorting: only allow certain fields for safety
    const allowedSort = ['id', 'name', 'description', 'order'];
    if (sort && allowedSort.includes(sort)) {
      query.orderBy(`arc.${sort}`, order);
    } else {
      query.orderBy('arc.order', 'ASC'); // Default: canonical order
    }

    // Order children by their order field when hierarchy is included
    if (includeHierarchy) {
      query.addOrderBy('children.order', 'ASC');
    }

    query.skip((page - 1) * limit).take(limit);
    const [data, total] = await query.getManyAndCount();
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  findOne(id: number) {
    return this.repo.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });
  }

  async create(data: CreateArcDto, userId: number) {
    const arc = this.repo.create({
      name: data.name,
      order: data.order,
      description: data.description,
      startChapter: data.startChapter,
      endChapter: data.endChapter,
      parentId: data.parentId,
    });
    const saved = await this.repo.save(arc);
    await this.editLogService.logCreate(
      EditLogEntityType.ARC,
      saved.id,
      userId,
    );
    return saved;
  }

  async update(id: number, data: Partial<Arc>, userId: number, isMinorEdit = false) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`Arc with id ${id} not found`);
    Object.assign(entity, data);
    if (!isMinorEdit) {
      entity.isVerified = false;
      entity.verifiedById = null;
      entity.verifiedAt = null;
    }
    const saved = await this.repo.save(entity);
    const changedFields = Object.keys(data).filter(
      (k) => data[k as keyof typeof data] !== undefined,
    );
    await this.editLogService.logUpdate(
      EditLogEntityType.ARC,
      id,
      userId,
      changedFields,
      isMinorEdit,
    );
    return saved;
  }

  async verify(id: number, verifierId: number, isAdmin: boolean): Promise<Arc> {
    const arc = await this.repo.findOne({ where: { id } });
    if (!arc) throw new NotFoundException(`Arc with id ${id} not found`);
    if (!isAdmin) {
      const lastEdit = await this.editLogService.findLastMajorEdit(EditLogEntityType.ARC, id);
      if (lastEdit && lastEdit.userId === verifierId) {
        throw new ForbiddenException('You cannot verify your own edit');
      }
    }
    arc.isVerified = true;
    arc.verifiedById = verifierId;
    arc.verifiedAt = new Date();
    return this.repo.save(arc);
  }

  async remove(id: number, userId: number) {
    await this.editLogService.logDelete(EditLogEntityType.ARC, id, userId);
    return this.repo.delete(id);
  }

  async getChaptersInArc(arcId: number): Promise<Chapter[]> {
    const arc = await this.repo.findOne({ where: { id: arcId } });

    if (!arc) {
      throw new NotFoundException(`Arc with id ${arcId} not found`);
    }

    if (!arc.startChapter || !arc.endChapter) {
      return [];
    }

    return this.chapterRepo.find({
      where: {
        number: Between(arc.startChapter, arc.endChapter),
      },
      order: { number: 'ASC' },
    });
  }

  async getGamblesInArc(arcId: number) {
    const arc = await this.repo.findOne({ where: { id: arcId } });

    if (!arc) {
      throw new NotFoundException(`Arc with id ${arcId} not found`);
    }

    if (!arc.startChapter || !arc.endChapter) {
      return { data: [], total: 0 };
    }

    // Find all chapters in the arc's range
    const chaptersInArc = await this.chapterRepo.find({
      where: {
        number: Between(arc.startChapter, arc.endChapter),
      },
      select: ['id', 'number'],
    });

    const chapterIds = chaptersInArc.map((chapter) => chapter.id);

    if (chapterIds.length === 0) {
      return { data: [], total: 0 };
    }

    // Find all gambles that reference chapters in this arc
    const gambles = await this.gambleRepo.find({
      where: {
        chapterId: In(chapterIds),
      },
      relations: ['participants'],
    });

    return {
      data: gambles,
      total: gambles.length,
    };
  }

  /**
   * Get entity display media for arc thumbnails with spoiler protection
   */
  async getArcEntityDisplayMedia(
    arcId: number,
    userProgress?: number,
    options: {
      page?: number;
      limit?: number;
    } = {},
  ) {
    await this.findOne(arcId); // Validate arc exists

    const result = await this.mediaService.findForEntityDisplay(
      MediaOwnerType.ARC,
      arcId,
      undefined,
      {
        page: options.page,
        limit: options.limit,
      },
    );

    // Apply spoiler protection if user progress is provided
    if (userProgress !== undefined) {
      result.data = result.data.map((media) => ({
        ...media,
        isSpoiler: media.chapterNumber > userProgress,
      }));
    }

    return result;
  }

  /**
   * Get gallery media for arc
   */
  async getArcGalleryMedia(
    arcId: number,
    userProgress?: number,
    options: {
      chapter?: number;
      page?: number;
      limit?: number;
    } = {},
  ) {
    await this.findOne(arcId); // Validate arc exists

    const result = await this.mediaService.findForGallery(
      MediaOwnerType.ARC,
      arcId,
      {
        chapter: options.chapter,
        page: options.page,
        limit: options.limit,
      },
    );

    // Apply spoiler protection if user progress is provided
    if (userProgress !== undefined) {
      result.data = result.data.map((media) => ({
        ...media,
        isSpoiler: media.chapterNumber && media.chapterNumber > userProgress,
      }));
    }

    return result;
  }

  /**
   * Get the current entity display media for arc thumbnail
   */
  async getArcCurrentThumbnail(arcId: number, userProgress?: number) {
    await this.findOne(arcId); // Validate arc exists

    // First try to get the default entity display media
    const defaultMedia = await this.mediaService.getDefaultForOwner(
      MediaOwnerType.ARC,
      arcId,
    );

    if (defaultMedia) {
      const isSpoiler =
        userProgress !== undefined && defaultMedia.chapterNumber > userProgress;

      return {
        ...defaultMedia,
        isSpoiler,
      };
    }

    // If no default, get the most recent entity display media
    const recentMedia = await this.mediaService.findForEntityDisplay(
      MediaOwnerType.ARC,
      arcId,
      undefined,
      { limit: 1 },
    );

    if (recentMedia.data.length > 0) {
      const media = recentMedia.data[0];
      const isSpoiler =
        userProgress !== undefined && media.chapterNumber > userProgress;

      return {
        ...media,
        isSpoiler,
      };
    }

    return null;
  }
}
