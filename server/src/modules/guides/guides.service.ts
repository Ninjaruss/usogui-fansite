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
import { Character } from '../../entities/character.entity';
import { Arc } from '../../entities/arc.entity';
import { Gamble } from '../../entities/gamble.entity';
import { CreateGuideDto } from './dto/create-guide.dto';
import { UpdateGuideDto } from './dto/update-guide.dto';
import { GuideQueryDto } from './dto/guide-query.dto';
import { PageViewsService } from '../page-views/page-views.service';
import { PageType } from '../../entities/page-view.entity';

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
    @InjectRepository(Character)
    private readonly characterRepository: Repository<Character>,
    @InjectRepository(Arc)
    private readonly arcRepository: Repository<Arc>,
    @InjectRepository(Gamble)
    private readonly gambleRepository: Repository<Gamble>,
    private readonly pageViewsService: PageViewsService,
  ) {}

  async create(createGuideDto: CreateGuideDto, author: User): Promise<Guide> {
    const { tagNames, characterIds, arcId, gambleIds, ...guideData } =
      createGuideDto;

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

    // Handle character relations
    if (characterIds && characterIds.length > 0) {
      const characters = await this.characterRepository.findByIds(characterIds);
      if (characters.length !== characterIds.length) {
        throw new BadRequestException('One or more character IDs are invalid');
      }
      guide.characters = characters;
    }

    // Handle arc relation
    if (arcId) {
      const arc = await this.arcRepository.findOne({ where: { id: arcId } });
      if (!arc) {
        throw new BadRequestException('Invalid arc ID');
      }
      guide.arc = arc;
      guide.arcId = arcId;
    }

    // Handle gamble relations
    if (gambleIds && gambleIds.length > 0) {
      const gambles = await this.gambleRepository.findByIds(gambleIds);
      if (gambles.length !== gambleIds.length) {
        throw new BadRequestException('One or more gamble IDs are invalid');
      }
      guide.gambles = gambles;
    }

    return await this.guideRepository.save(guide);
  }

  async findAll(query: GuideQueryDto): Promise<{
    data: (Guide & { viewCount?: number })[];
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
      characterIds,
      arcIds,
      gambleIds,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 20,
    } = query;

    const queryBuilder = this.guideRepository
      .createQueryBuilder('guide')
      .leftJoinAndSelect('guide.author', 'author')
      .leftJoinAndSelect('guide.tags', 'tags')
      .leftJoinAndSelect('guide.characters', 'characters')
      .leftJoinAndSelect('guide.arc', 'arc')
      .leftJoinAndSelect('guide.gambles', 'gambles')
      .select([
        'guide.id',
        'guide.authorId',
        'guide.title',
        'guide.description',
        'guide.status',
        'guide.likeCount',
        'guide.arcId',
        'guide.rejectionReason',
        'guide.createdAt',
        'guide.updatedAt',
        'author.id',
        'author.username',
        'author.customRole',
        'tags.id',
        'tags.name',
        'characters.id',
        'characters.name',
        'arc.id',
        'arc.name',
        'gambles.id',
        'gambles.name',
      ]);

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(guide.title ILIKE :search OR guide.description ILIKE :search OR author.username ILIKE :search)',
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

    // Filter by character IDs
    if (characterIds) {
      const charIds = characterIds
        .split(',')
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));
      if (charIds.length > 0) {
        queryBuilder.andWhere('characters.id IN (:...charIds)', { charIds });
      }
    }

    // Filter by arc IDs
    if (arcIds) {
      const arcIdArray = arcIds
        .split(',')
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));
      if (arcIdArray.length > 0) {
        queryBuilder.andWhere('arc.id IN (:...arcIdArray)', { arcIdArray });
      }
    }

    // Filter by gamble IDs
    if (gambleIds) {
      const gambleIdArray = gambleIds
        .split(',')
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));
      if (gambleIdArray.length > 0) {
        queryBuilder.andWhere('gambles.id IN (:...gambleIdArray)', {
          gambleIdArray,
        });
      }
    }

    // For sorting by viewCount, we need a different approach since it's not in the entity anymore
    if (sortBy === 'viewCount') {
      // We'll sort by createdAt for now and handle viewCount sorting later
      queryBuilder.orderBy('guide.createdAt', sortOrder);
    } else {
      // Apply sorting for other valid fields - ADMIN ENDPOINT
      const validSortFields = [
        'id',
        'createdAt',
        'updatedAt',
        'likeCount',
        'title',
        'description',
        'authorId',
      ];
      if (validSortFields.includes(sortBy)) {
        queryBuilder.orderBy(`guide.${sortBy}`, sortOrder);
      } else {
        queryBuilder.orderBy('guide.createdAt', 'DESC');
      }
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [guides, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    // Get view counts for all guides
    const guideIds = guides.map((guide) => guide.id);
    const viewCounts =
      guideIds.length > 0
        ? await this.pageViewsService.getUniqueViewCounts(
            PageType.GUIDE,
            guideIds,
          )
        : new Map<number, number>();

    // Add view counts and character/gamble IDs to guides
    const guidesWithViewCounts = guides.map((guide) => ({
      ...guide,
      viewCount: viewCounts.get(guide.id) || 0,
      characterIds: guide.characters ? guide.characters.map((c) => c.id) : [],
      gambleIds: guide.gambles ? guide.gambles.map((g) => g.id) : [],
    }));

    // Sort by viewCount if requested
    if (sortBy === 'viewCount') {
      guidesWithViewCounts.sort((a, b) => {
        const comparison = (a.viewCount || 0) - (b.viewCount || 0);
        return sortOrder === 'ASC' ? comparison : -comparison;
      });
    }

    return {
      data: guidesWithViewCounts,
      total,
      page,
      perPage: limit,
      totalPages,
    };
  }

  async findPublished(
    query: GuideQueryDto,
    currentUser?: User,
  ): Promise<{
    data: (Guide & { userHasLiked?: boolean; viewCount?: number })[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    const {
      search,
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
        'guide.likeCount',
        'guide.createdAt',
        'guide.updatedAt',
        'author.id',
        'author.username',
        'author.customRole',
        'tags.id',
        'tags.name',
      ])
      .where('guide.status = :status', { status: GuideStatus.PUBLISHED });

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(guide.title ILIKE :search OR guide.description ILIKE :search OR author.username ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (authorId) {
      queryBuilder.andWhere('guide.authorId = :authorId', { authorId });
    }

    if (tag) {
      queryBuilder.andWhere('tags.name = :tag', { tag });
    }

    // For sorting by viewCount, we need a different approach since it's not in the entity anymore
    if (sortBy === 'viewCount') {
      // We'll sort by createdAt for now and handle viewCount sorting later
      queryBuilder.orderBy('guide.createdAt', sortOrder);
    } else {
      // Apply sorting for other valid fields - PUBLIC ENDPOINT
      const validSortFields = [
        'id',
        'createdAt',
        'updatedAt',
        'likeCount',
        'title',
        'description',
        'authorId',
      ];
      if (validSortFields.includes(sortBy)) {
        queryBuilder.orderBy(`guide.${sortBy}`, sortOrder);
      } else {
        queryBuilder.orderBy('guide.createdAt', 'DESC');
      }
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [guides, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    // Get view counts for all guides
    const guideIds = guides.map((guide) => guide.id);
    const viewCounts =
      guideIds.length > 0
        ? await this.pageViewsService.getUniqueViewCounts(
            PageType.GUIDE,
            guideIds,
          )
        : new Map<number, number>();

    // Add user like status if user is authenticated
    let guidesWithLikeStatus: (Guide & {
      userHasLiked?: boolean;
      viewCount?: number;
    })[] = guides.map((guide) => ({
      ...guide,
      viewCount: viewCounts.get(guide.id) || 0,
    }));

    if (currentUser && guides.length > 0) {
      const userLikes = await this.guideLikeRepository.find({
        where: {
          guideId: In(guideIds),
          userId: currentUser.id,
        },
      });

      const likedGuideIds = new Set(userLikes.map((like) => like.guideId));

      guidesWithLikeStatus = guidesWithLikeStatus.map((guide) => ({
        ...guide,
        userHasLiked: likedGuideIds.has(guide.id),
      }));
    }

    // Sort by viewCount if requested
    if (sortBy === 'viewCount') {
      guidesWithLikeStatus.sort((a, b) => {
        const comparison = (a.viewCount || 0) - (b.viewCount || 0);
        return sortOrder === 'ASC' ? comparison : -comparison;
      });
    }

    return {
      data: guidesWithLikeStatus,
      total,
      page,
      perPage: limit,
      totalPages,
    };
  }

  async findOne(
    id: number,
    currentUser?: User,
  ): Promise<Guide & { characterIds?: number[]; gambleIds?: number[] }> {
    const guide = await this.guideRepository.findOne({
      where: { id },
      relations: ['author', 'tags', 'likes', 'characters', 'arc', 'gambles'],
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

    // Add character and gamble IDs for frontend form compatibility
    const guideWithIds = {
      ...guide,
      characterIds: guide.characters ? guide.characters.map((c) => c.id) : [],
      gambleIds: guide.gambles ? guide.gambles.map((g) => g.id) : [],
    };

    return guideWithIds;
  }

  async findOnePublic(
    id: number,
    currentUser?: User,
  ): Promise<Guide & { userHasLiked?: boolean; viewCount?: number }> {
    const guide = await this.guideRepository.findOne({
      where: { id, status: GuideStatus.PUBLISHED },
      relations: ['author', 'tags', 'characters', 'arc', 'gambles'],
      select: {
        id: true,
        authorId: true,
        title: true,
        description: true,
        content: true,
        likeCount: true,
        arcId: true,
        createdAt: true,
        updatedAt: true,
        author: {
          id: true,
          username: true,
          customRole: true,
        },
        tags: {
          id: true,
          name: true,
        },
        characters: {
          id: true,
          name: true,
        },
        arc: {
          id: true,
          name: true,
        },
        gambles: {
          id: true,
          name: true,
          rules: true,
        },
      },
    });

    if (!guide) {
      throw new NotFoundException('Guide not found');
    }

    // Get view count from page views service
    const viewCount = await this.pageViewsService.getUniqueViewCount(
      PageType.GUIDE,
      id,
    );

    // If user is authenticated, check if they have liked this guide
    let userHasLiked = false;
    if (currentUser) {
      const existingLike = await this.guideLikeRepository.findOne({
        where: { guideId: id, userId: currentUser.id },
      });
      userHasLiked = !!existingLike;
    }

    return { ...guide, userHasLiked, viewCount };
  }

  async update(
    id: number,
    updateGuideDto: UpdateGuideDto,
    currentUser: User,
  ): Promise<Guide> {
    console.log('=== GUIDE UPDATE DEBUG ===');
    console.log(
      'Received updateGuideDto:',
      JSON.stringify(updateGuideDto, null, 2),
    );
    console.log('Current user:', currentUser.id, currentUser.username);

    const guide = await this.findOne(id, currentUser);
    console.log('Found guide:', guide.id, guide.title);

    // Check if user can edit this guide
    if (
      guide.authorId !== currentUser.id &&
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.MODERATOR
    ) {
      throw new ForbiddenException('You can only edit your own guides');
    }

    const { tagNames, authorId, characterIds, arcId, gambleIds, ...guideData } =
      updateGuideDto;
    console.log('Extracted fields:', {
      tagNames,
      authorId,
      characterIds,
      arcId,
      gambleIds,
    });
    console.log('Basic guide data:', guideData);

    return await this.guideRepository.manager.transaction(async (manager) => {
      const guideRepo = manager.getRepository(Guide);
      const userRepo = manager.getRepository(User);
      const tagRepo = manager.getRepository(Tag);
      const characterRepo = manager.getRepository(Character);
      const arcRepo = manager.getRepository(Arc);
      const gambleRepo = manager.getRepository(Gamble);

      try {
        // Check if authorId is being changed (admin only)
        if (authorId !== undefined && authorId !== guide.authorId) {
          if (currentUser.role !== UserRole.ADMIN) {
            throw new ForbiddenException(
              'Only admins can change guide ownership',
            );
          }

          // Verify the new author exists
          const newAuthor = await userRepo.findOne({
            where: { id: authorId },
          });
          if (!newAuthor) {
            throw new NotFoundException('New author not found');
          }

          guide.authorId = authorId;
          console.log('Updated author to:', authorId);
        }

        // Update basic fields
        Object.assign(guide, guideData);
        console.log('Updated basic fields');

        // Handle tags if provided
        if (tagNames !== undefined) {
          if (tagNames.length > 0) {
            console.log('Processing tags:', tagNames);
            const tags: Tag[] = [];
            for (const tagName of tagNames) {
              let tag = await tagRepo.findOne({ where: { name: tagName } });
              if (!tag) {
                tag = tagRepo.create({ name: tagName });
                tag = await tagRepo.save(tag);
                console.log('Created new tag:', tag.name);
              }
              tags.push(tag);
            }
            guide.tags = tags;
            console.log(
              'Assigned tags:',
              tags.map((t) => t.name),
            );
          } else {
            guide.tags = [];
            console.log('Cleared tags');
          }
        }

        // Handle character relations
        if (characterIds !== undefined) {
          if (characterIds.length > 0) {
            console.log('Processing character IDs:', characterIds);
            const characters = await characterRepo.findByIds(characterIds);
            if (characters.length !== characterIds.length) {
              const foundIds = characters.map((c) => c.id);
              const missingIds = characterIds.filter(
                (id) => !foundIds.includes(id),
              );
              console.error('Missing character IDs:', missingIds);
              throw new BadRequestException(
                `Character IDs not found: ${missingIds.join(', ')}`,
              );
            }
            guide.characters = characters;
            console.log(
              'Assigned characters:',
              characters.map((c) => `${c.id}:${c.name}`),
            );
          } else {
            guide.characters = [];
            console.log('Cleared characters');
          }
        }

        // Handle arc relation
        if (arcId !== undefined) {
          if (arcId && arcId !== null) {
            console.log('Processing arc ID:', arcId);
            const arc = await arcRepo.findOne({ where: { id: arcId } });
            if (!arc) {
              console.error('Arc not found:', arcId);
              throw new BadRequestException(`Arc ID not found: ${arcId}`);
            }
            guide.arc = arc;
            guide.arcId = arcId;
            console.log('Assigned arc:', `${arc.id}:${arc.name}`);
          } else {
            guide.arc = undefined;
            guide.arcId = undefined;
            console.log('Cleared arc (arcId was:', arcId, ')');
          }
        }

        // Handle gamble relations
        if (gambleIds !== undefined) {
          if (gambleIds.length > 0) {
            console.log('Processing gamble IDs:', gambleIds);
            const gambles = await gambleRepo.findByIds(gambleIds);
            if (gambles.length !== gambleIds.length) {
              const foundIds = gambles.map((g) => g.id);
              const missingIds = gambleIds.filter(
                (id) => !foundIds.includes(id),
              );
              console.error('Missing gamble IDs:', missingIds);
              throw new BadRequestException(
                `Gamble IDs not found: ${missingIds.join(', ')}`,
              );
            }
            guide.gambles = gambles;
            console.log(
              'Assigned gambles:',
              gambles.map((g) => `${g.id}:${g.name}`),
            );
          } else {
            guide.gambles = [];
            console.log('Cleared gambles');
          }
        }

        console.log('Saving guide...');
        const savedGuide = await guideRepo.save(guide);
        console.log('Guide saved successfully');

        // Fetch the updated guide with all relations to ensure React Admin gets complete data
        const updatedGuide = await guideRepo.findOne({
          where: { id: savedGuide.id },
          relations: [
            'author',
            'tags',
            'likes',
            'characters',
            'arc',
            'gambles',
          ],
        });

        if (!updatedGuide) {
          throw new NotFoundException('Guide not found after update');
        }

        console.log('Returning updated guide with relations');
        console.log('=== END GUIDE UPDATE DEBUG ===');
        return updatedGuide;
      } catch (error) {
        console.error('Error in guide update transaction:', error);
        throw error;
      }
    });
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
    if (
      moderator.role !== UserRole.ADMIN &&
      moderator.role !== UserRole.MODERATOR
    ) {
      throw new ForbiddenException(
        'Only moderators and admins can approve guides',
      );
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

  async reject(
    id: number,
    rejectionReason: string,
    moderator: User,
  ): Promise<Guide> {
    // Only admins and moderators can reject guides
    if (
      moderator.role !== UserRole.ADMIN &&
      moderator.role !== UserRole.MODERATOR
    ) {
      throw new ForbiddenException(
        'Only moderators and admins can reject guides',
      );
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

    // Apply sorting - PENDING GUIDES
    const validSortFields = [
      'id',
      'createdAt',
      'updatedAt',
      'title',
      'description',
      'authorId',
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

  async recordView(
    id: number,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.pageViewsService.recordView(
      PageType.GUIDE,
      id,
      ipAddress,
      userAgent,
    );
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
