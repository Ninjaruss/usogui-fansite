import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { Event } from './event.entity';
import { Chapter } from './chapter.entity';
import { Character } from './character.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SpoilerLevel {
  REVEAL = 'reveal',      // Story revelations about past events or character backgrounds
                         // Example: "Character X's true identity is revealed"
  
  OUTCOME = 'outcome',    // Important outcomes that affect the story
                         // Example: "Character loses everything in the game"
  
  TWIST = 'twist',       // Unexpected developments or betrayals
                         // Example: "The game was a setup from the beginning"
  
  FATE = 'fate'         // Major character deaths or life-changing events
                       // Example: "Character dies during the game"
}

export enum SpoilerCategory {
  PLOT = 'plot',           // Story revelations and developments
                          // Example: "The true purpose of the tournament is revealed"
  
  CHARACTER = 'character', // Character motivations, betrayals, relationships
                          // Example: "Character X was working with Character Y all along"
  
  PLOT_TWIST = 'plot_twist' // Major story twists that change everything
                           // Example: "The entire arc was orchestrated by..."
}

@Entity()
export class ChapterSpoiler {
  @ApiProperty({ description: 'Unique identifier for the spoiler' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiPropertyOptional({ description: 'Associated event', type: () => Event })
  @ManyToOne(() => Event, event => event.id)
  event: Event;

  @ApiProperty({ description: 'Chapter where this spoiler occurs', type: () => Chapter })
  @ManyToOne(() => Chapter, chapter => chapter.id)
  chapter: Chapter;

  @ApiProperty({ 
    description: 'Severity level of the spoiler',
    enum: SpoilerLevel,
    default: SpoilerLevel.REVEAL,
    example: SpoilerLevel.REVEAL
  })
  @Column({
    type: 'enum',
    enum: SpoilerLevel,
    default: SpoilerLevel.REVEAL
  })
  level: SpoilerLevel;

  @ApiProperty({
    description: 'Category of the spoiler',
    enum: SpoilerCategory,
    default: SpoilerCategory.PLOT,
    example: SpoilerCategory.PLOT
  })
  @Column({
    type: 'enum',
    enum: SpoilerCategory,
    default: SpoilerCategory.PLOT
  })
  category: SpoilerCategory;

  @Column('text')
  description: string;

  @Column({ default: false })
  isVerified: boolean;

  // Characters affected by this spoiler
  @ManyToMany(() => Character)
  @JoinTable({ name: 'chapter_spoiler_characters' })
  affectedCharacters: Character[];

  // The minimum chapter number required to safely view this spoiler
  @Column({ type: 'int' })
  minimumChapter: number;

  // Additional chapters that need to be read (for non-sequential dependencies)
  @ManyToMany(() => Chapter)
  @JoinTable({ name: 'chapter_spoiler_additional_requirements' })
  additionalRequirements: Chapter[];

  @Column('text', { nullable: true })
  requirementExplanation: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
