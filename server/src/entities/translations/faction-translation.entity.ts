import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTranslation } from './base-translation.entity';
import { Faction } from '../faction.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('faction_translations')
export class FactionTranslation extends BaseTranslation {
  @ApiProperty({
    description: 'Faction this translation belongs to',
    type: () => Faction,
  })
  @ManyToOne(() => Faction, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'faction_id' })
  faction: Faction;

  @ApiProperty({
    description: 'ID of the faction being translated',
  })
  @Column({ name: 'faction_id' })
  factionId: number;

  @ApiProperty({
    description: 'Translated name of the faction',
    example: 'アイディアル (IDEAL)',
  })
  @Column({ type: 'text' })
  name: string;

  @ApiPropertyOptional({
    description: 'Translated description of the faction',
  })
  @Column({ type: 'text', nullable: true })
  description: string;
}
