import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like, In } from 'typeorm';
import { Guide, GuideStatus } from '../../entities/guide.entity';
import { GuideLike } from '../../entities/guide-like.entity';
import { Tag } from '../../entities/tag.entity';
import { User, UserRole } from '../../entities/user.entity';
import { CreateGuideDto } from './dto/create-guide.dto';
import { UpdateGuideDto } from './dto/update-guide.dto';
import { GuideQueryDto } from './dto/guide-query.dto';

@Injectable()
export class GuidesService {
  constructor(
    @InjectRepository(Guide)
    private readonly guideRepository: Repository<Guide>,
    @InjectRepository(GuideLike)
    private readonly guideLikeRepository: Repository<GuideLike>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createGuideDto: CreateGuideDto, author: User): Promise<Guide> {
    const { tagNames, ...guideData } = createGuideDto;

    // Create the guide first - set to PENDING for moderator approval
    const guide = this.guideRepository.create({
      ...guideData,
      authorId: author.id,
      status: guideData.status || GuideStatus.PENDING,
    });

    // Handle tags if provided
    if (tagNames && tagNames.length > 0) {
      const tags = await this.findOrCreateTags(tagNames);
      guide.tags = tags;
    }

    return await this.guideRepository.save(guide);
  }

  async findAll(query: GuideQueryDto): Promise<{
    data: Guide[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    const {
      search,
      status,
      authorId,
      tag,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 20,
    } = query;

    const queryBuilder = this.guideRepository
      .createQueryBuilder('guide')
      .leftJoinAndSelect('guide.author', 'author')
      .leftJoinAndSelect('guide.tags', 'tags')
      .select([
        'guide.id',
        'guide.authorId',
        'guide.title',
        'guide.description',
        'guide.status',
        'guide.viewCount',
        'guide.likeCount',
        'guide.createdAt',
        'guide.updatedAt',
        'author.id',
        'author.username',
        'tags.id',
        'tags.name',
      ]);

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(guide.title ILIKE :search OR guide.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      queryBuilder.andWhere('guide.status = :status', { status });
    }

    if (authorId) {
      queryBuilder.andWhere('guide.authorId = :authorId', { authorId });
    }

    if (tag) {
      queryBuilder.andWhere('tags.name = :tag', { tag });
    }

    // Apply sorting
    const validSortFields = [
      'createdAt',
      'updatedAt',
      'viewCount',
      'likeCount',
      'title',
    ];
    if (validSortFields.includes(sortBy)) {
      queryBuilder.orderBy(`guide.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('guide.createdAt', 'DESC');
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return { data, total, page, perPage: limit, totalPages };
  }

  async findPublished(query: GuideQueryDto, currentUser?: User): Promise<{
    data: (Guide & { userHasLiked?: boolean })[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    const {
      search,
      tag,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 20,
    } = query;

    const queryBuilder = this.guideRepository
      .createQueryBuilder('guide')
      .leftJoinAndSelect('guide.author', 'author')
      .leftJoinAndSelect('guide.tags', 'tags')
      .select([
        'guide.id',
        'guide.authorId',
        'guide.title',
        'guide.description',
        'guide.status',
        'guide.viewCount',
        'guide.likeCount',
        'guide.createdAt',
        'guide.updatedAt',
        'author.id',
        'author.username',
        'tags.id',
        'tags.name',
      ])
      .where('guide.status = :status', { status: GuideStatus.PUBLISHED });

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(guide.title ILIKE :search OR guide.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (tag) {
      queryBuilder.andWhere('tags.name = :tag', { tag });
    }

    // Apply sorting
    const validSortFields = [
      'createdAt',
      'updatedAt',
      'viewCount',
      'likeCount',
      'title',
    ];
    if (validSortFields.includes(sortBy)) {
      queryBuilder.orderBy(`guide.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('guide.createdAt', 'DESC');
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [guides, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    // Add user like status if user is authenticated
    let guidesWithLikeStatus: (Guide & { userHasLiked?: boolean })[] = guides;
    if (currentUser && guides.length > 0) {
      const guideIds = guides.map(guide => guide.id);
      const userLikes = await this.guideLikeRepository.find({
        where: { 
          guideId: In(guideIds),
          userId: currentUser.id 
        },
      });
      
      const likedGuideIds = new Set(userLikes.map(like => like.guideId));
      
      guidesWithLikeStatus = guides.map(guide => ({
        ...guide,
        userHasLiked: likedGuideIds.has(guide.id)
      }));
    }

    return { data: guidesWithLikeStatus, total, page, perPage: limit, totalPages };
  }

  async findOne(id: number, currentUser?: User): Promise<Guide> {
    const guide = await this.guideRepository.findOne({
      where: { id },
      relations: ['author', 'tags', 'likes'],
    });

    if (!guide) {
      throw new NotFoundException('Guide not found');
    }

    // Check if user can view this guide
    if (guide.status === GuideStatus.DRAFT) {
      if (
        !currentUser ||
        (currentUser.id !== guide.authorId &&
          currentUser.role !== UserRole.ADMIN &&
          currentUser.role !== UserRole.MODERATOR)
      ) {
        throw new NotFoundException('Guide not found');
      }
    }

    return guide;
  }

  async findOnePublic(id: number, currentUser?: User): Promise<Guide & { userHasLiked?: boolean }> {
    const guide = await this.guideRepository.findOne({
      where: { id, status: GuideStatus.PUBLISHED },
      relations: ['author', 'tags'],
      select: {
        id: true,
        authorId: true,
        title: true,
        description: true,
        content: true,
        viewCount: true,
        likeCount: true,
        createdAt: true,
        updatedAt: true,
        author: {
          id: true,
          username: true,
        },
        tags: {
          id: true,
          name: true,
        },
      },
    });

    if (!guide) {
      throw new NotFoundException('Guide not found');
    }

    // If user is authenticated, check if they have liked this guide
    let userHasLiked = false;
    if (currentUser) {
      const existingLike = await this.guideLikeRepository.findOne({
        where: { guideId: id, userId: currentUser.id },
      });
      userHasLiked = !!existingLike;
    }

    return { ...guide, userHasLiked };
  }

  async update(
    id: number,
    updateGuideDto: UpdateGuideDto,
    currentUser: User,
  ): Promise<Guide> {
    const guide = await this.findOne(id, currentUser);

    // Check if user can edit this guide
    if (
      guide.authorId !== currentUser.id &&
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.MODERATOR
    ) {
      throw new ForbiddenException('You can only edit your own guides');
    }

    const { tagNames, authorId, ...guideData } = updateGuideDto;

    // Check if authorId is being changed (admin only)
    if (authorId !== undefined && authorId !== guide.authorId) {
      if (currentUser.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Only admins can change guide ownership');
      }

      // Verify the new author exists
      const newAuthor = await this.userRepository.findOne({
        where: { id: authorId },
      });
      if (!newAuthor) {
        throw new NotFoundException('New author not found');
      }

      guide.authorId = authorId;
    }

    // Update basic fields
    Object.assign(guide, guideData);

    // Handle tags if provided
    if (tagNames !== undefined) {
      if (tagNames.length > 0) {
        const tags = await this.findOrCreateTags(tagNames);
        guide.tags = tags;
      } else {
        guide.tags = [];
      }
    }

    const savedGuide = await this.guideRepository.save(guide);

    // Fetch the updated guide with all relations to ensure React Admin gets complete data
    const updatedGuide = await this.guideRepository.findOne({
      where: { id: savedGuide.id },
      relations: ['author', 'tags', 'likes'],
    });

    if (!updatedGuide) {
      throw new NotFoundException('Guide not found after update');
    }

    return updatedGuide;
  }

  async remove(id: number, currentUser: User): Promise<void> {
    const guide = await this.findOne(id, currentUser);

    // Check if user can delete this guide
    if (
      guide.authorId !== currentUser.id &&
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.MODERATOR
    ) {
      throw new ForbiddenException('You can only delete your own guides');
    }

    await this.guideRepository.remove(guide);
  }

  async approve(id: number, moderator: User): Promise<Guide> {
    // Only admins and moderators can approve guides
    if (moderator.role !== UserRole.ADMIN && moderator.role !== UserRole.MODERATOR) {
      throw new ForbiddenException('Only moderators and admins can approve guides');
    }

    const guide = await this.guideRepository.findOne({
      where: { id },
      relations: ['author', 'tags'],
    });

    if (!guide) {
      throw new NotFoundException('Guide not found');
    }

    if (guide.status !== GuideStatus.PENDING) {
      throw new BadRequestException('Only pending guides can be approved');
    }

    guide.status = GuideStatus.PUBLISHED;
    guide.rejectionReason = null; // Clear any previous rejection reason

    return await this.guideRepository.save(guide);
  }

  async reject(id: number, rejectionReason: string, moderator: User): Promise<Guide> {
    // Only admins and moderators can reject guides
    if (moderator.role !== UserRole.ADMIN && moderator.role !== UserRole.MODERATOR) {
      throw new ForbiddenException('Only moderators and admins can reject guides');
    }

    const guide = await this.guideRepository.findOne({
      where: { id },
      relations: ['author', 'tags'],
    });

    if (!guide) {
      throw new NotFoundException('Guide not found');
    }

    if (guide.status !== GuideStatus.PENDING) {
      throw new BadRequestException('Only pending guides can be rejected');
    }

    guide.status = GuideStatus.REJECTED;
    guide.rejectionReason = rejectionReason;

    return await this.guideRepository.save(guide);
  }

  async getPendingGuides(query: GuideQueryDto): Promise<{
    data: Guide[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    const {
      sortBy = 'createdAt',
      sortOrder = 'ASC',
      page = 1,
      limit = 20,
    } = query;

    const queryBuilder = this.guideRepository
      .createQueryBuilder('guide')
      .leftJoinAndSelect('guide.author', 'author')
      .leftJoinAndSelect('guide.tags', 'tags')
      .where('guide.status = :status', { status: GuideStatus.PENDING });

    // Apply sorting
    const validSortFields = [
      'createdAt',
      'updatedAt',
      'title',
    ];
    if (validSortFields.includes(sortBy)) {
      queryBuilder.orderBy(`guide.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('guide.createdAt', 'ASC');
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return { data, total, page, perPage: limit, totalPages };
  }

  async incrementViewCount(id: number): Promise<void> {
    await this.guideRepository.increment({ id }, 'viewCount', 1);
  }

  async toggleLike(
    id: number,
    user: User,
  ): Promise<{ liked: boolean; likeCount: number }> {
    const guide = await this.guideRepository.findOne({
      where: { id, status: GuideStatus.PUBLISHED },
    });

    if (!guide) {
      throw new NotFoundException('Guide not found');
    }

    // Check if user already liked this guide
    const existingLike = await this.guideLikeRepository.findOne({
      where: { guideId: id, userId: user.id },
    });

    if (existingLike) {
      // Unlike
      await this.guideLikeRepository.remove(existingLike);
      await this.guideRepository.decrement({ id }, 'likeCount', 1);

      const updatedGuide = await this.guideRepository.findOne({
        where: { id },
      });
      return { liked: false, likeCount: updatedGuide?.likeCount || 0 };
    } else {
      // Like
      const guideLike = this.guideLikeRepository.create({
        guideId: id,
        userId: user.id,
      });
      await this.guideLikeRepository.save(guideLike);
      await this.guideRepository.increment({ id }, 'likeCount', 1);

      const updatedGuide = await this.guideRepository.findOne({
        where: { id },
      });
      return { liked: true, likeCount: updatedGuide?.likeCount || 1 };
    }
  }

  async getUserLikedGuides(
    userId: number,
    query: GuideQueryDto,
  ): Promise<{
    data: Guide[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = query;

    const queryBuilder = this.guideRepository
      .createQueryBuilder('guide')
      .innerJoin('guide.likes', 'guideLike', 'guideLike.userId = :userId', {
        userId,
      })
      .leftJoinAndSelect('guide.author', 'author')
      .leftJoinAndSelect('guide.tags', 'tags')
      .where('guide.status = :status', { status: GuideStatus.PUBLISHED })
      .orderBy('guideLike.createdAt', 'DESC');

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return { data, total, page, perPage: limit, totalPages };
  }

  private async findOrCreateTags(tagNames: string[]): Promise<Tag[]> {
    const tags: Tag[] = [];

    for (const tagName of tagNames) {
      let tag = await this.tagRepository.findOne({ where: { name: tagName } });

      if (!tag) {
        tag = this.tagRepository.create({
          name: tagName,
          description: `Auto-created tag: ${tagName}`,
        });
        tag = await this.tagRepository.save(tag);
      }

      tags.push(tag);
    }

    return tags;
  }
}
