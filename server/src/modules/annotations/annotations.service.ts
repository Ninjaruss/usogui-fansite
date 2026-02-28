import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Annotation,
  AnnotationStatus,
  AnnotationOwnerType,
} from '../../entities/annotation.entity';
import { User, UserRole } from '../../entities/user.entity';
import { Character } from '../../entities/character.entity';
import { Gamble } from '../../entities/gamble.entity';
import { Chapter } from '../../entities/chapter.entity';
import { Arc } from '../../entities/arc.entity';
import { CreateAnnotationDto } from './dto/create-annotation.dto';
import { UpdateAnnotationDto } from './dto/update-annotation.dto';
import { AnnotationQueryDto } from './dto/annotation-query.dto';

@Injectable()
export class AnnotationsService {
  constructor(
    @InjectRepository(Annotation)
    private annotationRepository: Repository<Annotation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Character)
    private characterRepository: Repository<Character>,
    @InjectRepository(Gamble)
    private gambleRepository: Repository<Gamble>,
    @InjectRepository(Chapter)
    private chapterRepository: Repository<Chapter>,
    @InjectRepository(Arc)
    private arcRepository: Repository<Arc>,
  ) {}

  async create(
    createAnnotationDto: CreateAnnotationDto,
    author: User,
  ): Promise<Annotation> {
    const { ownerType, ownerId, isSpoiler, spoilerChapter, ...rest } =
      createAnnotationDto;

    // Validate owner entity exists
    await this.validateOwnerExists(ownerType, ownerId);

    // Validate spoiler logic
    if (isSpoiler && !spoilerChapter) {
      throw new BadRequestException(
        'spoilerChapter is required when isSpoiler is true',
      );
    }

    const annotation = this.annotationRepository.create({
      ...rest,
      ownerType,
      ownerId,
      isSpoiler: isSpoiler || false,
      spoilerChapter: isSpoiler ? spoilerChapter : null,
      authorId: author.id,
      status: AnnotationStatus.PENDING,
    });

    return await this.annotationRepository.save(annotation);
  }

  async findAll(query: AnnotationQueryDto): Promise<{
    data: Annotation[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    const {
      status,
      ownerType,
      authorId,
      page = 1,
      limit = 20,
      sortOrder = 'DESC',
    } = query;

    const queryBuilder = this.annotationRepository
      .createQueryBuilder('annotation')
      .leftJoinAndSelect('annotation.author', 'author')
      .select([
        'annotation.id',
        'annotation.ownerType',
        'annotation.ownerId',
        'annotation.title',
        'annotation.content',
        'annotation.sourceUrl',
        'annotation.chapterReference',
        'annotation.isSpoiler',
        'annotation.spoilerChapter',
        'annotation.status',
        'annotation.rejectionReason',
        'annotation.authorId',
        'annotation.createdAt',
        'annotation.updatedAt',
        'author.id',
        'author.username',
      ]);

    if (status) {
      queryBuilder.andWhere('annotation.status = :status', { status });
    }

    if (ownerType) {
      queryBuilder.andWhere('annotation.ownerType = :ownerType', { ownerType });
    }

    if (authorId) {
      queryBuilder.andWhere('annotation.authorId = :authorId', { authorId });
    }

    queryBuilder.orderBy('annotation.createdAt', sortOrder);

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return { data, total, page, perPage: limit, totalPages };
  }

  async findApprovedByOwner(
    ownerType: AnnotationOwnerType,
    ownerId: number,
  ): Promise<Annotation[]> {
    return await this.annotationRepository.find({
      where: {
        ownerType,
        ownerId,
        status: AnnotationStatus.APPROVED,
      },
      relations: ['author'],
      order: { createdAt: 'DESC' },
      select: {
        id: true,
        ownerType: true,
        ownerId: true,
        title: true,
        content: true,
        sourceUrl: true,
        chapterReference: true,
        isSpoiler: true,
        spoilerChapter: true,
        status: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
        author: {
          id: true,
          username: true,
          fluxerId: true,
          fluxerAvatar: true,
          profilePictureType: true,
          selectedCharacterMediaId: true,
        },
      },
    });
  }

  async findApprovedByChapterReference(
    chapterReference: number,
  ): Promise<Annotation[]> {
    return await this.annotationRepository.find({
      where: {
        chapterReference,
        status: AnnotationStatus.APPROVED,
      },
      relations: ['author'],
      order: { createdAt: 'DESC' },
      select: {
        id: true,
        ownerType: true,
        ownerId: true,
        title: true,
        content: true,
        sourceUrl: true,
        chapterReference: true,
        isSpoiler: true,
        spoilerChapter: true,
        status: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
        author: {
          id: true,
          username: true,
          fluxerId: true,
          fluxerAvatar: true,
          profilePictureType: true,
          selectedCharacterMediaId: true,
        },
      },
    });
  }

  async findByAuthor(userId: number): Promise<Annotation[]> {
    return await this.annotationRepository.find({
      where: { authorId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findPending(query: AnnotationQueryDto): Promise<{
    data: Annotation[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, sortOrder = 'ASC' } = query;

    const queryBuilder = this.annotationRepository
      .createQueryBuilder('annotation')
      .leftJoinAndSelect('annotation.author', 'author')
      .where('annotation.status = :status', {
        status: AnnotationStatus.PENDING,
      })
      .select([
        'annotation.id',
        'annotation.ownerType',
        'annotation.ownerId',
        'annotation.title',
        'annotation.content',
        'annotation.sourceUrl',
        'annotation.chapterReference',
        'annotation.isSpoiler',
        'annotation.spoilerChapter',
        'annotation.status',
        'annotation.authorId',
        'annotation.createdAt',
        'annotation.updatedAt',
        'author.id',
        'author.username',
      ])
      .orderBy('annotation.createdAt', sortOrder);

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return { data, total, page, perPage: limit, totalPages };
  }

  async findOne(id: number, currentUser?: User): Promise<Annotation> {
    const annotation = await this.annotationRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!annotation) {
      throw new NotFoundException('Annotation not found');
    }

    // Non-approved annotations are only visible to author/admin/mod
    if (annotation.status !== AnnotationStatus.APPROVED) {
      if (
        !currentUser ||
        (currentUser.id !== annotation.authorId &&
          currentUser.role !== UserRole.ADMIN &&
          currentUser.role !== UserRole.MODERATOR)
      ) {
        throw new NotFoundException('Annotation not found');
      }
    }

    return annotation;
  }

  async update(
    id: number,
    updateAnnotationDto: UpdateAnnotationDto,
    currentUser: User,
  ): Promise<Annotation> {
    const annotation = await this.findOne(id, currentUser);

    // Check ownership or admin/mod privileges
    if (annotation.authorId !== currentUser.id) {
      if (
        currentUser.role !== UserRole.ADMIN &&
        currentUser.role !== UserRole.MODERATOR
      ) {
        throw new ForbiddenException('You can only edit your own annotations');
      }
    }

    // Regular users can only edit pending or rejected annotations
    if (
      annotation.status === AnnotationStatus.APPROVED &&
      currentUser.role === UserRole.USER
    ) {
      throw new ForbiddenException('Approved annotations cannot be edited');
    }

    // If the author is editing a rejected annotation, auto-resubmit (reset to pending)
    if (
      annotation.status === AnnotationStatus.REJECTED &&
      annotation.authorId === currentUser.id &&
      currentUser.role === UserRole.USER
    ) {
      annotation.status = AnnotationStatus.PENDING;
      annotation.rejectionReason = null;
    }

    const { isSpoiler, spoilerChapter, ...rest } = updateAnnotationDto;

    // Handle spoiler logic
    if (isSpoiler !== undefined) {
      annotation.isSpoiler = isSpoiler;
      if (isSpoiler && !spoilerChapter && !annotation.spoilerChapter) {
        throw new BadRequestException(
          'spoilerChapter is required when isSpoiler is true',
        );
      }
      annotation.spoilerChapter = isSpoiler
        ? spoilerChapter || annotation.spoilerChapter
        : null;
    } else if (spoilerChapter !== undefined) {
      annotation.spoilerChapter = spoilerChapter;
    }

    Object.assign(annotation, rest);
    return await this.annotationRepository.save(annotation);
  }

  async remove(id: number, currentUser: User): Promise<void> {
    const annotation = await this.findOne(id, currentUser);

    // Check ownership or admin/mod privileges
    if (
      annotation.authorId !== currentUser.id &&
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.MODERATOR
    ) {
      throw new ForbiddenException('You can only delete your own annotations');
    }

    await this.annotationRepository.remove(annotation);
  }

  async approve(id: number, moderator: User): Promise<Annotation> {
    // Verify moderator/admin role
    if (
      moderator.role !== UserRole.ADMIN &&
      moderator.role !== UserRole.MODERATOR
    ) {
      throw new ForbiddenException(
        'Only moderators and admins can approve annotations',
      );
    }

    const annotation = await this.annotationRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!annotation) {
      throw new NotFoundException('Annotation not found');
    }

    if (annotation.status !== AnnotationStatus.PENDING) {
      throw new BadRequestException('Only pending annotations can be approved');
    }

    annotation.status = AnnotationStatus.APPROVED;
    annotation.rejectionReason = null;
    return await this.annotationRepository.save(annotation);
  }

  async reject(
    id: number,
    rejectionReason: string,
    moderator: User,
  ): Promise<Annotation> {
    // Verify moderator/admin role
    if (
      moderator.role !== UserRole.ADMIN &&
      moderator.role !== UserRole.MODERATOR
    ) {
      throw new ForbiddenException(
        'Only moderators and admins can reject annotations',
      );
    }

    const annotation = await this.annotationRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!annotation) {
      throw new NotFoundException('Annotation not found');
    }

    if (annotation.status !== AnnotationStatus.PENDING) {
      throw new BadRequestException('Only pending annotations can be rejected');
    }

    annotation.status = AnnotationStatus.REJECTED;
    annotation.rejectionReason = rejectionReason;
    return await this.annotationRepository.save(annotation);
  }

  async getPendingCount(): Promise<number> {
    return await this.annotationRepository.count({
      where: { status: AnnotationStatus.PENDING },
    });
  }

  async getApprovedCountByAuthor(authorId: number): Promise<number> {
    return await this.annotationRepository.count({
      where: {
        authorId,
        status: AnnotationStatus.APPROVED,
      },
    });
  }

  private async validateOwnerExists(
    ownerType: AnnotationOwnerType,
    ownerId: number,
  ): Promise<void> {
    let exists = false;

    switch (ownerType) {
      case AnnotationOwnerType.CHARACTER:
        exists = !!(await this.characterRepository.findOne({
          where: { id: ownerId },
        }));
        break;
      case AnnotationOwnerType.GAMBLE:
        exists = !!(await this.gambleRepository.findOne({
          where: { id: ownerId },
        }));
        break;
      case AnnotationOwnerType.ARC:
        exists = !!(await this.arcRepository.findOne({
          where: { id: ownerId },
        }));
        break;
    }

    if (!exists) {
      throw new BadRequestException(
        `${ownerType} with ID ${ownerId} does not exist`,
      );
    }
  }
}
