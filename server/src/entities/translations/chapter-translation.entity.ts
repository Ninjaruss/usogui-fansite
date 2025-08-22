import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Chapter } from '../chapter.entity';
import { BaseTranslation } from './base-translation.entity';

@Entity('chapter_translations')
export class ChapterTranslation extends BaseTranslation {
  @ManyToOne(() => Chapter, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chapter_id' })
  chapter: Chapter;

  @Column({ name: 'chapter_id' })
  chapterId: number;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  summary: string;
}
