// media.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import {
  Media,
  MediaStatus,
  MediaType,
  MediaOwnerType,
  MediaPurpose,
  MediaUsageType,
} from '../../entities/media.entity';
import { User } from '../../entities/user.entity';
import { Character } from '../../entities/character.entity';
import { CreateMediaDto } from './dto/create-media.dto';
import { UploadMediaDto } from './dto/upload-media.dto';
import { UrlNormalizerService } from './services/url-normalizer.service';
import { EmailService } from '../email/email.service';
import { FileValidationService } from './validators/file-validation.service';
import { UserRole } from '../../entities/user.entity';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly isTestUser = (email: string | null) =>
    email === 'testuser@example.com';

  constructor(
    @InjectRepository(Media)
    private readonly mediaRepo: Repository<Media>,
    @InjectRepository(Character)
    private readonly characterRepo: Repository<Character>,
    private readonly urlNormalizer: UrlNormalizerService,
    private readonly emailService: EmailService,
    private readonly fileValidationService: FileValidationService,
  ) {}

  async create(data: CreateMediaDto, user: User): Promise<Media> {
    // Reject image URLs - images must be uploaded
    if (data.type === MediaType.IMAGE) {
      throw new BadRequestException(
        'Image URLs are not allowed. Please upload images using the /media/upload endpoint.',
      );
    }

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
    file: Express.Multer.File,
    user: User,
    b2Service: any, // BackblazeB2Service - will import properly later
  ): Promise<Media> {
    // Validate purpose constraints
    this.validateMediaPurpose(data);

    // Validate file with magic byte checks
    const validationResult = await this.fileValidationService.validateFile(
      file,
      file.mimetype,
    );

    // Generate UUID-based filename with usageType folder
    const crypto = await import('crypto');
    const uuid = crypto.randomUUID();
    const ext = this.fileValidationService.getExtensionFromMimeType(
      validationResult.mimeType,
    );
    const uniqueFileName = `${uuid}.${ext}`;

    // Determine status based on user role
    const status =
      user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR
        ? MediaStatus.APPROVED
        : MediaStatus.PENDING;

    // Upload to B2 with proper error handling
    let uploadResult: {
      url: string;
      fileName: string;
      fileId: string;
      key: string;
    };
    try {
      uploadResult = await b2Service.uploadFile(
        file.buffer,
        uniqueFileName,
        validationResult.mimeType,
        data.usageType, // Use usageType as folder name
      );
    } catch (uploadError) {
      // Log the error for debugging but don't expose internal details
      this.logger.error(
        `B2 upload failed for file: ${file.originalname}`,
        uploadError instanceof Error ? uploadError.stack : uploadError,
      );
      throw new InternalServerErrorException(
        'Failed to upload file. Please try again later.',
      );
    }

    // Only create media record if upload succeeded
    if (!uploadResult?.url) {
      this.logger.error('B2 upload returned invalid result', uploadResult);
      throw new InternalServerErrorException(
        'File upload completed but returned invalid data.',
      );
    }

    // Create media record
    let media: Media;
    try {
      media = this.mediaRepo.create({
        url: uploadResult.url,
        fileName: uploadResult.fileName,
        b2FileId: uploadResult.fileId,
        key: uploadResult.key,
        mimeType: validationResult.mimeType,
        fileSize: file.size,
        width: validationResult.width,
        height: validationResult.height,
        isUploaded: true,
        usageType: data.usageType,
        type: data.type,
        description: data.description,
        ownerType: data.ownerType,
        ownerId: data.ownerId,
        chapterNumber: data.chapterNumber,
        submittedBy: user,
        status,
        purpose: data.purpose || MediaPurpose.GALLERY,
      });

      media = await this.mediaRepo.save(media);
    } catch (dbError) {
      // Rollback: delete from B2 if DB save fails
      this.logger.error(
        `DB save failed after B2 upload for ${uploadResult.key}, attempting rollback`,
        dbError,
      );
      await b2Service.safeDeleteFile(uploadResult.key);
      throw new InternalServerErrorException(
        'Failed to save media record. Please try again.',
      );
    }

    return media;
  }

  async findAll(
    filters: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      type?: string;
      ownerType?: MediaOwnerType;
      ownerId?: number;
      purpose?: MediaPurpose;
      sort?: string;
      order?: 'ASC' | 'DESC';
      characterIds?: string;
      arcIds?: string;
      eventIds?: string;
      gambleIds?: string;
      organizationIds?: string;
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
      search,
      status,
      type,
      ownerType,
      ownerId,
      purpose,
      sort,
      order = 'DESC',
      characterIds,
      arcIds,
      eventIds,
      gambleIds,
      organizationIds,
    } = filters;
    const query = this.mediaRepo
      .createQueryBuilder('media')
      .leftJoinAndSelect('media.submittedBy', 'submittedBy');

    // Filter by status - 'all' means no status filtering
    if (status && status !== 'all') {
      query.where('media.status = :status', { status });
    } else if (!status) {
      // Default behavior when no status specified - show only approved
      query.where('media.status = :status', { status: MediaStatus.APPROVED });
    }
    // If status === 'all', don't add any status filter to show all media

    // Apply search filter
    if (search) {
      query.andWhere(
        '(media.description ILIKE :search OR submittedBy.username ILIKE :search)',
        { search: `%${search}%` },
      );
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

    // Handle entity-based filtering
    const entityFilters: Array<{ ownerType: MediaOwnerType; ids: number[] }> =
      [];

    if (characterIds) {
      const ids = characterIds
        .split(',')
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));
      if (ids.length > 0) {
        entityFilters.push({ ownerType: MediaOwnerType.CHARACTER, ids });
      }
    }

    if (arcIds) {
      const ids = arcIds
        .split(',')
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));
      if (ids.length > 0) {
        entityFilters.push({ ownerType: MediaOwnerType.ARC, ids });
      }
    }

    if (eventIds) {
      const ids = eventIds
        .split(',')
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));
      if (ids.length > 0) {
        entityFilters.push({ ownerType: MediaOwnerType.EVENT, ids });
      }
    }

    if (gambleIds) {
      const ids = gambleIds
        .split(',')
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));
      if (ids.length > 0) {
        entityFilters.push({ ownerType: MediaOwnerType.GAMBLE, ids });
      }
    }

    if (organizationIds) {
      const ids = organizationIds
        .split(',')
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));
      if (ids.length > 0) {
        entityFilters.push({ ownerType: MediaOwnerType.ORGANIZATION, ids });
      }
    }

    // Apply entity filters using OR logic between different entity types
    if (entityFilters.length > 0) {
      const entityConditions = entityFilters.map((filter, index) => {
        const paramPrefix = `entityType${index}`;
        query.setParameter(`${paramPrefix}OwnerType`, filter.ownerType);
        query.setParameter(`${paramPrefix}Ids`, filter.ids);
        return `(media.ownerType = :${paramPrefix}OwnerType AND media.ownerId IN (:...${paramPrefix}Ids))`;
      });

      query.andWhere(`(${entityConditions.join(' OR ')})`);
    }

    // Dynamic sorting
    const sortField = sort || 'createdAt';
    const sortOrder = order || 'DESC';

    // Map frontend field names to database field names
    const fieldMap: Record<string, string> = {
      id: 'media.id',
      type: 'media.type',
      description: 'media.description',
      status: 'media.status',
      createdAt: 'media.createdAt',
      updatedAt: 'media.updatedAt',
      ownerType: 'media.ownerType',
      ownerId: 'media.ownerId',
      user: 'submittedBy.username',
    };

    const dbField = fieldMap[sortField] || 'media.createdAt';
    query
      .orderBy(dbField, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit);
    return { data, total, page, perPage: limit, totalPages };
  }

  async findOne(id: string): Promise<Media | null> {
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

  async approveSubmission(id: string): Promise<Media> {
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

    // Skip email for test user, if no submitter, or if no email
    if (media.submittedBy?.email && !this.isTestUser(media.submittedBy.email)) {
      await this.emailService.sendMediaApprovalNotification(
        media.submittedBy.email,
        media.description || 'your submission',
      );
    }

    return savedMedia;
  }

  async rejectSubmission(id: string, reason: string): Promise<Media> {
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

    // Attempt to send email notification, but don't fail the rejection if email fails
    try {
      if (
        media.submittedBy?.email &&
        !this.isTestUser(media.submittedBy.email)
      ) {
        await this.emailService.sendMediaRejectionNotification(
          media.submittedBy.email,
          media.description || 'your submission',
          reason,
        );
      }
    } catch (emailError) {
      // Log the error but don't propagate it - the rejection already succeeded
      console.error(
        'Failed to send rejection email (media still rejected):',
        emailError,
      );
    }

    return savedMedia;
  }

  async update(
    id: string,
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

  async remove(id: string, b2Service?: any): Promise<void> {
    // Get the media record first to check if it's an uploaded file
    const media = await this.mediaRepo.findOne({
      where: { id },
    });

    if (media && media.isUploaded && media.key && b2Service) {
      // Delete from B2 storage using the key field
      try {
        await b2Service.safeDeleteFile(media.key);
      } catch (error) {
        // Log the error with sufficient detail for cleanup/investigation
        this.logger.error(
          `Failed to delete file from B2 storage. ` +
            `Media ID: ${id}, key: ${media.key}. ` +
            `Orphaned file may require manual cleanup.`,
          error instanceof Error ? error.stack : String(error),
        );
        // Continue with database deletion even if B2 deletion fails
        // The orphaned file will need to be cleaned up separately
      }
    }

    await this.mediaRepo.delete(id);
  }

  async removeWithAuth(
    id: string,
    currentUser: User,
    b2Service?: any,
  ): Promise<void> {
    const media = await this.mediaRepo.findOne({
      where: { id },
      relations: ['submittedBy'],
    });

    if (!media) {
      throw new NotFoundException(`Media with id ${id} not found`);
    }

    // Allow deletion by the submitter or by mods/admins
    const isOwner = media.submittedBy?.id === currentUser.id;
    const isModerator =
      currentUser.role === UserRole.ADMIN ||
      currentUser.role === UserRole.MODERATOR;

    if (!isOwner && !isModerator) {
      throw new ForbiddenException('You can only delete your own media');
    }

    return this.remove(id, b2Service);
  }

  async bulkApproveSubmissions(
    ids: string[],
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
    ids: string[],
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
      description?: string;
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
        'media.isUploaded',
        'media.fileName',
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
    if (filters.description) {
      query.andWhere('media.description ILIKE :description', {
        description: `%${filters.description}%`,
      });
    }

    query
      .orderBy('media.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();

    // Add character information for media with ownerType 'character'
    // Fix N+1 pattern: fetch all characters in a single query instead of one per media item
    const characterMediaItems = data.filter(
      (media: any) =>
        media.ownerType === MediaOwnerType.CHARACTER && media.ownerId,
    );
    const characterIds = characterMediaItems.map((media: any) => media.ownerId);

    let charactersMap = new Map<number, any>();
    if (characterIds.length > 0) {
      try {
        const characters = await this.characterRepo.find({
          where: { id: In(characterIds) },
          select: ['id', 'name'],
        });
        charactersMap = new Map(characters.map((c) => [c.id, c]));
      } catch (error) {
        console.error('Failed to fetch characters for media:', error);
      }
    }

    const enrichedData = data.map((media: any) => {
      if (media.ownerType === MediaOwnerType.CHARACTER && media.ownerId) {
        const character = charactersMap.get(media.ownerId);
        if (character) {
          return { ...media, character };
        }
      }
      return media;
    });

    return {
      data: enrichedData,
      total,
      page,
      perPage: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOnePublic(id: string): Promise<Media | null> {
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
    mediaId: string,
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
    mediaId: string,
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
  migrateToPolymorphic(): Promise<{
    migrated: number;
    failed: number;
    errors: string[];
  }> {
    const results = { migrated: 0, failed: 0, errors: [] as string[] };

    // This method is kept for compatibility but the migration
    // should be handled by database migrations instead

    return Promise.resolve(results);
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
