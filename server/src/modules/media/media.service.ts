// media.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import {
  Media,
  MediaStatus,
  MediaType,
  MediaOwnerType,
  MediaPurpose,
} from '../../entities/media.entity';
import { User } from '../../entities/user.entity';
import { CreateMediaDto } from './dto/create-media.dto';
import { UploadMediaDto } from './dto/upload-media.dto';
import { UrlNormalizerService } from './services/url-normalizer.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class MediaService {
  private readonly isTestUser = (email: string | null) =>
    email === 'testuser@example.com';

  constructor(
    @InjectRepository(Media)
    private readonly mediaRepo: Repository<Media>,
    private readonly urlNormalizer: UrlNormalizerService,
    private readonly emailService: EmailService,
  ) {}

  async create(data: CreateMediaDto, user: User): Promise<Media> {
    // Validate purpose constraints
    this.validateMediaPurpose(data);

    // Normalize the URL based on the media type
    const normalizedUrl = this.urlNormalizer.normalize(data.url, data.type);

    const media = this.mediaRepo.create({
      url: normalizedUrl,
      type: data.type,
      description: data.description,
      ownerType: data.ownerType,
      ownerId: data.ownerId,
      chapterNumber: data.chapterNumber,
      submittedBy: user,
      status: MediaStatus.PENDING,
      purpose: data.purpose || MediaPurpose.GALLERY,
    });
    return this.mediaRepo.save(media);
  }

  async createUpload(
    data: UploadMediaDto,
    file: Buffer,
    originalFileName: string,
    contentType: string,
    user: User,
    b2Service: any, // BackblazeB2Service - will import properly later
  ): Promise<Media> {
    // Validate purpose constraints
    this.validateMediaPurpose(data);

    // Generate a unique filename
    const timestamp = Date.now();
    const fileExtension = originalFileName.split('.').pop();
    const uniqueFileName = `${timestamp}_${originalFileName}`;

    // Upload to B2
    const uploadResult = await b2Service.uploadFile(
      file,
      uniqueFileName,
      contentType,
      'media',
    );

    const media = this.mediaRepo.create({
      url: uploadResult.url,
      fileName: uploadResult.fileName,
      b2FileId: uploadResult.fileId,
      isUploaded: true,
      type: data.type,
      description: data.description,
      ownerType: data.ownerType,
      ownerId: data.ownerId,
      chapterNumber: data.chapterNumber,
      submittedBy: user,
      status: MediaStatus.APPROVED, // Auto-approve uploads by moderators/admins
      purpose: data.purpose || MediaPurpose.GALLERY,
    });

    return this.mediaRepo.save(media);
  }

  async findAll(
    filters: {
      page?: number;
      limit?: number;
      status?: string;
      type?: string;
      ownerType?: MediaOwnerType;
      ownerId?: number;
      purpose?: MediaPurpose;
    } = {},
  ): Promise<{
    data: Media[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      ownerType,
      ownerId,
      purpose,
    } = filters;
    const query = this.mediaRepo
      .createQueryBuilder('media')
      .leftJoinAndSelect('media.submittedBy', 'submittedBy');

    // Only filter by approved status if no status filter is provided
    if (status) {
      query.where('media.status = :status', { status });
    } else {
      query.where('media.status = :status', { status: MediaStatus.APPROVED });
    }

    if (type) {
      query.andWhere('media.type = :type', { type });
    }

    if (ownerType) {
      query.andWhere('media.ownerType = :ownerType', { ownerType });
    }

    if (ownerId) {
      query.andWhere('media.ownerId = :ownerId', { ownerId });
    }

    if (purpose) {
      query.andWhere('media.purpose = :purpose', { purpose });
    }

    query
      .orderBy('media.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit);
    return { data, total, page, perPage: limit, totalPages };
  }

  async findOne(id: number): Promise<Media | null> {
    const media = await this.mediaRepo.findOne({
      where: { id },
      relations: ['submittedBy'],
    });
    if (!media) {
      throw new NotFoundException(`Media with id ${id} not found`);
    }
    return media;
  }

  async findPending(): Promise<Media[]> {
    return this.mediaRepo.find({
      where: { status: MediaStatus.PENDING },
      relations: ['submittedBy'],
      order: { createdAt: 'ASC' },
    });
  }

  async approveSubmission(id: number): Promise<Media> {
    const media = await this.mediaRepo.findOne({
      where: { id },
      relations: ['submittedBy'],
    });
    if (!media) {
      throw new NotFoundException(`Media with id ${id} not found`);
    }
    if (media.status !== MediaStatus.PENDING) {
      throw new BadRequestException('This submission is not in pending state');
    }

    media.status = MediaStatus.APPROVED;
    const savedMedia = await this.mediaRepo.save(media);

    // Skip email for test user or if no email
    if (media.submittedBy.email && !this.isTestUser(media.submittedBy.email)) {
      await this.emailService.sendMediaApprovalNotification(
        media.submittedBy.email,
        media.description || 'your submission',
      );
    }

    return savedMedia;
  }

  async rejectSubmission(id: number, reason: string): Promise<Media> {
    const media = await this.mediaRepo.findOne({
      where: { id },
      relations: ['submittedBy'],
    });
    if (!media) {
      throw new NotFoundException(`Media with id ${id} not found`);
    }
    if (media.status !== MediaStatus.PENDING) {
      throw new BadRequestException('This submission is not in pending state');
    }

    media.status = MediaStatus.REJECTED;
    media.rejectionReason = reason;

    const savedMedia = await this.mediaRepo.save(media);

    // Skip email for test user or if no email
    if (media.submittedBy.email && !this.isTestUser(media.submittedBy.email)) {
      await this.emailService.sendMediaRejectionNotification(
        media.submittedBy.email,
        media.description || 'your submission',
        reason,
      );
    }

    return savedMedia;
  }

  async update(
    id: number,
    updateData: Partial<CreateMediaDto>,
  ): Promise<Media> {
    const media = await this.mediaRepo.findOne({
      where: { id },
      relations: ['submittedBy'],
    });
    if (!media) {
      throw new NotFoundException(`Media with id ${id} not found`);
    }

    // Merge the update data
    Object.assign(media, updateData);

    return this.mediaRepo.save(media);
  }

  async remove(id: number, b2Service?: any): Promise<void> {
    // Get the media record first to check if it's an uploaded file
    const media = await this.mediaRepo.findOne({
      where: { id },
    });

    if (media && media.isUploaded && media.fileName && b2Service) {
      // Delete from B2 storage
      try {
        await b2Service.deleteFile(media.fileName);
      } catch (error) {
        console.warn(`Failed to delete file from B2: ${media.fileName}`, error);
        // Continue with database deletion even if B2 deletion fails
      }
    }

    await this.mediaRepo.delete(id);
  }

  async bulkApproveSubmissions(
    ids: number[],
  ): Promise<{ approved: number; failed: number; errors: string[] }> {
    const results = { approved: 0, failed: 0, errors: [] as string[] };

    for (const id of ids) {
      try {
        await this.approveSubmission(id);
        results.approved++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(
          `Failed to approve media ${id}: ${error.message || 'Unknown error'}`,
        );
      }
    }

    return results;
  }

  async bulkRejectSubmissions(
    ids: number[],
    reason: string,
  ): Promise<{ rejected: number; failed: number; errors: string[] }> {
    const results = { rejected: 0, failed: 0, errors: [] as string[] };

    for (const id of ids) {
      try {
        await this.rejectSubmission(id, reason);
        results.rejected++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(
          `Failed to reject media ${id}: ${error.message || 'Unknown error'}`,
        );
      }
    }

    return results;
  }

  // PUBLIC METHODS - No authentication required

  async findAllPublic(
    filters: {
      type?: string;
      ownerType?: MediaOwnerType;
      ownerId?: number;
      purpose?: MediaPurpose;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { page = 1, limit = 20 } = filters;
    const query = this.mediaRepo
      .createQueryBuilder('media')
      .leftJoinAndSelect('media.submittedBy', 'submittedBy')
      .where('media.status = :status', { status: MediaStatus.APPROVED })
      .select([
        'media.id',
        'media.url',
        'media.type',
        'media.description',
        'media.createdAt',
        'media.ownerType',
        'media.ownerId',
        'media.chapterNumber',
        'media.purpose',
        'submittedBy.id',
        'submittedBy.username',
      ]);

    if (filters.type) {
      query.andWhere('media.type = :type', { type: filters.type });
    }
    if (filters.ownerType) {
      query.andWhere('media.ownerType = :ownerType', {
        ownerType: filters.ownerType,
      });
    }
    if (filters.ownerId) {
      query.andWhere('media.ownerId = :ownerId', { ownerId: filters.ownerId });
    }
    if (filters.purpose) {
      query.andWhere('media.purpose = :purpose', { purpose: filters.purpose });
    }

    query
      .orderBy('media.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();
    return {
      data,
      total,
      page,
      perPage: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOnePublic(id: number): Promise<Media | null> {
    return this.mediaRepo.findOne({
      where: {
        id,
        status: MediaStatus.APPROVED,
      },
      relations: ['submittedBy'],
      select: {
        id: true,
        url: true,
        type: true,
        description: true,
        createdAt: true,
        ownerType: true,
        ownerId: true,
        chapterNumber: true,
        purpose: true,
        submittedBy: {
          id: true,
          username: true,
        },
      },
    });
  }

  /**
   * Find all media for a specific owner
   */
  async findForOwner(
    ownerType: MediaOwnerType,
    ownerId: number,
    chapter?: number,
    filters: {
      status?: MediaStatus;
      type?: MediaType;
      purpose?: MediaPurpose;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{
    data: Media[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      status = MediaStatus.APPROVED,
      type,
      purpose,
    } = filters;

    const query = this.mediaRepo
      .createQueryBuilder('media')
      .leftJoinAndSelect('media.submittedBy', 'submittedBy')
      .where('media.ownerType = :ownerType', { ownerType })
      .andWhere('media.ownerId = :ownerId', { ownerId })
      .andWhere('media.status = :status', { status });

    if (chapter !== undefined) {
      query.andWhere('media.chapterNumber = :chapter', { chapter });
    }

    if (type) {
      query.andWhere('media.type = :type', { type });
    }

    if (purpose) {
      query.andWhere('media.purpose = :purpose', { purpose });
    }

    query
      .orderBy('media.chapterNumber', 'ASC')
      .addOrderBy('media.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit);
    return { data, total, page, perPage: limit, totalPages };
  }

  /**
   * Get the default media for a specific owner
   */
  async getDefaultForOwner(
    ownerType: MediaOwnerType,
    ownerId: number,
  ): Promise<Media | null> {
    return this.mediaRepo.findOne({
      where: {
        ownerType,
        ownerId,
        status: MediaStatus.APPROVED,
        purpose: MediaPurpose.ENTITY_DISPLAY,
      },
      relations: ['submittedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Set a media as default for its owner (unsets other defaults)
   */
  // This method has been removed as isDefault functionality is no longer supported

  /**
   * Find media for entity display (official images)
   */
  async findForEntityDisplay(
    ownerType: MediaOwnerType,
    ownerId: number,
    chapter?: number,
    filters: {
      status?: MediaStatus;
      type?: MediaType;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{
    data: Media[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    return this.findForOwner(ownerType, ownerId, chapter, {
      ...filters,
      purpose: MediaPurpose.ENTITY_DISPLAY,
    });
  }

  /**
   * Find media for gallery (user-uploaded media)
   */
  async findForGallery(
    ownerType: MediaOwnerType,
    ownerId: number,
    filters: {
      status?: MediaStatus;
      type?: MediaType;
      page?: number;
      limit?: number;
      chapter?: number;
    } = {},
  ): Promise<{
    data: Media[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    const { chapter, ...otherFilters } = filters;
    return this.findForOwner(ownerType, ownerId, chapter, {
      ...otherFilters,
      purpose: MediaPurpose.GALLERY,
    });
  }

  /**
   * Get entity display media thumbnail closest to user's progress
   * Returns the media with chapter number closest to (but not exceeding) user progress
   * Returns null if no suitable media found
   */
  async getThumbnailForUserProgress(
    ownerType: MediaOwnerType,
    ownerId: number,
    userProgress: number,
  ): Promise<Media | null> {
    // First, try to find entity display media within user's progress
    const mediaWithinProgress = await this.mediaRepo
      .createQueryBuilder('media')
      .leftJoinAndSelect('media.submittedBy', 'submittedBy')
      .where('media.ownerType = :ownerType', { ownerType })
      .andWhere('media.ownerId = :ownerId', { ownerId })
      .andWhere('media.purpose = :purpose', {
        purpose: MediaPurpose.ENTITY_DISPLAY,
      })
      .andWhere('media.status = :status', { status: MediaStatus.APPROVED })
      .andWhere('media.chapterNumber IS NOT NULL')
      .andWhere('media.chapterNumber <= :userProgress', { userProgress })
      .orderBy('media.chapterNumber', 'DESC') // Highest chapter first
      .addOrderBy('media.createdAt', 'DESC') // Then newest
      .getOne();

    if (mediaWithinProgress) {
      return mediaWithinProgress;
    }

    // If no media within progress, return any entity display media
    return this.mediaRepo
      .createQueryBuilder('media')
      .leftJoinAndSelect('media.submittedBy', 'submittedBy')
      .where('media.ownerType = :ownerType', { ownerType })
      .andWhere('media.ownerId = :ownerId', { ownerId })
      .andWhere('media.purpose = :purpose', {
        purpose: MediaPurpose.ENTITY_DISPLAY,
      })
      .andWhere('media.status = :status', { status: MediaStatus.APPROVED })
      .orderBy('media.createdAt', 'DESC')
      .getOne();
  }

  /**
   * Get all entity display media for cycling on detail pages
   */
  async getEntityDisplayMediaForCycling(
    ownerType: MediaOwnerType,
    ownerId: number,
    userProgress?: number,
  ): Promise<Media[]> {
    const query = this.mediaRepo
      .createQueryBuilder('media')
      .leftJoinAndSelect('media.submittedBy', 'submittedBy')
      .where('media.ownerType = :ownerType', { ownerType })
      .andWhere('media.ownerId = :ownerId', { ownerId })
      .andWhere('media.purpose = :purpose', {
        purpose: MediaPurpose.ENTITY_DISPLAY,
      })
      .andWhere('media.status = :status', { status: MediaStatus.APPROVED });

    // Return all media regardless of user progress - spoiler system will handle protection

    return query
      .orderBy('media.chapterNumber', 'ASC')
      .addOrderBy('media.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Get next entity display media for manual cycling
   */

  /**
   * Get previous entity display media for manual cycling
   */

  /**
   * Get media cycling info (current position and total count)
   */

  /**
   * Get current media with full cycling context
   */

  /**
   * Promote gallery media to entity display media
   */
  async setAsEntityDisplay(
    mediaId: number,
    ownerType: MediaOwnerType,
    ownerId: number,
  ): Promise<Media> {
    const media = await this.mediaRepo.findOne({ where: { id: mediaId } });
    if (!media) {
      throw new NotFoundException(`Media with id ${mediaId} not found`);
    }

    if (media.status !== MediaStatus.APPROVED) {
      throw new BadRequestException(
        'Only approved media can be set as entity display',
      );
    }

    // Update the media to be entity display
    media.purpose = MediaPurpose.ENTITY_DISPLAY;
    media.ownerType = ownerType;
    media.ownerId = ownerId;

    return this.mediaRepo.save(media);
  }

  /**
   * Update media relations to use polymorphic approach
   */
  async updateMediaRelations(
    mediaId: number,
    ownerType: MediaOwnerType,
    ownerId: number,
    chapterNumber?: number,
  ): Promise<Media> {
    const media = await this.mediaRepo.findOne({ where: { id: mediaId } });
    if (!media) {
      throw new NotFoundException(`Media with id ${mediaId} not found`);
    }

    media.ownerType = ownerType;
    media.ownerId = ownerId;
    if (chapterNumber !== undefined) {
      media.chapterNumber = chapterNumber;
    }

    return this.mediaRepo.save(media);
  }

  /**
   * Migration function to convert old relationships to polymorphic
   */
  async migrateToPolymorphic(): Promise<{
    migrated: number;
    failed: number;
    errors: string[];
  }> {
    const results = { migrated: 0, failed: 0, errors: [] as string[] };

    // This method is kept for compatibility but the migration
    // should be handled by database migrations instead

    return results;
  }

  /**
   * Validate media purpose constraints
   */
  private validateMediaPurpose(data: {
    purpose?: MediaPurpose;
    ownerType?: MediaOwnerType;
    ownerId?: number;
  }): void {
    if (data.purpose === MediaPurpose.ENTITY_DISPLAY) {
      if (!data.ownerType || !data.ownerId) {
        throw new BadRequestException(
          'ENTITY_DISPLAY media must have ownerType and ownerId',
        );
      }
    }
  }
}
