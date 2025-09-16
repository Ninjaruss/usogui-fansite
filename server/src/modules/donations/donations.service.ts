import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import {
  Donation,
  DonationStatus,
  DonationProvider,
} from '../../entities/donation.entity';
import { User } from '../../entities/user.entity';
import { BadgesService } from '../badges/badges.service';
import { KofiWebhookDto } from '../badges/dto/kofi-webhook.dto';

@Injectable()
export class DonationsService {
  private readonly logger = new Logger(DonationsService.name);

  constructor(
    @InjectRepository(Donation)
    private readonly donationRepository: Repository<Donation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly badgesService: BadgesService,
    private readonly configService: ConfigService,
  ) {}

  async findAllDonations(): Promise<Donation[]> {
    return this.donationRepository.find({
      relations: ['user'],
      order: { donationDate: 'DESC' },
    });
  }

  async findUserDonations(userId: number): Promise<Donation[]> {
    return this.donationRepository.find({
      where: { userId },
      order: { donationDate: 'DESC' },
    });
  }

  async findDonationById(id: number): Promise<Donation> {
    const donation = await this.donationRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!donation) {
      throw new NotFoundException(`Donation with ID ${id} not found`);
    }

    return donation;
  }

  async processKofiWebhook(webhookData: KofiWebhookDto): Promise<any> {
    this.logger.log(
      `Processing Ko-fi webhook for message ID: ${webhookData.message_id}`,
    );

    try {
      // Verify webhook authenticity (Ko-fi provides verification_token)
      const isVerified = this.verifyKofiWebhook(webhookData);
      if (!isVerified) {
        this.logger.warn(
          `Invalid Ko-fi webhook verification for message ID: ${webhookData.message_id}`,
        );
        throw new BadRequestException('Invalid webhook verification');
      }

      // Check if this donation already exists
      const existingDonation = await this.donationRepository.findOne({
        where: {
          provider: DonationProvider.KOFI,
          externalId: webhookData.message_id,
        },
      });

      if (existingDonation) {
        this.logger.log(
          `Donation already processed for message ID: ${webhookData.message_id}`,
        );
        return {
          message: 'Donation already processed',
          donation: existingDonation,
        };
      }

      // Try to find user by Ko-fi email or name
      const user = await this.findUserByKofiData(webhookData);
      if (!user) {
        this.logger.warn(
          `User not found for Ko-fi donation from: ${webhookData.from_name} (${webhookData.email})`,
        );
        // Create a pending donation that admin can assign later
        const pendingDonation = await this.createPendingDonation(webhookData);
        return {
          message:
            'Donation recorded but user not found. Admin action required.',
          donation: pendingDonation,
        };
      }

      this.logger.log(
        `Found user ${user.username} for Ko-fi donation from: ${webhookData.from_name}`,
      );

      // Create and save the donation
      const donation = await this.createDonation(user.id, webhookData);

      // Process badges automatically
      if (donation.status === DonationStatus.COMPLETED) {
        this.logger.log(
          `Processing badges for donation ID: ${donation.id}, User: ${user.username}, Amount: $${donation.amount}`,
        );
        const badges =
          await this.badgesService.processAutomaticBadges(donation);

        // Mark badges as processed
        donation.badgesProcessed = true;
        await this.donationRepository.save(donation);

        this.logger.log(
          `Successfully awarded ${badges.length} badges: ${badges.map((b) => b.badge?.name).join(', ')}`,
        );

        return {
          message: 'Donation processed and badges awarded',
          donation,
          badges: badges.map((b) => b.badge?.name),
        };
      }

      return { message: 'Donation recorded', donation };
    } catch (error) {
      this.logger.error(
        `Failed to process Ko-fi webhook: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to process Ko-fi webhook: ${error.message}`,
      );
    }
  }

  private verifyKofiWebhook(webhookData: KofiWebhookDto): boolean {
    // Enhanced Ko-fi webhook verification
    // Basic validation - in production, you should also verify Ko-fi's signature if available
    const hasRequiredFields = !!(
      webhookData.verification_token &&
      webhookData.message_id &&
      webhookData.from_name &&
      webhookData.amount > 0 &&
      webhookData.currency &&
      webhookData.timestamp
    );

    if (!hasRequiredFields) {
      this.logger.warn('Ko-fi webhook missing required fields', {
        hasToken: !!webhookData.verification_token,
        hasMessageId: !!webhookData.message_id,
        hasFromName: !!webhookData.from_name,
        hasAmount: webhookData.amount > 0,
        hasCurrency: !!webhookData.currency,
        hasTimestamp: !!webhookData.timestamp,
      });
      return false;
    }

    // Verify webhook token matches environment configuration
    const expectedToken = this.configService.get<string>('KOFI_WEBHOOK_TOKEN');
    if (expectedToken && webhookData.verification_token !== expectedToken) {
      this.logger.warn('Ko-fi webhook verification token mismatch');
      return false;
    }

    // Validate amount is reasonable (between $1 and $10,000)
    if (webhookData.amount < 1 || webhookData.amount > 10000) {
      this.logger.warn(
        `Ko-fi webhook has suspicious amount: $${webhookData.amount}`,
      );
      return false;
    }

    // Validate timestamp is recent (within last hour)
    const webhookTime = new Date(webhookData.timestamp);
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    if (webhookTime < oneHourAgo || webhookTime > now) {
      this.logger.warn(
        `Ko-fi webhook has suspicious timestamp: ${webhookData.timestamp}`,
      );
      return false;
    }

    // TODO: In production, verify Ko-fi signature using their webhook secret
    // This would involve checking a signature header against the request body

    return true;
  }

  private async findUserByKofiData(
    webhookData: KofiWebhookDto,
  ): Promise<User | null> {
    this.logger.debug(
      `Attempting to find user for Ko-fi donation from: ${webhookData.from_name}, email: ${webhookData.email}`,
    );

    // Try to find user by email first
    if (webhookData.email) {
      const userByEmail = await this.userRepository.findOne({
        where: { email: webhookData.email },
      });
      if (userByEmail) {
        this.logger.debug(`Found user by email: ${userByEmail.username}`);
        return userByEmail;
      }
    }

    // Try to find by username (Ko-fi from_name might match Discord username)
    const userByName = await this.userRepository.findOne({
      where: { username: webhookData.from_name },
    });
    if (userByName) {
      this.logger.debug(`Found user by username: ${userByName.username}`);
      return userByName;
    }

    // Try to find by Discord username
    const userByDiscordName = await this.userRepository.findOne({
      where: { discordUsername: webhookData.from_name },
    });
    if (userByDiscordName) {
      this.logger.debug(
        `Found user by Discord username: ${userByDiscordName.username}`,
      );
      return userByDiscordName;
    }

    this.logger.debug('No user found for Ko-fi donation');
    return null;
  }

  private async createDonation(
    userId: number,
    webhookData: KofiWebhookDto,
  ): Promise<Donation> {
    const donation = this.donationRepository.create({
      userId,
      amount: webhookData.amount,
      currency: webhookData.currency,
      donationDate: new Date(webhookData.timestamp),
      provider: DonationProvider.KOFI,
      externalId: webhookData.message_id,
      status:
        webhookData.type === 'Donation'
          ? DonationStatus.COMPLETED
          : DonationStatus.PENDING,
      message: webhookData.message,
      donorName: webhookData.from_name,
      donorEmail: webhookData.email,
      isAnonymous: webhookData.is_public === 'false',
      webhookData: webhookData,
    });

    return this.donationRepository.save(donation);
  }

  private async createPendingDonation(
    webhookData: KofiWebhookDto,
  ): Promise<Donation> {
    const donation = this.donationRepository.create({
      userId: null, // Will be assigned by admin later
      amount: webhookData.amount,
      currency: webhookData.currency,
      donationDate: new Date(webhookData.timestamp),
      provider: DonationProvider.KOFI,
      externalId: webhookData.message_id,
      status: DonationStatus.PENDING,
      message: webhookData.message,
      donorName: webhookData.from_name,
      donorEmail: webhookData.email,
      isAnonymous: webhookData.is_public === 'false',
      webhookData: webhookData,
      adminNotes: 'User not found automatically - requires manual assignment',
    });

    return this.donationRepository.save(donation);
  }

  async assignDonationToUser(
    donationId: number,
    userId: number,
  ): Promise<Donation> {
    this.logger.log(`Admin assigning donation ${donationId} to user ${userId}`);

    const donation = await this.findDonationById(donationId);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    donation.userId = userId;
    donation.status = DonationStatus.COMPLETED;
    const savedDonation = await this.donationRepository.save(donation);

    // Process badges if not already done
    if (!donation.badgesProcessed) {
      this.logger.log(
        `Processing badges for manually assigned donation ${donationId}`,
      );
      await this.badgesService.processAutomaticBadges(savedDonation);
      savedDonation.badgesProcessed = true;
      await this.donationRepository.save(savedDonation);
    }

    this.logger.log(
      `Successfully assigned donation ${donationId} to user ${user.username}`,
    );
    return savedDonation;
  }

  async getUserTotalDonations(userId: number): Promise<number> {
    const result = await this.donationRepository
      .createQueryBuilder('donation')
      .select('SUM(donation.amount)', 'total')
      .where('donation.userId = :userId', { userId })
      .andWhere('donation.status = :status', {
        status: DonationStatus.COMPLETED,
      })
      .getRawOne();

    return parseFloat(result.total) || 0;
  }

  async getTopDonors(limit: number = 10): Promise<any[]> {
    return this.donationRepository
      .createQueryBuilder('donation')
      .select([
        'donation.userId',
        'user.username',
        'user.discordAvatar',
        'SUM(donation.amount) as totalAmount',
        'COUNT(donation.id) as donationCount',
      ])
      .leftJoin('donation.user', 'user')
      .where('donation.status = :status', { status: DonationStatus.COMPLETED })
      .andWhere('donation.isAnonymous = :isAnonymous', { isAnonymous: false })
      .groupBy('donation.userId, user.username, user.discordAvatar')
      .orderBy('totalAmount', 'DESC')
      .limit(limit)
      .getRawMany();
  }
}
