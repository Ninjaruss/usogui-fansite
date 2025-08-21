import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, ManyToMany } from 'typeorm';
import { Arc } from '../arcs/arc.entity';
import { Series } from '../series/series.entity';
import { Media } from '../media/media.entity';
import { Faction } from '../factions/faction.entity';

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

  @OneToMany(() => Media, media => media.character, {nullable: true, cascade: true })
  media: Media[];

  @ManyToMany(() => Faction, faction => faction.characters, { nullable: true })
  factions: Faction[];

}
