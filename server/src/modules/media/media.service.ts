// media.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
        arc: data.arcId ? { id: data.arcId } as any : null,
        character: data.characterId ? { id: data.characterId } as any : null,
        event: data.eventId ? { id: data.eventId } as any : null,
        submittedBy: user,
        status: MediaStatus.PENDING
    });
    return this.mediaRepo.save(media);
    }


  async findAll(): Promise<Media[]> {
    return this.mediaRepo.find({ 
      relations: ['arc', 'character', 'event', 'submittedBy'],
      where: { status: MediaStatus.APPROVED }
    });
  }

  async findOne(id: number): Promise<Media | null> {
    const media = await this.mediaRepo.findOne({ 
      where: { id },
      relations: ['arc', 'character', 'event', 'submittedBy']
    });
    if (!media) {
      throw new NotFoundException(`Media with id ${id} not found`);
    }
    return media;
  }

  async findPending(): Promise<Media[]> {
    return this.mediaRepo.find({
      where: { status: MediaStatus.PENDING },
      relations: ['arc', 'character', 'event', 'submittedBy'],
      order: { createdAt: 'ASC' }
    });
  }

  async approveSubmission(id: number): Promise<Media> {
    const media = await this.mediaRepo.findOne({ 
      where: { id },
      relations: ['submittedBy']
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
        media.description || 'your submission'
      );
    }

    return savedMedia;
  }

  async rejectSubmission(id: number, reason: string): Promise<Media> {
    const media = await this.mediaRepo.findOne({ where: { id } });
    if (!media) {
      throw new NotFoundException(`Media with id ${id} not found`);
    }
    if (media.status !== MediaStatus.PENDING) {
      throw new BadRequestException('This submission is not in pending state');
    }
    
    media.status = MediaStatus.REJECTED;
    media.rejectionReason = reason;
    return await this.mediaRepo.save(media);
  }

  async remove(id: number): Promise<void> {
    await this.mediaRepo.delete(id);
  }
}
