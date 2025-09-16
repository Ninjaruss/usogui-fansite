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
import { Badge } from './badge.entity';

@Entity()
@Index(['userId', 'badgeId'], { unique: true })
@Index(['userId'])
@Index(['badgeId'])
@Index(['awardedAt'])
@Index(['expiresAt'])
export class UserBadge {
  @ApiProperty({ description: 'Unique identifier of the user badge' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'ID of the user who received the badge',
    example: 1,
  })
  @Column({ type: 'int' })
  userId: number;

  @ApiProperty({
    description: 'ID of the badge that was awarded',
    example: 1,
  })
  @Column({ type: 'int' })
  badgeId: number;

  @ApiProperty({
    description: 'Date when the badge was awarded',
  })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  awardedAt: Date;

  @ApiPropertyOptional({
    description: 'Date when the badge expires (null for permanent badges)',
  })
  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @ApiPropertyOptional({
    description: 'Year appended to the badge (e.g., for Supporter 2024)',
    example: 2024,
  })
  @Column({ type: 'int', nullable: true })
  year: number | null;

  @ApiPropertyOptional({
    description: 'Reason for awarding the badge',
    example: 'Ko-fi donation of $10',
  })
  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @ApiPropertyOptional({
    description: 'ID of the admin who manually awarded the badge',
    example: 1,
  })
  @Column({ type: 'int', nullable: true })
  awardedByUserId: number | null;

  @ApiPropertyOptional({
    description: 'Additional metadata (JSON)',
    example: '{"donation_amount": 25.00, "donation_id": "kofi_abc123"}',
  })
  @Column({ type: 'json', nullable: true })
  metadata: any;

  @ApiProperty({
    description: 'Whether the badge is currently active (not expired)',
    default: true,
  })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Date when the badge was revoked (null if not revoked)',
  })
  @Column({ type: 'timestamp', nullable: true })
  revokedAt: Date | null;

  @ApiPropertyOptional({
    description: 'Reason for revoking the badge',
    example: 'Policy violation',
  })
  @Column({ type: 'text', nullable: true })
  revokedReason: string | null;

  @ApiPropertyOptional({
    description: 'ID of the admin who revoked the badge',
    example: 1,
  })
  @Column({ type: 'int', nullable: true })
  revokedByUserId: number | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Badge)
  @JoinColumn({ name: 'badgeId' })
  badge: Badge;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'awardedByUserId' })
  awardedBy: User | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'revokedByUserId' })
  revokedBy: User | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
