import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull } from 'typeorm';
import { Badge, BadgeType } from '../../entities/badge.entity';
import { UserBadge } from '../../entities/user-badge.entity';
import { User } from '../../entities/user.entity';
import { Donation, DonationStatus } from '../../entities/donation.entity';

@Injectable()
export class BadgesService {
  private readonly logger = new Logger(BadgesService.name);

  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,
    @InjectRepository(UserBadge)
    private readonly userBadgeRepository: Repository<UserBadge>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Donation)
    private readonly donationRepository: Repository<Donation>,
  ) {}

  async findAllBadges(): Promise<Badge[]> {
    return this.badgeRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', name: 'ASC' },
    });
  }

  async findBadgeById(id: number): Promise<Badge> {
    const badge = await this.badgeRepository.findOne({ where: { id } });
    if (!badge) {
      throw new NotFoundException(`Badge with ID ${id} not found`);
    }
    return badge;
  }

  async getUserBadges(userId: number): Promise<UserBadge[]> {
    return this.userBadgeRepository.find({
      where: { userId, isActive: true },
      relations: ['badge'],
      order: { badge: { displayOrder: 'ASC' }, awardedAt: 'DESC' },
    });
  }

  async getUserActiveBadges(userId: number): Promise<UserBadge[]> {
    const now = new Date();
    return this.userBadgeRepository.find({
      where: [
        { userId, isActive: true, expiresAt: IsNull() },
        { userId, isActive: true, expiresAt: MoreThan(now) },
      ],
      relations: ['badge'],
      order: { badge: { displayOrder: 'ASC' }, awardedAt: 'DESC' },
    });
  }

  async getAllUserBadges(userId: number): Promise<UserBadge[]> {
    return this.userBadgeRepository.find({
      where: { userId },
      relations: ['badge', 'revokedBy'],
      order: { badge: { displayOrder: 'ASC' }, awardedAt: 'DESC' },
    });
  }

  async awardBadge(
    userId: number,
    badgeId: number,
    reason?: string,
    awardedByUserId?: number,
    metadata?: any,
    year?: number,
    expiresAt?: string | Date,
  ): Promise<UserBadge> {
    this.logger.log(`Awarding badge ${badgeId} to user ${userId}. Reason: ${reason || 'Not specified'}`);
    
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const badge = await this.findBadgeById(badgeId);

    // Check if user already has this badge (for badges that can't be duplicated)
    const existingBadge = await this.userBadgeRepository.findOne({
      where: { userId, badgeId, isActive: true },
    });

    if (existingBadge && badge.type !== BadgeType.SUPPORTER && badge.type !== BadgeType.ACTIVE_SUPPORTER) {
      this.logger.warn(`User ${userId} already has active badge ${badgeId} (${badge.name})`);
      throw new BadRequestException('User already has this active badge');
    }

    // For supporter badges, check if they already have one for this year
    if (badge.type === BadgeType.SUPPORTER && year) {
      const existingSupporterBadge = await this.userBadgeRepository.findOne({
        where: { userId, badgeId, year, isActive: true },
      });
      if (existingSupporterBadge) {
        this.logger.warn(`User ${userId} already has ${badge.name} badge for year ${year}`);
        throw new BadRequestException(`User already has this badge for year ${year}`);
      }
    }

    const currentYear = new Date().getFullYear();
    let finalExpiresAt: Date | null = null;

    // Handle expiration date
    if (badge.type === BadgeType.ACTIVE_SUPPORTER) {
      // Active Supporter badges MUST have 1 year expiration - override any provided expiration
      finalExpiresAt = new Date();
      finalExpiresAt.setFullYear(finalExpiresAt.getFullYear() + 1);
      
      // For Active Supporter badges, we need to delete the old record completely
      // because the unique constraint doesn't allow duplicate userId+badgeId combinations
      const existingActiveBadge = await this.userBadgeRepository.findOne({
        where: { userId, badgeId },
      });
      
      if (existingActiveBadge) {
        this.logger.log(`Removing existing Active Supporter badge for user ${userId} before awarding new one`);
        await this.userBadgeRepository.remove(existingActiveBadge);
      }
    } else if (expiresAt) {
      finalExpiresAt = new Date(expiresAt);
    }

    const userBadge = this.userBadgeRepository.create({
      userId,
      badgeId,
      year: year || (badge.type === BadgeType.SUPPORTER ? currentYear : null),
      reason,
      awardedByUserId,
      metadata,
      expiresAt: finalExpiresAt,
    });

    const savedBadge = await this.userBadgeRepository.save(userBadge);
    this.logger.log(`Successfully awarded badge ${badge.name} to user ${user.username} (${userId})`);
    
    return savedBadge;
  }

  async revokeBadge(userId: number, badgeId: number, reason?: string, revokedByUserId?: number): Promise<void> {
    const userBadge = await this.userBadgeRepository.findOne({
      where: { userId, badgeId, isActive: true },
    });

    if (!userBadge) {
      throw new NotFoundException('Active user badge not found');
    }

    // Mark as inactive and log removal details instead of deleting
    userBadge.isActive = false;
    userBadge.revokedAt = new Date();
    userBadge.revokedReason = reason || 'No reason provided';
    userBadge.revokedByUserId = revokedByUserId || null;

    await this.userBadgeRepository.save(userBadge);
  }

  async processAutomaticBadges(donation: Donation): Promise<UserBadge[]> {
    const awardedBadges: UserBadge[] = [];
    const userId = donation.userId;

    if (!userId) {
      throw new BadRequestException('Donation must have a valid userId to process badges');
    }

    // Award Supporter badge (permanent with year)
    await this.awardSupporterBadge(userId, donation, awardedBadges);

    // Award or renew Active Supporter badge (1 year expiration)
    await this.awardActiveSupporterBadge(userId, donation, awardedBadges);

    // Check for Sponsor badge (total donations >= $25)
    await this.checkSponsorBadge(userId, donation, awardedBadges);

    return awardedBadges;
  }

  private async awardSupporterBadge(
    userId: number,
    donation: Donation,
    awardedBadges: UserBadge[],
  ): Promise<void> {
    const supporterBadge = await this.badgeRepository.findOne({
      where: { type: BadgeType.SUPPORTER, isActive: true },
    });

    if (!supporterBadge) return;

    const year = donation.donationDate.getFullYear();
    const existingSupporterBadge = await this.userBadgeRepository.findOne({
      where: { userId, badgeId: supporterBadge.id, year },
    });

    if (!existingSupporterBadge) {
      const userBadge = await this.awardBadge(
        userId,
        supporterBadge.id,
        `Ko-fi donation of $${donation.amount}`,
        undefined,
        {
          donation_amount: donation.amount,
          donation_id: donation.externalId,
          donation_date: donation.donationDate,
        },
      );
      awardedBadges.push(userBadge);
    }
  }

  private async awardActiveSupporterBadge(
    userId: number,
    donation: Donation,
    awardedBadges: UserBadge[],
  ): Promise<void> {
    const activeSupporterBadge = await this.badgeRepository.findOne({
      where: { type: BadgeType.ACTIVE_SUPPORTER, isActive: true },
    });

    if (!activeSupporterBadge) return;

    // Let awardBadge handle the existing badge removal logic
    // This prevents duplicate removal logic and race conditions
    const userBadge = await this.awardBadge(
      userId,
      activeSupporterBadge.id,
      `Ko-fi donation of $${donation.amount} - Active for 1 year`,
      undefined,
      {
        donation_amount: donation.amount,
        donation_id: donation.externalId,
        donation_date: donation.donationDate,
      },
    );
    awardedBadges.push(userBadge);
  }

  private async checkSponsorBadge(
    userId: number,
    donation: Donation,
    awardedBadges: UserBadge[],
  ): Promise<void> {
    const sponsorBadge = await this.badgeRepository.findOne({
      where: { type: BadgeType.SPONSOR, isActive: true },
    });

    if (!sponsorBadge) return;

    // Check if user already has sponsor badge
    const existingSponsorBadge = await this.userBadgeRepository.findOne({
      where: { userId, badgeId: sponsorBadge.id },
    });

    if (existingSponsorBadge) return;

    // Calculate total donations
    const totalDonations = await this.donationRepository
      .createQueryBuilder('donation')
      .select('SUM(donation.amount)', 'total')
      .where('donation.userId = :userId', { userId })
      .andWhere('donation.status = :status', { status: DonationStatus.COMPLETED })
      .getRawOne();

    const total = parseFloat(totalDonations.total) || 0;

    if (total >= 25) {
      const userBadge = await this.awardBadge(
        userId,
        sponsorBadge.id,
        `Total donations of $${total.toFixed(2)}`,
        undefined,
        {
          total_donations: total,
          qualifying_donation_id: donation.externalId,
        },
      );
      awardedBadges.push(userBadge);
    }
  }

  async expireUserBadges(): Promise<number> {
    this.logger.log('Starting badge expiration check...');
    const now = new Date();
    const expiredBadges = await this.userBadgeRepository.find({
      where: {
        isActive: true,
        expiresAt: MoreThan(new Date('2000-01-01')), // Only badges with expiration dates
      },
      relations: ['badge', 'user'],
    });

    let expiredCount = 0;
    for (const userBadge of expiredBadges) {
      if (userBadge.expiresAt && userBadge.expiresAt <= now) {
        userBadge.isActive = false;
        await this.userBadgeRepository.save(userBadge);
        expiredCount++;

        this.logger.log(`Expired badge ${userBadge.badge?.name} for user ${userBadge.user?.username} (${userBadge.userId})`);

        // If it's an Active Supporter badge, clear custom role
        if (userBadge.badge?.type === BadgeType.ACTIVE_SUPPORTER) {
          const user = await this.userRepository.findOne({
            where: { id: userBadge.userId },
          });
          if (user && user.customRole) {
            user.customRole = null;
            await this.userRepository.save(user);
            this.logger.log(`Cleared custom role for user ${user.username} due to expired Active Supporter badge`);
          }
        }
      }
    }

    this.logger.log(`Badge expiration check completed. Expired ${expiredCount} badges.`);
    return expiredCount;
  }

  async hasActiveSupporterBadge(userId: number): Promise<boolean> {
    const now = new Date();
    const activeSupporterBadge = await this.badgeRepository.findOne({
      where: { type: BadgeType.ACTIVE_SUPPORTER, isActive: true },
    });

    if (!activeSupporterBadge) return false;

    const userBadge = await this.userBadgeRepository.findOne({
      where: [
        {
          userId,
          badgeId: activeSupporterBadge.id,
          isActive: true,
          expiresAt: IsNull(),
        },
        {
          userId,
          badgeId: activeSupporterBadge.id,
          isActive: true,
          expiresAt: MoreThan(now),
        },
      ],
    });

    return !!userBadge;
  }

  async getAllSupporters(): Promise<any[]> {
    return this.userBadgeRepository
      .createQueryBuilder('userBadge')
      .leftJoinAndSelect('userBadge.user', 'user')
      .leftJoinAndSelect('userBadge.badge', 'badge')
      .where('badge.type IN (:...types)', {
        types: [BadgeType.SUPPORTER, BadgeType.SPONSOR],
      })
      .andWhere('userBadge.isActive = :isActive', { isActive: true })
      .orderBy('userBadge.awardedAt', 'ASC')
      .getMany();
  }

  async getBadgeStatistics(): Promise<any> {
    this.logger.log('Generating badge statistics...');
    
    // Get total badges by type
    const badgeStats = await this.userBadgeRepository
      .createQueryBuilder('userBadge')
      .leftJoin('userBadge.badge', 'badge')
      .select('badge.type', 'type')
      .addSelect('COUNT(userBadge.id)', 'count')
      .addSelect('COUNT(CASE WHEN userBadge.isActive = true THEN 1 END)', 'activeCount')
      .where('userBadge.isActive = :isActive', { isActive: true })
      .groupBy('badge.type')
      .getRawMany();

    // Get badges expiring soon (next 7 days)
    const soonToExpire = await this.userBadgeRepository
      .createQueryBuilder('userBadge')
      .leftJoin('userBadge.badge', 'badge')
      .leftJoin('userBadge.user', 'user')
      .select('COUNT(userBadge.id)', 'count')
      .where('userBadge.isActive = :isActive', { isActive: true })
      .andWhere('userBadge.expiresAt BETWEEN :now AND :sevenDaysFromNow', {
        now: new Date(),
        sevenDaysFromNow: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      .getRawOne();

    // Get total donation amounts for supporters
    const donationStats = await this.donationRepository
      .createQueryBuilder('donation')
      .select('SUM(donation.amount)', 'totalAmount')
      .addSelect('COUNT(donation.id)', 'totalDonations')
      .addSelect('COUNT(DISTINCT donation.userId)', 'uniqueDonors')
      .where('donation.status = :status', { status: DonationStatus.COMPLETED })
      .getRawOne();

    const statistics = {
      badges: badgeStats,
      expiringIn7Days: parseInt(soonToExpire.count) || 0,
      donations: {
        totalAmount: parseFloat(donationStats.totalAmount) || 0,
        totalDonations: parseInt(donationStats.totalDonations) || 0,
        uniqueDonors: parseInt(donationStats.uniqueDonors) || 0,
      },
      generatedAt: new Date(),
    };

    this.logger.log('Badge statistics generated successfully');
    return statistics;
  }
}