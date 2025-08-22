import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTranslation } from './base-translation.entity';
import { Arc } from '../arc.entity';

@Entity('arc_translations')
export class ArcTranslation extends BaseTranslation {
  @ManyToOne(() => Arc, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'arc_id' })
  arc: Arc;

  @Column({ name: 'arc_id' })
  arcId: number;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;
}
