import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThan, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, ProfilePictureType } from '../../entities/user.entity';
import { Quote } from '../../entities/quote.entity';
import { Gamble } from '../../entities/gamble.entity';
import { Character } from '../../entities/character.entity';
import { Media, MediaStatus, MediaPurpose } from '../../entities/media.entity';
import { Guide, GuideStatus } from '../../entities/guide.entity';
import { GuideLike } from '../../entities/guide-like.entity';
import { Annotation, AnnotationStatus } from '../../entities/annotation.entity';
import { Event, EventStatus } from '../../entities/event.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { randomBytes } from 'crypto';
import { createQueryLimiter } from '../../utils/db-query-limiter';

// Refresh token expiration duration (30 days)
const REFRESH_TOKEN_EXPIRATION_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
    @InjectRepository(Quote) private readonly quoteRepo: Repository<Quote>,
    @InjectRepository(Gamble) private readonly gambleRepo: Repository<Gamble>,
  ) {}

  // --- Find methods ---
  async findAll(
    filters: { page?: number; limit?: number; username?: string } = {},
  ): Promise<{
    data: User[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    // Default to page 1 and limit 20 (reasonable for public API)
    // Cap maximum limit at 100 to prevent abuse
    const page = filters.page || 1;
    const requestedLimit = filters.limit || 20;
    const limit = Math.min(requestedLimit, 100); // Cap at 100 max
    const skip = (page - 1) * limit;

    const queryBuilder = this.repo
      .createQueryBuilder('user')
      .leftJoinAndSelect(
        'user.selectedCharacterMedia',
        'selectedCharacterMedia',
      )
      .leftJoinAndSelect('user.badges', 'userBadges')
      .leftJoinAndSelect('userBadges.badge', 'badge')
      .skip(skip)
      .take(limit);

    // Add username filter if provided
    if (filters.username) {
      queryBuilder.where('user.username ILIKE :username', {
        username: `%${filters.username}%`,
      });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    // Process each user to filter active badges for list view
    const now = new Date();
    for (const user of data) {
      // Filter to show only active, non-expired badges in the list view
      if (user.badges) {
        user.badges = user.badges.filter(
          (userBadge) =>
            userBadge.isActive &&
            (!userBadge.expiresAt || userBadge.expiresAt > now),
        );
      }
    }

    // PERFORMANCE FIX: Batch load all character information to avoid N+1 queries
    // Collect all character IDs from users with character media
    const characterIds = data
      .filter(
        (user) =>
          user.selectedCharacterMedia &&
          user.selectedCharacterMedia.ownerType === 'character',
      )
      .map((user) => user.selectedCharacterMedia!.ownerId);

    // Batch fetch all characters in a single query
    if (characterIds.length > 0) {
      const characterRepo = this.repo.manager.getRepository(Character);
      const characters = await characterRepo.find({
        where: { id: In(characterIds) },
        select: ['id', 'name'],
      });
      const characterMap = new Map(characters.map((c) => [c.id, c]));

      // Attach character info to each user's media
      for (const user of data) {
        if (
          user.selectedCharacterMedia &&
          user.selectedCharacterMedia.ownerType === 'character'
        ) {
          const character = characterMap.get(
            user.selectedCharacterMedia.ownerId,
          );
          if (character) {
            (user.selectedCharacterMedia as any).character = {
              id: character.id,
              name: character.name,
            };
          }
        }
      }
    }

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { data, total, page, perPage: limit, totalPages };
  }

  async findOne(id: number): Promise<User> {
    const user = await this.repo.findOne({
      where: { id },
      relations: [
        'badges',
        'badges.badge',
        'badges.awardedBy',
        'badges.revokedBy',
      ],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getUserStats() {
    const stats = await this.repo
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();

    const totalUsers = stats.reduce(
      (acc, curr) => acc + parseInt(curr.count),
      0,
    );
    const verifiedUsers = await this.repo.count({
      where: { isEmailVerified: true },
    });

    return {
      totalUsers,
      verifiedUsers,
      roleDistribution: stats,
      registrationsByMonth: await this.getRegistrationsByMonth(),
    };
  }

  async getUserActivity(id: number) {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    // Get media submissions
    const mediaRepo = this.repo.manager.getRepository(Media);
    const mediaStats = await mediaRepo
      .createQueryBuilder('media')
      .where('media.submittedBy = :userId', { userId: id })
      .select('media.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('media.status')
      .getRawMany();

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
      mediaActivity: {
        total: mediaStats.reduce((acc, curr) => acc + parseInt(curr.count), 0),
        byStatus: mediaStats,
      },
    };
  }

  async getUserProfileStats(id: number) {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    // Get guides written count (approved only)
    const guideRepo = this.repo.manager.getRepository(Guide);
    const guidesWritten = await guideRepo
      .createQueryBuilder('guide')
      .where('guide.authorId = :userId', { userId: id })
      .andWhere('guide.status = :status', { status: GuideStatus.APPROVED })
      .getCount();

    // Get media submitted count (approved only)
    const mediaRepo = this.repo.manager.getRepository(Media);
    const mediaSubmitted = await mediaRepo
      .createQueryBuilder('media')
      .where('media.submittedBy = :userId', { userId: id })
      .andWhere('media.status = :status', { status: MediaStatus.APPROVED })
      .getCount();

    // Get total likes received on user's guides
    const guideLikeRepo = this.repo.manager.getRepository(GuideLike);
    const likesReceived = await guideLikeRepo
      .createQueryBuilder('guideLike')
      .innerJoin('guideLike.guide', 'guide')
      .where('guide.authorId = :userId', { userId: id })
      .andWhere('guide.status = :status', { status: GuideStatus.APPROVED })
      .getCount();

    // Get annotations submitted count (approved only)
    const annotationRepo = this.repo.manager.getRepository(Annotation);
    const annotationsSubmitted = await annotationRepo
      .createQueryBuilder('annotation')
      .where('annotation.authorId = :userId', { userId: id })
      .andWhere('annotation.status = :status', {
        status: AnnotationStatus.APPROVED,
      })
      .getCount();

    // Get events submitted count (approved only)
    const eventRepo = this.repo.manager.getRepository(Event);
    const eventsSubmitted = await eventRepo
      .createQueryBuilder('event')
      .where('event.createdBy = :userId', { userId: id })
      .andWhere('event.status = :status', { status: EventStatus.APPROVED })
      .getCount();

    return {
      guidesWritten,
      mediaSubmitted,
      likesReceived,
      annotationsSubmitted,
      eventsSubmitted,
    };
  }

  private async getRegistrationsByMonth() {
    return this.repo
      .createQueryBuilder('user')
      .select("DATE_TRUNC('month', user.createdAt)", 'month')
      .addSelect('COUNT(*)', 'count')
      .groupBy('month')
      .orderBy('month', 'DESC')
      .limit(12)
      .getRawMany();
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.repo.findOne({ where: { username } });
  }

  async findByDiscordId(discordId: string): Promise<User | null> {
    return this.repo.findOne({ where: { discordId } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return this.repo.findOne({ where: { emailVerificationToken: token } });
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.repo.findOne({ where: { passwordResetToken: token } });
  }

  // --- Create user ---
  async create(data: {
    username: string;
    email: string;
    password: string;
  }): Promise<User> {
    const existingUsername = await this.findByUsername(data.username);
    if (existingUsername) throw new ConflictException('Username already taken');

    const existingEmail = await this.findByEmail(data.email);
    if (existingEmail) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = this.repo.create({
      username: data.username,
      email: data.email,
      password: passwordHash,
      isEmailVerified: false,
      emailVerificationToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    return this.repo.save(user);
  }

  async createDiscordUser(data: {
    discordId: string;
    discordUsername: string;
    discordAvatar: string | null;
    username: string;
    email: string | null;
    role?: UserRole;
  }): Promise<User> {
    // Ensure unique username by appending number if needed
    let finalUsername = data.username;
    let counter = 1;
    while (await this.findByUsername(finalUsername)) {
      finalUsername = `${data.username}_${counter}`;
      counter++;
    }

    const user = this.repo.create({
      discordId: data.discordId,
      discordUsername: data.discordUsername,
      discordAvatar: data.discordAvatar,
      username: finalUsername,
      email: data.email,
      role: data.role || UserRole.USER,
      isEmailVerified: true, // Discord users are considered verified
      password: null, // No password for Discord users
    });

    return this.repo.save(user);
  }

  // --- Validate password ---
  async validatePassword(user: User, plain: string): Promise<boolean> {
    if (!user.password) return false; // Discord users don't have passwords
    return await bcrypt.compare(plain, user.password);
  }

  // --- Email verification ---
  async generateEmailVerificationToken(userId: number): Promise<string> {
    const user = await this.findOne(userId);
    const token = randomBytes(32).toString('hex');
    user.emailVerificationToken = token;
    await this.repo.save(user);
    return token;
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.findByVerificationToken(token);
    if (!user) throw new BadRequestException('Invalid token');

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    await this.repo.save(user);
  }

  // --- Password reset ---
  async generatePasswordReset(email: string): Promise<string> {
    const user = await this.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    const token = randomBytes(32).toString('hex');
    user.passwordResetToken = token;

    // Set expiration to 1 hour from now
    const expiresDate = new Date();
    expiresDate.setHours(expiresDate.getHours() + 1);
    user.passwordResetExpires = expiresDate;

    await this.repo.save(user);
    return token;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.findByPasswordResetToken(token);
    if (
      !user ||
      !user.passwordResetExpires ||
      user.passwordResetExpires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired token');
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    await this.repo.save(user);
  }

  // --- Update user ---
  async update(id: number, data: Partial<User>): Promise<User> {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
    }
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async updateDiscordInfo(
    userId: number,
    data: {
      discordUsername: string;
      discordAvatar: string | null;
    },
  ): Promise<void> {
    await this.repo.update(userId, {
      discordUsername: data.discordUsername,
      discordAvatar: data.discordAvatar,
    });
  }

  async refreshDiscordAvatar(userId: number): Promise<User> {
    const user = await this.findOne(userId);

    if (!user.discordId) {
      throw new BadRequestException(
        'User does not have a Discord account linked',
      );
    }

    // Since we don't have a Discord Bot Token configured, and we don't store
    // user access tokens, we need to redirect the user to re-authenticate
    // via Discord OAuth to get fresh avatar data.
    throw new BadRequestException(
      'To refresh your Discord avatar, please log out and log back in with Discord. ' +
        'This will fetch your latest avatar from Discord.',
    );
  }

  async updateRole(userId: number, role: UserRole): Promise<void> {
    await this.repo.update(userId, { role });
  }

  // --- Refresh token helpers ---
  async setRefreshToken(userId: number, token: string): Promise<void> {
    const user = await this.findOne(userId);
    user.refreshToken = token;
    // SECURITY: Set expiration time for refresh token
    user.refreshTokenExpiresAt = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRATION_MS,
    );
    await this.repo.save(user);
  }

  async clearRefreshToken(userId: number): Promise<void> {
    const user = await this.findOne(userId);
    user.refreshToken = null;
    user.refreshTokenExpiresAt = null;
    await this.repo.save(user);
  }

  async verifyRefreshToken(userId: number, token: string): Promise<boolean> {
    const user = await this.findOne(userId);
    if (!user.refreshToken || user.refreshToken !== token) {
      return false;
    }
    // SECURITY: Check if refresh token has expired
    if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt < new Date()) {
      return false;
    }
    return true;
  }

  async findByRefreshToken(token: string): Promise<User | null> {
    if (!token) return null;
    // SECURITY: Only return user if refresh token exists AND hasn't expired
    return this.repo.findOne({
      where: {
        refreshToken: token,
        refreshTokenExpiresAt: MoreThan(new Date()),
      },
    });
  }

  // --- Profile customization methods ---
  async updateProfile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    const user = await this.findOne(userId);

    // Validate and update username if provided
    if (updateProfileDto.username !== undefined) {
      const existingUser = await this.findByUsername(updateProfileDto.username);
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Username already taken');
      }
      user.username = updateProfileDto.username;
    }

    // Validate favorite quote exists if provided
    if (updateProfileDto.favoriteQuoteId !== undefined) {
      if (updateProfileDto.favoriteQuoteId === null) {
        user.favoriteQuoteId = null;
      } else {
        const quote = await this.quoteRepo.findOne({
          where: { id: updateProfileDto.favoriteQuoteId },
        });
        if (!quote) {
          throw new NotFoundException(
            `Quote with id ${updateProfileDto.favoriteQuoteId} not found`,
          );
        }
        user.favoriteQuoteId = updateProfileDto.favoriteQuoteId;
      }
    }

    // Validate favorite gamble exists if provided
    if (updateProfileDto.favoriteGambleId !== undefined) {
      if (updateProfileDto.favoriteGambleId === null) {
        user.favoriteGambleId = null;
      } else {
        const gamble = await this.gambleRepo.findOne({
          where: { id: updateProfileDto.favoriteGambleId },
        });
        if (!gamble) {
          throw new NotFoundException(
            `Gamble with id ${updateProfileDto.favoriteGambleId} not found`,
          );
        }
        user.favoriteGambleId = updateProfileDto.favoriteGambleId;
      }
    }

    // Handle profile picture type and character media selection
    if (updateProfileDto.profilePictureType !== undefined) {
      user.profilePictureType = updateProfileDto.profilePictureType;

      // If switching to discord, clear character media selection
      if (updateProfileDto.profilePictureType === ProfilePictureType.DISCORD) {
        user.selectedCharacterMediaId = null;
      }
    }

    // Validate character media if provided
    if (updateProfileDto.selectedCharacterMediaId !== undefined) {
      if (updateProfileDto.selectedCharacterMediaId === null) {
        user.selectedCharacterMediaId = null;
        // If clearing character media, default back to discord
        if (user.profilePictureType === ProfilePictureType.CHARACTER_MEDIA) {
          user.profilePictureType = ProfilePictureType.DISCORD;
        }
      } else {
        const mediaRepo = this.repo.manager.getRepository(Media);
        const characterMedia = await mediaRepo.findOne({
          where: {
            id: updateProfileDto.selectedCharacterMediaId,
            purpose: MediaPurpose.ENTITY_DISPLAY,
            status: MediaStatus.APPROVED,
          },
          relations: ['submittedBy'],
        });

        if (!characterMedia) {
          throw new NotFoundException(
            `Character media with id ${updateProfileDto.selectedCharacterMediaId} not found, not approved, or not entity display media`,
          );
        }

        user.selectedCharacterMediaId =
          updateProfileDto.selectedCharacterMediaId;
        user.profilePictureType = ProfilePictureType.CHARACTER_MEDIA;
      }
    }

    await this.repo.save(user);
    return this.getUserProfile(userId);
  }

  async updateUserProgress(
    userId: number,
    userProgress: number,
  ): Promise<void> {
    const user = await this.findOne(userId);
    user.userProgress = userProgress;
    await this.repo.save(user);
  }

  /**
   * Get all submissions (guides, media, events, annotations) for a user
   */
  async getUserSubmissions(userId: number) {
    const guideRepo = this.repo.manager.getRepository(Guide);
    const mediaRepo = this.repo.manager.getRepository(Media);
    const eventRepo = this.repo.manager.getRepository('Event');
    const annotationRepo = this.repo.manager.getRepository('Annotation');

    // Limit to 3 concurrent queries to prevent connection pool exhaustion
    const limiter = createQueryLimiter(3);

    const [guides, media, events, annotations] = await Promise.all([
      limiter(() =>
        guideRepo.find({
          where: { authorId: userId },
          select: ['id', 'title', 'status', 'createdAt', 'rejectionReason'],
          order: { createdAt: 'DESC' },
        }),
      ),
      limiter(() =>
        mediaRepo.find({
          where: { submittedBy: { id: userId } },
          select: [
            'id',
            'fileName',
            'status',
            'createdAt',
            'description',
            'ownerType',
            'ownerId',
            'url',
          ],
          order: { createdAt: 'DESC' },
        }),
      ),
      limiter(() =>
        eventRepo.find({
          where: { createdBy: { id: userId } },
          select: [
            'id',
            'title',
            'status',
            'createdAt',
            'description',
            'arcId',
            'gambleId',
            'rejectionReason',
          ],
          order: { createdAt: 'DESC' },
        }),
      ),
      limiter(() =>
        annotationRepo.find({
          where: { author: { id: userId } },
          select: [
            'id',
            'title',
            'content',
            'status',
            'createdAt',
            'ownerType',
            'ownerId',
            'rejectionReason',
          ],
          order: { createdAt: 'DESC' },
        }),
      ),
    ]);

    // Fetch entity names for media items
    const mediaWithEntityNames = await Promise.all(
      media.map(async (m) => {
        let entityName = 'Unknown';
        try {
          if (m.ownerType && m.ownerId) {
            const repoMap = {
              character: this.repo.manager.getRepository('Character'),
              arc: this.repo.manager.getRepository('Arc'),
              event: this.repo.manager.getRepository('Event'),
              gamble: this.repo.manager.getRepository('Gamble'),
              organization: this.repo.manager.getRepository('Organization'),
              guide: this.repo.manager.getRepository(Guide),
              user: this.repo.manager.getRepository('User'),
              volume: this.repo.manager.getRepository('Volume'),
            };
            const repo = repoMap[m.ownerType];
            if (repo) {
              const entity: any = await repo.findOne({
                where: { id: m.ownerId },
              });
              if (entity) {
                entityName =
                  entity.name || entity.title || entity.username || 'Unknown';
              }
            }
          }
        } catch (error) {
          console.error(
            `Failed to fetch entity name for media ${m.id}:`,
            error,
          );
        }
        return { ...m, entityName };
      }),
    );

    const submissions = [
      ...guides.map((g) => ({
        id: g.id,
        type: 'guide' as const,
        title: g.title,
        status: g.status,
        createdAt: g.createdAt,
        rejectionReason: g.rejectionReason,
      })),
      ...mediaWithEntityNames.map((m) => ({
        id: m.id,
        type: 'media' as const,
        title: m.entityName,
        status: m.status,
        createdAt: m.createdAt,
        description: m.description,
        ownerType: m.ownerType,
        ownerId: m.ownerId,
        url: m.url,
        entityName: m.entityName,
      })),
      ...events.map((e: any) => ({
        id: e.id,
        type: 'event' as const,
        title: e.title,
        status: e.status,
        createdAt: e.createdAt,
        description: e.description,
        ownerType: e.gambleId ? 'gamble' : e.arcId ? 'arc' : null,
        ownerId: e.gambleId || e.arcId || null,
        rejectionReason: e.rejectionReason,
      })),
      ...annotations.map((a: any) => ({
        id: a.id,
        type: 'annotation' as const,
        title: a.title || a.content?.substring(0, 100) || 'Annotation',
        status: a.status,
        createdAt: a.createdAt,
        ownerType: a.ownerType,
        ownerId: a.ownerId,
        rejectionReason: a.rejectionReason,
      })),
    ];

    // Sort all by createdAt descending
    submissions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return submissions;
  }

  /**
   * Get approved submissions for public viewing
   */
  async getPublicUserSubmissions(userId: number) {
    const allSubmissions = await this.getUserSubmissions(userId);
    return allSubmissions.filter((s) => s.status === 'approved');
  }

  async getUserProfile(userId: number): Promise<User> {
    const user = await this.repo.findOne({
      where: { id: userId },
      relations: [
        'favoriteQuote',
        'favoriteQuote.character',
        'favoriteGamble',
        'selectedCharacterMedia',
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    // If user has selected character media, fetch the character information
    if (
      user.selectedCharacterMedia &&
      user.selectedCharacterMedia.ownerType === 'character'
    ) {
      const characterRepo = this.repo.manager.getRepository(Character);
      const character = await characterRepo.findOne({
        where: { id: user.selectedCharacterMedia.ownerId },
      });

      if (character) {
        // Add character information to the media object
        (user.selectedCharacterMedia as any).character = {
          id: character.id,
          name: character.name,
        };
      }
    }

    return user;
  }

  async getQuotePopularityStats(): Promise<
    Array<{ quote: Quote; userCount: number }>
  > {
    const stats = await this.repo
      .createQueryBuilder('user')
      .select('user.favoriteQuoteId', 'quoteId')
      .addSelect('COUNT(*)', 'usercount')
      .where('user.favoriteQuoteId IS NOT NULL')
      .groupBy('user.favoriteQuoteId')
      .orderBy('usercount', 'DESC')
      .getRawMany();

    const result: Array<{ quote: Quote; userCount: number }> = [];

    for (const stat of stats) {
      const quote = await this.quoteRepo.findOne({
        where: { id: stat.quoteId },
        relations: ['character'],
      });

      if (quote) {
        result.push({
          quote,
          userCount: parseInt(stat.usercount),
        });
      }
    }

    return result;
  }

  async getGamblePopularityStats(): Promise<
    Array<{ gamble: Gamble; userCount: number }>
  > {
    const stats = await this.repo
      .createQueryBuilder('user')
      .select('user.favoriteGambleId', 'gambleId')
      .addSelect('COUNT(*)', 'usercount')
      .where('user.favoriteGambleId IS NOT NULL')
      .groupBy('user.favoriteGambleId')
      .orderBy('usercount', 'DESC')
      .getRawMany();

    const result: Array<{ gamble: Gamble; userCount: number }> = [];

    for (const stat of stats) {
      const gamble = await this.gambleRepo.findOne({
        where: { id: stat.gambleId },
      });

      if (gamble) {
        result.push({
          gamble,
          userCount: parseInt(stat.usercount),
        });
      }
    }

    return result;
  }

  async getCharacterMediaPopularityStats(): Promise<
    Array<{ media: any; userCount: number }>
  > {
    const stats = await this.repo
      .createQueryBuilder('user')
      .select('user.selectedCharacterMediaId', 'mediaId')
      .addSelect('COUNT(*)', 'usercount')
      .where('user.selectedCharacterMediaId IS NOT NULL')
      .andWhere('user.profilePictureType = :type', {
        type: ProfilePictureType.CHARACTER_MEDIA,
      })
      .groupBy('user.selectedCharacterMediaId')
      .orderBy('usercount', 'DESC')
      .getRawMany();

    const result: Array<{ media: any; userCount: number }> = [];
    const mediaRepo = this.repo.manager.getRepository(Media);

    for (const stat of stats) {
      const media = await mediaRepo.findOne({
        where: { id: stat.mediaId },
        relations: ['submittedBy'],
      });

      if (media && media.ownerType === 'character') {
        // Get character info for the media
        const characterRepo = this.repo.manager.getRepository(Character);
        const character = await characterRepo.findOne({
          where: { id: media.ownerId },
        });

        if (character) {
          result.push({
            media: {
              id: media.id,
              url: media.url,
              fileName: media.fileName,
              description: media.description,
              ownerType: media.ownerType,
              ownerId: media.ownerId,
              chapterNumber: media.chapterNumber,
              character: {
                id: character.id,
                name: character.name,
              },
              submittedBy: media.submittedBy
                ? {
                    id: media.submittedBy.id,
                    username: media.submittedBy.username,
                  }
                : null,
            },
            userCount: parseInt(stat.usercount),
          });
        }
      }
    }

    return result;
  }

  async getProfileCustomizationStats(): Promise<{
    totalUsersWithCustomization: {
      favoriteQuote: number;
      favoriteGamble: number;
      characterMedia: number;
    };
  }> {
    // Get total counts for each customization type
    const totalWithFavoriteQuote = await this.repo
      .createQueryBuilder('user')
      .where('user.favoriteQuoteId IS NOT NULL')
      .getCount();

    const totalWithFavoriteGamble = await this.repo
      .createQueryBuilder('user')
      .where('user.favoriteGambleId IS NOT NULL')
      .getCount();

    const totalWithCharacterMedia = await this.repo
      .createQueryBuilder('user')
      .where('user.selectedCharacterMediaId IS NOT NULL')
      .getCount();

    return {
      totalUsersWithCustomization: {
        favoriteQuote: totalWithFavoriteQuote,
        favoriteGamble: totalWithFavoriteGamble,
        characterMedia: totalWithCharacterMedia,
      },
    };
  }

  async updateCustomRole(
    userId: number,
    customRole: string | null,
  ): Promise<User> {
    const user = await this.findOne(userId);
    user.customRole = customRole;
    return this.repo.save(user);
  }

  // --- Delete user ---
  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    // findOne already throws NotFoundException if user not found
    await this.repo.remove(user);
  }
}
