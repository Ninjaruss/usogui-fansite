import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  EditLog,
  EditLogEntityType,
  EditLogAction,
} from '../../entities/edit-log.entity';
import { Guide, GuideStatus } from '../../entities/guide.entity';
import { Media, MediaStatus } from '../../entities/media.entity';
import { Annotation, AnnotationStatus } from '../../entities/annotation.entity';
import { Character } from '../../entities/character.entity';
import { Gamble } from '../../entities/gamble.entity';
import { Arc } from '../../entities/arc.entity';
import { Organization } from '../../entities/organization.entity';
import { Event } from '../../entities/event.entity';

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
    @InjectRepository(Character)
    private characterRepository: Repository<Character>,
    @InjectRepository(Gamble)
    private gambleRepository: Repository<Gamble>,
    @InjectRepository(Arc)
    private arcRepository: Repository<Arc>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
  ) {}

  private async resolveEntityNames(
    entries: Array<{ entityType: EditLogEntityType; entityId: number }>,
  ): Promise<Map<string, string>> {
    const groups = new Map<EditLogEntityType, number[]>();
    for (const e of entries) {
      if (!groups.has(e.entityType)) groups.set(e.entityType, []);
      groups.get(e.entityType)!.push(e.entityId);
    }

    const nameMap = new Map<string, string>();

    const fetch = async <T extends { id: number; name?: string; title?: string }>(
      repo: Repository<T>,
      type: EditLogEntityType,
      ids: number[],
      field: 'name' | 'title',
    ) => {
      const rows = await repo.find({ where: { id: In(ids) } as any, select: ['id', field] as any });
      for (const row of rows) {
        const val = (row as any)[field] as string | undefined;
        if (val) nameMap.set(`${type}:${row.id}`, val);
      }
    };

    await Promise.all([
      groups.has(EditLogEntityType.CHARACTER)
        ? fetch(this.characterRepository as any, EditLogEntityType.CHARACTER, groups.get(EditLogEntityType.CHARACTER)!, 'name')
        : Promise.resolve(),
      groups.has(EditLogEntityType.GAMBLE)
        ? fetch(this.gambleRepository as any, EditLogEntityType.GAMBLE, groups.get(EditLogEntityType.GAMBLE)!, 'name')
        : Promise.resolve(),
      groups.has(EditLogEntityType.ARC)
        ? fetch(this.arcRepository as any, EditLogEntityType.ARC, groups.get(EditLogEntityType.ARC)!, 'name')
        : Promise.resolve(),
      groups.has(EditLogEntityType.ORGANIZATION)
        ? fetch(this.organizationRepository as any, EditLogEntityType.ORGANIZATION, groups.get(EditLogEntityType.ORGANIZATION)!, 'name')
        : Promise.resolve(),
      groups.has(EditLogEntityType.EVENT)
        ? fetch(this.eventRepository as any, EditLogEntityType.EVENT, groups.get(EditLogEntityType.EVENT)!, 'title')
        : Promise.resolve(),
      groups.has(EditLogEntityType.GUIDE)
        ? fetch(this.guideRepository as any, EditLogEntityType.GUIDE, groups.get(EditLogEntityType.GUIDE)!, 'title')
        : Promise.resolve(),
      groups.has(EditLogEntityType.MEDIA)
        ? fetch(this.mediaRepository as any, EditLogEntityType.MEDIA, groups.get(EditLogEntityType.MEDIA)!, 'title')
        : Promise.resolve(),
      groups.has(EditLogEntityType.ANNOTATION)
        ? (async () => {
            const ids = groups.get(EditLogEntityType.ANNOTATION)!;
            const rows = await this.annotationRepository.find({
              where: { id: In(ids) } as any,
              select: ['id', 'title', 'ownerType'] as any,
            });
            for (const row of rows) {
              const ownerLabel = row.ownerType
                ? row.ownerType.charAt(0).toUpperCase() + row.ownerType.slice(1)
                : 'Annotation';
              nameMap.set(
                `${EditLogEntityType.ANNOTATION}:${row.id}`,
                `${ownerLabel}: ${row.title}`,
              );
            }
          })()
        : Promise.resolve(),
    ]);

    return nameMap;
  }

  private async resolveEntityNamesByType(
    entityType: string,
    ids: number[],
  ): Promise<Map<number, string>> {
    const nameMap = new Map<number, string>();
    if (!ids.length) return nameMap;

    const fetch = async <T extends { id: number }>(
      repo: Repository<T>,
      field: 'name' | 'title',
    ) => {
      const rows = await repo.find({ where: { id: In(ids) } as any, select: ['id', field] as any });
      for (const row of rows) {
        const val = (row as any)[field] as string | undefined;
        if (val) nameMap.set(row.id, val);
      }
    };

    switch (entityType.toLowerCase()) {
      case 'character': await fetch(this.characterRepository as any, 'name'); break;
      case 'gamble': await fetch(this.gambleRepository as any, 'name'); break;
      case 'arc': await fetch(this.arcRepository as any, 'name'); break;
      case 'organization': await fetch(this.organizationRepository as any, 'name'); break;
      case 'event': await fetch(this.eventRepository as any, 'title'); break;
    }

    return nameMap;
  }

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

  async getSubmissionEditsByUser(userId: number): Promise<Array<EditLog & { entityName?: string }>> {
    const data = await this.editLogRepository.find({
      where: {
        userId,
        entityType: In([
          EditLogEntityType.GUIDE,
          EditLogEntityType.MEDIA,
          EditLogEntityType.ANNOTATION,
        ]),
      },
      order: { createdAt: 'DESC' },
    });
    const nameMap = await this.resolveEntityNames(data);
    return data.map((e) => ({
      ...e,
      entityName: nameMap.get(`${e.entityType}:${e.entityId}`),
    }));
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
      [EditLogEntityType.GUIDE]: 0,
      [EditLogEntityType.MEDIA]: 0,
      [EditLogEntityType.ANNOTATION]: 0,
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
    data: Array<EditLog & { entityName?: string }>;
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

    const nameMap = await this.resolveEntityNames(data);
    const enriched = data.map((e) => ({
      ...e,
      entityName: nameMap.get(`${e.entityType}:${e.entityId}`),
    }));

    return { data: enriched, total, page, totalPages: Math.ceil(total / limit) };
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
      entityName?: string;
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
      entityName?: string;
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

    // Enrich media/annotation entries with entityName
    const byType = new Map<string, number[]>();
    for (const item of data) {
      if (item.entityType && item.entityId) {
        if (!byType.has(item.entityType)) byType.set(item.entityType, []);
        byType.get(item.entityType)!.push(item.entityId);
      }
    }
    const typeNameMaps = new Map<string, Map<number, string>>();
    await Promise.all(
      Array.from(byType.entries()).map(async ([type, ids]) => {
        typeNameMaps.set(type, await this.resolveEntityNamesByType(type, ids));
      }),
    );
    const enrichedData = data.map((item) => ({
      ...item,
      entityName:
        item.entityType && item.entityId
          ? typeNameMaps.get(item.entityType)?.get(item.entityId)
          : undefined,
    }));

    return { data: enrichedData, total, page, totalPages: Math.ceil(total / limit) };
  }
}
