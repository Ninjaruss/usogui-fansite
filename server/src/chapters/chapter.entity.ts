import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Arc } from '../arcs/arc.entity';
import { Series } from '../series/series.entity';

@Entity()
export class Chapter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  number: number;

  @Column({ nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @ManyToOne(() => Arc, arc => arc.id, { nullable: true })
  arc: Arc;

  @ManyToOne(() => Series, series => series.id)
  series: Series;
}
