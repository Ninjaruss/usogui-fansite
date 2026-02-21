import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Event } from './event.entity';
import { Quote } from './quote.entity';
import { Gamble } from './gamble.entity';
import { Media } from './media.entity';
import { UserBadge } from './user-badge.entity';
import { Donation } from './donation.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  EDITOR = 'editor',
}

export enum ProfilePictureType {
  DISCORD = 'discord',
  CHARACTER_MEDIA = 'character_media',
  PREMIUM_CHARACTER_MEDIA = 'premium_character_media',
  EXCLUSIVE_ARTWORK = 'exclusive_artwork',
  ANIMATED_AVATAR = 'animated_avatar',
  CUSTOM_FRAME = 'custom_frame',
  FLUXER = 'fluxer',
}

@Entity()
@Index(['discordId'])
@Index(['fluxerId'])
@Index(['emailVerificationToken']) // Keep for legacy data
@Index(['passwordResetToken']) // Keep for legacy data
export class User {
  @ApiProperty({ description: 'Unique identifier of the user' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Username (from Discord or custom)',
    example: 'usogui_fan',
  })
  @Column({ type: 'varchar', unique: true })
  username: string;

  @ApiProperty({
    description: "User's email address (optional for Discord users)",
    example: 'user@example.com',
  })
  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  // Discord-specific fields
  @ApiProperty({
    description: "User's Discord ID (primary identifier)",
    example: '123456789012345678',
  })
  @Column({ type: 'varchar', unique: true, nullable: true })
  discordId: string | null;

  @ApiProperty({
    description: "User's Discord username",
    example: 'usogui_fan#1234',
  })
  @Column({ type: 'varchar', nullable: true })
  discordUsername: string | null;

  @ApiProperty({
    description: "User's Discord avatar URL",
    example: 'https://cdn.discordapp.com/avatars/123456789012345678/avatar.png',
  })
  @Column({ type: 'varchar', nullable: true })
  discordAvatar: string | null;

  // Fluxer-specific fields
  @ApiProperty({
    description: "User's Fluxer ID (primary identifier)",
    example: '123456789012345678',
  })
  @Column({ type: 'varchar', unique: true, nullable: true })
  fluxerId: string | null;

  @ApiProperty({
    description: "User's Fluxer username",
    example: 'usogui_fan',
  })
  @Column({ type: 'varchar', nullable: true })
  fluxerUsername: string | null;

  @ApiProperty({
    description: "User's Fluxer avatar URL",
    example: 'https://cdn.fluxer.app/avatars/123456789012345678/avatar.png',
  })
  @Column({ type: 'varchar', nullable: true })
  fluxerAvatar: string | null;

  // Legacy auth fields (nullable for Discord-only users)
  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ type: 'varchar', nullable: true })
  emailVerificationToken: string | null;

  @Column({ type: 'varchar', nullable: true })
  password: string | null;

  @Column({ type: 'varchar', nullable: true })
  passwordResetToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetExpires: Date | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @ApiPropertyOptional({
    description: "User's reading progress (highest chapter number read)",
    example: 42,
    minimum: 0,
  })
  @Column({ type: 'int', default: 1 })
  userProgress: number;

  @ApiPropertyOptional({
    description: "ID of the user's favorite quote",
    example: 1,
  })
  @Column({ type: 'int', nullable: true })
  favoriteQuoteId: number | null;

  @ApiPropertyOptional({
    description: "ID of the user's favorite gamble",
    example: 1,
  })
  @Column({ type: 'int', nullable: true })
  favoriteGambleId: number | null;

  @ApiProperty({
    description: 'Type of profile picture the user has selected',
    enum: ProfilePictureType,
    default: ProfilePictureType.DISCORD,
    example: ProfilePictureType.DISCORD,
  })
  @Column({
    type: 'enum',
    enum: ProfilePictureType,
    default: ProfilePictureType.DISCORD,
  })
  profilePictureType: ProfilePictureType;

  @ApiPropertyOptional({
    description:
      'ID of the character media selected as profile picture (when type is CHARACTER_MEDIA)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', nullable: true })
  selectedCharacterMediaId: string | null;

  @ApiPropertyOptional({
    description:
      'Custom cosmetic role displayed alongside username (for active supporters)',
    example: 'Usogui Superfan',
  })
  @Column({ type: 'varchar', nullable: true, length: 50 })
  customRole: string | null;

  @ApiPropertyOptional({
    description: "User's favorite quote object",
    type: () => Quote,
  })
  @ManyToOne(() => Quote, { nullable: true })
  @JoinColumn({ name: 'favoriteQuoteId' })
  favoriteQuote: Quote | null;

  @ApiPropertyOptional({
    description: "User's favorite gamble object",
    type: () => Gamble,
  })
  @ManyToOne(() => Gamble, { nullable: true })
  @JoinColumn({ name: 'favoriteGambleId' })
  favoriteGamble: Gamble | null;

  @ApiPropertyOptional({
    description: "User's selected character media for profile picture",
    type: () => Media,
  })
  @ManyToOne(() => Media, { nullable: true })
  @JoinColumn({ name: 'selectedCharacterMediaId' })
  selectedCharacterMedia: Media | null;

  @OneToMany(() => Event, (event) => event.createdBy)
  submittedEvents: Event[];

  @OneToMany(() => UserBadge, (userBadge) => userBadge.user)
  badges: UserBadge[];

  // Computed property for frontend compatibility
  get userBadges(): UserBadge[] {
    return this.badges || [];
  }

  @OneToMany(() => Donation, (donation) => donation.user)
  donations: Donation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'varchar', nullable: true })
  refreshToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  refreshTokenExpiresAt: Date | null;
}
