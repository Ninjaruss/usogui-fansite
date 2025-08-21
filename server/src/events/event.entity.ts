import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Arc } from '../arcs/arc.entity';
import { Character } from '../characters/character.entity';
import { Series } from '../series/series.entity';
import { Media } from '../media/media.entity';

@Entity()
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  startChapter: number;

  @Column({ nullable: true })
  endChapter: number;

  @ManyToOne(() => Arc, arc => arc.id, { nullable: true })
  arc: Arc;

  @ManyToMany(() => Character)
  @JoinTable()
  characters: Character[];

  @ManyToOne(() => Series, series => series.id)
  series: Series;

  @OneToMany(() => Media, media => media.event, {nullable: true, cascade: true })
  media: Media[];
}
