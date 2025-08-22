import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTranslation } from './base-translation.entity';
import { ChapterSpoiler } from '../chapter_spoiler.entity';

@Entity('chapter_spoiler_translations')
export class ChapterSpoilerTranslation extends BaseTranslation {
  @ManyToOne(() => ChapterSpoiler, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chapter_spoiler_id' })
  chapterSpoiler: ChapterSpoiler;

  @Column({ name: 'chapter_spoiler_id' })
  chapterSpoilerId: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  requirementExplanation: string;
}
