import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Arc } from '../arcs/arc.entity';
import { Character } from '../characters/character.entity';
import { Event } from '../events/event.entity';

@Entity()
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string; // could be external URL or internal file path

  @Column({ nullable: true })
  type: string; // e.g. "image", "video", "audio"

  @Column({ nullable: true })
  description: string;

  // Relations
  @ManyToOne(() => Arc, arc => arc.media, { onDelete: 'CASCADE' })
  arc: Arc;

  @ManyToOne(() => Character, character => character.media, { onDelete: 'CASCADE' })
  character: Character;
  
  @ManyToOne(() => Event, event => event.media, { onDelete: 'CASCADE' })
  event: Event;
}
