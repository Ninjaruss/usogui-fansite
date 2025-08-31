// media.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media, MediaStatus } from '../../entities/media.entity';
import { User } from '../../entities/user.entity';
import { CreateMediaDto } from './dto/create-media.dto';
import { UrlNormalizerService } from './services/url-normalizer.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class MediaService {
  private readonly isTestUser = (email: string) =>
    email === 'testuser@example.com';

  constructor(
    @InjectRepository(Media)
    private readonly mediaRepo: Repository<Media>,
    private readonly urlNormalizer: UrlNormalizerService,
    private readonly emailService: EmailService,
  ) {}

  async create(data: CreateMediaDto, user: User): Promise<Media> {
    // Normalize the URL based on the media type
    const normalizedUrl = this.urlNormalizer.normalize(data.url, data.type);

    const media = this.mediaRepo.create({
      url: normalizedUrl,
      type: data.type,
      description: data.description,
      character: data.characterId ? ({ id: data.characterId } as any) : null,
      submittedBy: user,
      status: MediaStatus.PENDING,
    });
    return this.mediaRepo.save(media);
  }

  async findAll(filters: { page?: number; limit?: number } = {}): Promise<{
    data: Media[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = filters;
    const query = this.mediaRepo
      .createQueryBuilder('media')
      .leftJoinAndSelect('media.character', 'character')
      .leftJoinAndSelect('media.submittedBy', 'submittedBy')
      .where('media.status = :status', { status: MediaStatus.APPROVED });

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
      relations: ['character', 'submittedBy'],
    });
    if (!media) {
      throw new NotFoundException(`Media with id ${id} not found`);
    }
    return media;
  }

  async findPending(): Promise<Media[]> {
    return this.mediaRepo.find({
      where: { status: MediaStatus.PENDING },
      relations: ['character', 'submittedBy'],
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

    // Skip email for test user
    if (!this.isTestUser(media.submittedBy.email)) {
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

    // Skip email for test user
    if (!this.isTestUser(media.submittedBy.email)) {
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
      relations: ['character', 'submittedBy'],
    });
    if (!media) {
      throw new NotFoundException(`Media with id ${id} not found`);
    }

    // Merge the update data
    Object.assign(media, updateData);

    // If character ID is provided, update the character relation
    if (updateData.characterId !== undefined) {
      media.character = updateData.characterId
        ? ({ id: updateData.characterId } as any)
        : null;
    }

    return this.mediaRepo.save(media);
  }

  async remove(id: number): Promise<void> {
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
      characterId?: number;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { page = 1, limit = 20 } = filters;
    const query = this.mediaRepo
      .createQueryBuilder('media')
      .leftJoinAndSelect('media.character', 'character')
      .leftJoinAndSelect('media.submittedBy', 'submittedBy')
      .where('media.status = :status', { status: MediaStatus.APPROVED })
      .select([
        'media.id',
        'media.url',
        'media.type',
        'media.description',
        'media.createdAt',
        'character.id',
        'character.name',
        'submittedBy.id',
        'submittedBy.username',
      ]);

    if (filters.type) {
      query.andWhere('media.type = :type', { type: filters.type });
    }
    if (filters.characterId) {
      query.andWhere('character.id = :characterId', {
        characterId: filters.characterId,
      });
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
      relations: ['character', 'submittedBy'],
      select: {
        id: true,
        url: true,
        type: true,
        description: true,
        createdAt: true,
        character: {
          id: true,
          name: true,
        },
        submittedBy: {
          id: true,
          username: true,
        },
      },
    });
  }
}
