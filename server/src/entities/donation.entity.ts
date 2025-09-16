import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from './user.entity';

export enum DonationStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum DonationProvider {
  KOFI = 'kofi',
  MANUAL = 'manual', // For manually recorded donations by admins
}

@Entity()
@Index(['userId'])
@Index(['donationDate'])
@Index(['provider', 'externalId'], { unique: true })
@Index(['status'])
export class Donation {
  @ApiProperty({ description: 'Unique identifier of the donation' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'ID of the user who made the donation',
    example: 1,
  })
  @Column({ type: 'int', nullable: true })
  userId: number | null;

  @ApiProperty({
    description: 'Donation amount in USD',
    example: 25.0,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
  })
  @Column({ type: 'varchar', default: 'USD' })
  currency: string;

  @ApiProperty({
    description: 'Date when the donation was made',
  })
  @Column({ type: 'timestamp' })
  donationDate: Date;

  @ApiProperty({
    description: 'Donation provider',
    enum: DonationProvider,
    example: DonationProvider.KOFI,
  })
  @Column({ type: 'enum', enum: DonationProvider })
  provider: DonationProvider;

  @ApiProperty({
    description: 'External ID from the donation provider',
    example: 'kofi_abc123def456',
  })
  @Column({ type: 'varchar' })
  externalId: string;

  @ApiProperty({
    description: 'Status of the donation',
    enum: DonationStatus,
    example: DonationStatus.COMPLETED,
  })
  @Column({
    type: 'enum',
    enum: DonationStatus,
    default: DonationStatus.PENDING,
  })
  status: DonationStatus;

  @ApiPropertyOptional({
    description: 'Message from the donor',
    example: 'Love the fansite! Keep up the great work!',
  })
  @Column({ type: 'text', nullable: true })
  message: string | null;

  @ApiPropertyOptional({
    description: 'Donor name (if different from username)',
    example: 'Anonymous Supporter',
  })
  @Column({ type: 'varchar', nullable: true })
  donorName: string | null;

  @ApiPropertyOptional({
    description: 'Donor email from the payment provider',
    example: 'supporter@example.com',
  })
  @Column({ type: 'varchar', nullable: true })
  donorEmail: string | null;

  @ApiPropertyOptional({
    description: 'Whether the donor wants to remain anonymous',
    default: false,
  })
  @Column({ type: 'boolean', default: false })
  isAnonymous: boolean;

  @ApiPropertyOptional({
    description: 'Raw webhook data from the provider (JSON)',
  })
  @Column({ type: 'json', nullable: true })
  webhookData: any;

  @ApiPropertyOptional({
    description: 'Whether badges have been processed for this donation',
    default: false,
  })
  @Column({ type: 'boolean', default: false })
  badgesProcessed: boolean;

  @ApiPropertyOptional({
    description: 'Notes from admin (for manual donations)',
  })
  @Column({ type: 'text', nullable: true })
  adminNotes: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
