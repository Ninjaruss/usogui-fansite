import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../entities/user.entity';
import { Quote } from '../../entities/quote.entity';
import { Gamble } from '../../entities/gamble.entity';
import { ProfileImage } from '../../entities/profile-image.entity';
import { Media, MediaStatus } from '../../entities/media.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
    @InjectRepository(Quote) private readonly quoteRepo: Repository<Quote>,
    @InjectRepository(Gamble) private readonly gambleRepo: Repository<Gamble>,
    @InjectRepository(ProfileImage) private readonly profileImageRepo: Repository<ProfileImage>,
  ) {}

  // --- Find methods ---
  async findAll(filters: { page?: number; limit?: number } = {}): Promise<{ data: User[]; total: number; page: number; totalPages: number }> {
    const { page = 1, limit = 1000 } = filters;
    const skip = (page - 1) * limit;
    const [data, total] = await this.repo.createQueryBuilder('user').skip(skip).take(limit).getManyAndCount();
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { data, total, page, totalPages };
  }

  async findOne(id: number): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });
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

    const totalUsers = stats.reduce((acc, curr) => acc + parseInt(curr.count), 0);
    const verifiedUsers = await this.repo.count({ where: { isEmailVerified: true } });

    return {
      totalUsers,
      verifiedUsers,
      roleDistribution: stats,
      registrationsByMonth: await this.getRegistrationsByMonth()
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
        createdAt: user.createdAt
      },
      mediaActivity: {
        total: mediaStats.reduce((acc, curr) => acc + parseInt(curr.count), 0),
        byStatus: mediaStats
      }
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
  async create(data: { username: string; email: string; password: string }): Promise<User> {
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

  // --- Validate password ---
  async validatePassword(user: User, plain: string): Promise<boolean> {
    return bcrypt.compare(plain, user.password);
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
    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
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

  // --- Refresh token helpers ---
  async setRefreshToken(userId: number, token: string): Promise<void> {
    const user = await this.findOne(userId);
    user.refreshToken = token;
    await this.repo.save(user);
  }

  async clearRefreshToken(userId: number): Promise<void> {
    const user = await this.findOne(userId);
    user.refreshToken = null;
    await this.repo.save(user);
  }

  async verifyRefreshToken(userId: number, token: string): Promise<boolean> {
    const user = await this.findOne(userId);
    return !!(user.refreshToken && user.refreshToken === token);
  }

  async findByRefreshToken(token: string): Promise<User | null> {
    if (!token) return null;
    return this.repo.findOne({ where: { refreshToken: token } });
  }

  // --- Profile customization methods ---
  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto): Promise<User> {
    const user = await this.findOne(userId);

    // Validate and update profile image if provided
    if (updateProfileDto.profileImageId !== undefined) {
      if (updateProfileDto.profileImageId === null) {
        user.profileImageId = null;
      } else {
        const profileImage = await this.profileImageRepo.findOne({ 
          where: { id: updateProfileDto.profileImageId, isActive: true } 
        });
        if (!profileImage) {
          throw new NotFoundException(`Profile image with id ${updateProfileDto.profileImageId} not found or is inactive`);
        }
        user.profileImageId = updateProfileDto.profileImageId;
      }
    }

    // Validate favorite quote exists if provided
    if (updateProfileDto.favoriteQuoteId !== undefined) {
      if (updateProfileDto.favoriteQuoteId === null) {
        user.favoriteQuoteId = null;
      } else {
        const quote = await this.quoteRepo.findOne({ where: { id: updateProfileDto.favoriteQuoteId } });
        if (!quote) {
          throw new NotFoundException(`Quote with id ${updateProfileDto.favoriteQuoteId} not found`);
        }
        user.favoriteQuoteId = updateProfileDto.favoriteQuoteId;
      }
    }

    // Validate favorite gamble exists if provided
    if (updateProfileDto.favoriteGambleId !== undefined) {
      if (updateProfileDto.favoriteGambleId === null) {
        user.favoriteGambleId = null;
      } else {
        const gamble = await this.gambleRepo.findOne({ where: { id: updateProfileDto.favoriteGambleId } });
        if (!gamble) {
          throw new NotFoundException(`Gamble with id ${updateProfileDto.favoriteGambleId} not found`);
        }
        user.favoriteGambleId = updateProfileDto.favoriteGambleId;
      }
    }

    await this.repo.save(user);
    return this.getUserProfile(userId);
  }

  async updateUserProgress(userId: number, userProgress: number): Promise<void> {
    const user = await this.findOne(userId);
    user.userProgress = userProgress;
    await this.repo.save(user);
  }

  async getUserProfile(userId: number): Promise<User> {
    const user = await this.repo.findOne({
      where: { id: userId },
      relations: [
        'profileImage', 
        'profileImage.character',
        'favoriteQuote', 
        'favoriteQuote.character', 
        'favoriteQuote.series', 
        'favoriteGamble', 
        'favoriteGamble.chapter'
      ]
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    return user;
  }

  async getAvailableProfileImages(): Promise<ProfileImage[]> {
    return this.profileImageRepo.find({
      where: { isActive: true },
      relations: ['character'],
      order: { 
        characterId: 'ASC', 
        sortOrder: 'ASC',
        displayName: 'ASC'
      }
    });
  }

  async getQuotePopularityStats(): Promise<Array<{ quote: Quote; userCount: number }>> {
    const stats = await this.repo
      .createQueryBuilder('user')
      .select('user.favoriteQuoteId', 'quoteId')
      .addSelect('COUNT(*)', 'userCount')
      .where('user.favoriteQuoteId IS NOT NULL')
      .groupBy('user.favoriteQuoteId')
      .orderBy('userCount', 'DESC')
      .getRawMany();

    const result: Array<{ quote: Quote; userCount: number }> = [];

    for (const stat of stats) {
      const quote = await this.quoteRepo.findOne({
        where: { id: stat.quoteId },
        relations: ['character', 'series']
      });
      
      if (quote) {
        result.push({
          quote,
          userCount: parseInt(stat.userCount)
        });
      }
    }

    return result;
  }

  async getGamblePopularityStats(): Promise<Array<{ gamble: Gamble; userCount: number }>> {
    const stats = await this.repo
      .createQueryBuilder('user')
      .select('user.favoriteGambleId', 'gambleId')
      .addSelect('COUNT(*)', 'userCount')
      .where('user.favoriteGambleId IS NOT NULL')
      .groupBy('user.favoriteGambleId')
      .orderBy('userCount', 'DESC')
      .getRawMany();

    const result: Array<{ gamble: Gamble; userCount: number }> = [];

    for (const stat of stats) {
      const gamble = await this.gambleRepo.findOne({
        where: { id: stat.gambleId },
        relations: ['chapter']
      });
      
      if (gamble) {
        result.push({
          gamble,
          userCount: parseInt(stat.userCount)
        });
      }
    }

    return result;
  }

  async getProfileCustomizationStats(): Promise<{
    profileImageStats: Array<{ profileImage: ProfileImage; userCount: number }>;
    totalUsersWithCustomization: {
      profileImage: number;
      favoriteQuote: number;
      favoriteGamble: number;
    };
  }> {
    // Get profile image popularity
    const profileImageStats = await this.repo
      .createQueryBuilder('user')
      .select('user.profileImageId', 'profileImageId')
      .addSelect('COUNT(*)', 'userCount')
      .where('user.profileImageId IS NOT NULL')
      .groupBy('user.profileImageId')
      .orderBy('userCount', 'DESC')
      .getRawMany();

    const imageStatsWithDetails: Array<{ profileImage: ProfileImage; userCount: number }> = [];

    for (const stat of profileImageStats) {
      const profileImage = await this.profileImageRepo.findOne({
        where: { id: stat.profileImageId },
        relations: ['character']
      });
      
      if (profileImage) {
        imageStatsWithDetails.push({
          profileImage,
          userCount: parseInt(stat.userCount)
        });
      }
    }

    // Get total counts for each customization type
    const totalWithProfileImage = await this.repo
      .createQueryBuilder('user')
      .where('user.profileImageId IS NOT NULL')
      .getCount();
      
    const totalWithFavoriteQuote = await this.repo
      .createQueryBuilder('user')
      .where('user.favoriteQuoteId IS NOT NULL')
      .getCount();
      
    const totalWithFavoriteGamble = await this.repo
      .createQueryBuilder('user')
      .where('user.favoriteGambleId IS NOT NULL')
      .getCount();

    return {
      profileImageStats: imageStatsWithDetails,
      totalUsersWithCustomization: {
        profileImage: totalWithProfileImage,
        favoriteQuote: totalWithFavoriteQuote,
        favoriteGamble: totalWithFavoriteGamble
      }
    };
  }

  // --- Delete user ---
  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    // findOne already throws NotFoundException if user not found
    await this.repo.remove(user);
  }
}
