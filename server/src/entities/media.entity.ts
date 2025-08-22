import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { Arc } from './arc.entity';
import { Character } from './character.entity';
import { Event } from './event.entity';
import { User } from './user.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio'
}

export enum MediaStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

@Entity()
@Index(['url'], { unique: true })
export class Media {
  @ApiProperty({ description: 'Unique identifier of the media' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ 
    description: 'URL of the media content. Videos must be from YouTube, images must be from DeviantArt, Pixiv, Twitter, or Instagram',
    example: 'https://www.youtube.com/watch?v=example'
  })
  @Column({ length: 2000 })
  url: string;

  @ApiProperty({ 
    description: 'Type of media content',
    enum: MediaType,
    example: MediaType.VIDEO
  })
  @Column({ type: 'enum', enum: MediaType })
  type: MediaType;

  @ApiPropertyOptional({ 
    description: 'Description of the media content',
    example: 'Character illustration from Chapter 45'
  })
  @Column({ nullable: true, length: 500 })
  description: string;

  @ApiProperty({
    description: 'Story arc this media belongs to',
    type: () => Arc
  })
  @ManyToOne(() => Arc, arc => arc.media, { onDelete: 'CASCADE', nullable: true })
  arc: Arc;

  @ApiProperty({
    description: 'Character this media belongs to',
    type: () => Character
  })
  @ManyToOne(() => Character, character => character.media, { onDelete: 'CASCADE', nullable: true })
  character: Character;
  
  @ApiProperty({
    description: 'Event this media belongs to',
    type: () => Event
  })
  @ManyToOne(() => Event, event => event.media, { onDelete: 'CASCADE', nullable: true })
  event: Event;

  @ApiProperty({ 
    description: 'Current status of the media',
    enum: MediaStatus,
    default: MediaStatus.PENDING
  })
  @Column({ type: 'enum', enum: MediaStatus, default: MediaStatus.PENDING })
  status: MediaStatus;

  @ApiPropertyOptional({ 
    description: 'Reason for rejection if the media was rejected',
    example: 'Image contains inappropriate content'
  })
  @Column({ nullable: true, length: 500 })
  rejectionReason: string;

  @ApiProperty({ description: 'When this media was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'User who submitted this media',
    type: () => User
  })
  @ManyToOne(() => User, { nullable: false })
  submittedBy: User;
}
