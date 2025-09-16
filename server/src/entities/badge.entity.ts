import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserBadge } from './user-badge.entity';

export enum BadgeType {
  SUPPORTER = 'supporter',
  ACTIVE_SUPPORTER = 'active_supporter',
  SPONSOR = 'sponsor',
  CUSTOM = 'custom',
}

@Entity()
export class Badge {
  @ApiProperty({ description: 'Unique identifier of the badge' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Badge name',
    example: 'Supporter',
  })
  @Column({ type: 'varchar', unique: true })
  name: string;

  @ApiPropertyOptional({
    description: 'Badge description',
    example: 'Awarded to supporters who have made a donation',
  })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({
    description: 'Badge type',
    enum: BadgeType,
    example: BadgeType.SUPPORTER,
  })
  @Column({ type: 'enum', enum: BadgeType })
  type: BadgeType;

  @ApiProperty({
    description: 'Badge icon (emoji or image path)',
    example: '💎',
  })
  @Column({ type: 'varchar' })
  icon: string;

  @ApiProperty({
    description: 'Badge color (hex code)',
    example: '#FFD700',
  })
  @Column({ type: 'varchar' })
  color: string;

  @ApiPropertyOptional({
    description: 'Badge background color (hex code)',
    example: '#1A1A1A',
  })
  @Column({ type: 'varchar', nullable: true })
  backgroundColor: string | null;

  @ApiProperty({
    description: 'Display order/priority of the badge',
    example: 1,
  })
  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  @ApiProperty({
    description: 'Whether the badge is currently active/available',
    default: true,
  })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Whether the badge can be manually awarded by admins',
    default: false,
  })
  @Column({ type: 'boolean', default: false })
  isManuallyAwardable: boolean;

  @OneToMany(() => UserBadge, (userBadge) => userBadge.badge)
  userBadges: UserBadge[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
