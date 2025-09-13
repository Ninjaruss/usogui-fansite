import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Character } from './character.entity';
import { User } from './user.entity';
import { Event } from './event.entity';
import { Arc } from './arc.entity';
import { Gamble } from './gamble.entity';
import {
  ApiProperty,
  ApiPropertyOptional,
  ApiHideProperty,
} from '@nestjs/swagger';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
}

export enum MediaStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
export enum MediaPurpose {
  GALLERY = 'gallery', // User-uploaded media for galleries
  ENTITY_DISPLAY = 'entity_display', // Official images for entity pages
}

export enum MediaOwnerType {
  CHARACTER = 'character',
  ARC = 'arc',
  EVENT = 'event',
  GAMBLE = 'gamble',
  FACTION = 'faction',
  USER = 'user',
  VOLUME = 'volume',
}

@Entity()
@Index(['url'], { unique: false }) // Remove unique constraint as we'll have both URLs and filenames
@Index(['submittedBy'])
@Index(['ownerType', 'ownerId'])
@Index(['ownerType', 'ownerId', 'chapterNumber'])
@Index(['purpose'])
export class Media {
  @ApiProperty({ description: 'Unique identifier of the media' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiPropertyOptional({
    description:
      'URL of the media content. For external submissions: Videos must be from YouTube, images must be from DeviantArt, Pixiv, Twitter, or Instagram. For uploads: this will be the full URL to the uploaded file.',
    example: 'https://www.youtube.com/watch?v=example',
  })
  @Column({ type: 'varchar', length: 2000, nullable: true })
  url: string;

  @ApiPropertyOptional({
    description:
      'Original filename for uploaded files. Null for external URLs.',
    example: 'character-portrait.jpg',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  fileName: string;

  @ApiPropertyOptional({
    description:
      'Backblaze B2 file ID for uploaded files. Null for external URLs.',
    example:
      '4_z27c88f1d182b150646ff0b16_f200ec6f9c314f68a_d20230101_m120000_c000_v0001_t0005',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  b2FileId: string;

  @ApiPropertyOptional({
    description:
      'Whether this media was uploaded directly (true) or submitted as external URL (false)',
    default: false,
  })
  @Column({ type: 'boolean', default: false })
  isUploaded: boolean;

  @ApiProperty({
    description: 'Type of entity this media belongs to',
    enum: MediaOwnerType,
    example: MediaOwnerType.CHARACTER,
  })
  @Column({ type: 'enum', enum: MediaOwnerType })
  ownerType: MediaOwnerType;

  @ApiProperty({
    description: 'ID of the entity this media belongs to',
    example: 1,
  })
  @Column({ type: 'int' })
  ownerId: number;

  @ApiPropertyOptional({
    description:
      'Chapter number for chapter-based progression (mainly for characters)',
    example: 45,
  })
  @Column({ type: 'int', nullable: true })
  chapterNumber: number;

  @ApiProperty({
    description: 'Type of media content',
    enum: MediaType,
    example: MediaType.VIDEO,
  })
  @Column({ type: 'enum', enum: MediaType })
  type: MediaType;

  @ApiPropertyOptional({
    description: 'Description of the media content',
    example: 'Character illustration from Chapter 45',
  })
  @Column({ type: 'varchar', nullable: true, length: 500 })
  description: string;

  @ApiProperty({
    description: 'Current status of the media',
    enum: MediaStatus,
    default: MediaStatus.PENDING,
  })
  @Column({ type: 'enum', enum: MediaStatus, default: MediaStatus.PENDING })
  status: MediaStatus;

  @ApiProperty({
    description:
      'Purpose of the media - gallery for user uploads or entity display for official entity images',
    enum: MediaPurpose,
    default: MediaPurpose.GALLERY,
  })
  @Column({
    type: 'enum',
    enum: MediaPurpose,
    default: MediaPurpose.GALLERY,
  })
  purpose: MediaPurpose;

  @ApiPropertyOptional({
    description: 'Reason for rejection if the media was rejected',
    example: 'Image contains inappropriate content',
  })
  @Column({ type: 'varchar', nullable: true, length: 500 })
  rejectionReason: string;

  @ApiProperty({ description: 'When this media was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'User who submitted this media',
    type: () => User,
  })
  @ManyToOne(() => User, { nullable: false })
  submittedBy: User;
}
