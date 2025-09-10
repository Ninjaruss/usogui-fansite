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
import { ProfileImage } from './profile-image.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

@Entity()
@Index(['discordId'])
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
    description: "ID of the user's profile image",
    example: 'uuid-here',
  })
  @Column({ type: 'uuid', nullable: true })
  profileImageId: string | null;

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

  @ApiPropertyOptional({
    description: "User's profile image object",
    type: () => ProfileImage,
  })
  @ManyToOne(() => ProfileImage, (profileImage) => profileImage.users, {
    nullable: true,
  })
  @JoinColumn({ name: 'profileImageId' })
  profileImage: ProfileImage | null;

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

  @OneToMany(() => Event, (event) => event.createdBy)
  submittedEvents: Event[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'varchar', nullable: true })
  refreshToken: string | null;
}
