import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { Event } from './event.entity';
import { Chapter } from './chapter.entity';
import { Character } from './character.entity';

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
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Event, event => event.id)
  event: Event;

  @ManyToOne(() => Chapter, chapter => chapter.id)
  chapter: Chapter;

  @Column({
    type: 'enum',
    enum: SpoilerLevel,
    default: SpoilerLevel.REVEAL
  })
  level: SpoilerLevel;

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

  // Character death information
  @Column('boolean', { nullable: true })
  isDeathSpoiler: boolean;

  @Column('text', { nullable: true })
  deathContext: string;

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
