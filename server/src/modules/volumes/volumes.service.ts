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

  async getShowcaseReadyVolumes(): Promise<ShowcaseReadyVolume[]> {
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

    // Keep only the latest approved record per volume for each type
    const latestBg = new Map(bgMedia.map((m) => [m.ownerId, m]));
    const latestPop = new Map(popMedia.map((m) => [m.ownerId, m]));
    const sharedVolumeIds = [...latestBg.keys()].filter((id) =>
      latestPop.has(id),
    );

    if (sharedVolumeIds.length === 0) return [];

    const volumes = await this.repo.find({
      where: { id: In(sharedVolumeIds) },
    });
    const volumeMap = new Map(volumes.map((v) => [v.id, v]));

    return sharedVolumeIds
      .filter((id) => volumeMap.has(id))
      .map((volumeId) => {
        const vol = volumeMap.get(volumeId)!;
        return {
          volumeId,
          volumeNumber: vol.number,
          backgroundUrl: latestBg.get(volumeId)!.url,
          popoutUrl: latestPop.get(volumeId)!.url,
          title: `Volume ${vol.number}`,
        };
      });
  }
}
