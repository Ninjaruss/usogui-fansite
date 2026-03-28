import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../entities/organization.entity';
import { Character } from '../../entities/character.entity';
import { MediaService } from '../media/media.service';
import { MediaOwnerType } from '../../entities/media.entity';
import { EditLogService } from '../edit-log/edit-log.service';
import { EditLogEntityType } from '../../entities/edit-log.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization) private repo: Repository<Organization>,
    private readonly mediaService: MediaService,
    private readonly editLogService: EditLogService,
  ) {}

  /**
   * Sorting: sort (id, name), order (ASC/DESC)
   */
  async findAll(
    filters: {
      name?: string;
      sort?: string;
      order?: 'ASC' | 'DESC';
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{
    data: (Organization & { characters?: Character[] })[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    const { name, sort, order = 'ASC', page = 1, limit = 1000 } = filters;
    const query = this.repo
      .createQueryBuilder('organization')
      .leftJoinAndSelect('organization.characterMemberships', 'memberships')
      .leftJoinAndSelect('memberships.character', 'characters');

    // Add name filter if provided
    if (name) {
      query.where('organization.name ILIKE :name', { name: `%${name}%` });
    }

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

    // Transform data to include characters array for backwards compatibility
    const transformedData = data.map((org) => ({
      ...org,
      characters: org.characterMemberships?.map((m) => m.character) ?? [],
      characterMemberships: org.characterMemberships,
    }));

    return { data: transformedData, total, page, perPage: limit, totalPages };
  }

  async findOne(
    id: number,
  ): Promise<Organization & { characters?: Character[] }> {
    const organization = await this.repo.findOne({
      where: { id },
      relations: ['characterMemberships', 'characterMemberships.character'],
    });
    if (!organization)
      throw new NotFoundException(`Organization with ID ${id} not found`);

    // Add characters array for backwards compatibility
    return {
      ...organization,
      characters:
        organization.characterMemberships?.map((m) => m.character) ?? [],
    };
  }

  async create(
    data: Partial<Organization>,
    userId: number,
  ): Promise<Organization> {
    const organization = this.repo.create(data);
    const saved = await this.repo.save(organization);
    await this.editLogService.logCreate(
      EditLogEntityType.ORGANIZATION,
      saved.id,
      userId,
    );
    return saved;
  }

  async update(id: number, data: Partial<Organization>, userId: number, isMinorEdit = false) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`Organization with ID ${id} not found`);
    Object.assign(entity, data);
    if (!isMinorEdit) {
      entity.isVerified = false;
      entity.verifiedById = null;
      entity.verifiedAt = null;
    }
    await this.repo.save(entity);
    const changedFields = Object.keys(data).filter(
      (k) => data[k as keyof typeof data] !== undefined,
    );
    await this.editLogService.logUpdate(
      EditLogEntityType.ORGANIZATION,
      id,
      userId,
      changedFields,
      isMinorEdit,
    );
    return this.findOne(id);
  }

  async verify(id: number, verifierId: number, isAdmin: boolean): Promise<Organization> {
    const organization = await this.repo.findOne({ where: { id } });
    if (!organization) throw new NotFoundException(`Organization with id ${id} not found`);
    if (!isAdmin) {
      const lastEdit = await this.editLogService.findLastMajorEdit(EditLogEntityType.ORGANIZATION, id);
      if (lastEdit && lastEdit.userId === verifierId) {
        throw new ForbiddenException('You cannot verify your own edit');
      }
    }
    organization.isVerified = true;
    organization.verifiedById = verifierId;
    organization.verifiedAt = new Date();
    return this.repo.save(organization);
  }

  async remove(id: number, userId: number) {
    await this.editLogService.logDelete(
      EditLogEntityType.ORGANIZATION,
      id,
      userId,
    );
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
    await this.findOne(organizationId);

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
    await this.findOne(organizationId);

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
    await this.findOne(organizationId);

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

    let selectedMedia: (typeof allMedia.data)[0] | null = null;

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
