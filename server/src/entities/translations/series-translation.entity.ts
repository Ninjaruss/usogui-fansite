import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Series } from '../series.entity';
import { BaseTranslation } from './base-translation.entity';

@Entity('series_translations')
export class SeriesTranslation extends BaseTranslation {
  @ManyToOne(() => Series, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'series_id' })
  series: Series;

  @Column({ name: 'series_id' })
  seriesId: number;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;
}
