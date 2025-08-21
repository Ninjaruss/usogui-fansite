import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Series } from '../series/series.entity';
import { Character } from '../characters/character.entity';
import { Media } from '../media/media.entity';

@Entity()
export class Arc {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => Series, series => series.id)
  series: Series;

  @OneToMany(() => Character, character => character.arc)
  characters: Character[];

  @OneToMany(() => Media, media => media.arc, {nullable: true, cascade: true })
  media: Media[];
}
