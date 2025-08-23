import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Volume } from '../../entities/volume.entity';
import { CreateVolumeDto } from './dto/create-volume.dto';
import { UpdateVolumeDto } from './dto/update-volume.dto';

@Injectable()
export class VolumesService {
  constructor(
    @InjectRepository(Volume) private repo: Repository<Volume>
  ) {}

  /**
   * Get all volumes with pagination and filtering
   */
  async findAll(filters: { 
    series?: string; 
    number?: number;
    title?: string;
    page?: number; 
    limit?: number; 
    sort?: string; 
    order?: 'ASC' | 'DESC' 
  }) {
    const { page = 1, limit = 20, sort, order = 'ASC' } = filters;
    const query = this.repo.createQueryBuilder('volume')
      .leftJoinAndSelect('volume.series', 'series');

    if (filters.series) {
      query.andWhere('LOWER(series.name) LIKE LOWER(:series)', { series: `%${filters.series}%` });
    }
    if (filters.number) {
      query.andWhere('volume.number = :number', { number: filters.number });
    }
    if (filters.title) {
      query.andWhere('LOWER(volume.title) LIKE LOWER(:title)', { title: `%${filters.title}%` });
    }

    // Sorting: only allow certain fields for safety
    const allowedSort = ['id', 'number', 'title', 'startChapter', 'endChapter'];
    if (sort && allowedSort.includes(sort)) {
      query.orderBy(`volume.${sort}`, order);
    } else {
      query.orderBy('volume.number', 'ASC'); // Default: by volume number
    }

    query.skip((page - 1) * limit).take(limit);
    const [items, totalItems] = await query.getManyAndCount();
    return {
      items,
      meta: {
        totalItems,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page
      }
    };
  }

  findOne(id: number) {
    return this.repo.findOne({ 
      where: { id }, 
      relations: ['series'] 
    });
  }

  async create(data: CreateVolumeDto) {
    const volume = this.repo.create({
      number: data.number,
      title: data.title,
      coverUrl: data.coverUrl,
      startChapter: data.startChapter,
      endChapter: data.endChapter,
      description: data.description,
      seriesId: data.seriesId,
      series: { id: data.seriesId } as any
    });
    return this.repo.save(volume);
  }

  update(id: number, data: UpdateVolumeDto) {
    const updateData: any = { ...data };
    
    // Handle the series reference if seriesId is provided
    if (data.seriesId) {
      updateData.series = { id: data.seriesId };
      delete updateData.seriesId;
    }
    
    return this.repo.update(id, updateData);
  }

  remove(id: number) {
    return this.repo.delete(id);
  }

  /**
   * Find volume by chapter number
   */
  async findByChapter(chapterNumber: number, seriesId: number) {
    return this.repo.createQueryBuilder('volume')
      .leftJoinAndSelect('volume.series', 'series')
      .where('volume.startChapter <= :chapterNumber', { chapterNumber })
      .andWhere('volume.endChapter >= :chapterNumber', { chapterNumber })
      .andWhere('series.id = :seriesId', { seriesId })
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
}
