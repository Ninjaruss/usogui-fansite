import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Chapter } from '../chapter.entity';
import { BaseTranslation } from './base-translation.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('chapter_translations')
export class ChapterTranslation extends BaseTranslation {
  @ApiProperty({ 
    description: 'Chapter this translation belongs to',
    type: () => Chapter
  })
  @ManyToOne(() => Chapter, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chapter_id' })
  chapter: Chapter;

  @ApiProperty({ description: 'ID of the chapter being translated' })
  @Column({ name: 'chapter_id' })
  chapterId: number;

  @ApiProperty({ 
    description: 'Translated title of the chapter',
    example: '賭博師の条件 (Conditions of a Gambler)'
  })
  @Column({ type: 'text' })
  title: string;

  @ApiPropertyOptional({ 
    description: 'Translated summary of the chapter'
  })
  @Column({ type: 'text', nullable: true })
  summary: string;
}
