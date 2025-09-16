import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../entities/organization.entity';
import { MediaService } from '../media/media.service';
import { MediaOwnerType, MediaPurpose } from '../../entities/media.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization) private repo: Repository<Organization>,
    private readonly mediaService: MediaService,
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
    data: Organization[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    const { sort, order = 'ASC', page = 1, limit = 1000 } = filters;
    const query = this.repo
      .createQueryBuilder('organization')
      .leftJoinAndSelect('organization.characters', 'characters');
    const allowedSort = ['id', 'name'];
    if (sort && allowedSort.includes(sort)) {
      query.orderBy(`organization.${sort}`, order);
    } else {
      query.orderBy('organization.name', 'ASC');
    }

    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { data, total, page, perPage: limit, totalPages };
  }

  async findOne(id: number): Promise<Organization> {
    const organization = await this.repo.findOne({
      where: { id },
      relations: ['characters'],
    });
    if (!organization)
      throw new NotFoundException(`Organization with ID ${id} not found`);
    return organization;
  }

  create(data: Partial<Organization>): Promise<Organization> {
    const organization = this.repo.create(data);
    return this.repo.save(organization);
  }

  async update(id: number, data: Partial<Organization>) {
    const result = await this.repo.update(id, data);
    if (result.affected === 0)
      throw new NotFoundException(`Organization with ID ${id} not found`);
    return this.findOne(id);
  }

  async remove(id: number) {
    const result = await this.repo.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`Organization with ID ${id} not found`);
    return { deleted: true };
  }

  /**
   * Get entity display media for organization thumbnails with spoiler protection
   */
  async getOrganizationEntityDisplayMedia(
    organizationId: number,
    userProgress?: number,
    options: {
      page?: number;
      limit?: number;
    } = {},
  ) {
    const organization = await this.findOne(organizationId);

    const result = await this.mediaService.findForEntityDisplay(
      MediaOwnerType.ORGANIZATION,
      organizationId,
      undefined,
      {
        page: options.page,
        limit: options.limit,
      },
    );

    // Apply spoiler protection if user progress is provided and media has chapter number
    if (userProgress !== undefined) {
      result.data = result.data.map((media) => ({
        ...media,
        isSpoiler: media.chapterNumber
          ? media.chapterNumber > userProgress
          : false,
      }));
    }

    return result;
  }

  /**
   * Get gallery media for organization
   */
  async getOrganizationGalleryMedia(
    organizationId: number,
    userProgress?: number,
    options: {
      chapter?: number;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const organization = await this.findOne(organizationId);

    const result = await this.mediaService.findForGallery(
      MediaOwnerType.ORGANIZATION,
      organizationId,
      {
        chapter: options.chapter,
        page: options.page,
        limit: options.limit,
      },
    );

    // Apply spoiler protection if user progress is provided and media has chapter number
    if (userProgress !== undefined) {
      result.data = result.data.map((media) => ({
        ...media,
        isSpoiler: media.chapterNumber
          ? media.chapterNumber > userProgress
          : false,
      }));
    }

    return result;
  }

  /**
   * Get the current entity display media for organization thumbnail
   * Default changes to the one with the latest chapter number within user progress
   */
  async getOrganizationCurrentThumbnail(
    organizationId: number,
    userProgress?: number,
  ) {
    const organization = await this.findOne(organizationId);

    // Get all entity display media for this organization
    const allMedia = await this.mediaService.findForEntityDisplay(
      MediaOwnerType.ORGANIZATION,
      organizationId,
      undefined,
      { limit: 100 }, // Get all to find the right one
    );

    if (allMedia.data.length === 0) {
      return null;
    }

    let selectedMedia: any = null;

    if (userProgress !== undefined) {
      // Find the media with the highest chapter number that doesn't exceed user progress
      const allowedMedia = allMedia.data.filter(
        (media) => !media.chapterNumber || media.chapterNumber <= userProgress,
      );

      if (allowedMedia.length > 0) {
        // Get the one with the highest chapter number within user progress
        selectedMedia = allowedMedia.reduce((latest, current) => {
          const latestChapter = latest.chapterNumber || 0;
          const currentChapter = current.chapterNumber || 0;
          return currentChapter > latestChapter ? current : latest;
        });
      }
    } else {
      // No user progress provided, get default or most recent
      selectedMedia = allMedia.data[0];
    }

    if (selectedMedia) {
      const isSpoiler =
        userProgress !== undefined &&
        selectedMedia.chapterNumber &&
        selectedMedia.chapterNumber > userProgress;

      return {
        ...selectedMedia,
        isSpoiler,
      };
    }

    return null;
  }
}
