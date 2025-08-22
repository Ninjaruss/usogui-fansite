import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTranslation } from './base-translation.entity';
import { Character } from '../character.entity';

@Entity('character_translations')
export class CharacterTranslation extends BaseTranslation {
  @ManyToOne(() => Character, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'character_id' })
  character: Character;

  @Column({ name: 'character_id' })
  characterId: number;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;
}
