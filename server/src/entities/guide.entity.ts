import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinColumn,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from './user.entity';
import { Tag } from './tag.entity';
import { GuideLike } from './guide-like.entity';
import { Character } from './character.entity';
import { Arc } from './arc.entity';
import { Gamble } from './gamble.entity';

export enum GuideStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PUBLISHED = 'published',
  REJECTED = 'rejected',
}

@Entity()
@Index(['status'])
@Index(['authorId'])
@Index(['createdAt'])
@Index(['likeCount'])
export class Guide {
  @ApiProperty({ description: 'Unique identifier of the guide' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Title of the guide',
    example: 'Mastering Poker Strategy in Usogui',
  })
  @Column({ type: 'varchar', length: 200 })
  title: string;

  @ApiProperty({
    description: 'Brief description or summary of the guide',
    example:
      'A comprehensive guide to understanding poker strategies used in the manga',
  })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({
    description: 'Main content of the guide in markdown format',
    example: '# Introduction\\n\\nThis guide covers...',
  })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({
    description: 'Current status of the guide',
    enum: GuideStatus,
    example: GuideStatus.PUBLISHED,
  })
  @Column({
    type: 'enum',
    enum: GuideStatus,
    default: GuideStatus.DRAFT,
  })
  status: GuideStatus;

  @ApiProperty({ description: 'Number of likes this guide has received' })
  @Column({ type: 'int', default: 0 })
  likeCount: number;

  @ApiPropertyOptional({
    description: 'Reason for rejection if the guide was rejected',
    example: 'Guide content does not meet quality standards',
  })
  @Column({ type: 'varchar', nullable: true, length: 500 })
  rejectionReason: string | null;

  @ApiProperty({ description: 'ID of the user who authored this guide' })
  @Column()
  authorId: number;

  @ApiProperty({
    type: () => User,
    description: 'User who authored this guide',
  })
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @ApiPropertyOptional({
    type: () => [Tag],
    description: 'Tags associated with this guide',
  })
  @ManyToMany(() => Tag, { cascade: true })
  @JoinTable({
    name: 'guide_tags',
    joinColumn: { name: 'guideId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags: Tag[];

  @ApiPropertyOptional({
    description: 'Likes received by this guide',
  })
  @OneToMany(() => GuideLike, (guideLike) => guideLike.guide)
  likes: GuideLike[];

  @ApiPropertyOptional({
    type: () => [Character],
    description: 'Characters associated with this guide',
  })
  @ManyToMany(() => Character, { cascade: false })
  @JoinTable({
    name: 'guide_characters',
    joinColumn: { name: 'guideId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'characterId', referencedColumnName: 'id' },
  })
  characters?: Character[];

  @ApiPropertyOptional({
    type: () => Arc,
    description: 'Arc associated with this guide',
  })
  @ManyToOne(() => Arc, { eager: false, nullable: true })
  @JoinColumn({ name: 'arcId' })
  arc?: Arc;

  @ApiPropertyOptional({
    description: 'Arc ID associated with this guide',
  })
  @Column({ nullable: true })
  arcId?: number;

  @ApiPropertyOptional({
    type: () => [Gamble],
    description: 'Gambles associated with this guide',
  })
  @ManyToMany(() => Gamble, { cascade: false })
  @JoinTable({
    name: 'guide_gambles',
    joinColumn: { name: 'guideId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'gambleId', referencedColumnName: 'id' },
  })
  gambles?: Gamble[];

  @ApiProperty({ description: 'Date and time when the guide was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Date and time when the guide was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}
