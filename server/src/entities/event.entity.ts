import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Arc } from './arc.entity';
import { Character } from './character.entity';
import { User } from './user.entity';
import { Tag } from './tag.entity';
import {
  ApiProperty,
  ApiPropertyOptional,
  ApiHideProperty,
} from '@nestjs/swagger';

export enum EventType {
  ARC = 'arc',
  CHARACTER_REVEAL = 'character_reveal',
  PLOT_TWIST = 'plot_twist',
  DEATH = 'death',
  BACKSTORY = 'backstory',
  PLOT = 'plot',
  OTHER = 'other',
}

// Interface for chapter references with context
export interface ChapterReference {
  chapterNumber: number;
  context: string; // e.g., "Page 15 - Character introduction" or "Final scene - Important dialogue"
}

@Entity()
@Index(['arc'])
@Index(['chapterNumber'])
@Index(['title'])
@Index(['type'])
@Index(['spoilerChapter'])
@Index(['createdBy'])
export class Event {
  @ApiProperty({ description: 'Unique identifier of the event' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Title of the event',
    example: 'The 17 Steps Tournament',
  })
  @Column({ length: 200 })
  title: string;

  @ApiProperty({
    description: 'Detailed description of the event',
    example:
      'A high-stakes tournament where participants must climb 17 steps...',
  })
  @Column({ type: 'text', nullable: false })
  description: string;

  @ApiProperty({
    description: 'Type of event',
    enum: EventType,
    default: EventType.OTHER,
    example: EventType.ARC,
  })
  @Column({
    type: 'enum',
    enum: EventType,
    default: EventType.OTHER,
  })
  type: EventType;

  @ApiProperty({
    description: 'Chapter number where this event occurs',
    example: 45,
  })
  @Column()
  chapterNumber: number;

  @ApiPropertyOptional({
    description:
      'Chapter number the user should have read before seeing this event (spoiler protection)',
    example: 44,
  })
  @Column({ nullable: true })
  spoilerChapter: number;

  @ApiPropertyOptional({
    description: 'Page numbers where this event occurs or is referenced',
    example: [15, 22, 35],
  })
  @Column('json', { nullable: true })
  pageNumbers: number[];

  @ApiProperty({
    description: 'Whether this event has been verified by moderators',
    example: true,
  })
  @Column({ default: false })
  isVerified: boolean;

  @ApiPropertyOptional({
    description:
      'List of chapter references with context for additional reading',
    example: [
      { chapterNumber: 10, context: 'Page 8 - Character background revealed' },
      { chapterNumber: 12, context: 'Final scene - Important foreshadowing' },
    ],
  })
  @Column('json', { nullable: true })
  chapterReferences: ChapterReference[];

  @ApiPropertyOptional({
    description: 'Story arc this event belongs to',
    type: () => Arc,
  })
  @ManyToOne(() => Arc, { nullable: true })
  @JoinColumn({ name: 'arcId' })
  arc: Arc;

  @ApiPropertyOptional({
    description: 'ID of the arc this event belongs to',
    example: 1,
  })
  @Column({ nullable: true })
  arcId: number;

  @ApiHideProperty()
  @ManyToMany(() => Character)
  @JoinTable()
  characters: Character[];

  @ManyToOne(() => User, (user) => user.submittedEvents, { nullable: true })
  createdBy: User;

  @ManyToMany(() => Tag, (tag) => tag.events)
  tags: Tag[];

  @ApiProperty({ description: 'When this event was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'When this event was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}
