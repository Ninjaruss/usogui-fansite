import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Volume } from '../../entities/volume.entity';
import { CreateVolumeDto } from './dto/create-volume.dto';
import { UpdateVolumeDto } from './dto/update-volume.dto';

import { MediaService } from '../media/media.service';
import { MediaOwnerType, MediaUsageType } from '../../entities/media.entity';

export interface ShowcaseReadyVolume {
  volumeId: number;
  volumeNumber: number;
  backgroundUrl: string;
  popoutUrl: string;
  title: string;
}

export interface ShowcaseSlot {
  primary: ShowcaseReadyVolume;
  secondary?: ShowcaseReadyVolume;
}

@Injectable()
export class VolumesService {
  constructor(
    @InjectRepository(Volume) private repo: Repository<Volume>,
    private readonly mediaService: MediaService,
  ) {}

  /**
   * Get all volumes with pagination and filtering
   */
  async findAll(filters: {
    number?: number;
    title?: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'ASC' | 'DESC';
  }) {
    const { page = 1, limit = 20, sort, order = 'ASC' } = filters;
    const query = this.repo.createQueryBuilder('volume');
    if (filters.number) {
      query.andWhere('volume.number = :number', { number: filters.number });
    }
    if (filters.title) {
      query.andWhere('volume.title ILIKE :title', {
        title: `%${filters.title}%`,
      });
    }

    // Sorting: only allow certain fields for safety
    const allowedSort = ['id', 'number', 'startChapter', 'endChapter'];
    if (sort && allowedSort.includes(sort)) {
      query.orderBy(`volume.${sort}`, order);
    } else {
      query.orderBy('volume.number', 'ASC'); // Default: by volume number
    }

    query.skip((page - 1) * limit).take(limit);
    const [items, totalItems] = await query.getManyAndCount();
    return {
      data: items,
      total: totalItems,
      page,
      perPage: limit,
      totalPages: Math.ceil(totalItems / limit),
    };
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: CreateVolumeDto) {
    const volume = this.repo.create({
      number: data.number,
      startChapter: data.startChapter,
      endChapter: data.endChapter,
      description: data.description,
    });
    return this.repo.save(volume);
  }

  update(id: number, data: UpdateVolumeDto) {
    const updateData: any = { ...data };
    return this.repo.update(id, updateData);
  }

  remove(id: number) {
    return this.repo.delete(id);
  }

  /**
   * Find volume by chapter number
   */
  async findByChapter(chapterNumber: number) {
    return this.repo
      .createQueryBuilder('volume')
      .where('volume.startChapter <= :chapterNumber', { chapterNumber })
      .andWhere('volume.endChapter >= :chapterNumber', { chapterNumber })
      .getOne();
  }

  /**
   * Get chapters range for a volume
   */
  getChapterRange(volume: Volume): number[] {
    const chapters: number[] = [];
    for (let i = volume.startChapter; i <= volume.endChapter; i++) {
      chapters.push(i);
    }
    return chapters;
  }

  /**
   * Get entity display media for a volume
   */
  async getVolumeShowcaseMedia(
    volumeNumber: number,
    usageType: MediaUsageType,
  ) {
    const volume = await this.repo.findOne({ where: { number: volumeNumber } });
    if (!volume) return null;
    return this.mediaService.findOneByUsageType(
      MediaOwnerType.VOLUME,
      volume.id,
      usageType,
    );
  }

  /**
   * Get showcase status for background and popout images
   */
  async getVolumeShowcaseStatus(volumeId: number): Promise<{
    background: 'approved' | 'pending' | 'rejected' | null;
    popout: 'approved' | 'pending' | 'rejected' | null;
  }> {
    const [bg, pop] = await Promise.all([
      this.mediaService.findLatestByUsageTypeAny(
        MediaOwnerType.VOLUME,
        volumeId,
        MediaUsageType.VOLUME_SHOWCASE_BACKGROUND,
      ),
      this.mediaService.findLatestByUsageTypeAny(
        MediaOwnerType.VOLUME,
        volumeId,
        MediaUsageType.VOLUME_SHOWCASE_POPOUT,
      ),
    ]);
    return {
      background: bg ? (bg.status as 'approved' | 'pending' | 'rejected') : null,
      popout: pop ? (pop.status as 'approved' | 'pending' | 'rejected') : null,
    };
  }

  async getVolumeEntityDisplayMedia(
    volumeId: number,
    userProgress?: number,
    options: {
      page?: number;
      limit?: number;
    } = {},
  ) {
    const volume = await this.findOne(volumeId);

    const result = await this.mediaService.findForEntityDisplay(
      MediaOwnerType.VOLUME,
      volumeId,
      undefined, // no chapter filter - we'll handle spoilers separately
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

  async getShowcaseReadyVolumes(): Promise<ShowcaseSlot[]> {
    const [bgMedia, popMedia] = await Promise.all([
      this.mediaService.findAllApprovedByUsageType(
        MediaOwnerType.VOLUME,
        MediaUsageType.VOLUME_SHOWCASE_BACKGROUND,
      ),
      this.mediaService.findAllApprovedByUsageType(
        MediaOwnerType.VOLUME,
        MediaUsageType.VOLUME_SHOWCASE_POPOUT,
      ),
    ]);

    // Keep only the latest approved record per volume for each type.
    // bgMedia/popMedia are sorted createdAt DESC so first-seen per ownerId is the latest.
    const latestBg = new Map<number, (typeof bgMedia)[0]>();
    for (const m of bgMedia) {
      if (!latestBg.has(m.ownerId)) latestBg.set(m.ownerId, m);
    }
    const latestPop = new Map<number, (typeof popMedia)[0]>();
    for (const m of popMedia) {
      if (!latestPop.has(m.ownerId)) latestPop.set(m.ownerId, m);
    }
    const sharedVolumeIds = [...latestBg.keys()].filter((id) =>
      latestPop.has(id),
    );

    if (sharedVolumeIds.length === 0) return [];

    const volumes = await this.repo.find({
      where: { id: In(sharedVolumeIds) },
      order: { number: 'ASC' },
    });
    const volumeMap = new Map(volumes.map((v) => [v.id, v]));

    const toShowcaseVolume = (id: number): ShowcaseReadyVolume => {
      const vol = volumeMap.get(id)!;
      return {
        volumeId: id,
        volumeNumber: vol.number,
        backgroundUrl: latestBg.get(id)!.url,
        popoutUrl: latestPop.get(id)!.url,
        title: `Volume ${vol.number}`,
      };
    };

    // Collect volume IDs that are designated as secondaries by another volume.
    const secondaryIds = new Set<number>();
    for (const vol of volumes) {
      if (vol.pairedVolumeId && volumeMap.has(vol.pairedVolumeId)) {
        secondaryIds.add(vol.pairedVolumeId);
      }
    }

    const slots: ShowcaseSlot[] = [];
    for (const vol of volumes) {
      if (secondaryIds.has(vol.id)) continue; // rendered as someone else's secondary

      const slot: ShowcaseSlot = { primary: toShowcaseVolume(vol.id) };

      if (vol.pairedVolumeId && volumeMap.has(vol.pairedVolumeId)) {
        slot.secondary = toShowcaseVolume(vol.pairedVolumeId);
      }

      slots.push(slot);
    }

    return slots;
  }
}
