import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Series } from '../series.entity';
import { BaseTranslation } from './base-translation.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('series_translations')
export class SeriesTranslation extends BaseTranslation {
  @ApiProperty({ 
    description: 'Series this translation belongs to',
    type: () => Series
  })
  @ManyToOne(() => Series, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'series_id' })
  series: Series;

  @ApiProperty({ description: 'ID of the series being translated' })
  @Column({ name: 'series_id' })
  seriesId: number;

  @ApiProperty({ 
    description: 'Translated name of the series',
    example: 'ウソウギ (Usogui)'
  })
  @Column({ type: 'text' })
  name: string;

  @ApiPropertyOptional({ description: 'Translated description of the series' })
  @Column({ type: 'text', nullable: true })
  description: string;
}
