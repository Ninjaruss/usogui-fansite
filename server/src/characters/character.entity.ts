import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Arc } from '../arcs/arc.entity';
import { Series } from '../series/series.entity';

@Entity()
export class Character {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => Arc, arc => arc.characters, { nullable: true })
  arc: Arc;

  @ManyToOne(() => Series, series => series.id)
  series: Series;
}
