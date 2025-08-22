import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTranslation } from './base-translation.entity';
import { Faction } from '../faction.entity';

@Entity('faction_translations')
export class FactionTranslation extends BaseTranslation {
  @ManyToOne(() => Faction, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'faction_id' })
  faction: Faction;

  @Column({ name: 'faction_id' })
  factionId: number;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;
}
