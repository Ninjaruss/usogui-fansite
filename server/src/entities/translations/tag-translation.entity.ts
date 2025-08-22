import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTranslation } from './base-translation.entity';
import { Tag } from '../tag.entity';

@Entity('tag_translations')
export class TagTranslation extends BaseTranslation {
  @ManyToOne(() => Tag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag: Tag;

  @Column({ name: 'tag_id' })
  tagId: number;

  @Column({ type: 'text' })
  name: string;
}
