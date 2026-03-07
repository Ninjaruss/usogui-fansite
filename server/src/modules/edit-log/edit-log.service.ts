import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EditLog,
  EditLogEntityType,
  EditLogAction,
} from '../../entities/edit-log.entity';
import { Guide, GuideStatus } from '../../entities/guide.entity';
import { Media, MediaStatus } from '../../entities/media.entity';
import { Annotation, AnnotationStatus } from '../../entities/annotation.entity';

@Injectable()
export class EditLogService {
  constructor(
    @InjectRepository(EditLog)
    private editLogRepository: Repository<EditLog>,
    @InjectRepository(Guide)
    private guideRepository: Repository<Guide>,
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
    @InjectRepository(Annotation)
    private annotationRepository: Repository<Annotation>,
  ) {}

  async logEdit(
    entityType: EditLogEntityType,
    entityId: number,
    action: EditLogAction,
    userId: number,
    changedFields?: string[],
  ): Promise<EditLog> {
    const editLog = this.editLogRepository.create({
      entityType,
      entityId,
      action,
      userId,
      changedFields: changedFields || null,
    });
    return await this.editLogRepository.save(editLog);
  }

  async logCreate(
    entityType: EditLogEntityType,
    entityId: number,
    userId: number,
  ): Promise<EditLog> {
    return this.logEdit(entityType, entityId, EditLogAction.CREATE, userId);
  }

  async logUpdate(
    entityType: EditLogEntityType,
    entityId: number,
    userId: number,
    changedFields: string[],
  ): Promise<EditLog> {
    return this.logEdit(
      entityType,
      entityId,
      EditLogAction.UPDATE,
      userId,
      changedFields,
    );
  }

  async logDelete(
    entityType: EditLogEntityType,
    entityId: number,
    userId: number,
  ): Promise<EditLog> {
    return this.logEdit(entityType, entityId, EditLogAction.DELETE, userId);
  }

  async getEditsByUser(userId: number): Promise<EditLog[]> {
    return await this.editLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getEditsByEntity(
    entityType: EditLogEntityType,
    entityId: number,
  ): Promise<EditLog[]> {
    return await this.editLogRepository.find({
      where: { entityType, entityId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getEditCountByUser(userId: number): Promise<number> {
    return await this.editLogRepository.count({
      where: { userId },
    });
  }

  async getEditCountByUserGrouped(
    userId: number,
  ): Promise<Record<EditLogEntityType, number>> {
    const results = await this.editLogRepository
      .createQueryBuilder('editLog')
      .select('editLog.entityType', 'entityType')
      .addSelect('COUNT(*)', 'count')
      .where('editLog.userId = :userId', { userId })
      .groupBy('editLog.entityType')
      .getRawMany();

    const counts: Record<EditLogEntityType, number> = {
      [EditLogEntityType.CHARACTER]: 0,
      [EditLogEntityType.GAMBLE]: 0,
      [EditLogEntityType.ARC]: 0,
      [EditLogEntityType.ORGANIZATION]: 0,
      [EditLogEntityType.EVENT]: 0,
    };

    for (const result of results) {
      counts[result.entityType as EditLogEntityType] = parseInt(
        result.count,
        10,
      );
    }

    return counts;
  }

  async getRecent(options: {
    limit?: number;
    page?: number;
    entityType?: EditLogEntityType;
  }): Promise<{
    data: EditLog[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, entityType } = options;
    const where: any = {};
    if (entityType) where.entityType = entityType;

    const [data, total] = await this.editLogRepository.findAndCount({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getRecentApprovedSubmissions(options: {
    limit?: number;
    page?: number;
  }): Promise<{
    data: Array<{
      id: number | string;
      type: 'guide' | 'media' | 'annotation';
      title?: string;
      entityType?: string;
      entityId?: number;
      createdAt: Date;
      submittedBy?: { id: number; username: string; fluxerAvatar?: string; fluxerId?: string } | null;
    }>;
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = options;

    const [guides, media, annotations] = await Promise.all([
      this.guideRepository.find({
        where: { status: GuideStatus.APPROVED },
        relations: ['author'],
        order: { createdAt: 'DESC' },
      }),
      this.mediaRepository.find({
        where: { status: MediaStatus.APPROVED },
        relations: ['submittedBy'],
        order: { createdAt: 'DESC' },
      }),
      this.annotationRepository.find({
        where: { status: AnnotationStatus.APPROVED },
        relations: ['author'],
        order: { createdAt: 'DESC' },
      }),
    ]);

    const combined: Array<{
      id: number | string;
      type: 'guide' | 'media' | 'annotation';
      title?: string;
      entityType?: string;
      entityId?: number;
      createdAt: Date;
      submittedBy?: { id: number; username: string; fluxerAvatar?: string; fluxerId?: string } | null;
    }> = [
      ...guides.map((g) => ({
        id: g.id,
        type: 'guide' as const,
        title: g.title,
        createdAt: g.createdAt,
        submittedBy: g.author
          ? { id: g.author.id, username: g.author.username, fluxerAvatar: g.author.fluxerAvatar ?? undefined, fluxerId: g.author.fluxerId ?? undefined }
          : null,
      })),
      ...media
        .filter((m) => m.submittedBy)
        .map((m) => ({
          id: m.id,
          type: 'media' as const,
          title: m.fileName ?? undefined,
          entityType: m.ownerType,
          entityId: m.ownerId,
          createdAt: m.createdAt,
          submittedBy: m.submittedBy
            ? { id: m.submittedBy.id, username: m.submittedBy.username, fluxerAvatar: m.submittedBy.fluxerAvatar ?? undefined, fluxerId: m.submittedBy.fluxerId ?? undefined }
            : null,
        })),
      ...annotations.map((a) => ({
        id: a.id,
        type: 'annotation' as const,
        title: a.title,
        entityType: a.ownerType,
        entityId: a.ownerId,
        createdAt: a.createdAt,
        submittedBy: a.author
          ? { id: a.author.id, username: a.author.username, fluxerAvatar: a.author.fluxerAvatar ?? undefined, fluxerId: a.author.fluxerId ?? undefined }
          : null,
      })),
    ];

    // Sort by date descending
    combined.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = combined.length;
    const data = combined.slice((page - 1) * limit, page * limit);

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }
}
